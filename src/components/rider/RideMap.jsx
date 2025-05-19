import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const RideMap = ({ pickup, drop }) => {
  const mapRef = useRef(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_KEY = '5b3ce3597851110001cf6248ca803a2f94ee4d46b2bd1e2b97c33ec5';

  useEffect(() => {
    if (!pickup || !drop) return;

    const fetchRoute = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get driving directions from OpenRouteService
        const response = await fetch(
          `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${API_KEY}&start=${pickup.longitude},${pickup.latitude}&end=${drop.longitude},${drop.latitude}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch route');
        }
        
        const data = await response.json();
        
        // Convert route coordinates to LatLng format
        const routeCoords = data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRoute(routeCoords);
        
        // Fit map to the route bounds
        const bounds = L.latLngBounds(routeCoords);
        mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
        
      } catch (err) {
        console.error('Routing error:', err);
        setError('Could not load route directions');
        // Fallback to straight line if routing fails
        setRoute([
          [pickup.latitude, pickup.longitude],
          [drop.latitude, drop.longitude]
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [pickup, drop]);

  if (!pickup || !drop) {
    return (
      <div style={{ 
        height: '400px', 
        background: '#f0f0f0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        Waiting for location data...
      </div>
    );
  }

  return (
    <div style={{ height: '400px', width: '100%', position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          background: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          Loading route...
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          background: '#ffebee',
          padding: '8px 16px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          color: '#d32f2f'
        }}>
          {error} (showing straight line)
        </div>
      )}

      <MapContainer
        center={[pickup.latitude, pickup.longitude]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        whenCreated={map => mapRef.current = map}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <Marker position={[pickup.latitude, pickup.longitude]} icon={defaultIcon}>
          <Popup>Pickup Location</Popup>
        </Marker>

        <Marker position={[drop.latitude, drop.longitude]} icon={defaultIcon}>
          <Popup>Drop Location</Popup>
        </Marker>

        {route && (
          <Polyline
            positions={route}
            color="#3b82f6"
            weight={5}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default RideMap;