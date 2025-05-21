import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase'; // adjust path if needed

const Notification = ({ riderId ,setAnyNotification,setNotification}) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!riderId) return;

    const riderRef = doc(db, 'riders', riderId);

    const unsubscribe = onSnapshot(riderRef, (docSnap) => {
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
        setNotifications(sorted);
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, [riderId]);

  const markAsRead = async () => {
    if (!riderId || notifications.length === 0) return;

    const riderRef = doc(db, 'riders', riderId);

    try {
      const allNotifications = notifications.map(note => ({
        ...note,
        mark: 'read',
      }));
        await updateDoc(riderRef, { notifications: allNotifications });
        setNotifications([]);
        setAnyNotification(false);
        setNotification(false)
      }
    catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  return (
<div className='z-50 w-[260px] max-h-[400px] overflow-y-auto bg-white/40 backdrop-blur-md shadow-lg ring-1 ring-white/30 rounded-lg p-4 absolute left-2/4 top-16 border border-gray-200'>
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Notifications</h3>
      {notifications.length === 0 ? (
        <p className="text-gray-500 text-sm">No notifications</p>
      ) : (
        notifications.map((note, index) => (
          <div key={index} className="mb-2 p-2 bg-amber-100 rounded hover:bg-amber-200 transition-all duration-200">
            <p className="text-sm text-gray-800">{note.text}</p>
            <p className="text-xs text-gray-500">
              {/* Firestore Timestamp conversion */}
              {note.timeStamp?.toDate
                ? note.timeStamp.toDate().toLocaleString()
                : new Date(note.timeStamp).toLocaleString() || 'Unknown time'}
            </p>
          </div>
        ))
      )}
      <button
        onClick={markAsRead}
        className="mt-2 w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700 transition"
      >
        Mark all read
      </button>
    </div>
  );
};

export default Notification;
