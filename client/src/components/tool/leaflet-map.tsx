import React, { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

let _L: any = null;
async function getL() {
  if (!_L) {
    const leafletUrl = "/vendor/leaflet.esm.js";
    const leaflet = await import(/* @vite-ignore */ leafletUrl);
    _L = leaflet.default ?? leaflet;
  }
  return _L;
}

export interface LeafletMapProps {
  latitude: number;
  longitude: number;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  className?: string;
  zoom?: number;
  readOnly?: boolean;
}

export function LeafletMap({
  latitude,
  longitude,
  onCoordinatesChange,
  className = "",
  zoom = 13,
  readOnly = false,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let cancelled = false;

    getL().then((L) => {
      if (cancelled || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current, {
        scrollWheelZoom: "center", // smoother scroll behavior
      }).setView([latitude, longitude], zoom);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const customIcon = L.divIcon({
        html: `<div style="background:#2D6A4F;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 3px 10px rgba(45,106,79,0.5);"></div>`,
        className: "custom-leaflet-marker",
        iconSize: [26, 26],
        iconAnchor: [13, 26],
      });

      const marker = L.marker([latitude, longitude], {
        icon: customIcon,
        draggable: !readOnly,
      }).addTo(map);
      markerRef.current = marker;

      if (!readOnly && onCoordinatesChange) {
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          const roundedLat = Math.round(pos.lat * 1000000) / 1000000;
          const roundedLng = Math.round(pos.lng * 1000000) / 1000000;
          onCoordinatesChange(roundedLat, roundedLng);
        });

        map.on("click", (e: any) => {
          const roundedLat = Math.round(e.latlng.lat * 1000000) / 1000000;
          const roundedLng = Math.round(e.latlng.lng * 1000000) / 1000000;
          marker.setLatLng([roundedLat, roundedLng]);
          onCoordinatesChange(roundedLat, roundedLng);
        });
      }

      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position and optionally pan when coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const curPos = markerRef.current.getLatLng();
      const dist = Math.abs(curPos.lat - latitude) + Math.abs(curPos.lng - longitude);

      // Only update if difference is meaningful
      if (dist > 0.00001) {
        markerRef.current.setLatLng([latitude, longitude]);
        // Pan to new coordinates
        mapInstanceRef.current.panTo([latitude, longitude], { animate: true });
      }
    }
  }, [latitude, longitude]);

  return (
    <div
      className={`relative w-full rounded-2xl border border-border overflow-hidden bg-muted/20 shadow-sm ${className}`}
      style={{ minHeight: "350px", height: "100%" }}
      role="region"
      aria-label={readOnly ? "Map showing photo GPS location" : "Interactive location map picker"}
    >
      <div ref={mapContainerRef} className="absolute inset-0 z-0" data-testid="leaflet-map" />

      {/* Floating Coordinate Pill */}
      <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-2 bg-card/95 backdrop-blur-md border border-border/80 px-3 py-1.5 rounded-xl shadow-md pointer-events-none">
        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
        <span className="text-xs font-mono font-semibold text-foreground">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </span>
      </div>

      {/* Map Usage Hint */}
      <div className="absolute top-3 right-3 z-[400] text-[11px] text-muted-foreground bg-card/90 backdrop-blur-sm border border-border/60 px-2.5 py-1 rounded-lg shadow-sm pointer-events-none hidden sm:block">
        {readOnly ? "Photo capture location" : "Click anywhere or drag pin to adjust"}
      </div>
    </div>
  );
}
