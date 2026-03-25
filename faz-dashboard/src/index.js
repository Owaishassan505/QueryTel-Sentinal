import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { initTheme } from "./theme";
import "leaflet/dist/leaflet.css";
import "./leaflet-fix";



// initTheme();


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
