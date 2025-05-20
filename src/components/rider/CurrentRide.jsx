import React, { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import RideMap from "./RideMap";
import RideChat from "./RideChat";
import {
  FiUser,
  FiNavigation,
  FiClock,
  FiDollarSign,
  FiX,
  FiMapPin,
} from "react-icons/fi";

const CurrentRide = ({ ride, user, setView }) => {
  const [currentRide, setCurrentRide] = useState(ride);
  const [driver, setDriver] = useState(null);
  const [activeTab, setActiveTab] = useState("track");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Real-time updates for ride and driver
  useEffect(() => {
    if (!ride?.id) {
      setView('home');
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "requests", ride.id), (doc) => {
      if (!doc.exists()) {
        // Ride document no longer exists
        setView('home');
        return;
      }

      const rideData = { id: doc.id, ...doc.data() };
      setCurrentRide(rideData);

      // If ride is completed or cancelled, redirect after a delay
      if (rideData.status === "completed" || rideData.status === "cancelled") {
        const timer = setTimeout(() => {
          setView('home');
        }, 3000); // Redirect after 3 seconds
        return () => clearTimeout(timer);
      }
    });

    if (ride.driverId) {
      const driverUnsubscribe = onSnapshot(
        doc(db, "drivers", ride.driverId),
        (doc) => {
          if (doc.exists()) {
            setDriver({ id: doc.id, ...doc.data() });
          }
        }
      );

      return () => {
        unsubscribe();
        driverUnsubscribe();
      };
    }

    return () => unsubscribe();
  }, [ride?.id, ride?.driverId, setView]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this ride?")) return;

    setIsCancelling(true);
    try {
      await updateDoc(doc(db, "requests", ride.id), {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancelledBy: user.uid,
      });
      setCancelSuccess(true);
    } catch (error) {
      console.error("Error cancelling ride:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "--:--";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // If there's no ride or the ride is completed/cancelled, return null
  // (the useEffect will handle the redirect)
  if (!currentRide || !currentRide.id || 
      currentRide.status === "completed" || 
      currentRide.status === "cancelled") {
    return null;
  }

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Ride Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <span
                  className={`w-3 h-3 rounded-full mr-2 ${
                    currentRide.mode === "auto"
                      ? "bg-orange-500"
                      : "bg-blue-500"
                  }`}
                ></span>
                {currentRide.mode === "auto" ? "Auto" : "Cab"} Ride
              </h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  currentRide.status
                )}`}
              >
                {currentRide.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Estimated</p>
              <p className="text-lg font-bold text-indigo-600">
                ₹{currentRide.fare?.toFixed(0) || "--"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("track")}
            className={`flex-1 py-3 text-center font-medium text-sm flex items-center justify-center ${
              activeTab === "track"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FiNavigation className="mr-2" /> Track
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-3 text-center font-medium text-sm flex items-center justify-center ${
              activeTab === "chat"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FiUser className="mr-2" /> Chat
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 py-3 text-center font-medium text-sm flex items-center justify-center ${
              activeTab === "details"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FiClock className="mr-2" /> Details
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "track" && (
            <div className="space-y-4">
              {driver && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 p-2 rounded-full mr-3">
                      <FiUser className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{driver.name}</h3>
                      <p className="text-sm text-gray-600">
                        {driver.vehicle?.model || "Vehicle"} •{" "}
                        {driver.vehicle?.numberPlate || "DL-XXXX"}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-sm">
                          {driver.rating?.toFixed(1) || "4.5"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {currentRide && (
                <div className="h-64 rounded-md overflow-hidden border border-gray-200">
                  <RideMap
                    pickup={{
                      latitude: currentRide.pickupCoords.lat,
                      longitude: currentRide.pickupCoords.lng,
                    }}
                    drop={{
                      latitude: currentRide.dropCoords.lat,
                      longitude: currentRide.dropCoords.lng,
                    }}
                  />
                </div>
              )}

              {currentRide.status !== "cancelled" &&
                currentRide.status !== "completed" && (
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center"
                  >
                    {isCancelling ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <FiX className="mr-2" /> Cancel Ride
                      </>
                    )}
                  </button>
                )}

              {cancelSuccess && (
                <div className="mt-2 p-2 bg-green-50 text-green-700 text-sm rounded-md text-center">
                  Ride cancelled successfully
                </div>
              )}
            </div>
          )}

          {activeTab === "chat" && driver && <RideChat chatId={driver.currentRide?.chatId} riderId={currentRide.riderId}/>}

          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <FiMapPin className="text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="font-medium">{currentRide.pickupAddress}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <FiMapPin className="text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="font-medium">{currentRide.dropAddress}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <FiNavigation className="text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">Distance</p>
                  <p className="font-medium">
                    {currentRide.distance?.toFixed(1) || "--"} km
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <FiDollarSign className="text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">Fare</p>
                  <p className="font-medium">
                    ₹{currentRide.fare?.toFixed(0) || "--"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-medium mb-2">Ride Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Requested:</span>
                    <span>{formatTime(currentRide.createdAt)}</span>
                  </div>
                  {currentRide.acceptedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Accepted:</span>
                      <span>{formatTime(currentRide.acceptedAt)}</span>
                    </div>
                  )}
                  {currentRide.startedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Started:</span>
                      <span>{formatTime(currentRide.startedAt)}</span>
                    </div>
                  )}
                  {currentRide.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Completed:</span>
                      <span>{formatTime(currentRide.completedAt)}</span>
                    </div>
                  )}
                  {currentRide.cancelledAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cancelled:</span>
                      <span>{formatTime(currentRide.cancelledAt)}</span>
                    </div>
                  )}
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
