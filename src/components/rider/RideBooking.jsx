import React, { useState, useEffect } from 'react';
import { FiMapPin, FiNavigation, FiClock } from 'react-icons/fi';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

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

  // Handle pickup address input changes
  useEffect(() => {
    if (pickupAddress) {
      fetchAddressSuggestions(pickupAddress, setPickupSuggestions);
    }
  }, [pickupAddress]);

  // Handle drop address input changes
  useEffect(() => {
    if (dropAddress) {
      fetchAddressSuggestions(dropAddress, setDropSuggestions);
    }
  }, [dropAddress]);

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

  // Calculate distance and fare (mock implementation)
  const calculateDistanceAndFare = () => {
    if (!pickupAddress || !dropAddress) return;
    
    setIsLoading(true);
    setError('');
    
    // In a real app, you would calculate actual distance
    // This is a mock implementation
    setTimeout(() => {
      const mockDistance = Math.floor(Math.random() * 30) + 1; // 1-30 km
      const baseFare = mode === 'auto' ? 30 : 80;
      const perKmFare = mode === 'auto' ? 10 : 15;
      const calculatedFare = baseFare + (mockDistance * perKmFare);
      
      setDistance(mockDistance);
      setFare(calculatedFare);
      setIsLoading(false);
    }, 1000);
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
      await addDoc(collection(db, 'requests'), {
        pickupAddress,
        dropAddress,
        driverId: null,
        riderId: user.uid,
        mode,
        status: 'pending',
        distance: distance || 0,
        fare: fare || 0,
        createdAt: new Date().toISOString()
      });

      // Reset form
      setPickupAddress('');
      setDropAddress('');
      setDistance(null);
      setFare(null);
      setPickupSuggestions([]);
      setDropSuggestions([]);
      
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
            calculateDistanceAndFare();
          }}
        >
          Auto
        </button>
        <button
          className={`flex-1 py-2 text-center font-medium ${mode === 'cab' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => {
            setMode('cab');
            calculateDistanceAndFare();
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
          <div className="mt-1 border border-gray-200 rounded-md shadow-lg absolute z-10 w-full bg-white max-h-60 overflow-y-auto">
            {pickupSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => {
                  setPickupAddress(suggestion.display_name);
                  setPickupSuggestions([]);
                  setShowPickupSuggestions(false);
                  calculateDistanceAndFare();
                }}
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
            }}
            onFocus={() => setShowDropSuggestions(true)}
            onBlur={() => setTimeout(() => setShowDropSuggestions(false), 200)}
            className="w-full p-2 border border-gray-300 rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter drop location"
          />
          <FiMapPin className="absolute left-3 top-3 text-gray-400" />
        </div>
        {showDropSuggestions && dropSuggestions.length > 0 && (
          <div className="mt-1 border border-gray-200 rounded-md shadow-lg absolute z-10 w-full bg-white max-h-60 overflow-y-auto">
            {dropSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => {
                  setDropAddress(suggestion.display_name);
                  setDropSuggestions([]);
                  setShowDropSuggestions(false);
                  calculateDistanceAndFare();
                }}
              >
                {suggestion.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

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