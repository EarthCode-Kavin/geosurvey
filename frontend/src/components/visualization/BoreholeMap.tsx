"use client";

import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Borehole } from "@/lib/api";

interface BoreholeMapProps {
    boreholes: Borehole[];
    onSelectBorehole?: (bh: Borehole) => void;
}

export default function BoreholeMap({ boreholes, onSelectBorehole }: BoreholeMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || map) return;

        const m = L.map(mapRef.current, {
            center: [20, 78], // Default to Central India
            zoom: 5,
            zoomControl: true,
        });

        // Use Google Satellite Imagery
        L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
            attribution: '&copy; <a href="https://www.google.com/intl/en-US_US/help/terms_maps.html">Google</a>',
            maxZoom: 20,
        }).addTo(m);

        setMap(m);

        return () => {
            m.remove();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!map) return;

        // Clear existing markers
        map.eachLayer((layer) => {
            if (layer instanceof L.CircleMarker || layer instanceof L.Marker || layer instanceof L.Tooltip) {
                map.removeLayer(layer);
            }
        });

        const bounds: L.LatLng[] = [];
        const validBoreholes = boreholes.filter((bh) => bh.latitude != null && bh.longitude != null);

        validBoreholes.forEach((bh) => {
            const latlng = L.latLng(bh.latitude!, bh.longitude!);
            bounds.push(latlng);

            // Create professional-looking cross-hair or circle markers for boreholes
            const marker = L.circleMarker(latlng, {
                radius: 7,
                fillColor: "red",
                color: "#fff",
                weight: 2,
                fillOpacity: 1,
            }).addTo(map);

            // Add permanent tooltip as label next to the marker
            marker.bindTooltip(`<b>${bh.name}</b><br/>${bh.total_depth}m`, {
                permanent: true,
                direction: "right",
                className: "borehole-label",
                offset: [10, 0]
            });

            if (onSelectBorehole) {
                marker.on('click', () => onSelectBorehole(bh));
                const el = marker.getElement();
                if (el instanceof HTMLElement) {
                    el.style.setProperty('cursor', 'pointer');
                }
            }
        });

        if (bounds.length > 0) {
            map.fitBounds(L.latLngBounds(bounds).pad(0.3));
        }

        // Add custom styles for the tooltip to match the professional look
        const style = document.createElement("style");
        style.innerHTML = `
            .borehole-label {
                background: rgba(255, 255, 255, 0.85);
                border: 1px solid #ccc;
                border-radius: 4px;
                padding: 2px 6px;
                font-size: 11px;
                font-weight: normal;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                color: #333;
                font-family: inherit;
            }
            .borehole-label::before {
                display: none; /* Hide the little triangle pointer of the tooltip */
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        }
    }, [map, boreholes, onSelectBorehole]);

    return (
        <div
            ref={mapRef}
            style={{
                height: 400,
                width: "100%",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid var(--border-color)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}
            id="borehole-map"
        />
    );
}
