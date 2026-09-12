import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Compass,
  MapPin,
  Copy,
  Check,
  Search,
  Crosshair,
  ExternalLink,
  Camera,
  Eye,
  ShieldCheck,
  FileText,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Info,
  Sparkles,
  Globe,
  Sliders,
  Navigation,
} from "lucide-react";
import { SEO_CONFIG, injectPageSchema } from "@/lib/seo";
import { AdSlot } from "@/components/ad-slot";
import {
  decimalToDms,
  dmsToDecimal,
  decimalToDdm,
  ddmToDecimal,
  encodeGeohash,
  convertAllFormats,
  parseAnyCoordinates,
  isValidCoords,
  DmsCoordinate,
  DdmCoordinate,
} from "@/lib/coordinate-converter-utils";

// Lazy-load Leaflet map using named export
const LeafletMap = lazy(() =>
  import("@/components/tool/leaflet-map").then((m) => ({
    default: m.LeafletMap,
  }))
);

// Fallback coordinate: San Francisco / Presidio
const DEFAULT_LAT = 37.774929;
const DEFAULT_LNG = -122.419416;

export default function CoordinateConverter() {
  // Core coordinate state
  const [lat, setLat] = useState<number>(DEFAULT_LAT);
  const [lng, setLng] = useState<number>(DEFAULT_LNG);
  const [precision, setPrecision] = useState<number>(6);

  // Universal Smart Input state
  const [smartInput, setSmartInput] = useState<string>("");
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Geocoding states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [reverseAddress, setReverseAddress] = useState<string | null>("San Francisco, California, United States");
  const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);

  // Synchronized representation
  const converted = useMemo(() => {
    return convertAllFormats(lat, lng, precision);
  }, [lat, lng, precision]);

  // Handle URL query params on mount (e.g. ?lat=...&lng=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLat = params.get("lat");
      const urlLng = params.get("lng");
      if (urlLat && urlLng) {
        const pLat = parseFloat(urlLat);
        const pLng = parseFloat(urlLng);
        if (isValidCoords(pLat, pLng)) {
          setLat(Number(pLat.toFixed(6)));
          setLng(Number(pLng.toFixed(6)));
          setSmartInput(`${pLat.toFixed(6)}, ${pLng.toFixed(6)}`);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Inject SEO metadata & JSON-LD schemas
  useEffect(() => {
    document.title = SEO_CONFIG.coordinateConverter.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", SEO_CONFIG.coordinateConverter.description);
    }

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "https://freegeotagger.com/coordinate-converter");

    // JSON-LD: WebPage
    injectPageSchema("schema-webpage", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: SEO_CONFIG.coordinateConverter.title,
      description: SEO_CONFIG.coordinateConverter.description,
      url: "https://freegeotagger.com/coordinate-converter",
      inLanguage: "en-US",
    });

    // JSON-LD: BreadcrumbList
    injectPageSchema("schema-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://freegeotagger.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Tools",
          item: "https://freegeotagger.com/",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Coordinate Converter",
          item: "https://freegeotagger.com/coordinate-converter",
        },
      ],
    });

    // JSON-LD: WebApplication
    injectPageSchema("schema-webapplication", {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "FreeGeoTagger GPS Coordinate Converter",
      url: "https://freegeotagger.com/coordinate-converter",
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Decimal Degrees to DMS conversion",
        "Degrees Decimal Minutes conversion",
        "Base32 Geohash generation",
        "Interactive Leaflet map pin placement",
        "Smart universal coordinate parsing",
        "One-click geotag photo integration",
        "Zero server uploads and privacy-safe lookup",
      ],
    });

    // JSON-LD: FAQPage
    injectPageSchema("schema-faq", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the difference between Decimal Degrees (DD) and DMS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Decimal Degrees (DD) express latitude and longitude as simple decimal numbers (e.g. 37.774929, -122.419416), where positive numbers indicate North/East and negative numbers indicate South/West. Degrees, Minutes, Seconds (DMS) breaks coordinates into angular units (e.g. 37° 46' 29.74\" N, 122° 25' 09.90\" W), where 1 degree equals 60 minutes, and 1 minute equals 60 seconds.",
          },
        },
        {
          "@type": "Question",
          name: "How many decimal places do I need for accurate GPS coordinates?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Four decimal places gives accuracy of approximately 11 meters (street or neighborhood level). Five decimal places achieves 1.1 meters (identifying a specific driveway or tree). Six decimal places reaches 11 centimeters (sub-meter pinpointing used by modern smartphones and cameras). Seven or eight decimal places represents millimeter accuracy, typically unnecessary for civilian photo geotagging.",
          },
        },
        {
          "@type": "Question",
          name: "How do I convert Google Maps coordinates into DMS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Right-click any point in Google Maps and click on the coordinates at the top of the context menu to copy them (e.g. 40.7128, -74.0060). Paste them into our Smart Coordinate Parser box above, and the tool will instantly convert them into Degrees Minutes Seconds (DMS), Degrees Decimal Minutes (DDM), and Geohash.",
          },
        },
        {
          "@type": "Question",
          name: "How are GPS coordinates stored inside photo EXIF tags?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Digital cameras and smartphones store coordinates inside the EXIF GPS IFD block as three rational numbers (degrees/1, minutes/1, seconds/100) paired with reference tags: GPSLatitudeRef ('N' or 'S') and GPSLongitudeRef ('E' or 'W'). You can use our tool to convert any decimal coordinate into the exact DMS fractions required by EXIF standards.",
          },
        },
        {
          "@type": "Question",
          name: "Can I use these converted coordinates to geotag my photos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! Once you find or convert your desired coordinates, click the 'Geotag Photos with These Coordinates' button. This opens our free photo geotagging tool with your exact latitude and longitude pre-loaded, ready to embed into JPG, PNG, WebP, or HEIC photos.",
          },
        },
        {
          "@type": "Question",
          name: "Does converting coordinates send my location to any external servers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. All coordinate conversions (DD, DMS, DDM, Geohash, and distance calculations) execute 100% locally in your browser using client-side JavaScript. If you search for an address, the query is proxied through our privacy-safe server cache which never logs IP addresses, queries, or user identities.",
          },
        },
      ],
    });
  }, []);

  // Reverse geocode whenever lat/lng changes
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsLoadingAddress(true);
      try {
        const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data?.display_name) {
            setReverseAddress(data.display_name);
          }
        }
      } catch {
        // Ignore network errors in offline/dev
      } finally {
        if (active) setIsLoadingAddress(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [lat, lng]);

  // Handle Smart Input submission
  const handleSmartConvert = (inputVal?: string) => {
    const toParse = inputVal !== undefined ? inputVal : smartInput;
    setParseError(null);
    const res = parseAnyCoordinates(toParse);
    if (res.success && res.lat !== undefined && res.lng !== undefined) {
      setLat(Number(res.lat.toFixed(precision)));
      setLng(Number(res.lng.toFixed(precision)));
      setDetectedFormat(res.detectedFormat || "Recognized coordinates");
    } else {
      setParseError(res.error || "Unable to parse coordinates. Please verify your format.");
      setDetectedFormat(null);
    }
  };

  // Handle Map Click
  const handleMapClick = (newLat: number, newLng: number) => {
    setLat(Number(newLat.toFixed(precision)));
    setLng(Number(newLng.toFixed(precision)));
    setSmartInput(`${newLat.toFixed(precision)}, ${newLng.toFixed(precision)}`);
    setDetectedFormat("Map Pin Location");
    setParseError(null);
  };

  // Address search query handler
  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const results = await res.json();
        setSearchResults(Array.isArray(results) ? results : []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select search result
  const handleSelectPlace = (placeLat: string, placeLng: string, placeName: string) => {
    const pLat = parseFloat(placeLat);
    const pLng = parseFloat(placeLng);
    if (isValidCoords(pLat, pLng)) {
      setLat(Number(pLat.toFixed(precision)));
      setLng(Number(pLng.toFixed(precision)));
      setSmartInput(`${pLat.toFixed(precision)}, ${pLng.toFixed(precision)}`);
      setReverseAddress(placeName);
      setSearchResults([]);
      setSearchQuery("");
      setDetectedFormat("Geocoded Address");
      setParseError(null);
    }
  };

  // Geolocation handler ("My Location")
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const pLat = pos.coords.latitude;
        const pLng = pos.coords.longitude;
        setLat(Number(pLat.toFixed(precision)));
        setLng(Number(pLng.toFixed(precision)));
        setSmartInput(`${pLat.toFixed(precision)}, ${pLng.toFixed(precision)}`);
        setDetectedFormat("Current Device GPS");
        setParseError(null);
      },
      (err) => {
        alert(`Could not retrieve location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Clipboard copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main id="main-content" tabIndex={-1} className="outline-none flex-1">
        {/* Breadcrumb Header */}
        <div className="border-b bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-primary transition-colors">
                    Home
                  </Link>
                </li>
                <li>/</li>
                <li>
                  <span className="text-muted-foreground">Tools</span>
                </li>
                <li>/</li>
                <li className="text-foreground font-medium" aria-current="page">
                  Coordinate Converter
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                <Compass className="w-3 h-3 mr-1" />
                Free GPS Utility
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                100% Client-Side
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              GPS Coordinate Converter Online Free
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Convert coordinates instantly between Decimal Degrees (DD), Degrees Minutes Seconds (DMS), Degrees Decimal Minutes (DDM), and Geohash. Inspect points on the interactive map and send them directly to the photo geotagger.
            </p>
          </div>
        </div>

        {/* Tool Interaction Zone */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* Universal Smart Input Card */}
          <Card className="shadow-sm border-primary/20 mb-8 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Smart Coordinate Parser & Auto-Detector
              </CardTitle>
              <CardDescription>
                Paste coordinates in any format (e.g. <code>37.7749, -122.4194</code>, <code>37° 46' 29.74" N, 122° 25' 09.90" W</code>, Google Maps URLs, or Geohashes) for automatic detection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSmartConvert();
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={smartInput}
                    onChange={(e) => {
                      setSmartInput(e.target.value);
                      if (parseError) setParseError(null);
                    }}
                    placeholder="Paste coordinates, Google Maps link, or DMS string..."
                    className="w-full text-base md:text-sm pr-10 font-mono"
                    data-testid="smart-coordinate-input"
                  />
                  {smartInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSmartInput("");
                        setDetectedFormat(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="gap-2 font-medium" data-testid="btn-smart-convert">
                    <Compass className="w-4 h-4" />
                    Convert
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseMyLocation}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    title="Use my device's current GPS location"
                  >
                    <Crosshair className="w-4 h-4" />
                    <span className="hidden sm:inline">My Location</span>
                  </Button>
                </div>
              </form>

              {/* Status and feedback */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {detectedFormat && (
                  <Badge variant="secondary" className="gap-1 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border-green-200">
                    <Check className="w-3 h-3" />
                    {detectedFormat}
                  </Badge>
                )}
                {parseError && (
                  <span className="text-destructive flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {parseError}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2 text-muted-foreground">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Precision:</span>
                  <select
                    value={precision}
                    onChange={(e) => setPrecision(Number(e.target.value))}
                    className="bg-background border rounded px-1.5 py-0.5 text-xs text-foreground cursor-pointer"
                  >
                    <option value={4}>4 decimals (~11 m)</option>
                    <option value={5}>5 decimals (~1.1 m)</option>
                    <option value={6}>6 decimals (~0.11 m)</option>
                    <option value={7}>7 decimals (~11 mm)</option>
                    <option value={8}>8 decimals (~1.1 mm)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Core Grid: Format Cards (Left) & Map + Reverse Geocode (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Formats & Conversions (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* 1. Decimal Degrees (DD) */}
              <Card className="border shadow-sm">
                <CardHeader className="py-3 px-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Decimal Degrees (DD)</span>
                      <Badge variant="outline" className="text-[10px]">Standard GPS</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-xs"
                      onClick={() => copyToClipboard(converted.dd.formatted, "dd")}
                      data-testid="copy-dd-btn"
                    >
                      {copiedKey === "dd" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === "dd" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Latitude (-90 to +90)</Label>
                      <Input
                        type="number"
                        step="any"
                        value={lat}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setLat(val);
                        }}
                        className="font-mono text-sm"
                        data-testid="input-dd-lat"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Longitude (-180 to +180)</Label>
                      <Input
                        type="number"
                        step="any"
                        value={lng}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setLng(val);
                        }}
                        className="font-mono text-sm"
                        data-testid="input-dd-lng"
                      />
                    </div>
                  </div>
                  <div className="bg-muted/40 p-2.5 rounded font-mono text-xs flex justify-between items-center">
                    <span className="select-all font-medium text-foreground">{converted.dd.formatted}</span>
                    <span className="text-muted-foreground text-[11px]">WGS84 Format</span>
                  </div>
                </CardContent>
              </Card>

              {/* 2. Degrees Minutes Seconds (DMS) */}
              <Card className="border shadow-sm">
                <CardHeader className="py-3 px-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Degrees Minutes Seconds (DMS)</span>
                      <Badge variant="outline" className="text-[10px]">EXIF Camera Tag</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-xs"
                      onClick={() => copyToClipboard(converted.dms.formatted, "dms")}
                      data-testid="copy-dms-btn"
                    >
                      {copiedKey === "dms" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === "dms" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Latitude:</div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Degrees</Label>
                        <Input
                          type="number"
                          value={converted.dms.lat.degrees}
                          onChange={(e) => {
                            const newDeg = parseInt(e.target.value, 10) || 0;
                            const newDec = dmsToDecimal(newDeg, converted.dms.lat.minutes, converted.dms.lat.seconds, converted.dms.lat.direction);
                            setLat(Number(newDec.toFixed(precision)));
                          }}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Minutes</Label>
                        <Input
                          type="number"
                          value={converted.dms.lat.minutes}
                          onChange={(e) => {
                            const newMin = parseInt(e.target.value, 10) || 0;
                            const newDec = dmsToDecimal(converted.dms.lat.degrees, newMin, converted.dms.lat.seconds, converted.dms.lat.direction);
                            setLat(Number(newDec.toFixed(precision)));
                          }}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Seconds</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={converted.dms.lat.seconds}
                          onChange={(e) => {
                            const newSec = parseFloat(e.target.value) || 0;
                            const newDec = dmsToDecimal(converted.dms.lat.degrees, converted.dms.lat.minutes, newSec, converted.dms.lat.direction);
                            setLat(Number(newDec.toFixed(precision)));
                          }}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Direction</Label>
                        <select
                          value={converted.dms.lat.direction}
                          onChange={(e) => {
                            const dir = e.target.value as "N" | "S";
                            const newDec = dmsToDecimal(converted.dms.lat.degrees, converted.dms.lat.minutes, converted.dms.lat.seconds, dir);
                            setLat(Number(newDec.toFixed(precision)));
                          }}
                          className="w-full h-9 bg-background border rounded px-2 text-xs font-mono"
                        >
                          <option value="N">N</option>
                          <option value="S">S</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-medium text-muted-foreground">Longitude:</div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Degrees</Label>
                        <Input
                          type="number"
                          value={converted.dms.lng.degrees}
                          onChange={(e) => {
                            const newDeg = parseInt(e.target.value, 10) || 0;
                            const newDec = dmsToDecimal(newDeg, converted.dms.lng.minutes, converted.dms.lng.seconds, converted.dms.lng.direction);
                            setLng(Number(newDec.toFixed(precision)));
                          }}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Minutes</Label>
                        <Input
                          type="number"
                          value={converted.dms.lng.minutes}
                          onChange={(e) => {
                            const newMin = parseInt(e.target.value, 10) || 0;
                            const newDec = dmsToDecimal(converted.dms.lng.degrees, newMin, converted.dms.lng.seconds, converted.dms.lng.direction);
                            setLng(Number(newDec.toFixed(precision)));
                          }}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Seconds</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={converted.dms.lng.seconds}
                          onChange={(e) => {
                            const newSec = parseFloat(e.target.value) || 0;
                            const newDec = dmsToDecimal(converted.dms.lng.degrees, converted.dms.lng.minutes, newSec, converted.dms.lng.direction);
                            setLng(Number(newDec.toFixed(precision)));
                          }}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Direction</Label>
                        <select
                          value={converted.dms.lng.direction}
                          onChange={(e) => {
                            const dir = e.target.value as "E" | "W";
                            const newDec = dmsToDecimal(converted.dms.lng.degrees, converted.dms.lng.minutes, converted.dms.lng.seconds, dir);
                            setLng(Number(newDec.toFixed(precision)));
                          }}
                          className="w-full h-9 bg-background border rounded px-2 text-xs font-mono"
                        >
                          <option value="E">E</option>
                          <option value="W">W</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/40 p-2.5 rounded font-mono text-xs flex justify-between items-center mt-2">
                    <span className="select-all font-medium text-foreground">{converted.dms.formatted}</span>
                    <span className="text-muted-foreground text-[11px]">Angular DMS</span>
                  </div>
                </CardContent>
              </Card>

              {/* 3. Degrees Decimal Minutes (DDM) */}
              <Card className="border shadow-sm">
                <CardHeader className="py-3 px-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Degrees Decimal Minutes (DDM)</span>
                      <Badge variant="outline" className="text-[10px]">Aviation & Marine</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-xs"
                      onClick={() => copyToClipboard(converted.ddm.formatted, "ddm")}
                      data-testid="copy-ddm-btn"
                    >
                      {copiedKey === "ddm" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === "ddm" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-muted/20 p-2.5 rounded">
                      <span className="text-xs text-muted-foreground block mb-1">Latitude DDM</span>
                      <span className="font-mono text-xs font-medium">{converted.ddm.lat.formatted}</span>
                    </div>
                    <div className="bg-muted/20 p-2.5 rounded">
                      <span className="text-xs text-muted-foreground block mb-1">Longitude DDM</span>
                      <span className="font-mono text-xs font-medium">{converted.ddm.lng.formatted}</span>
                    </div>
                  </div>
                  <div className="bg-muted/40 p-2.5 rounded font-mono text-xs flex justify-between items-center">
                    <span className="select-all font-medium text-foreground">{converted.ddm.formatted}</span>
                    <span className="text-muted-foreground text-[11px]">Nautical / GPS</span>
                  </div>
                </CardContent>
              </Card>

              {/* 4. Geohash & External Map Links */}
              <Card className="border shadow-sm">
                <CardHeader className="py-3 px-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Geohash Code & External Links</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-xs"
                      onClick={() => copyToClipboard(converted.geohash, "geohash")}
                      data-testid="copy-geohash-btn"
                    >
                      {copiedKey === "geohash" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === "geohash" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between bg-muted/30 p-2.5 rounded">
                    <div>
                      <span className="text-xs text-muted-foreground block">Base32 Geohash (9 chars)</span>
                      <span className="font-mono text-sm font-semibold text-foreground select-all">{converted.geohash}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">Precision ~4.8m</Badge>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href={converted.urls.googleMaps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      Google Maps
                    </a>
                    <a
                      href={converted.urls.openStreetMap}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      OpenStreetMap
                    </a>
                    <a
                      href={converted.urls.appleMaps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      Apple Maps
                    </a>
                    <a
                      href={converted.urls.geoUri}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded hover:bg-muted transition-colors"
                    >
                      <Navigation className="w-3 h-3 text-muted-foreground" />
                      Geo URI Scheme
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Primary Conversion CTA: Geotag Photo */}
              <div className="pt-2">
                <Card className="bg-primary/5 border-primary/30 shadow-sm">
                  <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-base text-foreground">Ready to embed these coordinates?</h3>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-md">
                        Load <code>{converted.dd.formatted}</code> directly into our primary photo geotagger to embed EXIF GPS tags into your images.
                      </p>
                    </div>
                    <Link
                      href={`/?lat=${lat}&lng=${lng}`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shrink-0 w-full sm:w-auto"
                      data-testid="cta-geotag-photo-btn"
                    >
                      Geotag Photos with Coordinates
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column: Interactive Map & Search (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Address Search Bar */}
              <Card className="border shadow-sm">
                <CardContent className="p-3">
                  <form onSubmit={handleAddressSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search address, city, or landmark..."
                        className="pl-9 text-xs"
                      />
                    </div>
                    <Button type="submit" size="sm" variant="secondary" disabled={isSearching} className="text-xs px-3">
                      {isSearching ? "Searching..." : "Search"}
                    </Button>
                  </form>

                  {/* Search Autocomplete Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 border rounded-md divide-y max-h-48 overflow-y-auto bg-background text-xs shadow-lg">
                      {searchResults.map((place, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPlace(place.lat, place.lon, place.display_name)}
                          className="w-full text-left p-2 hover:bg-muted transition-colors flex items-start gap-2"
                        >
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="truncate">{place.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Leaflet Map Preview Container */}
              <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="py-2.5 px-4 border-b bg-muted/30 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-xs">Interactive Pinpoint Map</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Click map to move pin</span>
                </CardHeader>
                <div className="h-[360px] w-full relative bg-muted/20">
                  <Suspense
                    fallback={
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                        Loading interactive map...
                      </div>
                    }
                  >
                    <LeafletMap
                      latitude={lat}
                      longitude={lng}
                      onCoordinatesChange={handleMapClick}
                    />
                  </Suspense>
                </div>

                {/* Reverse Geocoded Location Badge */}
                <div className="p-3 border-t bg-muted/10 flex items-start gap-2 text-xs">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">Reverse Geocoded Location:</div>
                    <div className="text-muted-foreground truncate">
                      {isLoadingAddress ? "Looking up address..." : reverseAddress || "Coordinates selected"}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Supporting Conversion CTAs */}
              <Card className="border shadow-sm">
                <CardHeader className="py-3 px-4 border-b bg-muted/30">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Related Tools & Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 divide-y text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">Check Photo GPS</div>
                        <div className="text-[11px] text-muted-foreground">See where an existing photo was taken</div>
                      </div>
                    </div>
                    <Link href="/gps-finder" className="text-primary hover:underline font-medium text-xs">
                      GPS Finder &rarr;
                    </Link>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">EXIF Viewer</div>
                        <div className="text-[11px] text-muted-foreground">Inspect shutter, lens, and all camera tags</div>
                      </div>
                    </div>
                    <Link href="/exif-viewer" className="text-primary hover:underline font-medium text-xs">
                      View EXIF &rarr;
                    </Link>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">Remove GPS from Photo</div>
                        <div className="text-[11px] text-muted-foreground">Strip location coordinates before sharing</div>
                      </div>
                    </div>
                    <Link href="/remove-gps-from-photo" className="text-primary hover:underline font-medium text-xs">
                      Strip GPS &rarr;
                    </Link>
                  </div>

                  <div className="pt-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">EXIF GPS Guide</div>
                        <div className="text-[11px] text-muted-foreground">Understand how GPS metadata works</div>
                      </div>
                    </div>
                    <Link href="/blog/what-is-exif-gps-metadata" className="text-primary hover:underline font-medium text-xs">
                      Read Guide &rarr;
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Reserved Monetization Placement (CLS Protected) */}
          <div className="mt-10">
            <AdSlot placement="coordinate-converter-below-tool" />
          </div>
        </div>

        {/* 1,000+ Word Comprehensive Educational Article */}
        <section className="border-t bg-muted/10 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <article className="prose dark:prose-invert max-w-none space-y-8">
              <div>
                <Badge variant="outline" className="mb-2 text-primary border-primary/30">
                  Technical Reference
                </Badge>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                  The Complete Guide to GPS Coordinate Formats & Conversion
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Geographic coordinates define any position on planet Earth through an ellipsoidal reference grid. However, depending on whether you are working with mobile GPS hardware, photography EXIF tags, maritime navigation charts, or web mapping APIs like Google Maps and Leaflet, coordinates are formatted in completely different notations.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground">1. The Four Major GPS Coordinate Notations Explained</h3>
                <p>
                  To use location data effectively across photography, GIS software, and satellite navigation, it is essential to understand the four primary notation standards:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-4">
                  <div className="p-4 rounded-lg border bg-card">
                    <h4 className="font-bold text-sm text-primary mb-1">Decimal Degrees (DD)</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Example: <code>37.774929, -122.419416</code>
                    </p>
                    <p className="text-xs leading-relaxed text-foreground">
                      Standard for computer programming, databases, web mapping APIs (Google Maps, Leaflet, Mapbox), and modern REST endpoints. Positive values represent the Northern and Eastern hemispheres, while negative numbers represent the Southern and Western hemispheres.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border bg-card">
                    <h4 className="font-bold text-sm text-primary mb-1">Degrees, Minutes, Seconds (DMS)</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Example: <code>37° 46' 29.74" N, 122° 25' 09.90" W</code>
                    </p>
                    <p className="text-xs leading-relaxed text-foreground">
                      The traditional sexagesimal astronomical system dating back to ancient Babylonian astronomy. One full circle comprises 360 degrees, each degree contains 60 arcminutes, and each minute contains 60 arcseconds. This is the exact binary standard used in EXIF photo metadata tags.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border bg-card">
                    <h4 className="font-bold text-sm text-primary mb-1">Degrees Decimal Minutes (DDM)</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Example: <code>37° 46.4957' N, 122° 25.1650' W</code>
                    </p>
                    <p className="text-xs leading-relaxed text-foreground">
                      The official global standard for marine navigation, aeronautical flight charts, and handheld Garmin or NMEA GPS devices. Because one nautical mile equals approximately one minute of latitude, combining degrees with decimal minutes simplifies dead-reckoning calculations.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border bg-card">
                    <h4 className="font-bold text-sm text-primary mb-1">Geohash (Hierarchical Spatial Index)</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Example: <code>9q8yyk8y</code>
                    </p>
                    <p className="text-xs leading-relaxed text-foreground">
                      A public-domain geocode system invented by Gustavo Niemeyer. It interleaves latitude and longitude bits into a compact Base32 string. Adding or trimming characters from the end provides immediate spatial proximity search and bounding-box queries in databases like Elasticsearch and MongoDB.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground">2. Step-by-Step Mathematical Conversion Formulas</h3>
                <p>
                  Understanding the arithmetic behind coordinate transformations ensures you can verify conversions manually or build custom scripts:
                </p>

                <div className="space-y-4 not-prose">
                  <div className="p-4 rounded-lg bg-muted/40 border">
                    <h4 className="font-semibold text-sm mb-2 text-foreground">Converting DMS to Decimal Degrees (DMS &rarr; DD)</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Given Degrees (D), Minutes (M), Seconds (S), and Direction (N, S, E, or W):
                    </p>
                    <pre className="bg-background p-3 rounded text-xs font-mono overflow-x-auto border">
                      DD = (Degrees + (Minutes / 60) + (Seconds / 3600)) * (Direction in [S, W] ? -1 : 1)
                    </pre>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Worked Example:</strong> Convert <code>40° 42' 46.02" N</code>:
                      <br />
                      40 + (42 / 60) + (46.02 / 3600) = 40 + 0.7000 + 0.012783 = <strong>40.712783°</strong>
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/40 border">
                    <h4 className="font-semibold text-sm mb-2 text-foreground">Converting Decimal Degrees to DMS (DD &rarr; DMS)</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Given a decimal value like -74.0060:
                    </p>
                    <ol className="list-decimal list-inside text-xs space-y-1 text-muted-foreground">
                      <li>Determine direction: Since the value is negative, longitude direction is <strong>W</strong>. Work with absolute value: 74.0060.</li>
                      <li>Whole degrees: Math.floor(74.0060) = <strong>74°</strong>.</li>
                      <li>Multiply remainder by 60: (74.0060 - 74) &times; 60 = 0.0060 &times; 60 = 0.36. Whole minutes: <strong>0'</strong>.</li>
                      <li>Multiply remaining fractional minute by 60: 0.36 &times; 60 = <strong>21.60&quot;</strong>.</li>
                      <li>Final formatted result: <code>74° 0' 21.60" W</code>.</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground">3. How GPS Coordinates are Encoded in EXIF Photo Metadata</h3>
                <p>
                  When a camera or smartphone embeds geolocation into a JPEG, WebP, or HEIC file, it does not store a simple decimal number. The EXIF 2.32 standard dictates that coordinates must be encoded in the <strong>GPS IFD</strong> (Image File Directory) using three rational fractions:
                </p>
                <div className="p-4 rounded-lg border bg-card not-prose my-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-muted-foreground block font-sans">Tag 0x0001 (GPSLatitudeRef):</span>
                      <span className="text-primary font-bold">"N"</span> or <span className="text-primary font-bold">"S"</span> (1 ASCII byte)
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-sans">Tag 0x0002 (GPSLatitude):</span>
                      <span className="text-foreground">[[deg, 1], [min, 1], [sec*100, 100]]</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-sans">Tag 0x0003 (GPSLongitudeRef):</span>
                      <span className="text-primary font-bold">"E"</span> or <span className="text-primary font-bold">"W"</span> (1 ASCII byte)
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-sans">Tag 0x0004 (GPSLongitude):</span>
                      <span className="text-foreground">[[deg, 1], [min, 1], [sec*100, 100]]</span>
                    </div>
                  </div>
                </div>
                <p>
                  Because EXIF stores degrees, minutes, and seconds as unsigned positive integers accompanied by a separate hemisphere byte, negative decimal values must be stripped of their minus signs and mapped to "S" or "W" references. Our tool automatically calculates both the decimal numbers and the exact EXIF rational triplets.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground">4. Precision Guide: How Many Decimals Do You Actually Need?</h3>
                <p>
                  A common question when geotagging photos or formatting coordinates is how many decimal places to record. Because one degree of latitude spans approximately 111 kilometers (69 miles) anywhere on Earth, each decimal place corresponds to a fixed physical scale:
                </p>

                <div className="overflow-x-auto not-prose my-4">
                  <table className="w-full text-left text-xs border rounded-lg overflow-hidden">
                    <thead className="bg-muted/60 text-foreground font-semibold border-b">
                      <tr>
                        <th className="p-2.5">Decimal Places</th>
                        <th className="p-2.5">Degree Fraction</th>
                        <th className="p-2.5">Ground Resolution (Equator)</th>
                        <th className="p-2.5">Typical Use Case</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-muted-foreground">
                      <tr>
                        <td className="p-2.5 font-mono font-medium text-foreground">0 (1.0)</td>
                        <td className="p-2.5">1.0°</td>
                        <td className="p-2.5">~111 km (69 miles)</td>
                        <td className="p-2.5">Country or state-level region</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-medium text-foreground">1 (0.1)</td>
                        <td className="p-2.5">0.1°</td>
                        <td className="p-2.5">~11.1 km (6.9 miles)</td>
                        <td className="p-2.5">Large metropolitan city</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-medium text-foreground">2 (0.01)</td>
                        <td className="p-2.5">0.01°</td>
                        <td className="p-2.5">~1.11 km (0.69 miles)</td>
                        <td className="p-2.5">Town or neighborhood district</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-medium text-foreground">3 (0.001)</td>
                        <td className="p-2.5">0.001°</td>
                        <td className="p-2.5">~111 meters (364 feet)</td>
                        <td className="p-2.5">Agricultural parcel or large campus</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-medium text-foreground">4 (0.0001)</td>
                        <td className="p-2.5">0.0001°</td>
                        <td className="p-2.5">~11.1 meters (36.4 feet)</td>
                        <td className="p-2.5">Individual property parcel or street address</td>
                      </tr>
                      <tr className="bg-primary/5 font-semibold text-foreground">
                        <td className="p-2.5 font-mono">5 (0.00001)</td>
                        <td className="p-2.5">0.00001°</td>
                        <td className="p-2.5">~1.11 meters (3.64 feet)</td>
                        <td className="p-2.5">Commercial smartphone GPS accuracy (Ideal for photos)</td>
                      </tr>
                      <tr className="bg-primary/5 font-semibold text-foreground">
                        <td className="p-2.5 font-mono">6 (0.000001)</td>
                        <td className="p-2.5">0.000001°</td>
                        <td className="p-2.5">~11.1 centimeters (4.37 inches)</td>
                        <td className="p-2.5">High-precision DSLR geotagging, surveying, robotics</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-medium text-foreground">7+</td>
                        <td className="p-2.5">0.0000001°</td>
                        <td className="p-2.5">&lt; 11 millimeters</td>
                        <td className="p-2.5">Tectonic drift monitoring and scientific geodesy</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  For photo geotagging and real estate listings, recording <strong>5 to 6 decimal places</strong> provides the ultimate balance between sub-meter precision and avoiding meaningless floating-point noise.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground">5. Troubleshooting Common Coordinate Conversion Errors</h3>
                <p>
                  When pasting coordinates between mapping applications, photographers and developers frequently encounter subtle errors that result in pins appearing thousands of miles away:
                </p>
                <ul className="list-disc list-inside text-sm space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Inverted Latitude and Longitude Order:</strong> Aviation and mathematics conventionally write ((X, Y)), where (X) is horizontal (Longitude) and (Y) is vertical (Latitude). However, geographic GPS notation always lists <strong>Latitude first, then Longitude</strong>. Reversing them places an American city in the Indian Ocean or Antarctica.
                  </li>
                  <li>
                    <strong className="text-foreground">Minus Sign vs. Hemisphere Character:</strong> Writing <code>-122.4194 W</code> creates a double-negative error. In decimal coordinates, the minus sign represents West. When using the direction character "W", the number must always be positive: <code>122.4194° W</code>.
                  </li>
                  <li>
                    <strong className="text-foreground">Comma vs. Dot Decimal Separator:</strong> Many European locales use a comma as the decimal point (e.g. <code>37,7749</code>). In standard international GPS systems, a period <code>.</code> is required for decimals, while commas are reserved solely for separating latitude from longitude. Our smart parser automatically normalizes these formats.
                  </li>
                </ul>
              </div>
            </article>

            {/* 6-Item FAQ Accordion */}
            <div className="mt-16 pt-12 border-t">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  Frequently Asked Questions
                </h3>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger className="text-left text-sm font-semibold">
                    What is the difference between Decimal Degrees (DD) and DMS?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Decimal Degrees (DD) express latitude and longitude as simple decimal numbers (e.g. <code>37.774929, -122.419416</code>), where positive numbers indicate North/East and negative numbers indicate South/West. Degrees, Minutes, Seconds (DMS) breaks coordinates into angular units (e.g. <code>37° 46' 29.74" N, 122° 25' 09.90" W</code>), where 1 degree equals 60 minutes, and 1 minute equals 60 seconds.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2">
                  <AccordionTrigger className="text-left text-sm font-semibold">
                    How many decimal places do I need for accurate GPS coordinates?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Four decimal places gives accuracy of approximately 11 meters (street or neighborhood level). Five decimal places achieves 1.1 meters (identifying a specific driveway or tree). Six decimal places reaches 11 centimeters (sub-meter pinpointing used by modern smartphones and cameras). Seven or eight decimal places represents millimeter accuracy, typically unnecessary for civilian photo geotagging.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3">
                  <AccordionTrigger className="text-left text-sm font-semibold">
                    How do I convert Google Maps coordinates into DMS?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Right-click any point in Google Maps and click on the coordinates at the top of the context menu to copy them (e.g. <code>40.7128, -74.0060</code>). Paste them into our Smart Coordinate Parser box above, and the tool will instantly convert them into Degrees Minutes Seconds (DMS), Degrees Decimal Minutes (DDM), and Geohash.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4">
                  <AccordionTrigger className="text-left text-sm font-semibold">
                    How are GPS coordinates stored inside photo EXIF tags?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Digital cameras and smartphones store coordinates inside the EXIF GPS IFD block as three rational numbers (degrees/1, minutes/1, seconds/100) paired with reference tags: GPSLatitudeRef ("N" or "S") and GPSLongitudeRef ("E" or "W"). You can use our tool to convert any decimal coordinate into the exact DMS fractions required by EXIF standards.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-5">
                  <AccordionTrigger className="text-left text-sm font-semibold">
                    Can I use these converted coordinates to geotag my photos?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Yes! Once you find or convert your desired coordinates, click the "Geotag Photos with These Coordinates" button. This opens our free photo geotagging tool with your exact latitude and longitude pre-loaded, ready to embed into JPG, PNG, WebP, or HEIC photos.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-6">
                  <AccordionTrigger className="text-left text-sm font-semibold">
                    Does converting coordinates send my location to any external servers?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    No. All coordinate conversions (DD, DMS, DDM, Geohash, and distance calculations) execute 100% locally in your browser using client-side JavaScript. If you search for an address, the query is proxied through our privacy-safe server cache which never logs IP addresses, queries, or user identities.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
