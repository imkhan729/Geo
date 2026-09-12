import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Search, Locate, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchPlaces, reverseGeocode, PlaceSuggestion } from "@/lib/geotag-utils";
import { useToast } from "@/hooks/use-toast";
import { trackMapLocationSelected, trackGeocoderError } from "@/lib/analytics";

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
  onLocationFound?: (lat: number, lng: number, displayName?: string) => void;
  className?: string;
  zoom?: number;
  readOnly?: boolean;
  showSearch?: boolean;
}

export function LeafletMap({
  latitude,
  longitude,
  onCoordinatesChange,
  onLocationFound,
  className = "",
  zoom = 13,
  readOnly = false,
  showSearch = true,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const ignoreSearchRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

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
        zoomControl: false, // zoom control placed at bottom-right for clean top search bar
      }).setView([latitude, longitude], zoom);
      mapInstanceRef.current = map;

      L.control.zoom({ position: "bottomright" }).addTo(map);

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

  // Update marker position and pan when coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const curPos = markerRef.current.getLatLng();
      const dist = Math.abs(curPos.lat - latitude) + Math.abs(curPos.lng - longitude);

      // Only update if difference is meaningful
      if (dist > 0.00001) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude], { animate: true });
      }
    }
  }, [latitude, longitude]);

  // Debounced search query
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3 && !ignoreSearchRef.current) {
        setIsSearching(true);
        try {
          const results = await searchPlaces(searchQuery);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch {
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      ignoreSearchRef.current = false;
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = useCallback((item: PlaceSuggestion) => {
    ignoreSearchRef.current = true;
    setSearchQuery(item.displayName);
    setShowSuggestions(false);
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([item.lat, item.lng]);
      mapInstanceRef.current.setView([item.lat, item.lng], 14, { animate: true });
    }
    onCoordinatesChange?.(item.lat, item.lng);
    onLocationFound?.(item.lat, item.lng, item.displayName);
    trackMapLocationSelected({ method: "search" });
    toast({
      title: "Location Selected",
      description: item.displayName.substring(0, 60),
    });
  }, [onCoordinatesChange, onLocationFound, toast]);

  const handleSearchSubmit = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await reverseGeocode(searchQuery);
      if (result) {
        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([result.lat, result.lng]);
          mapInstanceRef.current.setView([result.lat, result.lng], 14, { animate: true });
        }
        onCoordinatesChange?.(result.lat, result.lng);
        onLocationFound?.(result.lat, result.lng, result.displayName);
        trackMapLocationSelected({ method: "search" });
        setShowSuggestions(false);
        toast({
          title: "Location Found",
          description: result.displayName.substring(0, 60),
        });
      } else {
        trackGeocoderError({ error_type: "location_not_found" });
        toast({
          title: "Location Not Found",
          description: "Try entering a city name, address, or postal code.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, onCoordinatesChange, onLocationFound, toast]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser does not support automatic location detection.",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1000000) / 1000000;
        const lng = Math.round(pos.coords.longitude * 1000000) / 1000000;
        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
        }
        onCoordinatesChange?.(lat, lng);
        onLocationFound?.(lat, lng, "Current Location");
        trackMapLocationSelected({ method: "device_gps" });
        setIsLocating(false);
        toast({
          title: "Location Detected",
          description: `Set to ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        });
      },
      (err) => {
        setIsLocating(false);
        let msg = "Could not retrieve your location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location access was denied in browser permissions.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Position unavailable. Please search or click on the map.";
        }
        toast({
          title: "Location Unavailable",
          description: msg,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onCoordinatesChange, onLocationFound, toast]);

  return (
    <div
      className={`relative w-full h-[300px] sm:h-[340px] md:h-[360px] rounded-2xl border border-border overflow-hidden bg-muted/20 shadow-sm ${className}`}
      role="region"
      aria-label={
        readOnly
          ? "Map showing photo GPS location"
          : "Interactive location map. To set coordinates without using the map, use the latitude and longitude inputs in the adjacent panel."
      }
    >
      <div ref={mapContainerRef} className="absolute inset-0 z-0" data-testid="leaflet-map" />

      {/* ── Top-Inside Floating Location Search Bar ── */}
      {showSearch && !readOnly && (
        <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-3 sm:right-3 z-[500] max-w-lg mx-auto sm:max-w-none sm:mx-0">
          <div className="relative flex items-center gap-1.5 bg-card/95 backdrop-blur-md border border-border/80 rounded-xl p-1 shadow-lg ring-1 ring-black/5">
            <div className="relative flex-1 flex items-center min-w-0">
              <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none shrink-0" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search place, city, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  } else if (e.key === "Escape") {
                    setShowSuggestions(false);
                  }
                }}
                className="w-full pl-8 pr-7 py-1.5 bg-transparent text-xs sm:text-sm font-medium placeholder:text-muted-foreground/70 focus:outline-none text-foreground truncate"
                aria-label="Search place name or address on map"
                data-testid="input-map-search"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="absolute right-2 p-0.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50"
                  aria-label="Clear search query"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {isSearching && (
                <div className="absolute right-2 pointer-events-none text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                </div>
              )}
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleSearchSubmit}
              disabled={isSearching || !searchQuery.trim()}
              className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg shrink-0"
              aria-label="Search location"
              data-testid="button-map-search"
            >
              <Search className="h-3.5 w-3.5 sm:mr-1" aria-hidden="true" />
              <span className="hidden sm:inline">Search</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg border-border/80 hover:bg-primary/10 hover:text-primary shrink-0"
              title="Use current GPS location"
              aria-label="Use my device GPS location"
              data-testid="button-map-my-location"
            >
              {isLocating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
              ) : (
                <Locate className="h-3.5 w-3.5 text-primary sm:mr-1" aria-hidden="true" />
              )}
              <span className="hidden md:inline">My Location</span>
            </Button>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1.5 bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-xl overflow-hidden max-h-52 overflow-y-auto ring-1 ring-black/5"
              role="listbox"
              aria-label="Location suggestions"
            >
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-3 py-2 hover:bg-primary/10 transition-colors text-xs flex items-start gap-2 border-b border-border/20 last:border-0"
                  role="option"
                  aria-selected="false"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="line-clamp-1 text-foreground font-medium">{item.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Coordinate Pill */}
      <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-2 bg-card/95 backdrop-blur-md border border-border/80 px-3 py-1.5 rounded-xl shadow-md pointer-events-none">
        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
        <span className="text-xs font-mono font-semibold text-foreground">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </span>
      </div>

      {/* Map Usage Hint (visible when read-only, or subtle hint next to bottom-right zoom) */}
      {readOnly ? (
        <div className="absolute top-3 right-3 z-[400] text-[11px] text-muted-foreground bg-card/90 backdrop-blur-sm border border-border/60 px-2.5 py-1 rounded-lg shadow-sm pointer-events-none">
          Photo capture location
        </div>
      ) : (
        <div className="absolute bottom-3 right-14 z-[400] text-[10px] text-muted-foreground bg-card/90 backdrop-blur-sm border border-border/60 px-2 py-1 rounded-lg shadow-sm pointer-events-none hidden md:block">
          Click anywhere or drag pin
        </div>
      )}
    </div>
  );
}

export default LeafletMap;
