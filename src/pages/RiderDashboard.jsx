import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  FiHome,
  FiNavigation,
  FiClock,
  FiStar,
  FiCreditCard,
  FiPieChart,
  FiUser,
} from "react-icons/fi";

// Import your components
import RideBooking from "../components/rider/RideBooking";
import CurrentRide from "../components/rider/CurrentRide";
import RideHistory from "../components/rider/RideHistory";
import RateRides from "../components/rider/RateRides";
import Payment from "../components/rider/Payment";
import Analytics from "../components/rider/Analytics";
import Profile from "../components/rider/Profile";
import Notification from "../components/utils/Notification";

const RiderDashboard = () => {
  const [user, loading] = useAuthState(auth);
  const [activeRide, setActiveRide] = useState(null);
  const [view, setView] = useState("home");
  const [riderData, setRiderData] = useState(null);
  const navigate = useNavigate();
  const [notification,setNotification] = useState(false)
  const [anyNotification,setAnyNotification] = useState(false)
  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading]);

  // Fetch active ride
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "requests"),
      where("riderId", "==", user.uid),
      where("status", "in", ["pending", "accepted", "ongoing"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const ride = snapshot.docs[0].data();
        setActiveRide({ id: snapshot.docs[0].id, ...ride });
      } else {
        setActiveRide(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch rider data
  useEffect(() => {
    if (!user) return;

    const fetchRiderData = async () => {
      const docRef = doc(db, "riders", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRiderData(docSnap.data());
      }
      const data = docSnap.data();
      if (data && data.notifications) {
        // Filter unread notifications and sort by timestamp descending
        const sorted = [...data.notifications]
          .filter((a) => a.mark === "unread")
          .sort((a, b) => {
            const timeA = a.timeStamp?.seconds || 0;  // Firestore Timestamp seconds
            const timeB = b.timeStamp?.seconds || 0;
            return timeB - timeA;
          });
        setAnyNotification(()=> sorted.length == 0 ? false : true);
      }
    };

    fetchRiderData();
  }, [user]);

  if (loading || !riderData)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Logo - Replace with your actual logo image or SVG */}
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className="w-5 h-5"
              >
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-indigo-600">
              <span className="text-indigo-800">Route</span>Sync
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-600 hover:text-indigo-600 relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                onClick={()=> setNotification(prev=> !prev)}
              >
                <path
                  fillRule="evenodd"
                  d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z"
                  clipRule="evenodd"
                />
              </svg>
              {
                anyNotification && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                )
              }
            </button>

            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-sm font-medium text-indigo-600">
 {riderData?.profileURL ? (
                  <div className="h-[40px] w-[40px] rounded-full overflow-hidden border border-gray-300 shadow-sm">
                    <img
                      src={riderData?.profileURL}
                      alt="Rider"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  riderData?.name?.charAt(0) || "U"
                )}              </span>
            </div>
          </div>
        </div>
      </header>

      {notification && <Notification riderId={user.uid} setAnyNotification={setAnyNotification}/>}
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            {view === "home" && (
              <RideBooking user={user} riderData={riderData} setView = {setView} />
            )}
            {view === "current" && activeRide && (
              <CurrentRide ride={activeRide} user={user} setView={setView}/>
            )}
            {view === "history" && <RideHistory riderId={user.uid} />}
            {view === "rate" && (
              <RateRides riderData={riderData} riderId={user.uid} />
            )}
            {view === "payment" && (
              <Payment riderId={user.uid} />
            )}
            {view === "analytics" && <Analytics riderData={riderData} />}
            {view === "profile" && (
              <Profile
                user={user}
                riderData={riderData}
                setRiderData={setRiderData}
              />
            )}
          </div>
        </div>
      </main>

      {/* Bottom navigation tabs */}
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full">
        <div className="max-w-md mx-auto flex justify-around">
          <button
            onClick={() => setView("home")}
            className={`flex flex-col items-center py-3 px-2 ${
              view === "home" ? "text-indigo-600" : "text-gray-500"
            }`}
          >
            <FiHome size={20} />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => setView("current")}
            className={`flex flex-col items-center py-3 px-2 ${
              view === "current" ? "text-indigo-600" : "text-gray-500"
            } ${!activeRide ? "opacity-50" : ""}`}
            disabled={!activeRide}
          >
            <FiNavigation size={20} />
            <span className="text-xs mt-1">Current</span>
          </button>
          <button
            onClick={() => setView("history")}
            className={`flex flex-col items-center py-3 px-2 ${
              view === "history" ? "text-indigo-600" : "text-gray-500"
            }`}
          >
            <FiClock size={20} />
            <span className="text-xs mt-1">History</span>
          </button>
          <button
            onClick={() => setView("rate")}
            className={`flex flex-col items-center py-3 px-2 ${
              view === "rate" ? "text-indigo-600" : "text-gray-500"
            }`}
          >
            <FiStar size={20} />
            <span className="text-xs mt-1">Rate</span>
          </button>
          <button
            onClick={() => setView("payment")}
            className={`flex flex-col items-center py-3 px-2 ${
              view === "payment" ? "text-indigo-600" : "text-gray-500"
            }`}
          >
            <FiCreditCard size={20} />
            <span className="text-xs mt-1">Pay</span>
          </button>
          <button
            onClick={() => setView("analytics")}
            className={`flex flex-col items-center py-3 px-2 ${
              view === "analytics" ? "text-indigo-600" : "text-gray-500"
            }`}
          >
            <FiPieChart size={20} />
            <span className="text-xs mt-1">Stats</span>
          </button>
          <button
            onClick={() => setView("profile")}
            className={`flex flex-col items-center py-3 px-2 ${
              view === "profile" ? "text-indigo-600" : "text-gray-500"
            }`}
          >
            <FiUser size={20} />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default RiderDashboard;
