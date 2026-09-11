import { useState, useCallback, useEffect, useRef } from "react";
import {
  Eye, FileImage, Copy, Check, Globe, MapPin, Upload,
  Shield, Zap, Camera, Search, Info, ChevronDown,
  Smartphone, Laptop, Image as ImageIcon, Lock,
  CheckCircle, AlertCircle, HelpCircle,
  Compass, Clock, Loader2, ExternalLink
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  readFileAsDataUrl,
  extractPhotoMetadata,
  convertHeicToJpeg,
  formatFileSize,
  ExtractedPhotoDetails
} from "@/lib/geotag-utils";
import { LeafletMap } from "@/components/tool/leaflet-map";
import { useToast } from "@/hooks/use-toast";
import { updatePageSEO, SEO_CONFIG, injectPageSchema } from "@/lib/seo";

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

interface PhotoInspection {
  file: File;
  previewUrl: string;
  name: string;
  sizeFormatted: string;
  formatBadge: string;
  dimensions?: { width: number; height: number };
  meta: ExtractedPhotoDetails;
}

export default function GpsFinder() {
  const [inspection, setInspection] = useState<PhotoInspection | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [coordFormat, setCoordFormat] = useState<"dd" | "dms">("dd");
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const { toast } = useToast();

  const cleanupPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupPreview();
    };
  }, [cleanupPreview]);

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.gpsFinder);

    injectPageSchema('gps-finder-webpage', {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "GPS Finder – Extract GPS Coordinates from Photos Free",
      "url": "https://freegeotagger.com/gps-finder",
      "description": "Instantly extract GPS coordinates from any geotagged photo. Upload a JPG, PNG, WebP, or HEIC image to find where it was taken and view the exact location on an interactive map.",
      "inLanguage": "en-US",
      "dateModified": "2026-03-30",
      "isPartOf": {
        "@type": "WebSite",
        "name": "FreeGeoTagger",
        "url": "https://freegeotagger.com"
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://freegeotagger.com/" },
          { "@type": "ListItem", "position": 2, "name": "GPS Finder", "item": "https://freegeotagger.com/gps-finder" }
        ]
      }
    });

    injectPageSchema('gps-finder-app', {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "GPS Photo Finder",
      "applicationCategory": "PhotographyApplication",
      "operatingSystem": "Web Browser",
      "browserRequirements": "Chrome, Firefox, Safari, Edge",
      "url": "https://freegeotagger.com/gps-finder",
      "description": SEO_CONFIG.gpsFinder.description,
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
      "featureList": [
        "Read EXIF GPS coordinates from photos",
        "Show photo location on an interactive map",
        "Copy coordinates in DD or DMS format",
        "JPG, PNG, WebP and HEIC support",
        "Runs entirely in the browser — 100% private"
      ]
    });

    injectPageSchema('gps-finder-faq', {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is a GPS Finder tool?",
          "acceptedAnswer": { "@type": "Answer", "text": "A GPS Finder reads EXIF metadata from photos to extract embedded GPS coordinates. When you take a photo with location services enabled, your device stores latitude and longitude in the image file. Our GPS Finder reads this data and displays the exact location on an interactive map." }
        },
        {
          "@type": "Question",
          "name": "How do I find GPS coordinates in a photo?",
          "acceptedAnswer": { "@type": "Answer", "text": "Upload your photo to our GPS Finder tool. If the image contains GPS metadata (EXIF data), coordinates are automatically extracted and shown on a map. You can copy the coordinates or open the location in Google Maps." }
        },
        {
          "@type": "Question",
          "name": "Is my photo uploaded to your servers?",
          "acceptedAnswer": { "@type": "Answer", "text": "No. All processing happens locally in your browser. Your photos never leave your device — we don't store, transmit, or have access to any of your images." }
        },
        {
          "@type": "Question",
          "name": "Why doesn't my photo have GPS data?",
          "acceptedAnswer": { "@type": "Answer", "text": "Photos may lack GPS data if location services were disabled when taken, if the image was edited and metadata was stripped, if taken with a camera without GPS, or if downloaded from social media (which often removes location data for privacy)." }
        }
      ]
    });
  }, []);

  const processFile = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const file = fileArray[0];

    if (!file) return;

    const isAccepted = ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isAccepted || file.size > 20 * 1024 * 1024) {
      toast({
        title: "Invalid file",
        description: "Please upload a supported image file (JPG, PNG, WebP, HEIC under 20MB)",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      cleanupPreview();

      let targetBlob: Blob = file;
      let displayBlob: Blob = file;
      const isHeic = file.name.toLowerCase().endsWith(".heic");

      if (isHeic) {
        displayBlob = await convertHeicToJpeg(file);
        targetBlob = displayBlob;
      }

      const previewUrl = URL.createObjectURL(displayBlob);
      previewUrlRef.current = previewUrl;

      // Read image dimensions
      const dimensions = await new Promise<{ width: number; height: number } | undefined>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve(undefined);
        img.src = previewUrl;
      });

      const mime = targetBlob.type || (isHeic ? "image/jpeg" : undefined);
      const dataUrl = await readFileAsDataUrl(new File([targetBlob], file.name, { type: mime }));
      const meta = await extractPhotoMetadata(dataUrl);

      const ext = file.name.split(".").pop()?.toUpperCase() || "IMG";

      setInspection({
        file,
        previewUrl,
        name: file.name,
        sizeFormatted: formatFileSize(file.size),
        formatBadge: ext,
        dimensions,
        meta,
      });

      if (meta.hasGps && meta.gps) {
        toast({
          title: "Location Found!",
          description: `Extracted GPS: ${meta.gps.lat.toFixed(5)}, ${meta.gps.lng.toFixed(5)}`,
        });
      } else {
        toast({
          title: "No GPS coordinates",
          description: "This photo contains no embedded GPS location metadata.",
          variant: "default",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Processing error",
        description: err.message || "Could not read photo metadata.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [cleanupPreview, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files);
  }, [processFile]);

  const copyCoordinates = useCallback(async () => {
    if (!inspection?.meta?.gps) return;
    const gps = inspection.meta.gps;
    const textToCopy = coordFormat === "dd"
      ? `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`
      : gps.dmsFormatted;

    await navigator.clipboard.writeText(textToCopy);
    setCopiedCoords(true);
    toast({ title: "Coordinates Copied!", description: textToCopy });
    setTimeout(() => setCopiedCoords(false), 2000);
  }, [inspection, coordFormat, toast]);

  const faqs = [
    {
      q: "What is a GPS Finder tool?",
      a: "A GPS Finder is a tool that reads EXIF metadata from photos to extract embedded GPS coordinates. When you take a photo with location services enabled, your camera or smartphone stores latitude and longitude data in the image file. Our GPS Finder reads this data and displays the exact location on an interactive map."
    },
    {
      q: "How do I find GPS coordinates in a photo?",
      a: "Simply upload your photo to our GPS Finder tool. If the image contains GPS metadata (EXIF data), we'll automatically extract the coordinates and show you the location on a map. You can then copy the coordinates or open the location in Google Maps."
    },
    {
      q: "What image formats support GPS data?",
      a: "Most common image formats support GPS metadata, including JPG/JPEG, PNG, WebP, and HEIC (iPhone photos). Our tool supports all these formats and will automatically convert HEIC files for processing."
    },
    {
      q: "Is my photo uploaded to your servers?",
      a: "No. All processing happens locally in your browser. Your photos never leave your device, ensuring complete privacy and security. We don't store, transmit, or have access to any of your images."
    },
    {
      q: "Why doesn't my photo have GPS data?",
      a: "Photos may lack GPS data if: (1) Location services were disabled when the photo was taken, (2) The image was edited and metadata was stripped, (3) The photo was taken with a camera without GPS, or (4) The image was downloaded from social media (which often removes location data for privacy)."
    },
    {
      q: "Can I use this tool on my phone?",
      a: "Yes! Our GPS Finder works on all modern browsers including mobile devices. You can upload photos directly from your phone's camera roll or photo library."
    },
    {
      q: "How accurate are the GPS coordinates?",
      a: "The accuracy depends on the device that captured the photo. Modern smartphones typically provide accuracy within 5-10 meters. Professional cameras with GPS modules can be even more accurate."
    },
    {
      q: "What can I do with the extracted coordinates?",
      a: "Once extracted, you can: (1) Copy coordinates to use in other applications, (2) Open the location in Google Maps for navigation, (3) Verify where a photo was taken, (4) Organize photos by location, or (5) Use coordinates for research, documentation, or verification purposes."
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" tabIndex={-1} className="outline-none flex-1">
        {/* Hero Section */}
        <section className="py-8 md:py-12 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="max-w-4xl mx-auto text-center">
              {/* Semantic Breadcrumbs */}
              <nav aria-label="Breadcrumbs" className="mb-4 inline-flex">
                <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <li>
                    <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                  </li>
                  <li aria-hidden="true" className="opacity-60">/</li>
                  <li className="font-medium text-foreground" aria-current="page">GPS Finder</li>
                </ol>
              </nav>

              <div className="mb-3">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-xs font-semibold">
                  <Eye className="h-3 w-3 mr-1.5" /> Free GPS Location Finder
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight leading-tight">
                <span className="text-primary">GPS Finder</span>
                {" — "}Extract GPS Coordinates from Photos
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
                Upload any photo to instantly extract embedded GPS coordinates and view where it was captured on an interactive map. Works with JPG, PNG, WebP, and HEIC — 100% free and private.
              </p>

              {/* ARIA Live Region for screen readers */}
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                {isProcessing
                  ? "Reading photo metadata..."
                  : inspection
                  ? inspection.meta.hasGps
                    ? `GPS location extracted: ${inspection.meta.gps?.lat.toFixed(5)}, ${inspection.meta.gps?.lng.toFixed(5)}`
                    : "No GPS coordinates found in uploaded photo."
                  : "No photo uploaded."}
              </div>

              {/* Tool Area */}
              {!inspection ? (
                <Card
                  className={`max-w-2xl mx-auto cursor-pointer transition-all duration-300 border-2 border-dashed shadow-sm ${
                    isDragging
                      ? "border-primary bg-primary/10 scale-[1.01]"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("finder-input")?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      document.getElementById("finder-input")?.click();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label="Upload photo to extract GPS coordinates"
                  data-testid="dropzone-finder"
                >
                  <CardContent className="py-12 sm:py-14 text-center">
                    {isProcessing ? (
                      <div className="space-y-4">
                        <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                        <h3 className="text-xl font-semibold">Reading photo metadata...</h3>
                        <p className="text-sm text-muted-foreground">Extracting EXIF GPS tags locally in memory</p>
                      </div>
                    ) : (
                      <>
                        <FileImage className={`h-12 w-12 mx-auto mb-4 text-primary transition-transform duration-300 ${isDragging ? "scale-110" : ""}`} />
                        <h3 className="text-xl sm:text-2xl font-semibold mb-2">Drop your photo here</h3>
                        <p className="text-muted-foreground mb-4 text-sm sm:text-base">or click to browse from your device</p>
                        <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                          <Badge variant="outline" className="text-xs">JPG</Badge>
                          <Badge variant="outline" className="text-xs">PNG</Badge>
                          <Badge variant="outline" className="text-xs">WebP</Badge>
                          <Badge variant="outline" className="text-xs">HEIC</Badge>
                          <Badge variant="secondary" className="text-xs">Max 20MB</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto flex items-center justify-center gap-1.5">
                          <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                          100% Client-Side. Photos never leave your browser.
                        </p>
                        <input
                          id="finder-input"
                          type="file"
                          accept={ACCEPTED_EXTENSIONS.join(",")}
                          onChange={(e) => e.target.files && processFile(e.target.files)}
                          className="hidden"
                          data-testid="input-finder-file"
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : !inspection.meta.hasGps || !inspection.meta.gps ? (
                /* No GPS State */
                <div className="space-y-6 max-w-3xl mx-auto text-left">
                  <div className="text-center">
                    <Badge variant="outline" className="mb-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 px-3 py-1 font-medium" data-testid="badge-no-gps">
                      <AlertCircle className="h-3.5 w-3.5 mr-1.5" /> No GPS Coordinates Embedded
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-1 text-foreground" data-testid="text-gps-title">
                      No Location Data Found in Photo
                    </h2>
                    <p className="text-muted-foreground text-sm" data-testid="text-filename">
                      {inspection.name} • {inspection.sizeFormatted} • {inspection.formatBadge}
                    </p>
                  </div>

                  <Card className="border-border shadow-sm overflow-hidden">
                    <CardContent className="p-6 md:p-8 space-y-6">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <img
                          src={inspection.previewUrl}
                          alt={inspection.name}
                          className="w-36 h-36 object-cover rounded-xl border border-border shadow-inner shrink-0"
                        />
                        <div className="space-y-3 flex-1 text-center sm:text-left">
                          <h3 className="font-semibold text-lg text-foreground">Metadata Analysis Result</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Our metadata engine inspected the EXIF headers and container chunks of this file, but no geographic GPS tags were found.
                          </p>
                          {(inspection.meta.camera || inspection.meta.dateTimeOriginal) && (
                            <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                              {inspection.meta.camera?.make && (
                                <Badge variant="secondary" className="text-xs">
                                  Camera: {inspection.meta.camera.make} {inspection.meta.camera.model || ""}
                                </Badge>
                              )}
                              {inspection.meta.dateTimeOriginal && (
                                <Badge variant="secondary" className="text-xs">
                                  Captured: {inspection.meta.dateTimeOriginal}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-900 dark:text-amber-200 space-y-2">
                        <h4 className="font-semibold flex items-center gap-1.5">
                          <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" /> Why do photos lack GPS data?
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm opacity-90">
                          <li>Location services or GPS tagging was disabled in your camera app.</li>
                          <li>The photo was shared via WhatsApp, Instagram, Facebook, or X (which strip EXIF metadata for privacy).</li>
                          <li>The image was edited or saved in software that stripped metadata on export.</li>
                          <li>The camera does not have built-in GPS hardware.</li>
                        </ul>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                        <Link href="/">
                          <Button size="lg" className="w-full sm:w-auto font-medium shadow-sm" data-testid="button-geotag">
                            <MapPin className="h-4 w-4 mr-2" /> Add GPS Location to This Photo
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => { cleanupPreview(); setInspection(null); }}
                          className="w-full sm:w-auto"
                          data-testid="button-check-another"
                        >
                          <Upload className="h-4 w-4 mr-2" /> Check Another Photo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* Success State: GPS Found */
                <div className="space-y-6 max-w-5xl mx-auto text-left">
                  <div className="text-center">
                    <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 px-3 py-1 font-medium" data-testid="badge-location-found">
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> GPS Location Extracted
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-1 text-foreground" data-testid="text-gps-title">
                      GPS Coordinates Found
                    </h2>
                    <p className="text-muted-foreground text-sm" data-testid="text-filename">
                      {inspection.name} • {inspection.sizeFormatted} • {inspection.formatBadge}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Photo & Details */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Photo Preview Card */}
                      <Card className="overflow-hidden border-border shadow-sm">
                        <div className="relative bg-muted/40 aspect-video flex items-center justify-center p-2">
                          <img
                            src={inspection.previewUrl}
                            alt={inspection.name}
                            className="max-h-52 max-w-full object-contain rounded-lg shadow-sm"
                          />
                          {inspection.dimensions && (
                            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                              {inspection.dimensions.width} × {inspection.dimensions.height} px
                            </span>
                          )}
                        </div>
                      </Card>

                      {/* Coordinate Card */}
                      <Card className="border-border shadow-sm">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coordinates</span>
                            {/* DD / DMS Segmented Toggle */}
                            <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5" role="tablist" aria-label="Coordinate format">
                              <button
                                type="button"
                                role="tab"
                                aria-selected={coordFormat === "dd"}
                                onClick={() => setCoordFormat("dd")}
                                data-testid="toggle-dd"
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                  coordFormat === "dd"
                                    ? "bg-card text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Decimal (DD)
                              </button>
                              <button
                                type="button"
                                role="tab"
                                aria-selected={coordFormat === "dms"}
                                onClick={() => setCoordFormat("dms")}
                                data-testid="toggle-dms"
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                  coordFormat === "dms"
                                    ? "bg-card text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                DMS
                              </button>
                            </div>
                          </div>

                          <div className="bg-muted/30 border border-border/60 rounded-xl p-3.5 text-center">
                            <div className="text-lg sm:text-xl font-mono font-bold tracking-tight text-foreground" data-testid="text-coordinates">
                              {coordFormat === "dd"
                                ? `${inspection.meta.gps.lat.toFixed(6)}, ${inspection.meta.gps.lng.toFixed(6)}`
                                : inspection.meta.gps.dmsFormatted}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono mt-1">
                              {coordFormat === "dd"
                                ? inspection.meta.gps.dmsFormatted
                                : `${inspection.meta.gps.lat.toFixed(6)}, ${inspection.meta.gps.lng.toFixed(6)}`}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              onClick={copyCoordinates}
                              className="w-full justify-center"
                              data-testid="button-copy-coords"
                            >
                              {copiedCoords ? <Check className="h-4 w-4 mr-2 text-primary" /> : <Copy className="h-4 w-4 mr-2" />}
                              {copiedCoords ? "Copied!" : "Copy Coordinates"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => window.open(`https://www.google.com/maps?q=${inspection.meta.gps?.lat},${inspection.meta.gps?.lng}`, "_blank", "noopener,noreferrer")}
                              className="w-full justify-center"
                              data-testid="button-open-maps"
                            >
                              <Globe className="h-4 w-4 mr-2" /> Google Maps
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${inspection.meta.gps?.lat}&mlon=${inspection.meta.gps?.lng}#map=16/${inspection.meta.gps?.lat}/${inspection.meta.gps?.lng}`, "_blank", "noopener,noreferrer")}
                              className="w-full justify-center sm:col-span-2"
                              data-testid="button-open-osm"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" /> Open in OpenStreetMap
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Technical Metadata Card */}
                      <Card className="border-border shadow-sm" data-testid="card-metadata-breakdown">
                        <CardContent className="p-4 space-y-2.5 text-xs">
                          <div className="font-semibold text-foreground text-sm pb-1 border-b border-border/60">
                            Technical EXIF Metadata
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-muted-foreground flex items-center gap-1.5"><Compass className="h-3.5 w-3.5" /> Altitude:</span>
                            <span className="font-mono font-medium text-foreground">
                              {inspection.meta.gps.altitudeMeters !== undefined
                                ? `${inspection.meta.gps.altitudeMeters} m (${inspection.meta.gps.altitudeFeet} ft)`
                                : "Not recorded"}
                            </span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Date / Time:</span>
                            <span className="font-mono font-medium text-foreground">
                              {inspection.meta.dateTimeOriginal || inspection.meta.gps.dateStamp || "Not recorded"}
                            </span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-muted-foreground flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> Camera:</span>
                            <span className="font-medium text-foreground truncate max-w-[200px]" title={[inspection.meta.camera?.make, inspection.meta.camera?.model].filter(Boolean).join(" ") || "Unknown"}>
                              {[inspection.meta.camera?.make, inspection.meta.camera?.model].filter(Boolean).join(" ") || "Not recorded"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Column: Map Preview */}
                    <div className="lg:col-span-7 flex flex-col">
                      <Card className="border-border shadow-sm flex-1 flex flex-col overflow-hidden min-h-[420px] lg:min-h-[500px]" data-testid="map-finder">
                        <LeafletMap
                          latitude={inspection.meta.gps.lat}
                          longitude={inspection.meta.gps.lng}
                          readOnly={true}
                          zoom={15}
                          className="h-full w-full"
                        />
                      </Card>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => { cleanupPreview(); setInspection(null); }}
                      data-testid="button-check-another"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Check Another Photo
                    </Button>
                    <Link href="/">
                      <Button size="lg" data-testid="button-geotag">
                        <MapPin className="h-4 w-4 mr-2" /> Add GPS to More Photos
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Instant GPS extraction</span>
                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> 100% private & secure</span>
                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> No uploads required</span>
                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Works on all devices</span>
              </div>
            </div>
          </div>
        </section>

      {/* What is GPS Finder Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Info className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">What Is GPS Finder?</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p className="text-lg leading-relaxed">
                GPS Finder is a free online tool that extracts GPS location data from digital photos. When you take a photo with a GPS-enabled device (smartphone, tablet, or camera), the device embeds geographic coordinates into the image's EXIF metadata. Our GPS Finder reads this metadata and displays the exact location where the photo was captured.
              </p>
              <p className="leading-relaxed">
                This tool is essential for photographers, travelers, researchers, journalists, and anyone who needs to verify photo locations, organize images geographically, or recover location information from their photo library.
              </p>
              <p className="leading-relaxed">
                Unlike other tools that require uploads to cloud servers, our GPS Finder processes everything locally in your browser, ensuring your photos remain completely private and secure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How GPS Finder Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Extract GPS coordinates from photos in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="card-3d h-full">
              <Card className="card-3d-inner text-center p-6 h-full bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4 animate-float">
                  <Upload className="h-8 w-8 text-blue-500 icon-glow" />
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto mb-4 font-bold text-xl">1</div>
                <h3 className="font-semibold text-lg mb-2">Upload Your Photo</h3>
                <p className="text-sm text-muted-foreground">Drag and drop or click to select any JPG, PNG, WebP, or HEIC image from your device.</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner text-center p-6 h-full bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4 animate-float-delay-1">
                  <Search className="h-8 w-8 text-green-500 icon-glow" />
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-4 font-bold text-xl">2</div>
                <h3 className="font-semibold text-lg mb-2">Automatic Extraction</h3>
                <p className="text-sm text-muted-foreground">Our tool instantly reads the EXIF metadata and extracts GPS coordinates from your photo.</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner text-center p-6 h-full bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4 animate-float-delay-2">
                  <MapPin className="h-8 w-8 text-purple-500 icon-glow" />
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center mx-auto mb-4 font-bold text-xl">3</div>
                <h3 className="font-semibold text-lg mb-2">View on Map</h3>
                <p className="text-sm text-muted-foreground">See the exact location on an interactive map, copy coordinates, or open in Google Maps.</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Use Our GPS Finder?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Powerful features for extracting and viewing photo location data</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="card-3d h-full">
              <Card className="card-3d-inner p-6 h-full hover-scale bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-green-500 icon-glow" />
                </div>
                <h3 className="font-semibold mb-2">100% Private</h3>
                <p className="text-sm text-muted-foreground">All processing happens in your browser. Photos never leave your device.</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner p-6 h-full hover-scale bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-500 icon-glow" />
                </div>
                <h3 className="font-semibold mb-2">Instant Results</h3>
                <p className="text-sm text-muted-foreground">GPS coordinates are extracted and displayed within seconds.</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner p-6 h-full hover-scale bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                  <Camera className="h-6 w-6 text-purple-500 icon-glow" />
                </div>
                <h3 className="font-semibold mb-2">All Formats</h3>
                <p className="text-sm text-muted-foreground">Supports JPG, PNG, WebP, and HEIC (iPhone) photos.</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner p-6 h-full hover-scale bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-amber-500 icon-glow" />
                </div>
                <h3 className="font-semibold mb-2">Interactive Map</h3>
                <p className="text-sm text-muted-foreground">View locations on an interactive map with zoom and pan controls.</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner p-6 h-full hover-scale bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/20">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center mb-4">
                  <Copy className="h-6 w-6 text-rose-500 icon-glow" />
                </div>
                <h3 className="font-semibold mb-2">Copy Coordinates</h3>
                <p className="text-sm text-muted-foreground">One-click copy to use coordinates in other applications.</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner p-6 h-full hover-scale bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-cyan-500 icon-glow" />
                </div>
                <h3 className="font-semibold mb-2">Mobile Friendly</h3>
                <p className="text-sm text-muted-foreground">Works perfectly on smartphones, tablets, and desktop computers.</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner p-6 h-full hover-scale bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-indigo-500 icon-glow" />
                </div>
                <h3 className="font-semibold mb-2">No Registration</h3>
                <p className="text-sm text-muted-foreground">No sign-up, no accounts, no tracking. Just upload and extract.</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner p-6 h-full hover-scale bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                  <ImageIcon className="h-6 w-6 text-emerald-500 icon-glow" />
                </div>
                <h3 className="font-semibold mb-2">Large Files</h3>
                <p className="text-sm text-muted-foreground">Process images up to 20MB without quality loss.</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Who Uses GPS Finder?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Essential tool for professionals and enthusiasts alike</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Camera, title: "Photographers", desc: "Verify shooting locations and organize photo libraries by geographic data" },
              { icon: Laptop, title: "Journalists", desc: "Authenticate photo sources and verify where images were captured" },
              { icon: Search, title: "Researchers", desc: "Extract location data for field studies, documentation, and analysis" },
              { icon: Globe, title: "Travelers", desc: "Rediscover where vacation photos were taken and plan return visits" },
              { icon: Shield, title: "Legal Professionals", desc: "Verify photo authenticity and location for evidence documentation" },
              { icon: ImageIcon, title: "Content Creators", desc: "Tag and organize media assets by location for better workflow" },
            ].map((useCase, idx) => (
              <div key={idx} className="card-3d h-full">
                <Card className="card-3d-inner p-5 flex items-start gap-4 h-full hover-scale">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <useCase.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{useCase.title}</h3>
                    <p className="text-sm text-muted-foreground">{useCase.desc}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Understanding GPS Metadata Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Understanding GPS Metadata in Photos</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  What is EXIF Data?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  EXIF (Exchangeable Image File Format) is a standard that specifies formats for images, sound, and ancillary tags used by digital cameras, smartphones, and other systems. When you take a photo with a GPS-enabled device, the camera embeds location coordinates (latitude and longitude) directly into the image file's EXIF metadata.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  What GPS Data is Stored?
                </h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>Photos with GPS metadata typically contain:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Latitude & Longitude:</strong> Precise geographic coordinates</li>
                    <li><strong>Altitude:</strong> Elevation above sea level (when available)</li>
                    <li><strong>Timestamp:</strong> Date and time the photo was captured</li>
                    <li><strong>Direction:</strong> Compass direction the camera was facing</li>
                    <li><strong>GPS Accuracy:</strong> Precision of the location measurement</li>
                  </ul>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Privacy Considerations
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  GPS metadata can reveal sensitive location information. Before sharing photos online, consider whether you want to preserve or remove location data. Many social media platforms automatically strip EXIF data, but direct file sharing (email, messaging apps) may preserve it.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Tip:</strong> Use our GPS Finder to check if your photos contain location data before sharing them publicly.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="gps-finder-faq" className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Everything you need to know about GPS Finder</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <Card key={idx} className="overflow-hidden hover-scale">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="font-semibold">{faq.q}</span>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="pl-8 text-muted-foreground leading-relaxed border-l-2 border-primary/20 ml-2">
                        {faq.a}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-green-500/10 to-transparent">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find GPS Coordinates?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Upload your photo now to extract location data instantly — completely free and private
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={() => document.getElementById("finder-input")?.click()} className="shadow-hover">
                <Upload className="h-5 w-5 mr-2" /> Upload Photo Now
              </Button>
              <Link href="/">
                <Button size="lg" variant="outline" className="shadow-hover">
                  <MapPin className="h-5 w-5 mr-2" /> Add GPS to Photos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>

    {/* Footer */}
    <Footer />
    </div>
  );
}
