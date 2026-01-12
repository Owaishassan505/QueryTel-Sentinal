import { useEffect } from "react";
import L from "leaflet";
import "leaflet.markercluster";

export default function ClusterLayer({ map, points }) {
    useEffect(() => {
        if (!map || !points) return;

        const clusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 60,
            spiderfyOnEveryZoom: false,
            showCoverageOnHover: false,
        });

        points.forEach((p) => {
            const marker = L.marker([p.lat, p.lng], {
                icon: L.divIcon({
                    className: "attack-marker",
                    html: `<div style="width:12px;height:12px;background:#ff3b3b;border-radius:50%"></div>`
                })
            });

            clusterGroup.addLayer(marker);
        });

        map.addLayer(clusterGroup);

        return () => {
            map.removeLayer(clusterGroup);
        };
    }, [map, points]);

    return null;
}
