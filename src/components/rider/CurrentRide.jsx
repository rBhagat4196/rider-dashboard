import React, { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import RideMap from "./RideMap";
import RideChat from "./RideChat";

const CurrentRide = ({ ride, user }) => {
  const [currentRide, setCurrentRide] = useState(ride);
  const [driver, setDriver] = useState(null);
  const [activeTab, setActiveTab] = useState("track");

  useEffect(() => {
    if (!ride.id) return;

    const unsubscribe = onSnapshot(doc(db, 'requests', ride.id), (doc) => {
      if (doc.exists()) {
        setCurrentRide(doc.data());
      }
    });

    if (ride.driverId) {
      const driverUnsubscribe = onSnapshot(doc(db, 'drivers', ride.driverId), (doc) => {
        if (doc.exists()) {
          setDriver(doc.data());
        }
      });

      return () => {
        unsubscribe();
        driverUnsubscribe();
      };
    }

    return () => unsubscribe();
  }, [ride.id]);

  const handleCancel = async () => {
    // Implement cancellation logic
    alert("Ride cancellation would be implemented here");
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            Your {currentRide.mode === 'auto' ? 'Auto' : 'Cab'} Ride
          </h2>
          <p className="text-gray-600">
            Status: <span className="font-medium capitalize">{currentRide.status}</span>
          </p>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-4 text-center font-medium ${activeTab === 'track' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Track Ride
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-4 text-center font-medium ${activeTab === 'chat' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-4 text-center font-medium ${activeTab === 'details' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Details
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'track' && (
            <div className="space-y-6">
              {driver && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Driver: {driver.name}</h3>
                  <p className="text-gray-600">Vehicle: {driver.vehicle}</p>
                  <p className="text-gray-600">Rating: {driver.rating || '4.5'} ★</p>
                </div>
              )}
              
              <RideMap 
                pickup={currentRide.pickupCoordinates} 
                drop={currentRide.dropCoordinates} 
                driverLocation={driver?.currentLocation}
              />
              
              <button
                onClick={handleCancel}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancel Ride
              </button>
            </div>
          )}
          
          {activeTab === 'chat' && (
            <RideChat rideId={currentRide.id} />
          )}
          
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="font-medium">{currentRide.pickupLocation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="font-medium">{currentRide.destination}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Distance</p>
                  <p className="font-medium">{currentRide.distance.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Fare</p>
                  <p className="font-medium">₹{Math.round(currentRide.distance * 10)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mode</p>
                  <p className="font-medium capitalize">{currentRide.mode}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentRide;