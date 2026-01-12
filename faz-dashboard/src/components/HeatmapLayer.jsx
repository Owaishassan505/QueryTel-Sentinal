import { useEffect } from "react";
import L from "leaflet";
import "leaflet.heat";

export default function HeatmapLayer({ map, points }) {
    useEffect(() => {
        if (!map || !points) return;

        const heatLayer = L.heatLayer(
            points.map((p) => [p.lat, p.lng, p.intensity || 0.7]),
            {
                radius: 25,
                blur: 20,
                maxZoom: 8,
            }
        );

        map.addLayer(heatLayer);

        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, points]);

    return null;
}
