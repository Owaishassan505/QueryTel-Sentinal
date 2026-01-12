// ===============================================================
// 🌍 QueryTel Sentinel — 2D CYBER ATTACK MAP (SOC Command Center)
// Layout A: Map Left + Attack Feed Right + Darkweb Widget
// Effects: Missiles, Trails, Arcs, Impact Glow, Clustering, Zoom
// Map Source: OpenStreetMap (M1)
// ===============================================================

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import axios from "axios";
import { generateArcPoints, missileTrail, clusterAttacks } from "../utils/CyberUtils";
import "leaflet/dist/leaflet.css";


export default function GlobalThreatMap() {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const attackLayerRef = useRef(L.layerGroup());
    const trailsLayerRef = useRef(L.layerGroup());
    const [attackFeed, setAttackFeed] = useState([]);

    // Small neon country labels
    const COUNTRY_LABELS = [
        { name: "USA", lat: 39.5, lng: -98.35 },
        { name: "Canada", lat: 56.1304, lng: -106.3468 },
        { name: "UK", lat: 55.3781, lng: -3.4360 },
        { name: "UAE", lat: 23.4241, lng: 53.8478 },
        { name: "India", lat: 20.5937, lng: 78.9629 },
        { name: "China", lat: 35.8617, lng: 104.1954 },
        { name: "Russia", lat: 61.5240, lng: 105.3188 },
        { name: "Japan", lat: 36.2048, lng: 138.2529 },
        { name: "Australia", lat: -25.2744, lng: 133.7751 },
        { name: "Brazil", lat: -14.2350, lng: -51.9253 },
        { name: "South Africa", lat: -30.5595, lng: 22.9375 }
    ];

    // Convert severity to color
    function sevColor(s) {
        s = (s || "").toLowerCase();
        if (s === "critical") return "#ff00ff";
        if (s === "error") return "#ff0033";
        if (s === "warning") return "#ffcc00";
        return "#00eaff";
    }

    // ===========================================================
    // INIT MAP
    // ===========================================================
    useEffect(() => {
        if (!mapRef.current) return;

        const newMap = L.map(mapRef.current, {
            zoomControl: false,
            minZoom: 2,
            maxZoom: 7,
            worldCopyJump: true
        }).setView([20, 0], 2.2);

        // OpenStreetMap FREE
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(newMap);

        attackLayerRef.current.addTo(newMap);
        trailsLayerRef.current.addTo(newMap);

        setMap(newMap);
    }, []);

    // ===========================================================
    // DRAW COUNTRY LABELS
    // ===========================================================
    useEffect(() => {
        if (!map) return;

        COUNTRY_LABELS.forEach(c => {
            L.marker([c.lat, c.lng], {
                icon: L.divIcon({
                    className: "country-label",
                    html: `<div style="
                        color:#00eaff;
                        font-size:11px;
                        font-weight:bold;
                        text-shadow:0 0 6px #00eaff;
                    ">${c.name}</div>`
                })
            }).addTo(map);
        });
    }, [map]);

    // ===========================================================
    // FETCH LOGS + ATTACK ANIMATION
    // ===========================================================
    async function loadAttacks() {
        try {
            const res = await axios.get("/api/logs?limit=40");

            const logs = res.data.logs;
            if (!logs || logs.length === 0) return;

            // Update right attack feed
            setAttackFeed(prev => [...logs, ...prev].slice(0, 30));

            // Cluster attacks
            const grouped = clusterAttacks(logs);

            grouped.forEach(log => {
                const color = sevColor(log.severity);

                const src = [log.srcLat, log.srcLng];
                const dst = [log.dstLat, log.dstLng];

                // Draw arc
                const arcPoints = generateArcPoints(src, dst, 60);

                const arc = L.polyline(arcPoints, {
                    color,
                    weight: 2,
                    opacity: 0.7
                }).addTo(attackLayerRef.current);

                setTimeout(() => {
                    arc.setStyle({ opacity: 0 });
                    setTimeout(() => attackLayerRef.current.removeLayer(arc), 300);
                }, 2000);

                // NEW: missile trail following the arc
                missileTrail(arcPoints, trailsLayerRef.current, color);

                // NEW: missile head movement
                let idx = 0;
                const missileHead = L.circleMarker(arcPoints[0], {
                    radius: 6,
                    color,
                    fillColor: color,
                    fillOpacity: 1
                }).addTo(trailsLayerRef.current);

                const interval = setInterval(() => {
                    missileHead.setLatLng(arcPoints[idx]);
                    idx++;

                    if (idx >= arcPoints.length) {
                        clearInterval(interval);
                        trailsLayerRef.current.removeLayer(missileHead);
                    }
                }, 25);

                // Zoom-to-attack animation
                map.flyToBounds([src, dst], { maxZoom: 4, duration: 1.4 });
            });

        } catch (err) {
            console.error("API Error:", err.message);
        }
    }



    useEffect(() => {
        if (!map) return;
        loadAttacks();
        const intv = setInterval(loadAttacks, 2800);
        return () => clearInterval(intv);
    }, [map]);

    return (
        <div style={{ display: "flex", width: "100vw", height: "100vh" }}>

            {/* LEFT: MAP */}
            <div
                ref={mapRef}
                style={{
                    width: "75%",
                    height: "100%",
                    background: "#050610"
                }}
            ></div>

            {/* RIGHT: Attack Feed */}
            <div
                style={{
                    width: "25%",
                    height: "100%",
                    background: "#0a0d1a",
                    borderLeft: "2px solid #00eaff55",
                    padding: "12px",
                    color: "#00eaff",
                    overflowY: "auto"
                }}
            >
                <h2 style={{ margin: 0, fontSize: "20px" }}>⚡ Live Attacks</h2>
                <hr style={{ borderColor: "#00eaff33" }} />

                {attackFeed.map((a, i) => (
                    <div
                        key={i}
                        style={{
                            marginBottom: "12px",
                            padding: "8px",
                            background: "#0d1324",
                            borderLeft: `4px solid ${sevColor(a.severity)}`,
                            borderRadius: "4px"
                        }}
                    >
                        <strong>{a.deviceName}</strong>
                        <br />
                        {a.sourceIp} → {a.destIp}
                        <br />
                        <span style={{ color: sevColor(a.severity) }}>
                            {a.severity}
                        </span>
                    </div>
                ))}
            </div>

            {/* DARKWEB FEED */}
        </div>
    );
}

