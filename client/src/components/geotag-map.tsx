import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Search, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { reverseGeocode, validateCoordinates } from "@/lib/geotag-utils";
import { useToast } from "@/hooks/use-toast";

interface GeotagMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export function GeotagMap({ latitude, longitude, onLocationChange }: GeotagMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current).setView([latitude, longitude], 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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
    });

    const marker = L.marker([latitude, longitude], { 
      icon: customIcon,
      draggable: true 
    }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onLocationChange(pos.lat, pos.lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onLocationChange(lat, lng);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - latitude) > 0.0001 || Math.abs(currentPos.lng - longitude) > 0.0001) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom());
      }
    }
  }, [latitude, longitude]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const result = await reverseGeocode(searchQuery);
      if (result) {
        onLocationChange(result.lat, result.lng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([result.lat, result.lng], 15);
        }
        toast({
          title: "Location found",
          description: result.displayName.substring(0, 100),
        });
      } else {
        toast({
          title: "Location not found",
          description: "Try a different search term",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Search failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, onLocationChange, toast]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        onLocationChange(lat, lng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
        }
        toast({
          title: "Location found",
          description: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
        setIsLocating(false);
      },
      (error) => {
        toast({
          title: "Location error",
          description: error.message,
          variant: "destructive",
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationChange, toast]);

  return (
    <Card data-testid="card-geotag-map">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2" data-testid="text-map-title">
          <MapPin className="h-5 w-5 text-primary" />
          Set Location
        </CardTitle>
        <p className="text-sm text-muted-foreground" data-testid="text-map-instruction">
          Click on the map or drag the marker to set GPS coordinates
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Search for a place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pr-10"
              data-testid="input-search-location"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={handleSearch}
              disabled={isSearching}
              data-testid="button-search-location"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            data-testid="button-use-my-location"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            My Location
          </Button>
        </div>

        <div 
          ref={mapRef} 
          className="h-[300px] rounded-md overflow-hidden border border-border"
          data-testid="map-container"
        />
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Latitude (-90 to 90)</label>
            <Input
              type="number"
              step="any"
              min="-90"
              max="90"
              value={latitude.toFixed(6)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && validateCoordinates(val, longitude)) {
                  onLocationChange(val, longitude);
                }
              }}
              data-testid="input-latitude"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Longitude (-180 to 180)</label>
            <Input
              type="number"
              step="any"
              min="-180"
              max="180"
              value={longitude.toFixed(6)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && validateCoordinates(latitude, val)) {
                  onLocationChange(latitude, val);
                }
              }}
              data-testid="input-longitude"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
