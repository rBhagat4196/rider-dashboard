import React, { useState, useEffect } from 'react';
import { FiClock, FiNavigation, FiDollarSign, FiMapPin } from 'react-icons/fi';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const RideHistory = ({ riderId }) => {
  const [currentRiderData, setRiderData] = useState(null);
  const [autoRides, setAutoRides] = useState([]);
  const [cabRides, setCabRides] = useState([]);

  useEffect(() => {
    if (!riderId) return;

    const unsub = onSnapshot(
      doc(db, 'riders', riderId),
      (snapshot) => {
        const data = snapshot.data();
        if (data) {
          setRiderData(data);
          const rides = data.previousRides || [];
          setAutoRides(rides.filter(ride => ride.mode === 'auto'));
          setCabRides(rides.filter(ride => ride.mode === 'cab'));
        }
      },
      (error) => {
        console.error('Error fetching ride data:', error);
      }
    );

    return () => unsub(); // cleanup
  }, [riderId]);

  if (
    currentRiderData &&
    (!currentRiderData.previousRides || currentRiderData.previousRides.length === 0)
  ) {
    return (
      <div className="p-4 text-center">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <FiClock className="mx-auto text-4xl text-gray-400 mb-3" />
          <h2 className="text-lg font-semibold mb-1">No Ride History</h2>
          <p className="text-gray-600">Your completed rides will appear here</p>
        </div>
      </div>
    );
  }

  const RideCard = ({ ride }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-3 border border-gray-100">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <span
            className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${
              ride.mode === 'auto'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {ride.mode}
          </span>
        </div>
        <span className="text-lg font-semibold">₹{ride.totalFare.toFixed(2)}</span>
      </div>

      <div className="flex items-center text-gray-600 mb-1">
        <FiNavigation className="mr-2" />
        <span className="text-sm">{ride.startAddress}</span>
      </div>
      <div className="flex items-center text-gray-600 mb-2">
        <FiMapPin className="mr-2" />
        <span className="text-sm">{ride.destinationAddress}</span>
      </div>

      <div className="flex justify-between text-sm text-gray-500">
        <div className="flex items-center">
          <FiDollarSign className="mr-1" />
          <span>{ride.totalDistance} km</span>
        </div>
        <div>
          {ride.rating ? (
            <span className="text-yellow-500">{'★'.repeat(ride.rating)}</span>
          ) : (
            <span className="text-gray-400">Not rated</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Ride History</h1>

      {/* Cab Rides */}
      {cabRides.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-3">
            <h2 className="text-lg font-semibold flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Cab Rides
            </h2>
            <span className="ml-2 text-sm text-gray-500">{cabRides.length} rides</span>
          </div>
          <div className="space-y-3">
            {cabRides.map((ride, index) => (
              <RideCard key={`cab-${index}`} ride={ride} />
            ))}
          </div>
        </div>
      )}

      {/* Auto Rides */}
      {autoRides.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-3">
            <h2 className="text-lg font-semibold flex items-center">
              <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
              Auto Rides
            </h2>
            <span className="ml-2 text-sm text-gray-500">{autoRides.length} rides</span>
          </div>
          <div className="space-y-3">
            {autoRides.map((ride, index) => (
              <RideCard key={`auto-${index}`} ride={ride} />
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-gray-500">Total Cab Rides</p>
            <p className="text-xl font-bold">{cabRides.length}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Auto Rides</p>
            <p className="text-xl font-bold">{autoRides.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideHistory;
