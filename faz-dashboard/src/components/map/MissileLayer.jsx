import { useEffect } from "react";
import L from "leaflet";

export default function MissileLayer({ map, attacks }) {
    useEffect(() => {
        if (!map || !attacks) return;

        attacks.forEach((attack) => {
            const { srcLat, srcLng, dstLat, dstLng, severity } = attack;

            let color =
                severity === "Critical"
                    ? "#ff0000"
                    : severity === "High"
                        ? "#ff6b00"
                        : severity === "Medium"
                            ? "#ffff00"
                            : "#00ffea";

            // Arc path between points
            const arc = L.motion.polyline(
                [
                    [srcLat, srcLng],
                    [dstLat, dstLng]
                ],
                {
                    color,
                    weight: 2,
                    opacity: 0.9
                },
                {
                    auto: true,
                    duration: 3000,
                },
                {
                    removeOnEnd: true,
                    showMarker: true,
                    marker: L.circleMarker([srcLat, srcLng], {
                        radius: 5,
                        color,
                        fillColor: color,
                        fillOpacity: 1,
                    }),
                }
            ).addTo(map);

            // Particle effect (moving point)
            const particle = L.motion.circleMarker(
                [srcLat, srcLng],
                {
                    radius: 4,
                    color,
                    fillColor: color,
                    fillOpacity: 1,
                },
                {
                    auto: true,
                    duration: 2500,
                    easing: L.Motion.Ease.linear
                }
            ).addTo(map);

            particle.motionMoveTo([dstLat, dstLng], 2500);

            // Explosion effect at destination
            setTimeout(() => {
                L.circleMarker([dstLat, dstLng], {
                    radius: 10,
                    color,
                    fillColor: color,
                    fillOpacity: 0.4,
                })
                    .addTo(map)
                    .setStyle({ opacity: 0 })
                    .setRadius(25);
            }, 2600);
        });
    }, [map, attacks]);

    return null;
}
