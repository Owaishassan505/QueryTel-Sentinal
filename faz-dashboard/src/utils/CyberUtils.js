// ==================================================================
// CyberUtils.js — Utility Engine for 2D Cyber Map
// Arc Points • Missile Trail • Simple Clustering
// ==================================================================

import L from "leaflet";

// --------------------------------------------------------------
// 1. Generate curved arc points between two lat/lng pairs
// --------------------------------------------------------------
export function generateArcPoints(src, dst, segments = 40) {
    const [lat1, lng1] = src;
    const [lat2, lng2] = dst;

    const points = [];

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;

        // Linear interpolation
        const lat = lat1 + (lat2 - lat1) * t;
        const lng = lng1 + (lng2 - lng1) * t;

        // Cyber arc "lift" using sine wave
        const lift = Math.sin(Math.PI * t) * 8; // peak lift
        const curvedLat = lat + (lift * 0.08);

        points.push([curvedLat, lng]);
    }

    return points;
}

// --------------------------------------------------------------
// 2. Missile Trail — Improved version with fade-out + cleanup
// --------------------------------------------------------------
// --------------------------------------------------------------
// 2. Missile Trail - follow REAL arc points (fixed)
// --------------------------------------------------------------
export function missileTrail(arcPoints, layer, color) {
    arcPoints.forEach((point, i) => {
        const dot = L.circleMarker(point, {
            radius: 3,
            color,
            fillColor: color,
            fillOpacity: 0.9
        }).addTo(layer);

        // Fade + cleanup
        setTimeout(() => {
            dot.setStyle({ opacity: 0.0, fillOpacity: 0.0 });
            setTimeout(() => layer.removeLayer(dot), 350);
        }, 1200 + i * 15);
    });
}

// --------------------------------------------------------------
// 3. Simple clustering: reduce duplicate attacks from same region
// --------------------------------------------------------------
export function clusterAttacks(list, thresholdDeg = 3) {
    const clustered = [];

    list.forEach(log => {
        if (!log.srcLat || !log.srcLng) return;
        if (!log.dstLat || !log.dstLng) return;

        let found = false;

        for (let c of clustered) {
            const nearSrc =
                Math.abs(c.srcLat - log.srcLat) < thresholdDeg &&
                Math.abs(c.srcLng - log.srcLng) < thresholdDeg;

            const nearDst =
                Math.abs(c.dstLat - log.dstLat) < thresholdDeg &&
                Math.abs(c.dstLng - log.dstLng) < thresholdDeg;

            if (nearSrc && nearDst) {
                found = true;
                break;
            }
        }

        if (!found) clustered.push(log);
    });

    return clustered;
}
