import React, { useState } from "react";
import { db, auth } from "../../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { UploadCloud } from "lucide-react";
const Profile = ({ user, riderData, setRiderData }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: riderData?.name || "",
    phoneNumber: riderData?.phoneNumber || "",
    currentAddress: riderData?.currentAddress || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [upLoading, setUploading] = useState(false);

  const cloudName = import.meta.env.VITE_CLOUDNAME;
  const unsignedPreset = import.meta.env.VITE_PRESET;
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // Redirect to login page after sign out
    } catch (err) {
      setError(err.message);
      console.error("Error signing out:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: formData.name,
      });

      // Update Firestore rider document
      const riderRef = doc(db, "riders", user.uid);
      await updateDoc(riderRef, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        currentAddress: formData.currentAddress,
        updatedAt: new Date().toISOString(),
        profileURL: imageUrl,
      });

      // Update local state
      setRiderData({
        ...riderData,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        currentAddress: formData.currentAddress,
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
  const totalSpent =
    riderData?.previousRides?.reduce(
      (sum, ride) => sum + (ride.totalFare || 0),
      0
    ) || 0;
  const totalRatedRides = riderData?.previousRides?.reduce(
    (sum, ride) => sum + (ride.rating == null ? 0 : 1),
    0
  );
  const avgRating =
    riderData?.previousRides?.reduce(
      (sum, ride) => sum + (ride.rating || 0),
      0
    ) / totalRatedRides || 0;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log(file);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", unsignedPreset);

    setUploading(true);
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      console.log(data);
      setImageUrl(data.secure_url);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-3 py-1 rounded-md ${
              editMode
                ? "bg-gray-200 text-gray-800"
                : "bg-indigo-100 text-indigo-600"
            }`}
          >
            {editMode ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={handleSignOut}
            className="px-3 py-1 rounded-md bg-red-100 text-red-600 hover:bg-red-200"
          >
            Sign Out
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      {editMode ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-48 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-blue-400 cursor-pointer hover:bg-blue-50 transition"
              >
                <UploadCloud className="w-12 h-12 text-blue-500 mb-2" />
                <p className="text-gray-700 font-medium">
                  Click or Drag & Drop to Upload
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>

              {upLoading && (
                <p className="mt-4 text-blue-600 font-semibold text-center animate-pulse">
                  Uploading image...
                </p>
              )}

              {imageUrl && (
                // <div className="mt-6 text-center">
                <p className="text-green-600 font-semibold mb-2">
                  Upload successful!
                </p>
                // <img
                //   src={imageUrl}
                //   alt="Uploaded"
                //   className="rounded-xl w-full object-cover"
                // />
                // <a
                //   href={imageUrl}
                //   target="_blank"
                //   rel="noopener noreferrer"
                //   className="block mt-2 text-blue-600 hover:underline text-sm"
                // >
                //   View Image in New Tab
                // </a>
                // </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Address
              </label>
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
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-2xl font-medium text-indigo-600">
                {riderData?.profileURL ? (
                  <div className="h-[60px] w-[60px] rounded-full overflow-hidden border border-gray-300 shadow-sm">
                    <img
                      src={riderData?.profileURL}
                      alt="Rider"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  riderData?.name?.charAt(0) || "U"
                )}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {riderData?.name || "User"}
              </h3>
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
              <p className="text-xl font-bold">₹{totalSpent.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Avg. Rating</p>
              <p className="text-xl font-bold">
                {avgRating ? avgRating.toFixed(1) + "★" : "N/A"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="font-medium">
                {riderData?.phoneNumber || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Address</p>
              <p className="font-medium">
                {riderData?.currentAddress || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">
                {new Date(riderData?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
