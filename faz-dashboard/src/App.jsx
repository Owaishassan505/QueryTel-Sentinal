// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedApp from "./ProtectedApp";
import Login from "./pages/Login";
import TwoFA from "./pages/TwoFA";
import TwoFASetup from "./pages/TwoFASetup";
import GlobalThreatMap from "./pages/GlobalThreatMap";

export default function App() {
  const [loaded, setLoaded] = useState(false);

  // 🔥 Extract token BEFORE React renders any protected routes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");

    if (urlToken && urlToken !== "undefined" && urlToken.trim() !== "") {
      console.log("🔐 Azure Token Received:", urlToken);
      localStorage.setItem("token", urlToken);

      // Remove token from URL
      window.history.replaceState({}, document.title, "/");
    }

    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="text-center text-white p-10">
        <h2>Loading...</h2>
      </div>
    );
  }

  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/2fa" element={<TwoFA />} />
        <Route path="/2fa-setup" element={<TwoFASetup />} />
        <Route path="/global-map" element={<GlobalThreatMap />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/*"
          element={token ? <ProtectedApp /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
