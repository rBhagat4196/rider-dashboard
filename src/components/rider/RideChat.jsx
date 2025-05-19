import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase/firebase"; // Your Firebase initialization
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";

const RideChat = ({ chatId, riderId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [riderName, setRiderName] = useState("Rider");
  const messagesEndRef = useRef(null);

  // Fetch rider name and initial messages
  useEffect(() => {
    if (!chatId || !riderId) return;

    // Get rider name from riders collection
    const fetchRiderName = async () => {
      const riderDoc = await getDoc(doc(db, "riders", riderId));
      if (riderDoc.exists()) {
        setRiderName(riderDoc.data().name || "Rider");
      }
    };

    // Listen for chat updates
    const chatRef = doc(db, "chats", chatId);
    const unsubscribe = onSnapshot(chatRef, (doc) => {
      if (doc.exists()) {
        setMessages(doc.data().messages || []);
        scrollToBottom();
      }
    });

    fetchRiderName();
    return () => unsubscribe();
  }, [chatId, riderId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        messages: arrayUnion({
          text: newMessage,
          timeStamp: new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),

          senderName: riderName,
          riderId: riderId,
        }),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!chatId) {
    return <div className="p-4 text-center">No chat selected</div>;
  }

  return (
    <div className="flex flex-col h-full border rounded-lg">
      <div className="p-3 bg-gray-100 border-b">
        <h3 className="font-medium">Chatting as {riderName}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No messages yet</div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="flex flex-col">
              <div
                className={`flex ${
                  msg.riderId === riderId ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-xs rounded-lg px-3 py-2 ${
                    msg.riderId === riderId ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <div className="text-xs font-medium">{msg.senderName}</div>
                  <p>{msg.text}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {msg.timeStamp}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default RideChat;
