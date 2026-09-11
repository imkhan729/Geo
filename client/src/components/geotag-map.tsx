import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Search, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeafletMap } from "@/components/tool/leaflet-map";
import { reverseGeocode, validateCoordinates } from "@/lib/geotag-utils";
import { useToast } from "@/hooks/use-toast";

interface GeotagMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export function GeotagMap({ latitude, longitude, onLocationChange }: GeotagMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await reverseGeocode(searchQuery);
      if (result) {
        onLocationChange(result.lat, result.lng);
        toast({
          title: "Location found",
          description: result.displayName,
        });
      } else {
        toast({
          title: "Location not found",
          description: "Try searching for a city, address, or landmark",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Search failed",
        description: "Could not complete location search",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        onLocationChange(lat, lng);
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

        <div className="h-[300px] rounded-md overflow-hidden border border-border" data-testid="map-container">
          <LeafletMap
            latitude={latitude}
            longitude={longitude}
            onCoordinatesChange={onLocationChange}
            className="w-full h-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block" data-testid="label-latitude">
              Latitude (-90 to 90)
            </label>
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
            <label className="text-xs text-muted-foreground mb-1 block" data-testid="label-longitude">
              Longitude (-180 to 180)
            </label>
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
