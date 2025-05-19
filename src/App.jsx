import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/shared/AuthContext";
import PrivateRoute from "./components/shared/PrivateRoute";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import RiderDashboard from "./pages/RiderDashboard";
import Home from "./pages/Home";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Home />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <RiderDashboard />
                </PrivateRoute>
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;