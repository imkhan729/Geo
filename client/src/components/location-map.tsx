import { useEffect, useRef } from "react";
import L from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationMapProps {
  latitude: number;
  longitude: number;
}

export function LocationMap({ latitude, longitude }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current).setView([latitude, longitude], 15);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const customIcon = L.divIcon({
      html: `
        <div style="
          background-color: hsl(217, 91%, 60%);
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      className: "custom-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
      <div style="text-align: center; padding: 8px;">
        <strong>Photo Location</strong><br/>
        <span style="font-size: 12px; color: #666;">
          ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
        </span>
      </div>
    `).openPopup();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude]);

  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank");
  };

  const openInOpenStreetMap = () => {
    window.open(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`, "_blank");
  };

  return (
    <Card data-testid="card-location-map">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2" data-testid="text-map-title">
            <MapPin className="h-5 w-5 text-primary" />
            Photo Location
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openInGoogleMaps}
              data-testid="button-google-maps"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Maps
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openInOpenStreetMap}
              data-testid="button-osm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              OSM
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div 
          ref={mapRef} 
          className="h-80 w-full rounded-lg overflow-hidden border border-border"
          data-testid="map-container"
        />
      </CardContent>
    </Card>
  );
}
