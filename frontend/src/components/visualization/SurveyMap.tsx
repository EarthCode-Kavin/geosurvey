"use client";

import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SurveyMapProps {
    data: Record<string, unknown>;
}

export default function SurveyMap({ data }: SurveyMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || map) return;

        const m = L.map(mapRef.current, {
            center: [20, 78],
            zoom: 5,
            zoomControl: true,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
        }).addTo(m);

        setMap(m);

        return () => {
            m.remove();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!map || !data) return;

        const features = (data as { features?: Array<{ geometry?: { coordinates?: number[] }; properties?: { name?: string; type?: string } }> }).features || [];
        const bounds: L.LatLng[] = [];

        features.forEach((feature) => {
            const geom = feature.geometry;
            if (geom && geom.coordinates) {
                const [lng, lat] = geom.coordinates;
                const latlng = L.latLng(lat, lng);
                bounds.push(latlng);

                const color = feature.properties?.type === "borehole" ? "#10b981" : "#3b82f6";
                const marker = L.circleMarker(latlng, {
                    radius: 8,
                    fillColor: color,
                    color: "#fff",
                    weight: 2,
                    fillOpacity: 0.8,
                }).addTo(map);

                marker.bindPopup(`
          <div style="font-family: Inter, sans-serif;">
            <strong>${feature.properties?.name || "Unknown"}</strong><br/>
            <span style="color: #888; font-size: 12px;">${feature.properties?.type || ""}</span>
          </div>
        `);
            }
        });

        if (bounds.length > 0) {
            map.fitBounds(L.latLngBounds(bounds).pad(0.3));
        }
    }, [map, data]);

    return (
        <div
            ref={mapRef}
            style={{
                height: 300,
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid var(--border-color)",
            }}
            id="survey-map"
        />
    );
}
