import React, { useState, useEffect } from "react";
import {
  FiCreditCard,
  FiDollarSign,
  FiSmartphone,
  FiCheck,
} from "react-icons/fi";
import { doc, getDoc, Timestamp, updateDoc,arrayUnion } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const Payment = ({ riderId }) => {
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [riderData, setRiderData] = useState(null);
  const [unpaidRide, setUnpaidRide] = useState(null);

  useEffect(() => {
    const fetchRiderData = async () => {
      try {
        const riderRef = doc(db, "riders", riderId);
        const snap = await getDoc(riderRef);

        if (snap.exists()) {
          const data = snap.data();
          setRiderData(data);

          // Simulate unpaid ride details — replace this with actual data from Firestore if structured differently
          if (data.isPayment) {
            setUnpaidRide({
              startAddress: data.startAddress || "Start Point",
              destinationAddress: data.destinationAddress || "End Point",
              totalDistance: data.totalDistance || 5.5,
              totalFare: data.totalFare || 120.0,
              mode: data.mode || "cab",
            });
          }
        } else {
          console.warn("Rider not found");
        }
      } catch (err) {
        console.error("Error fetching rider data:", err);
      }
    };

    fetchRiderData();
  }, [riderId]);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const riderRef = doc(db, "riders", riderId);
      await updateDoc(riderRef, {
        isPayment: false,
        notifications: arrayUnion({
          text: "Payment Completed",
          timeStamp: Date.now(),
        }),
      });

      const updatedSnap = await getDoc(riderRef);
      const updatedData = updatedSnap.data();
      setRiderData(updatedData);
      setUnpaidRide(null); // Clear unpaid ride if payment is done

      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 3000);
    } catch (error) {
      console.error("Payment processing error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!riderData || (riderData && !riderData.isPayment)) {
    return (
      <div className="p-4 text-center">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <FiCheck className="mx-auto text-4xl text-green-500 mb-3" />
          <h2 className="text-lg font-semibold mb-1">No Pending Payments</h2>
          <p className="text-gray-600">All your rides have been paid</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Complete Payment
      </h1>

      {/* Ride Summary */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-3">Pending Payment</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">From:</span>
            <span className="font-medium">{unpaidRide?.startAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">To:</span>
            <span className="font-medium">
              {unpaidRide?.destinationAddress}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Distance:</span>
            <span>{unpaidRide?.totalDistance} km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Mode:</span>
            <span className="capitalize">{unpaidRide?.mode}</span>
          </div>
          <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-gray-100">
            <span>Amount Due:</span>
            <span className="text-indigo-600">
              ₹{unpaidRide?.totalFare.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-3">Select Payment Method</h2>

        <div className="space-y-3">
          <button
            onClick={() => setPaymentMethod("upi")}
            className={`flex items-center w-full p-3 rounded-lg border ${
              paymentMethod === "upi"
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <FiSmartphone
              className={`text-xl mr-3 ${
                paymentMethod === "upi" ? "text-indigo-600" : "text-gray-500"
              }`}
            />
            <div className="text-left">
              <p className="font-medium">UPI Payment</p>
              <p className="text-sm text-gray-500">Pay using any UPI app</p>
            </div>
          </button>

          <button
            onClick={() => setPaymentMethod("cash")}
            className={`flex items-center w-full p-3 rounded-lg border ${
              paymentMethod === "cash"
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <FiDollarSign
              className={`text-xl mr-3 ${
                paymentMethod === "cash" ? "text-indigo-600" : "text-gray-500"
              }`}
            />
            <div className="text-left">
              <p className="font-medium">Cash Payment</p>
              <p className="text-sm text-gray-500">Pay cash to driver</p>
            </div>
          </button>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className={`w-full py-3 px-4 bg-indigo-600 text-white rounded-md font-medium flex items-center justify-center ${
          isProcessing ? "opacity-75" : "hover:bg-indigo-700"
        }`}
      >
        {isProcessing ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
            Processing...
          </>
        ) : (
          `Pay ₹${unpaidRide?.totalFare.toFixed(2)}`
        )}
      </button>

      {paymentSuccess && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-center">
          Payment successful! Thank you for riding with us.
        </div>
      )}

      {paymentMethod === "cash" && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-center text-sm">
          Please pay ₹{unpaidRide?.totalFare.toFixed(2)} directly to your driver
        </div>
      )}
    </div>
  );
};

export default Payment;
