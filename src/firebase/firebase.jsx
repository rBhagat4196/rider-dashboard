// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyDdobgzn_dYDJMqAH2Zor7QkafCk1bYtOg",
  authDomain: "interview-af776.firebaseapp.com",
  projectId: "interview-af776",
  storageBucket: "interview-af776.firebasestorage.app",
  messagingSenderId: "467815626064",
  appId: "1:467815626064:web:521b0e7d9eac2c1a7d6855",
  measurementId: "G-FJ42WBGLT7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
export { db , auth, storage};