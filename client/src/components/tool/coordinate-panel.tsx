import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MapPin,
  Search,
  Locate,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Mountain,
  Tag,
  FileText,
  Loader2,
  Compass,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  decimalToDms,
  dmsToDecimal,
  formatCoordinates,
  searchPlaces,
  reverseGeocode,
  PlaceSuggestion,
} from "@/lib/geotag-utils";
import { useToast } from "@/hooks/use-toast";
import {
  trackMapLocationSelected,
  trackManualCoordinatesEntered,
  trackGeocoderError,
} from "@/lib/analytics";

export interface CoordinatePanelProps {
  latitude: number;
  longitude: number;
  altitude?: number;
  keywords: string;
  description: string;
  existingPhotoGps?: { lat: number; lng: number; altitude?: number } | null;
  onCoordinatesChange: (lat: number, lng: number) => void;
  onAltitudeChange?: (alt: number | undefined) => void;
  onKeywordsChange: (keywords: string) => void;
  onDescriptionChange: (description: string) => void;
  onLocationFound?: (lat: number, lng: number, displayName?: string) => void;
  className?: string;
}

export function CoordinatePanel({
  latitude,
  longitude,
  altitude,
  keywords,
  description,
  existingPhotoGps,
  onCoordinatesChange,
  onAltitudeChange,
  onKeywordsChange,
  onDescriptionChange,
  onLocationFound,
  className = "",
}: CoordinatePanelProps) {
  const [coordFormat, setCoordFormat] = useState<"decimal" | "dms">("decimal");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copied, setCopied] = useState(false);
  const ignoreSearchRef = useRef(false);
  const { toast } = useToast();

  // DMS internal state
  const latDms = decimalToDms(latitude, true);
  const lngDms = decimalToDms(longitude, false);

  const [dmsLatDeg, setDmsLatDeg] = useState(latDms.degrees);
  const [dmsLatMin, setDmsLatMin] = useState(latDms.minutes);
  const [dmsLatSec, setDmsLatSec] = useState(latDms.seconds);
  const [dmsLatDir, setDmsLatDir] = useState<"N" | "S">(latDms.direction as "N" | "S");

  const [dmsLngDeg, setDmsLngDeg] = useState(lngDms.degrees);
  const [dmsLngMin, setDmsLngMin] = useState(lngDms.minutes);
  const [dmsLngSec, setDmsLngSec] = useState(lngDms.seconds);
  const [dmsLngDir, setDmsLngDir] = useState<"E" | "W">(lngDms.direction as "E" | "W");

  // Keep DMS in sync with external lat/lng changes
  useEffect(() => {
    const curLatDms = decimalToDms(latitude, true);
    const curLngDms = decimalToDms(longitude, false);

    setDmsLatDeg(curLatDms.degrees);
    setDmsLatMin(curLatDms.minutes);
    setDmsLatSec(curLatDms.seconds);
    setDmsLatDir(curLatDms.direction as "N" | "S");

    setDmsLngDeg(curLngDms.degrees);
    setDmsLngMin(curLngDms.minutes);
    setDmsLngSec(curLngDms.seconds);
    setDmsLngDir(curLngDms.direction as "E" | "W");
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

  const handleSelectSuggestion = (item: PlaceSuggestion) => {
    ignoreSearchRef.current = true;
    setSearchQuery(item.displayName);
    setShowSuggestions(false);
    onCoordinatesChange(item.lat, item.lng);
    onLocationFound?.(item.lat, item.lng, item.displayName);
    trackMapLocationSelected({ method: "search" });
    toast({
      title: "Location Selected",
      description: item.displayName.substring(0, 60),
    });
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await reverseGeocode(searchQuery);
      if (result) {
        onCoordinatesChange(result.lat, result.lng);
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
  };

  const handleUseMyLocation = () => {
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
        onCoordinatesChange(lat, lng);
        if (pos.coords.altitude !== null && onAltitudeChange) {
          onAltitudeChange(Math.round(pos.coords.altitude));
        }
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
  };

  const handleApplyExistingPhotoGps = () => {
    if (existingPhotoGps) {
      onCoordinatesChange(existingPhotoGps.lat, existingPhotoGps.lng);
      if (existingPhotoGps.altitude !== undefined && onAltitudeChange) {
        onAltitudeChange(existingPhotoGps.altitude);
      }
      onLocationFound?.(existingPhotoGps.lat, existingPhotoGps.lng, "Original Photo GPS");
      toast({
        title: "Applied Photo's GPS",
        description: `Coordinates reset to ${existingPhotoGps.lat.toFixed(4)}, ${existingPhotoGps.lng.toFixed(4)}`,
      });
    }
  };

  const handleCopyCoordinates = async () => {
    const text = formatCoordinates(latitude, longitude, coordFormat);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Coordinates Copied",
        description: text,
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please copy coordinates manually.",
        variant: "destructive",
      });
    }
  };

  const handleDmsChange = (
    latDeg = dmsLatDeg,
    latMin = dmsLatMin,
    latSec = dmsLatSec,
    latDir = dmsLatDir,
    lngDeg = dmsLngDeg,
    lngMin = dmsLngMin,
    lngSec = dmsLngSec,
    lngDir = dmsLngDir
  ) => {
    const newLat = dmsToDecimal(latDeg, latMin, latSec, latDir);
    const newLng = dmsToDecimal(lngDeg, lngMin, lngSec, lngDir);
    onCoordinatesChange(newLat, newLng);
    trackManualCoordinatesEntered({ format: "dms" });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ── Search and Quick Actions Bar ── */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-4 w-4" aria-hidden="true" />
            </div>
            <Input
              type="text"
              placeholder="Search place, city, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              className="pl-9 pr-8 h-10 rounded-xl bg-background border-border/70 text-sm focus-visible:ring-primary"
              aria-label="Search place name or address"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-primary">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={handleSearchSubmit}
            disabled={isSearching || !searchQuery.trim()}
            className="h-10 px-3.5 sm:px-4 rounded-xl font-medium shrink-0"
            aria-label="Submit place search"
          >
            <Search className="h-4 w-4 sm:mr-1.5" aria-hidden="true" />
            <span className="hidden sm:inline">Search</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="h-10 px-3 rounded-xl border-border/70 hover:bg-primary/10 hover:text-primary shrink-0"
            title="Use current GPS location"
            aria-label="Use my device GPS location"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
            ) : (
              <Locate className="h-4 w-4 text-primary" aria-hidden="true" />
            )}
            <span className="hidden md:inline ml-1.5 text-xs font-medium">My Location</span>
          </Button>
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-[1001] max-h-56 overflow-y-auto"
            role="listbox"
            aria-label="Location suggestions"
          >
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-primary/10 transition-colors text-xs sm:text-sm flex items-start gap-2 border-b border-border/20 last:border-0"
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

      {/* ── Coordinates Control Card ── */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        {/* Format Selector & Tools Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-border/60">
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/50">
            <button
              type="button"
              onClick={() => setCoordFormat("decimal")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                coordFormat === "decimal"
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={coordFormat === "decimal"}
            >
              Decimal (DD)
            </button>
            <button
              type="button"
              onClick={() => setCoordFormat("dms")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                coordFormat === "dms"
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={coordFormat === "dms"}
            >
              DMS (Deg/Min/Sec)
            </button>
          </div>

          <div className="flex items-center gap-2">
            {existingPhotoGps && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyExistingPhotoGps}
                className="h-7 text-xs font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                title="Reset to photo's original GPS"
              >
                <RotateCcw className="h-3 w-3 mr-1" aria-hidden="true" />
                Use Photo's GPS
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCoordinates}
              className="h-7 text-xs font-medium text-muted-foreground hover:text-foreground"
              title="Copy formatted coordinates"
              aria-label="Copy coordinates to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1 text-emerald-500" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" aria-hidden="true" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── Mode 1: Decimal Degrees Inputs ── */}
        {coordFormat === "decimal" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="input-latitude" className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>Latitude (-90 to 90)</span>
                <span className="text-[11px] font-mono text-muted-foreground">{latDms.formatted}</span>
              </label>
              <Input
                id="input-latitude"
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                value={latitude}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) onCoordinatesChange(val, longitude);
                }}
                onBlur={() => trackManualCoordinatesEntered({ format: "dd" })}
                className="font-mono text-sm h-9 bg-background focus-visible:ring-primary"
                data-testid="input-latitude"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="input-longitude" className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>Longitude (-180 to 180)</span>
                <span className="text-[11px] font-mono text-muted-foreground">{lngDms.formatted}</span>
              </label>
              <Input
                id="input-longitude"
                type="number"
                step="0.000001"
                min="-180"
                max="180"
                value={longitude}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) onCoordinatesChange(latitude, val);
                }}
                onBlur={() => trackManualCoordinatesEntered({ format: "dd" })}
                className="font-mono text-sm h-9 bg-background focus-visible:ring-primary"
                data-testid="input-longitude"
              />
            </div>
          </div>
        ) : (
          /* ── Mode 2: Degrees, Minutes, Seconds (DMS) Inputs ── */
          <div className="space-y-3">
            {/* Latitude DMS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Latitude (DMS)</span>
                <span className="text-[11px] font-mono text-muted-foreground">{latitude.toFixed(6)}°</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label htmlFor="dms-lat-deg" className="sr-only">Latitude Degrees</label>
                  <Input
                    id="dms-lat-deg"
                    type="number"
                    min="0"
                    max="90"
                    value={dmsLatDeg}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      setDmsLatDeg(v);
                      handleDmsChange(v, dmsLatMin, dmsLatSec, dmsLatDir);
                    }}
                    placeholder="Deg °"
                    className="font-mono text-xs h-9"
                  />
                </div>
                <div>
                  <label htmlFor="dms-lat-min" className="sr-only">Latitude Minutes</label>
                  <Input
                    id="dms-lat-min"
                    type="number"
                    min="0"
                    max="59"
                    value={dmsLatMin}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      setDmsLatMin(v);
                      handleDmsChange(dmsLatDeg, v, dmsLatSec, dmsLatDir);
                    }}
                    placeholder="Min '"
                    className="font-mono text-xs h-9"
                  />
                </div>
                <div>
                  <label htmlFor="dms-lat-sec" className="sr-only">Latitude Seconds</label>
                  <Input
                    id="dms-lat-sec"
                    type="number"
                    step="0.01"
                    min="0"
                    max="59.99"
                    value={dmsLatSec}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setDmsLatSec(v);
                      handleDmsChange(dmsLatDeg, dmsLatMin, v, dmsLatDir);
                    }}
                    placeholder={'Sec "'}
                    className="font-mono text-xs h-9"
                  />
                </div>
                <div>
                  <label htmlFor="dms-lat-dir" className="sr-only">Latitude Hemisphere</label>
                  <select
                    id="dms-lat-dir"
                    value={dmsLatDir}
                    onChange={(e) => {
                      const v = e.target.value as "N" | "S";
                      setDmsLatDir(v);
                      handleDmsChange(dmsLatDeg, dmsLatMin, dmsLatSec, v);
                    }}
                    className="w-full h-9 px-2 rounded-xl border border-input bg-background font-mono text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="N">N (North)</option>
                    <option value="S">S (South)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Longitude DMS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Longitude (DMS)</span>
                <span className="text-[11px] font-mono text-muted-foreground">{longitude.toFixed(6)}°</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label htmlFor="dms-lng-deg" className="sr-only">Longitude Degrees</label>
                  <Input
                    id="dms-lng-deg"
                    type="number"
                    min="0"
                    max="180"
                    value={dmsLngDeg}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      setDmsLngDeg(v);
                      handleDmsChange(undefined, undefined, undefined, undefined, v, dmsLngMin, dmsLngSec, dmsLngDir);
                    }}
                    placeholder="Deg °"
                    className="font-mono text-xs h-9"
                  />
                </div>
                <div>
                  <label htmlFor="dms-lng-min" className="sr-only">Longitude Minutes</label>
                  <Input
                    id="dms-lng-min"
                    type="number"
                    min="0"
                    max="59"
                    value={dmsLngMin}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      setDmsLngMin(v);
                      handleDmsChange(undefined, undefined, undefined, undefined, dmsLngDeg, v, dmsLngSec, dmsLngDir);
                    }}
                    placeholder="Min '"
                    className="font-mono text-xs h-9"
                  />
                </div>
                <div>
                  <label htmlFor="dms-lng-sec" className="sr-only">Longitude Seconds</label>
                  <Input
                    id="dms-lng-sec"
                    type="number"
                    step="0.01"
                    min="0"
                    max="59.99"
                    value={dmsLngSec}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setDmsLngSec(v);
                      handleDmsChange(undefined, undefined, undefined, undefined, dmsLngDeg, dmsLngMin, v, dmsLngDir);
                    }}
                    placeholder={'Sec "'}
                    className="font-mono text-xs h-9"
                  />
                </div>
                <div>
                  <label htmlFor="dms-lng-dir" className="sr-only">Longitude Hemisphere</label>
                  <select
                    id="dms-lng-dir"
                    value={dmsLngDir}
                    onChange={(e) => {
                      const v = e.target.value as "E" | "W";
                      setDmsLngDir(v);
                      handleDmsChange(undefined, undefined, undefined, undefined, dmsLngDeg, dmsLngMin, dmsLngSec, v);
                    }}
                    className="w-full h-9 px-2 rounded-xl border border-input bg-background font-mono text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="E">E (East)</option>
                    <option value="W">W (West)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Optional Altitude & Metadata Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/40">
          <div className="space-y-1">
            <label htmlFor="input-altitude" className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Mountain className="h-3 w-3 text-primary" aria-hidden="true" />
              Altitude (meters, optional)
            </label>
            <Input
              id="input-altitude"
              type="number"
              placeholder="e.g. 150"
              value={altitude !== undefined ? altitude : ""}
              onChange={(e) => {
                const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                onAltitudeChange?.(val);
              }}
              className="h-8 text-xs font-mono bg-background"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="input-keywords" className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3 text-primary" aria-hidden="true" />
              Keywords (optional)
            </label>
            <Input
              id="input-keywords"
              type="text"
              placeholder="travel, sunset, beach"
              value={keywords}
              onChange={(e) => onKeywordsChange(e.target.value)}
              className="h-8 text-xs bg-background"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="input-description" className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3 text-primary" aria-hidden="true" />
              Caption / Description
            </label>
            <Input
              id="input-description"
              type="text"
              placeholder="Photo description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="h-8 text-xs bg-background"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
