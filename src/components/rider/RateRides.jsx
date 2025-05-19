import React, { useState } from 'react';
import { db } from '../../firebase/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { FiStar, FiCheck } from 'react-icons/fi';

const RateRides = ({ riderData, riderId }) => {
  const [ratingSubmissions, setRatingSubmissions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Filter rides that haven't been rated yet and have a driverId
  const unratedRides = (riderData?.previousRides?.filter(ride => 
    ride.rating === null && ride.driverId
  ) )|| [];

  const handleRatingChange = (rideIndex, rating) => {
    setRatingSubmissions(prev => ({
      ...prev,
      [rideIndex]: rating
    }));
  };

  const submitRatings = async () => {
    if (Object.keys(ratingSubmissions).length === 0) return;
    
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const riderRef = doc(db, 'riders', riderId);
      const batchUpdates = [];

      // Create updated rides array with new ratings
      const updatedRides = riderData.previousRides.map((ride, index) => {
        if (ratingSubmissions[index] !== undefined) {
          return { ...ride, rating: ratingSubmissions[index] };
        }
        return ride;
      });

      // Update rider document
      batchUpdates.push(updateDoc(riderRef, {
        previousRides: updatedRides
      }));

      // Update each driver's rating
      for (const [index, rating] of Object.entries(ratingSubmissions)) {
        const rideIndex = parseInt(index);
        const ride = riderData.previousRides[rideIndex];
        
        if (ride.driverId) {
          const driverRef = doc(db, 'drivers', ride.driverId);
          const driverSnap = await getDoc(driverRef);
          
          if (driverSnap.exists()) {
            const driverData = driverSnap.data();
            const currentRatings = driverData.ratings || 0;
            const currentTotalRides = driverData.totalRides || 0;

            // Calculate new average rating
            const newRatings = ((currentRatings * currentTotalRides) + rating) / (currentTotalRides+1);

            batchUpdates.push(updateDoc(driverRef, {
              ratings: newRatings,
              totalRides: currentTotalRides + 1,
            }));
          }
        }
      }

      // Execute all updates
      await Promise.all(batchUpdates);

      setSubmitSuccess(true);
      setRatingSubmissions({});
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating ratings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (unratedRides.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <FiCheck className="mx-auto text-4xl text-green-500 mb-3" />
          <h2 className="text-lg font-semibold mb-1">All Rides Rated</h2>
          <p className="text-gray-600">You've rated all your completed rides</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Rate Your Rides</h1>
      <p className="text-gray-600 mb-6">Please rate your recent rides to help us improve</p>

      <div className="space-y-4">
        {unratedRides.map((ride, originalIndex) => {
          // Find the original index in previousRides array
          const rideIndex = riderData.previousRides.findIndex(r => 
            r.startAddress === ride.startAddress && 
            r.destinationAddress === ride.destinationAddress &&
            r.totalFare === ride.totalFare &&
            r.driverId === ride.driverId
          );

          return (
            <div key={originalIndex} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium capitalize">{ride.mode} Ride</h3>
                  <p className="text-sm text-gray-600">{ride.startAddress} → {ride.destinationAddress}</p>
                  {ride.driverId && (
                    <p className="text-xs text-gray-500 mt-1">Driver: {ride.driverId.substring(0, 8)}...</p>
                  )}
                </div>
                <span className="text-lg font-semibold">₹{ride.totalFare.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">{ride.totalDistance} km</p>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingChange(rideIndex, star)}
                      className={`text-2xl ${ratingSubmissions[rideIndex] >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(ratingSubmissions).length > 0 && (
        <div className="mt-6">
          <button
            onClick={submitRatings}
            disabled={isSubmitting}
            className={`w-full py-3 px-4 bg-indigo-600 text-white rounded-md font-medium flex items-center justify-center ${
              isSubmitting ? 'opacity-75' : 'hover:bg-indigo-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <FiStar className="mr-2" />
                Submit Ratings
              </>
            )}
          </button>
        </div>
      )}

      {submitSuccess && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-center">
          Ratings submitted successfully!
        </div>
      )}
    </div>
  );
};

export default RateRides;