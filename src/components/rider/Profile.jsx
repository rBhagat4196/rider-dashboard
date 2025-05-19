import React, { useState } from 'react';
import { db, auth } from '../../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

const Profile = ({ user, riderData, setRiderData }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: riderData?.name || '',
    phoneNumber: riderData?.phoneNumber || '',
    currentAddress: riderData?.currentAddress || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: formData.name
      });

      // Update Firestore rider document
      const riderRef = doc(db, 'riders', user.uid);
      await updateDoc(riderRef, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        currentAddress: formData.currentAddress,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setRiderData({
        ...riderData,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        currentAddress: formData.currentAddress
      });

      setEditMode(false);
    } catch (err) {
      setError(err.message);
      console.error("Error updating profile:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate rider statistics
  const totalRides = riderData?.previousRides?.length || 0;
  const totalSpent = riderData?.previousRides?.reduce((sum, ride) => sum + (ride.totalFare || 0), 0) || 0;
  const avgRating = riderData?.previousRides?.reduce((sum, ride) => sum + (ride.rating || 0), 0) / totalRides || 0;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
        <button 
          onClick={() => setEditMode(!editMode)}
          className={`px-3 py-1 rounded-md ${editMode ? 'bg-gray-200 text-gray-800' : 'bg-indigo-100 text-indigo-600'}`}
        >
          {editMode ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      {editMode ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Address</label>
              <textarea
                name="currentAddress"
                value={formData.currentAddress}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-2xl font-medium text-indigo-600">
                {riderData?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{riderData?.name || 'User'}</h3>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Rides</p>
              <p className="text-xl font-bold">{totalRides}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-xl font-bold">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Avg. Rating</p>
              <p className="text-xl font-bold">
                {avgRating ? avgRating.toFixed(1) + '★' : 'N/A'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="font-medium">{riderData?.phoneNumber || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Address</p>
              <p className="font-medium">
                {riderData?.currentAddress || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">
                {new Date(riderData?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* {riderData?.currentRide?.driverId && (
            <div className="mt-6 p-3 bg-indigo-50 rounded-lg">
              <h3 className="font-medium text-indigo-800 mb-2">Current Ride</h3>
              <p>From: {riderData.currentRide.pickupAddress}</p>
              <p>To: {riderData.currentRide.dropAddress}</p>
              <p>Fare: ${riderData.currentRide.fare?.toFixed(2)}</p>
            </div>
          )} */}
        </div>
      )}
    </div>
  );
};

export default Profile;