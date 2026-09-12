import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Eye, FileImage, Copy, Check, Globe, MapPin, Upload,
  Shield, Zap, Camera, Search, Info, ChevronDown,
  Smartphone, Laptop, Image as ImageIcon, Lock,
  CheckCircle, AlertCircle, HelpCircle,
  Compass, Clock, Loader2, ExternalLink, Download,
  Sliders, Calendar, Maximize, FileText, Share2, Layers,
  Trash2, RefreshCw
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import {
  extractExifData,
  ExifData,
  RawTagItem,
  generateMetadataSummary
} from "@/lib/exif-utils";
import { MapSkeleton } from "@/components/tool/map-skeleton";
import { useToast } from "@/hooks/use-toast";
import { updatePageSEO, SEO_CONFIG, injectPageSchema } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";
import { AdSlot } from "@/components/ad-slot";

const LazyLeafletMap = React.lazy(() => import("@/components/tool/leaflet-map"));

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

interface PhotoInspection {
  file: File;
  previewUrl: string;
  name: string;
  sizeFormatted: string;
  data: ExifData;
  rawTags: RawTagItem[];
  hasGps: boolean;
  hasExif: boolean;
}

export default function ExifViewer() {
  const [inspection, setInspection] = useState<PhotoInspection | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [showRawTags, setShowRawTags] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
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
    updatePageSEO(SEO_CONFIG.exifViewer);

    injectPageSchema("exif-viewer-webpage", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "EXIF Viewer Online Free – View Image Metadata in Browser",
      url: "https://freegeotagger.com/exif-viewer",
      description: SEO_CONFIG.exifViewer.description,
      inLanguage: "en-US",
      dateModified: "2026-09-12",
      isPartOf: {
        "@type": "WebSite",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
      },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://freegeotagger.com/" },
          { "@type": "ListItem", position: 2, name: "EXIF Viewer", item: "https://freegeotagger.com/exif-viewer" },
        ],
      },
    });

    injectPageSchema("exif-viewer-app", {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "FreeGeoTagger EXIF Viewer",
      applicationCategory: "PhotographyApplication",
      operatingSystem: "Web Browser",
      browserRequirements: "Chrome, Firefox, Safari, Edge",
      url: "https://freegeotagger.com/exif-viewer",
      description: SEO_CONFIG.exifViewer.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
      featureList: [
        "Inspect camera make, model, lens and exposure settings",
        "View ISO, aperture, shutter speed and focal length",
        "View GPS location coordinates with interactive map",
        "Inspect image dimensions, megapixels and aspect ratio",
        "View software, color space, and copyright metadata",
        "100% in-browser processing with zero server uploads",
      ],
    });

    injectPageSchema("exif-viewer-faq", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is EXIF data in a photo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "EXIF (Exchangeable Image File Format) is a metadata standard that stores camera settings, exposure values, date and time stamps, image dimensions, and GPS coordinates directly inside digital image files.",
          },
        },
        {
          "@type": "Question",
          name: "Are my photos uploaded to your server when using the EXIF Viewer?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. All file reading and metadata inspection happen locally in your web browser using client-side JavaScript. Your images are never transmitted to any server, keeping your private photos and location details 100% confidential.",
          },
        },
        {
          "@type": "Question",
          name: "Can I view EXIF metadata from iPhone HEIC photos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. FreeGeoTagger automatically parses HEIC and HEIF photos locally in your browser, extracting camera model, capture time, exposure settings, and GPS coordinates without requiring manual conversion.",
          },
        },
        {
          "@type": "Question",
          name: "Why does my photo have no EXIF data?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Photos may lack EXIF data if they were saved from social media networks (like Facebook, Instagram, or Twitter) or sent via messaging apps (such as WhatsApp), which automatically strip metadata to protect user privacy.",
          },
        },
        {
          "@type": "Question",
          name: "How do I edit or add GPS data to a photo after viewing it?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You can click the 'Geotag This Photo' button to open FreeGeoTagger's free geotagging tool, where you can click on an interactive map or search an address to embed new coordinates into the photo.",
          },
        },
        {
          "@type": "Question",
          name: "What is the difference between the EXIF Viewer and GPS Finder?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "GPS Finder focuses specifically on extracting location coordinates and plotting them on a map to answer 'where was this photo taken'. The EXIF Viewer provides a comprehensive breakdown of all camera settings, exposure values, dimensions, timestamps, software, and copyright metadata alongside GPS coordinates.",
          },
        },
      ],
    });
  }, []);

  const handleFileProcess = async (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast({
        title: "Unsupported format",
        description: "Please upload a JPG, PNG, WebP, or HEIC image.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    cleanupPreview();

    try {
      const preview = URL.createObjectURL(file);
      previewUrlRef.current = preview;

      const result = await extractExifData(file);

      if (!result.success || !result.data) {
        toast({
          title: "Parsing error",
          description: result.error || "Failed to parse metadata from image.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      setInspection({
        file,
        previewUrl: preview,
        name: file.name,
        sizeFormatted: result.data.softwareInfo.fileSizeFormatted || "Unknown size",
        data: result.data,
        rawTags: result.rawTagsList,
        hasGps: result.hasGps,
        hasExif: result.hasExif,
      });

      trackEvent("tool_used", { tool: "exif_viewer", has_exif: result.hasExif, has_gps: result.hasGps });

      if (result.hasExif) {
        toast({
          title: "EXIF metadata extracted",
          description: `Found ${result.data.totalTagsCount} metadata tags in ${file.name}.`,
        });
      } else {
        toast({
          title: "No EXIF metadata found",
          description: "This image does not contain standard EXIF tags. It may have been stripped by messaging apps.",
        });
      }
    } catch (err) {
      toast({
        title: "Error reading photo",
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleCopyCoords = async () => {
    if (!inspection?.data.gps.decimalFormatted) return;
    try {
      await navigator.clipboard.writeText(inspection.data.gps.decimalFormatted);
      setCopiedCoords(true);
      toast({
        title: "Coordinates copied",
        description: inspection.data.gps.decimalFormatted,
      });
      setTimeout(() => setCopiedCoords(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleCopySummary = async () => {
    if (!inspection) return;
    const summary = generateMetadataSummary(inspection.data, inspection.name);
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedSummary(true);
      toast({
        title: "Metadata summary copied",
        description: "Full EXIF summary copied to clipboard.",
      });
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleExportJson = () => {
    if (!inspection) return;
    const exportPayload = {
      source: "FreeGeoTagger EXIF Viewer (https://freegeotagger.com/exif-viewer)",
      fileName: inspection.name,
      fileSize: inspection.sizeFormatted,
      extractedAt: new Date().toISOString(),
      metadata: inspection.data,
      allTags: inspection.rawTags,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inspection.name.replace(/\.[^/.]+$/, "")}-exif.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "JSON exported",
      description: "Complete metadata saved to JSON file.",
    });
  };

  const handleClear = () => {
    cleanupPreview();
    setInspection(null);
    setShowRawTags(false);
    setTagSearch("");
  };

  const filteredRawTags = inspection?.rawTags.filter((t) => {
    if (!tagSearch.trim()) return true;
    const q = tagSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.value.toLowerCase().includes(q) ||
      t.group.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }) || [];

  const faqs = [
    {
      q: "What is EXIF data in a photo?",
      a: "EXIF stands for Exchangeable Image File Format. It is a technical metadata specification used by digital cameras and smartphones to save capture settings directly into image headers. This includes camera make and model, lens details, focal length, aperture (F-number), shutter speed, ISO sensitivity, exposure mode, date and time, image dimensions, and GPS coordinates.",
    },
    {
      q: "Are my photos uploaded to your server when using the EXIF Viewer?",
      a: "No. FreeGeoTagger is built with a strict privacy-first zero-upload architecture. All file reading, metadata extraction, and coordinate parsing execute locally in your web browser using HTML5 File and ArrayBuffer APIs. Your photos never cross the internet, ensuring 100% confidential processing for private photos, client shoots, and sensitive locations.",
    },
    {
      q: "Can I view EXIF metadata from iPhone HEIC photos?",
      a: "Yes. Apple iPhones capture photos in HEIC/HEIF format by default. Our EXIF Viewer automatically decodes HEIC container structures in your browser and displays the complete metadata record, including Apple iPhone camera models, computational photography tags, and embedded GPS coordinates.",
    },
    {
      q: "Why does my photo have no EXIF data?",
      a: "Digital photos can lack EXIF metadata for several reasons: (1) Social media platforms (such as Facebook, Instagram, Twitter/X) automatically wipe EXIF headers to protect user privacy; (2) Messaging applications (such as WhatsApp, Telegram) compress and strip metadata by default; (3) Editing software (such as Photoshop 'Save for Web' or Canva) was configured to discard metadata; or (4) The camera had location services turned off.",
    },
    {
      q: "How do I edit or add GPS data to a photo after viewing it?",
      a: "If your photo is missing GPS coordinates or has inaccurate location tags, click the 'Geotag This Photo' button to open our free photo geotagger. You can select any location on an interactive map or search an address to inject verified EXIF GPS tags into your photo without recompressing pixels.",
    },
    {
      q: "What is the difference between the EXIF Viewer and GPS Finder?",
      a: "The GPS Finder tool specifically extracts geographic coordinates to plot photos on an interactive map and answer 'where was this photo taken'. The EXIF Viewer provides a comprehensive technical breakdown of all camera settings, exposure values, lens data, hardware details, timestamps, image dimensions, and copyright information in addition to GPS data.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main id="main-content" tabIndex={-1} className="outline-none flex-1">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="container mx-auto px-4 max-w-6xl pt-6 pb-2">
          <ol className="flex items-center gap-2 text-xs text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground font-medium" aria-current="page">
              EXIF Viewer
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 max-w-6xl pt-4 pb-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <Badge variant="outline" className="mb-3 px-3 py-1 font-medium text-xs bg-primary/5 text-primary border-primary/20">
              <Shield className="h-3 w-3 mr-1.5 inline" aria-hidden="true" />
              100% In-Browser & Local Privacy
            </Badge>
            <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-foreground mb-4">
              EXIF Viewer Online Free
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Inspect complete photo metadata in your browser. View camera settings, ISO, exposure, lens details, timestamps, and GPS coordinates with <strong>zero server uploads</strong>.
            </p>
          </div>

          {/* Core Tool Interaction Zone */}
          <div className="max-w-4xl mx-auto" role="region" aria-label="EXIF Viewer Tool">
            {/* Upload Area */}
            {!inspection && (
              <Card
                className={`border-2 border-dashed transition-all duration-200 cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5 shadow-md scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById("exif-file-input")?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center py-14 px-6 text-center">
                  <input
                    id="exif-file-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.heic,image/jpeg,image/png,image/webp,image/heic"
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    {isProcessing ? (
                      <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
                    ) : (
                      <Camera className="h-8 w-8" aria-hidden="true" />
                    )}
                  </div>
                  <h2 className="text-xl font-display font-semibold mb-2 text-foreground">
                    {isProcessing ? "Reading EXIF Metadata..." : "Drop your photo here to view EXIF data"}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-md mb-6">
                    {isProcessing
                      ? "Extracting camera settings, exposure values, and GPS tags locally..."
                      : "Drag and drop any JPG, PNG, WebP, or HEIC photo, or click to browse files from your device."}
                  </p>
                  <Button
                    type="button"
                    variant="default"
                    size="lg"
                    disabled={isProcessing}
                    className="min-h-12 px-6 font-semibold"
                  >
                    <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                    Select Photo to Inspect
                  </Button>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-1 rounded">JPG / JPEG</span>
                    <span className="bg-muted px-2 py-1 rounded">PNG</span>
                    <span className="bg-muted px-2 py-1 rounded">WebP</span>
                    <span className="bg-muted px-2 py-1 rounded">HEIC / iPhone</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium ml-1">✓ 100% Private</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Inspection View */}
            {inspection && (
              <div className="space-y-6">
                {/* File Header Bar */}
                <Card className="border border-border shadow-sm">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={inspection.previewUrl}
                          alt={inspection.name}
                          className="w-16 h-16 object-cover rounded-lg border border-border flex-shrink-0 bg-muted"
                        />
                        <div className="min-w-0">
                          <h2 className="text-base md:text-lg font-display font-bold truncate text-foreground">
                            {inspection.name}
                          </h2>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{inspection.sizeFormatted}</span>
                            <span>•</span>
                            <span>{inspection.data.softwareInfo.fileType}</span>
                            {inspection.data.geometry.megapixels && (
                              <>
                                <span>•</span>
                                <span>{inspection.data.geometry.megapixels}</span>
                              </>
                            )}
                            <span>•</span>
                            <Badge
                              variant={inspection.hasGps ? "default" : "secondary"}
                              className="text-[10px] px-1.5 py-0.5"
                            >
                              {inspection.hasGps ? "GPS Tagged" : "No GPS"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Top Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopySummary}
                          className="flex-1 sm:flex-none text-xs min-h-[38px]"
                        >
                          {copiedSummary ? <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                          Copy Summary
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportJson}
                          className="flex-1 sm:flex-none text-xs min-h-[38px]"
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          Export JSON
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClear}
                          className="text-xs text-muted-foreground hover:text-destructive min-h-[38px]"
                          aria-label="Inspect another photo"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                          New Photo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 28 Grouped Metadata Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Group 1: Camera & Hardware */}
                  <Card className="border border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
                        <Camera className="h-4 w-4 text-primary" aria-hidden="true" />
                        Camera & Exposure
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2.5 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Camera Make:</span>
                        <span className="font-medium text-foreground">{inspection.data.camera.make || "Not recorded"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Camera Model:</span>
                        <span className="font-medium text-foreground">{inspection.data.camera.model || "Not recorded"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Lens Model:</span>
                        <span className="font-medium text-foreground truncate max-w-[200px]" title={inspection.data.camera.lensModel || ""}>
                          {inspection.data.camera.lensModel || "Not recorded"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Focal Length:</span>
                        <span className="font-medium text-foreground">
                          {inspection.data.camera.focalLength || "Not recorded"}
                          {inspection.data.camera.focalLength35mm && (
                            <span className="text-xs text-muted-foreground ml-1">({inspection.data.camera.focalLength35mm} 35mm)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Aperture:</span>
                        <span className="font-medium text-foreground">{inspection.data.camera.fNumber || "Not recorded"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Shutter Speed:</span>
                        <span className="font-medium text-foreground">{inspection.data.camera.exposureTime || "Not recorded"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">ISO Sensitivity:</span>
                        <span className="font-medium text-foreground">{inspection.data.camera.iso ?? "Not recorded"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Flash:</span>
                        <span className="font-medium text-foreground">{inspection.data.camera.flash || "Not recorded"}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-muted-foreground">Exposure Program:</span>
                        <span className="font-medium text-foreground">{inspection.data.camera.exposureProgram || "Normal / Auto"}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Group 2: Dimensions & Geometry */}
                  <Card className="border border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
                        <Maximize className="h-4 w-4 text-primary" aria-hidden="true" />
                        Dimensions & Geometry
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2.5 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Resolution:</span>
                        <span className="font-medium text-foreground">
                          {inspection.data.geometry.width && inspection.data.geometry.height
                            ? `${inspection.data.geometry.width} × ${inspection.data.geometry.height} px`
                            : "Unknown"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Megapixels:</span>
                        <span className="font-medium text-foreground">{inspection.data.geometry.megapixels || "Unknown"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Aspect Ratio:</span>
                        <span className="font-medium text-foreground">{inspection.data.geometry.aspectRatio || "Unknown"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">EXIF Orientation:</span>
                        <span className="font-medium text-foreground">{inspection.data.geometry.orientation || "Horizontal (Normal)"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Color Space:</span>
                        <span className="font-medium text-foreground">{inspection.data.softwareInfo.colorSpace || "sRGB"}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-muted-foreground">Bits Per Sample:</span>
                        <span className="font-medium text-foreground">{inspection.data.softwareInfo.bitsPerSample || "8 bits/channel"}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Group 3: Date & Time */}
                  <Card className="border border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
                        Date & Time Stamps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2.5 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Date Taken (Original):</span>
                        <span className="font-medium text-foreground">{inspection.data.dateTimeInfo.original || "Not recorded"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Date Digitized:</span>
                        <span className="font-medium text-foreground">{inspection.data.dateTimeInfo.digitized || "Not recorded"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Date Modified:</span>
                        <span className="font-medium text-foreground">{inspection.data.dateTimeInfo.modified || "Not recorded"}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-muted-foreground">Time Zone Offset:</span>
                        <span className="font-medium text-foreground">{inspection.data.dateTimeInfo.offsetTime || "Not specified"}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Group 4: Software & Copyright */}
                  <Card className="border border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                        Software & Attribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2.5 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Software / Editor:</span>
                        <span className="font-medium text-foreground">{inspection.data.softwareInfo.software || "Original camera firmware"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Artist / Creator:</span>
                        <span className="font-medium text-foreground">{inspection.data.copyright.artist || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">Copyright Notice:</span>
                        <span className="font-medium text-foreground">{inspection.data.copyright.copyright || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-muted-foreground">Image Description:</span>
                        <span className="font-medium text-foreground">{inspection.data.copyright.imageDescription || "None"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Group 5: GPS Location & Interactive Map */}
                <Card className="border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                        GPS Location Metadata
                      </CardTitle>
                      {inspection.hasGps && (
                        <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs">
                          Location Coordinates Found
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {inspection.hasGps && inspection.data.gps.latitude !== null && inspection.data.gps.longitude !== null ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Decimal Degrees</p>
                            <p className="font-mono text-sm font-semibold text-foreground">
                              {inspection.data.gps.latitude.toFixed(6)}, {inspection.data.gps.longitude.toFixed(6)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">DMS Coordinates</p>
                            <p className="font-mono text-xs font-semibold text-foreground">
                              {inspection.data.gps.dmsFormatted}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Altitude</p>
                            <p className="font-mono text-sm font-semibold text-foreground">
                              {inspection.data.gps.altitude !== null ? `${inspection.data.gps.altitude.toFixed(1)} m` : "Not recorded"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyCoords}
                              className="text-xs w-full min-h-[36px]"
                            >
                              {copiedCoords ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                              Copy GPS
                            </Button>
                            {inspection.data.gps.googleMapsUrl && (
                              <a
                                href={inspection.data.gps.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center p-2 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Open in Google Maps"
                                aria-label="Open in Google Maps"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Map View */}
                        <div className="h-[280px] w-full rounded-xl overflow-hidden border border-border">
                          <React.Suspense fallback={<MapSkeleton />}>
                            <LazyLeafletMap
                              key={`exif-map-${inspection.data.gps.latitude}-${inspection.data.gps.longitude}`}
                              latitude={inspection.data.gps.latitude}
                              longitude={inspection.data.gps.longitude}
                              zoom={15}
                              readOnly={true}
                              className="h-full w-full"
                            />
                          </React.Suspense>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center rounded-xl bg-muted/30 border border-dashed border-border">
                        <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2" aria-hidden="true" />
                        <h3 className="font-display font-semibold text-foreground mb-1">No GPS Coordinates Found</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                          This image does not contain geographic location tags in its EXIF header. Location services may have been disabled when the photo was taken, or stripped by a messaging app.
                        </p>
                        <Link href="/">
                          <Button size="sm" variant="default" className="min-h-[40px]">
                            <MapPin className="h-4 w-4 mr-1.5" />
                            Add GPS Coordinates to This Photo
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 28 Required Actions Box */}
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-display font-bold text-foreground mb-2">
                      What would you like to do with this photo?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      FreeGeoTagger offers free companion tools to edit, wipe, or verify photo metadata locally:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Link href="/">
                        <Button variant="default" className="w-full min-h-11 font-semibold justify-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          Geotag / Add GPS
                        </Button>
                      </Link>
                      <Link href="/gps-finder">
                        <Button variant="outline" className="w-full min-h-11 justify-center">
                          <Globe className="h-4 w-4 mr-2" />
                          GPS Finder Map
                        </Button>
                      </Link>
                      <Link href="/blog/how-to-remove-gps-data-from-photos">
                        <Button variant="outline" className="w-full min-h-11 justify-center">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove GPS Data
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Raw Tags Searchable Table */}
                <Card className="border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
                          <Sliders className="h-4 w-4 text-primary" aria-hidden="true" />
                          All Detected Metadata Tags ({inspection.data.totalTagsCount})
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Searchable raw technical tags parsed from EXIF, TIFF, XMP, and IPTC headers.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRawTags(!showRawTags)}
                        className="text-xs self-start sm:self-auto min-h-[36px]"
                      >
                        {showRawTags ? "Hide Raw Tags" : "Show All Raw Tags"}
                      </Button>
                    </div>
                  </CardHeader>
                  {showRawTags && (
                    <CardContent className="pt-0 space-y-4">
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search tags by name, group, or value (e.g. ISO, Model, Date)..."
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          className="pl-9 text-sm"
                        />
                      </div>

                      <div className="max-h-96 overflow-y-auto border border-border rounded-lg">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-muted/70 sticky top-0 border-b border-border">
                            <tr>
                              <th className="py-2.5 px-3 font-semibold text-foreground">Tag Name</th>
                              <th className="py-2.5 px-3 font-semibold text-foreground">Group</th>
                              <th className="py-2.5 px-3 font-semibold text-foreground">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50 font-mono">
                            {filteredRawTags.length > 0 ? (
                              filteredRawTags.map((tag) => (
                                <tr key={tag.id} className="hover:bg-muted/30">
                                  <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">{tag.name}</td>
                                  <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                      {tag.group}
                                    </Badge>
                                  </td>
                                  <td className="py-2 px-3 text-foreground break-all">{tag.value}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="py-6 text-center text-muted-foreground font-sans">
                                  No tags matching "{tagSearch}"
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
          </div>
        </section>

        {/* AdSlot Placement: Safely below the core tool */}
        <div className="container mx-auto px-4 max-w-4xl my-8">
          <AdSlot placement="exif-viewer-below-tool" />
        </div>

        {/* Educational Content Section (SEO & Value) */}
        <section className="container mx-auto px-4 max-w-4xl py-12 border-t border-border">
          <article className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              What Is EXIF Data in Digital Photography?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              When you take a photograph with a smartphone or digital camera, the device records far more than just light and color. It writes a detailed technical snapshot into the file header known as <strong>EXIF (Exchangeable Image File Format)</strong> metadata. This data serves as a comprehensive digital passport for the image, documenting the exact photographic conditions, hardware configuration, and location where the capture occurred.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Photographers, forensic researchers, web developers, and real estate professionals regularly inspect EXIF data to verify camera settings, confirm authentic capture dates, diagnose image issues, and locate where photos were captured.
            </p>

            <h3 className="text-xl font-display font-bold mt-8 mb-3">
              How to View EXIF Data Online in 3 Steps
            </h3>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li><strong>Select or drop your photo:</strong> Upload any JPG, PNG, WebP, or HEIC image into the dropzone above.</li>
              <li><strong>Instant local extraction:</strong> The browser reads the metadata tags directly in memory without uploading anything.</li>
              <li><strong>Review and export:</strong> Inspect camera settings, GPS map coordinates, and raw tags, or export the data to a structured JSON file.</li>
            </ol>

            <h3 className="text-xl font-display font-bold mt-8 mb-3">
              Key Metadata Groups Explained
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-6">
              <div className="p-4 rounded-xl border border-border bg-card">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                  <Camera className="h-4 w-4 text-primary" /> Camera & Exposure
                </h4>
                <p className="text-xs text-muted-foreground">
                  Identifies the camera make, model, lens model, shutter speed (exposure time), aperture (f-number), ISO sensitivity, focal length, and flash activation.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-primary" /> GPS Geolocation
                </h4>
                <p className="text-xs text-muted-foreground">
                  Records latitude, longitude, and elevation above sea level. This allows photos to be mapped on interactive cartographic platforms like Google Maps and OpenStreetMap.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-primary" /> Capture Timestamps
                </h4>
                <p className="text-xs text-muted-foreground">
                  Records Date/Time Original (when the shutter clicked), Date/Time Digitized, and Date/Time Modified, including subsecond precision and timezone offsets.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-1">
                  <Maximize className="h-4 w-4 text-primary" /> Geometry & Resolution
                </h4>
                <p className="text-xs text-muted-foreground">
                  Displays pixel dimensions (width and height), total megapixels, aspect ratio, bits per channel, and EXIF orientation flags.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-display font-bold mt-8 mb-3">
              Why Do Some Photos Lack EXIF Metadata?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              If our tool reports <em>"No EXIF metadata found"</em>, it usually means the image passed through a service that strips metadata for privacy or compression reasons:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li><strong>Social Media Networks:</strong> Platforms like Instagram, Facebook, and Twitter automatically strip all EXIF and GPS headers upon upload to prevent stalking and reduce storage overhead.</li>
              <li><strong>Chat & Messaging Apps:</strong> Apps like WhatsApp, Telegram, and Signal strip metadata unless images are sent as uncompressed "Document" attachments.</li>
              <li><strong>Web Optimization Tools:</strong> Image compressors (TinyPNG, Squoosh) strip non-pixel metadata by default to reduce file weight.</li>
              <li><strong>Disabled Location Permissions:</strong> If your camera app does not have location permissions enabled, GPS tags are omitted while camera tags remain.</li>
            </ul>

            <h3 className="text-xl font-display font-bold mt-8 mb-3">
              Zero-Upload Client-Side Privacy Guarantee
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Photo metadata can reveal highly sensitive information, such as home addresses, children's school locations, daily commute routes, and high-value camera serial numbers. FreeGeoTagger was built from the ground up with a <strong>strict client-side privacy architecture</strong>. When you inspect a photo with our EXIF Viewer, the image is loaded into your browser's local memory using JavaScript. The data never leaves your device and is never sent across the network. When you close or refresh the tab, the in-memory data is instantly wiped.
            </p>
          </article>

          {/* FAQ Accordion */}
          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-2xl font-display font-bold mb-6 text-foreground text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-border rounded-xl overflow-hidden bg-card">
                  <button
                    type="button"
                    className="w-full px-5 py-4 text-left font-display font-semibold flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    aria-expanded={openFaq === idx}
                  >
                    <span className="text-base text-foreground">{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                        openFaq === idx ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/40 bg-muted/10">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
