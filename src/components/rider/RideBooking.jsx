import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiNavigation, FiClock } from 'react-icons/fi';
import { collection, addDoc, setDoc,doc,updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RideBooking = ({ user, riderData }) => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [mode, setMode] = useState('auto');
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const mapRef = useRef(null);

  // Fetch address suggestions from Nominatim API
  const fetchAddressSuggestions = async (query, setSuggestions) => {
    if (query.length < 3) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching address suggestions:', err);
    }
  };

  // Get coordinates for an address
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await response.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (err) {
      console.error('Error geocoding address:', err);
      return null;
    }
  };

  // Get route from OpenRouteService
  const getRoute = async (start, end) => {
    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248ca803a2f94ee4d46b2bd1e2b97c33ec5&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`
      );
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching route:', err);
      return null;
    }
  };

  // Calculate distance, fare, and route
  const calculateRoute = async () => {
    if (!pickupAddress || !dropAddress) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Geocode both addresses
      const startCoords = await geocodeAddress(pickupAddress);
      const endCoords = await geocodeAddress(dropAddress);
      
      if (!startCoords || !endCoords) {
        throw new Error('Could not find locations');
      }
      
      setPickupCoords(startCoords);
      setDropCoords(endCoords);
      
      // Get route from ORS
      const routeData = await getRoute(startCoords, endCoords);
      
      if (!routeData || !routeData.features || routeData.features.length === 0) {
        throw new Error('Could not calculate route');
      }
      
      const route = routeData.features[0];
      const calculatedDistance = route.properties.segments[0].distance / 1000; // Convert to km
      const baseFare = mode === 'auto' ? 30 : 80;
      const perKmFare = mode === 'auto' ? 10 : 15;
      const calculatedFare = baseFare + (calculatedDistance * perKmFare);
      console.log(mode,baseFare,perKmFare,calculatedFare)
      setDistance(calculatedDistance.toFixed(1));
      setFare(calculatedFare.toFixed(0));
      setRouteGeometry(route.geometry.coordinates.map(coord => [coord[1], coord[0]]));
      
      // Center map on the route
      if (mapRef.current) {
        const bounds = L.latLngBounds(routeGeometry || [startCoords, endCoords]);
        mapRef.current.fitBounds(bounds);
      }
    } catch (err) {
      setError(err.message || 'Failed to calculate route');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pickup address selection
  const handlePickupSelect = async (suggestion) => {
    setPickupAddress(suggestion.display_name);
    setPickupSuggestions([]);
    setShowPickupSuggestions(false);
    await calculateRoute();
  };

  // Handle drop address selection
  const handleDropSelect = async (suggestion) => {
    setDropAddress(suggestion.display_name);
    setDropSuggestions([]);
    setShowDropSuggestions(false);
    await calculateRoute();
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            setPickupAddress(data.display_name);
            const riderRef = doc(db,"riders",user.uid);
            await updateDoc(riderRef,{
              currentAddress : data.display_name
            })
            setPickupCoords({ lat: latitude, lng: longitude });
            await calculateRoute();
          } catch (err) {
            setError('Failed to get current location address');
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          setError('Please enable location services to use this feature');
          setIsLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  // Book the ride
  const bookRide = async () => {
    if (!pickupAddress || !dropAddress) {
      setError('Please enter both pickup and drop locations');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Create ride request in Firestore
      console.log(user.uid)
      await setDoc(doc(db, 'requests',user.uid), {
        pickupAddress,
        dropAddress,
        pickupCoords,
        dropCoords,
        driverId: null,
        riderId: user.uid,
        mode,
        status: 'pending',
        distance: parseFloat(distance),
        fare: parseFloat(fare),
        createdAt: new Date().toISOString()
      });

      // Reset form
      setPickupAddress('');
      setDropAddress('');
      setDistance(null);
      setFare(null);
      setPickupSuggestions([]);
      setDropSuggestions([]);
      setPickupCoords(null);
      setDropCoords(null);
      setRouteGeometry(null);
      
      alert('Ride booked successfully! Finding a driver...');
    } catch (err) {
      setError('Failed to book ride. Please try again.');
      console.error('Error booking ride:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Book a Ride</h2>
      
      {/* Mode Selection */}
      <div className="flex mb-4 border border-gray-200 rounded-md overflow-hidden">
        <button
          className={`flex-1 py-2 text-center font-medium ${mode === 'auto' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => {
            setMode('auto');
            calculateRoute();
          }}
        >
          Auto
        </button>
        <button
          className={`flex-1 py-2 text-center font-medium ${mode === 'cab' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => {
            setMode('cab');
            calculateRoute();
          }}
        >
          Cab
        </button>
      </div>

      {/* Pickup Address */}
      <div className="mb-4 relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
        <div className="relative">
          <input
            value={pickupAddress}
            onChange={(e) => {
              setPickupAddress(e.target.value);
              setShowPickupSuggestions(true);
              fetchAddressSuggestions(e.target.value, setPickupSuggestions);
            }}
            onFocus={() => setShowPickupSuggestions(true)}
            onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
            className="w-full p-2 border border-gray-300 rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter pickup location"
          />
          <FiMapPin className="absolute left-3 top-3 text-gray-400" />
          <button
            type="button"
            onClick={getCurrentLocation}
            className="absolute right-2 top-2 bg-indigo-100 text-indigo-600 p-1 rounded-md"
            title="Use current location"
          >
            <FiNavigation size={16} />
          </button>
        </div>
        {showPickupSuggestions && pickupSuggestions.length > 0 && (
          <div className="mt-1 border border-gray-200 rounded-md shadow-lg absolute w-full bg-white max-h-60 overflow-y-auto z-99">
            {pickupSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => handlePickupSelect(suggestion)}
              >
                {suggestion.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drop Address */}
      <div className="mb-4 relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Drop Location</label>
        <div className="relative">
          <input
            value={dropAddress}
            onChange={(e) => {
              setDropAddress(e.target.value);
              setShowDropSuggestions(true);
              fetchAddressSuggestions(e.target.value, setDropSuggestions);
            }}
            onFocus={() => setShowDropSuggestions(true)}
            onBlur={() => setTimeout(() => setShowDropSuggestions(false), 200)}
            className="w-full p-2 border border-gray-300 rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter drop location"
          />
          <FiMapPin className="absolute left-3 top-3 text-gray-400" />
        </div>
        {showDropSuggestions && dropSuggestions.length > 0 && (
          <div className="mt-1 border border-gray-200 rounded-md shadow-lg absolute z-[999999] w-full bg-white max-h-60 overflow-y-auto">
            {dropSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                onMouseEnter={() => handleDropSelect(suggestion)}
              >
                {suggestion.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Display */}
      {(pickupCoords || dropCoords) && (
        <div className="mb-4 h-64 rounded-md overflow-hidden ">
          <MapContainer
            center={pickupCoords || [20.5937, 78.9629]} // Default to India center
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {pickupCoords && (
              <Marker position={pickupCoords}>
                <Popup>Pickup Location</Popup>
              </Marker>
            )}
            {dropCoords && (
              <Marker position={dropCoords}>
                <Popup>Drop Location</Popup>
              </Marker>
            )}
            {routeGeometry && (
              <Polyline 
                positions={routeGeometry}
                color="blue"
                weight={4}
              />
            )}
          </MapContainer>
        </div>
      )}

      {/* Fare Calculation */}
      {(distance || fare) && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Distance:</span>
            <span className="font-medium">{distance} km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estimated Fare:</span>
            <span className="font-bold text-indigo-600">₹{fare}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Book Button */}
      <button
        onClick={bookRide}
        disabled={isLoading || !pickupAddress || !dropAddress}
        className={`w-full py-3 px-4 bg-indigo-600 text-white rounded-md font-medium flex items-center justify-center ${
          isLoading || !pickupAddress || !dropAddress ? 'opacity-75' : 'hover:bg-indigo-700'
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          `Book ${mode === 'auto' ? 'Auto' : 'Cab'}`
        )}
      </button>
    </div>
  );
};

export default RideBooking;