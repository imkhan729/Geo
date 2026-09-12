import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { Link } from "wouter";
import {
  Download,
  Loader2,
  Upload,
  Search,
  CheckCircle,
  Camera,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Globe,
  MapPin,
  Lock,
  Users,
  Check,
  Clock,
  Mountain,
  Compass,
  HardDrive,
  Eye,
  UserX,
  Newspaper,
  Building,
  Home as HomeIcon,
  Tag,
  Layers,
  ArrowRight,
  BookOpen,
  FileCheck,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dropzone } from "@/components/tool/dropzone";
import { FileQueue } from "@/components/tool/file-queue";
import { CoordinatePanel } from "@/components/tool/coordinate-panel";
import { MapSkeleton } from "@/components/tool/map-skeleton";
import { BatchActions } from "@/components/tool/batch-actions";
import { AdSlot } from "@/components/ad-slot";

const ToolComparisonTable = lazy(() =>
  import("@/components/tool-comparison-table").then((m) => ({
    default: m.ToolComparisonTable,
  }))
);

const LazyLeafletMap = React.lazy(() => import("@/components/tool/leaflet-map"));

import {
  ImageFile,
  GeotagData,
  addGeotagToImage,
  addGeotagAndVerify,
  downloadGeotaggedImage,
  generateId,
  readFileAsDataUrl,
  extractExistingGps,
  convertHeicToJpeg,
  downloadAsZip,
  formatCoordinates,
  VerificationResult,
} from "@/lib/geotag-utils";
import { useToast } from "@/hooks/use-toast";
import { HOME_SEO_CONFIG, updatePageSEO, injectPageSchema } from "@/lib/seo";
import {
  trackUploadOpened,
  trackFileAccepted,
  trackExistingGpsDetected,
  trackMapLocationSelected,
  trackProcessingStarted,
  trackProcessingCompleted,
  trackVerificationPassed,
  trackVerificationFailed,
  trackDownloadCompleted,
  trackBatchDownloadCompleted,
  trackParsingError,
  trackWritingError,
} from "@/lib/analytics";

export const HOME_FAQS = [
  {
    q: "What is a geotagger?",
    a: "A geotagger is a tool that writes geographic location coordinates—specifically latitude, longitude, and altitude—into a photo's EXIF metadata headers so map viewers and photo services know where it was taken.",
  },
  {
    q: "How do I geotag a photo online?",
    a: "Upload your JPG, PNG, WebP, or HEIC photo, click on the interactive map or search an address to set the location, and click Download to save the geotagged image with embedded EXIF GPS tags.",
  },
  {
    q: "Can I add GPS coordinates to an existing photo?",
    a: "Yes. You can add coordinates to any digital photo from cameras without GPS, scanned prints, or messaging apps. FreeGeoTagger embeds standard EXIF tags without changing image pixels or quality.",
  },
  {
    q: "Is FreeGeoTagger really free?",
    a: "Yes. FreeGeoTagger is 100% free with no accounts, subscriptions, watermarks, or file limits. You can process single photos or batches at no charge.",
  },
  {
    q: "Are my photos uploaded to your servers?",
    a: "No. All file reading, metadata editing, and downloads happen locally in your browser using JavaScript. Your photos never leave your device and are never sent across the internet.",
  },
  {
    q: "Can I geotag multiple photos at once?",
    a: "Yes. Drop multiple photos into the queue, set the location once, and apply it to every image simultaneously. You can then download them individually or as a single ZIP archive.",
  },
  {
    q: "Can I edit or change an existing GPS location on a photo?",
    a: "Yes. If an image already contains inaccurate or drifted coordinates, FreeGeoTagger detects them upon upload. Reposition the pin or enter new coordinates to overwrite the old metadata cleanly.",
  },
  {
    q: "What latitude and longitude coordinate format should I use?",
    a: "FreeGeoTagger supports both Decimal Degrees (e.g. 40.7128, -74.0060) and Degrees, Minutes, Seconds (DMS, e.g. 40° 42' 46\" N). You can switch formats anytime with synchronized conversion.",
  },
  {
    q: "Does geotagging change or compress image quality?",
    a: "No. For JPEG, PNG, and WebP files, FreeGeoTagger only updates the metadata header segments. Pixel data is not re-compressed or resaved, ensuring 100% lossless preservation.",
  },
  {
    q: "Can I remove GPS metadata from a photo later?",
    a: "Yes. You can wipe location metadata before sharing photos publicly. FreeGeoTagger provides free guides explaining how to strip EXIF data on Windows, macOS, iPhone, and Android.",
  },
  {
    q: "How do I find where an existing photo was taken?",
    a: "Use our free companion tool, the GPS Photo Finder. It reads embedded EXIF coordinates from your photo and displays the exact capture location on an interactive map.",
  },
  {
    q: "Which image formats support GPS metadata?",
    a: "JPEG uses the universal APP1 Exif standard. PNG supports GPS via the standardized eXIf binary chunk. WebP supports EXIF via RIFF containers. HEIC photos are locally converted to JPEG for universal compatibility.",
  },
];

export default function Home() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Default coordinate: Central Park, New York
  const [latitude, setLatitude] = useState<number>(40.7829);
  const [longitude, setLongitude] = useState<number>(-73.9654);
  const [altitude, setAltitude] = useState<number | undefined>(undefined);
  const [keywords, setKeywords] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [isWritingExif, setIsWritingExif] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [processedBlobs, setProcessedBlobs] = useState<Map<string, { blob: Blob; verification?: VerificationResult }>>(new Map());
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLat = params.get("lat");
      const urlLng = params.get("lng");
      if (urlLat && urlLng) {
        const pLat = parseFloat(urlLat);
        const pLng = parseFloat(urlLng);
        if (!isNaN(pLat) && !isNaN(pLng) && pLat >= -90 && pLat <= 90 && pLng >= -180 && pLng <= 180) {
          setLatitude(Number(pLat.toFixed(6)));
          setLongitude(Number(pLng.toFixed(6)));
        }
      }
    } catch {
      // Ignore URL param parsing errors
    }

    updatePageSEO(HOME_SEO_CONFIG);

    injectPageSchema("home-software", {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "FreeGeoTagger",
      alternateName: "GeoTagger",
      applicationCategory: "PhotographyApplication",
      applicationSubCategory: "Image Editing",
      operatingSystem: "Web Browser",
      browserRequirements: "Chrome, Firefox, Safari, Edge",
      description:
        "FreeGeoTagger is a free browser-based tool to add GPS location data to JPEG, PNG, WebP, and HEIC photos — without uploading files to any server. Supports batch geotagging, address search, and interactive map selection.",
      featureList: [
        "Batch geotagging",
        "Privacy-first — no file uploads",
        "Interactive map pin selection",
        "Address and place name search",
        "GPS coordinate entry",
        "DMS and Decimal coordinates",
        "EXIF metadata editing",
        "JPG, PNG, WebP, HEIC support",
        "No account required",
        "Zero image quality loss",
      ],
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
      url: "https://freegeotagger.com",
      screenshot: "https://freegeotagger.com/og-image.png",
    });

    injectPageSchema("home-webpage", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Free Geotagger – Add GPS Location to Photos Online | FreeGeoTagger",
      url: "https://freegeotagger.com/",
      description: "Add GPS location data to photos instantly — free, private and browser-based. No uploads, no accounts, no limits.",
      inLanguage: "en-US",
      isPartOf: { "@type": "WebSite", name: "FreeGeoTagger", url: "https://freegeotagger.com" },
      dateModified: "2026-09-11",
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://freegeotagger.com/" }],
      },
    });

    injectPageSchema("home-howto", {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to Geotag Photos Online for Free",
      description: "Add GPS location data to your photos in three simple steps using FreeGeoTagger — no uploads, no accounts, no software to install.",
      totalTime: "PT2M",
      estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
      step: [
        {
          "@type": "HowToStep",
          position: "1",
          name: "Upload Your Photos",
          text: "Drag and drop your JPG, PNG, WebP, or HEIC photos onto the GeoTagger tool, or click to browse and select one or multiple files. Files stay on your device — nothing is uploaded.",
        },
        {
          "@type": "HowToStep",
          position: "2",
          name: "Set the GPS Location",
          text: "Click on the interactive map to pin the exact location, search for an address or city name, or use your device's current GPS coordinates. Latitude and longitude are set instantly.",
        },
        {
          "@type": "HowToStep",
          position: "3",
          name: "Download Your Geotagged Photos",
          text: "Click Download to get your photos with GPS coordinates embedded in the EXIF metadata. No quality loss — only metadata is changed. Batch download multiple photos as a ZIP file.",
        },
      ],
      tool: { "@type": "HowToTool", name: "FreeGeoTagger", url: "https://freegeotagger.com" },
    });

    injectPageSchema("home-faq", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HOME_FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    });
  }, []);

  const processFiles = useCallback(async (incomingFiles: File[]) => {
    trackUploadOpened();
    const newItems: ImageFile[] = [];

    for (const file of incomingFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "unknown";
      try {
        let previewFile = file;
        if (file.name.toLowerCase().endsWith(".heic")) {
          const jpegBlob = await convertHeicToJpeg(file);
          previewFile = new File([jpegBlob], file.name, { type: "image/jpeg" });
        }

        const dataUrl = await readFileAsDataUrl(previewFile);
        const existingGps = await extractExistingGps(dataUrl);

        trackFileAccepted({ count: 1, format: ext });
        if (existingGps) {
          trackExistingGpsDetected({ format: ext });
        }

        newItems.push({
          id: generateId(),
          file,
          preview: dataUrl,
          name: file.name,
          type: file.type || "image/jpeg",
          size: file.size,
          existingGps,
          status: "pending",
        });
      } catch (err) {
        console.error(`Failed to load ${file.name}:`, err);
        trackParsingError({ format: ext, error_category: "decode_error" });
      }
    }

    if (newItems.length > 0) {
      setImages((prev) => {
        const nextList = [...prev, ...newItems];
        if (prev.length === 0 && newItems[0].existingGps) {
          setLatitude(newItems[0].existingGps.lat);
          setLongitude(newItems[0].existingGps.lng);
          if (newItems[0].existingGps.altitude !== undefined) {
            setAltitude(newItems[0].existingGps.altitude);
          }
        }
        return nextList;
      });

      toast({
        title: "Photos Added",
        description: `${newItems.length} photo${newItems.length > 1 ? "s" : ""} added to the queue.`,
      });
    }
  }, [toast]);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      setProcessedBlobs((cur) => {
        const next = new Map(cur);
        next.delete(id);
        return next;
      });
      if (selectedImageIndex >= filtered.length) {
        setSelectedImageIndex(Math.max(0, filtered.length - 1));
      }
      return filtered;
    });
  }, [selectedImageIndex]);

  const clearAll = useCallback(() => {
    setImages([]);
    setProcessedBlobs(new Map());
    setSelectedImageIndex(0);
    setProcessedCount(0);
  }, []);

  const writeExifOnly = useCallback(async () => {
    if (images.length === 0) return;
    setIsWritingExif(true);

    const startTime = performance.now();
    const mode = images.length > 1 ? "batch" : "single";
    trackProcessingStarted({ mode, count: images.length });

    const geotag: GeotagData = {
      latitude,
      longitude,
      altitude,
      keywords,
      description,
    };

    const newMap = new Map(processedBlobs);
    let successCount = 0;

    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      const ext = item.name.split(".").pop()?.toLowerCase() || "unknown";
      setImages((prev) =>
        prev.map((img, idx) => (idx === i ? { ...img, status: "processing" } : img))
      );

      try {
        const { blob, verification } = await addGeotagAndVerify(item.file, geotag);
        newMap.set(item.id, { blob, verification });

        setImages((prev) =>
          prev.map((img, idx) => (idx === i ? { ...img, status: "success" } : img))
        );
        successCount++;
        if (verification?.coordinatesVerified) {
          trackVerificationPassed({ format: ext });
        } else if (verification) {
          trackVerificationFailed({ reason_category: "coordinate_mismatch" });
        }
      } catch (err: any) {
        console.error(`Error geotagging ${item.name}:`, err);
        trackWritingError({ format: ext, error_category: "exif_write_failed" });
        setImages((prev) =>
          prev.map((img, idx) => (idx === i ? { ...img, status: "error", error: err?.message || "Unable to add GPS metadata to this image." } : img))
        );
      }
    }

    setProcessedBlobs(newMap);
    setIsWritingExif(false);

    const durationMs = performance.now() - startTime;
    trackProcessingCompleted({
      mode,
      count: images.length,
      duration_ms: durationMs,
      success_count: successCount,
    });

    toast({
      title: successCount === images.length ? "GPS Metadata Applied" : "Some Photos Could Not Be Tagged",
      description: successCount === images.length
        ? `Embedded location in ${images.length} photo${images.length > 1 ? "s" : ""}. Ready to download.`
        : `${successCount} of ${images.length} photos were tagged. The queue shows the reason for each failed photo.`,
      variant: successCount === images.length ? "default" : "destructive",
    });
  }, [images, latitude, longitude, altitude, keywords, description, processedBlobs, toast]);

  const processAndDownloadAll = useCallback(async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProcessedCount(0);

    const startTime = performance.now();
    const mode = images.length > 1 ? "batch" : "single";
    trackProcessingStarted({ mode, count: images.length });

    const geotag: GeotagData = {
      latitude,
      longitude,
      altitude,
      keywords,
      description,
    };

    const filesToZip: Array<{ name: string; blob: Blob }> = [];
    const newMap = new Map(processedBlobs);
    let successCount = 0;

    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      const ext = item.name.split(".").pop()?.toLowerCase() || "unknown";
      setImages((prev) =>
        prev.map((img, idx) => (idx === i ? { ...img, status: "processing" } : img))
      );

      try {
        let blobToUse = newMap.get(item.id)?.blob;
        if (!blobToUse) {
          const result = await addGeotagAndVerify(item.file, geotag);
          blobToUse = result.blob;
          newMap.set(item.id, { blob: result.blob, verification: result.verification });
          if (result.verification?.coordinatesVerified) {
            trackVerificationPassed({ format: ext });
          } else if (result.verification) {
            trackVerificationFailed({ reason_category: "coordinate_mismatch" });
          }
        }

        filesToZip.push({ name: item.name, blob: blobToUse });
        setImages((prev) =>
          prev.map((img, idx) => (idx === i ? { ...img, status: "success" } : img))
        );
        successCount++;
      } catch (err: any) {
        console.error(`Error processing ${item.name}:`, err);
        trackWritingError({ format: ext, error_category: "exif_write_failed" });
        setImages((prev) =>
          prev.map((img, idx) => (idx === i ? { ...img, status: "error", error: err?.message || "Unable to add GPS metadata to this image." } : img))
        );
      }

      setProcessedCount(i + 1);
    }

    setProcessedBlobs(newMap);

    const durationMs = performance.now() - startTime;
    trackProcessingCompleted({
      mode,
      count: images.length,
      duration_ms: durationMs,
      success_count: successCount,
    });

    if (filesToZip.length === 1) {
      await downloadGeotaggedImage(filesToZip[0].blob, filesToZip[0].name);
      trackDownloadCompleted({
        format: filesToZip[0].name.split(".").pop()?.toLowerCase() || "unknown",
        count: 1,
      });
      toast({
        title: "Photo Downloaded",
        description: `Saved ${filesToZip[0].name} with verified GPS coordinates.`,
      });
    } else if (filesToZip.length > 1) {
      await downloadAsZip(filesToZip);
      trackBatchDownloadCompleted({ count: filesToZip.length });
      toast({
        title: "ZIP Downloaded",
        description: `Downloaded ${filesToZip.length} geotagged photos in a ZIP archive.`,
      });
    }

    setIsProcessing(false);
  }, [images, latitude, longitude, altitude, keywords, description, processedBlobs, toast]);

  const handleDownloadSingle = useCallback(async (image: ImageFile) => {
    const ext = image.name.split(".").pop()?.toLowerCase() || "unknown";
    try {
      let blob = processedBlobs.get(image.id)?.blob;
      if (!blob) {
        const geotag: GeotagData = {
          latitude,
          longitude,
          altitude,
          keywords,
          description,
        };
        const res = await addGeotagAndVerify(image.file, geotag);
        blob = res.blob;
        setProcessedBlobs((prev) => {
          const n = new Map(prev);
          n.set(image.id, { blob: res.blob, verification: res.verification });
          return n;
        });
        setImages((prev) =>
          prev.map((img) => (img.id === image.id ? { ...img, status: "success" } : img))
        );
        if (res.verification?.coordinatesVerified) {
          trackVerificationPassed({ format: ext });
        } else if (res.verification) {
          trackVerificationFailed({ reason_category: "coordinate_mismatch" });
        }
      }

      await downloadGeotaggedImage(blob, image.name);
      trackDownloadCompleted({ format: ext, count: 1 });
      toast({
        title: "Photo Downloaded",
        description: `Saved ${image.name} with verified GPS metadata.`,
      });
    } catch (err: any) {
      console.error(err);
      trackWritingError({ format: ext, error_category: "download_failed" });
      toast({
        title: "Download Failed",
        description: `Could not save ${image.name}: ${err.message || err}`,
        variant: "destructive",
      });
    }
  }, [latitude, longitude, altitude, keywords, description, processedBlobs, toast]);

  const currentImage = images[selectedImageIndex] || images[0];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <Header />

      <main id="main-content" tabIndex={-1} className="outline-none flex-1">
        {/* ─── HERO & CORE TOOL CONTAINER ─────────────────────────── */}
        <section className="relative overflow-hidden pt-8 pb-14 md:pt-12 md:pb-20 bg-gradient-to-b from-primary/[0.03] via-background to-background">
          <div className="absolute inset-0 topo-pattern opacity-40 pointer-events-none" aria-hidden="true" />
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            {/* Above-The-Fold Value Proposition Header */}
            <div className="text-center mb-8 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1 rounded-full border border-primary/25 bg-primary/10 text-primary text-xs font-semibold font-display shadow-sm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Free Forever · No Account Required · 100% Client-Side Privacy
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-[1.15] tracking-tight text-foreground">
                Free Geotagger — <span className="gradient-text">Add GPS Location to Photos Online</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
                Add, edit, or remove GPS coordinates in your photos directly in your browser. 100% private — your images never leave your device.
              </p>

              {/* Trust signals row */}
              <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  100% Browser-Based
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  No Sign-Up or Fees
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  Batch Photo Geotagging
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  Zero Quality Loss
                </span>
              </div>
            </div>

            {/* ─── TOOL WORKSPACE (DYNAMIC) ───────────────────────── */}
            <div className="w-full">
              {images.length === 0 ? (
                /* State 1: Dropzone Prominent View */
                <Dropzone
                  onFilesSelected={processFiles}
                  onError={(msg) =>
                    toast({
                      title: "File Unsupported",
                      description: msg,
                      variant: "destructive",
                    })
                  }
                />
              ) : (
                /* State 2: Active Geotagger Workspace */
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* Row 1: Preview / Queue & Map */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left Column: Active Image Preview & Queue */}
                    <div className="lg:col-span-6 space-y-4">
                      {/* Active Image Preview Card */}
                      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/70 bg-muted/30">
                          <div className="flex items-center gap-2 min-w-0">
                            <Camera className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                            <span className="text-xs font-semibold text-foreground truncate max-w-[200px]" title={currentImage?.name}>
                              {currentImage?.name || "Photo Preview"}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-border bg-background">
                              {currentImage ? `${(currentImage.size / 1024).toFixed(0)} KB` : ""}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {currentImage?.existingGps ? (
                              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px] font-medium px-2 py-0.5">
                                <MapPin className="h-3 w-3 mr-1" aria-hidden="true" />
                                GPS Embedded
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-border text-muted-foreground text-[10px] px-2 py-0.5">
                                No GPS
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Image Preview Canvas */}
                        <div
                          className="relative h-[280px] sm:h-[320px] flex items-center justify-center p-3 overflow-hidden bg-muted/20"
                          style={{
                            backgroundImage: "radial-gradient(circle, hsl(var(--border)/0.4) 1px, transparent 1px)",
                            backgroundSize: "16px 16px",
                          }}
                        >
                          {currentImage && (
                            <img
                              src={currentImage.preview}
                              alt={currentImage.name}
                              className="max-h-full max-w-full object-contain rounded-lg drop-shadow-md"
                              data-testid="img-preview-main"
                            />
                          )}

                          {currentImage?.status === "success" && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
                              <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                              EXIF Tagged
                            </div>
                          )}
                          {currentImage?.status === "processing" && (
                            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                              <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* File Queue List */}
                      <FileQueue
                        images={images}
                        selectedIndex={selectedImageIndex}
                        onSelectIndex={setSelectedImageIndex}
                        onRemoveImage={removeImage}
                        onClearAll={clearAll}
                        onAddMoreClick={() => addMoreInputRef.current?.click()}
                        onDownloadSingle={handleDownloadSingle}
                      />
                      <input
                        ref={addMoreInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.heic"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) processFiles(Array.from(e.target.files));
                          e.target.value = "";
                        }}
                        className="hidden"
                        tabIndex={-1}
                      />

                      {/* Batch Actions and Download Panel */}
                      <BatchActions
                        totalImages={images.length}
                        processedCount={processedCount}
                        isProcessing={isProcessing}
                        isWritingExif={isWritingExif}
                        hasTaggedImages={images.some((img) => img.status === "success")}
                        onWriteExif={writeExifOnly}
                        onDownloadAll={processAndDownloadAll}
                        onClearAll={clearAll}
                      />
                    </div>

                    {/* Right Column: Interactive Leaflet Map */}
                    <div className="lg:col-span-6 space-y-4">
                      <React.Suspense fallback={<MapSkeleton className="h-[300px] sm:h-[340px] md:h-[360px] w-full" />}>
                        <LazyLeafletMap
                          latitude={latitude}
                          longitude={longitude}
                          onCoordinatesChange={(lat, lng) => {
                            setLatitude(lat);
                            setLongitude(lng);
                            trackMapLocationSelected({ method: "map_click" });
                          }}
                          onLocationFound={(lat, lng) => {
                            setLatitude(lat);
                            setLongitude(lng);
                          }}
                        />
                      </React.Suspense>

                      {/* Coordinates & Metadata Controls */}
                      <CoordinatePanel
                        latitude={latitude}
                        longitude={longitude}
                        altitude={altitude}
                        keywords={keywords}
                        description={description}
                        existingPhotoGps={currentImage?.existingGps}
                        onCoordinatesChange={(lat, lng) => {
                          setLatitude(lat);
                          setLongitude(lng);
                        }}
                        onAltitudeChange={setAltitude}
                        onKeywordsChange={setKeywords}
                        onDescriptionChange={setDescription}
                        onLocationFound={(lat, lng) => {
                          setLatitude(lat);
                          setLongitude(lng);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Pre-allocated ad slot area (Phase 16 - Inactive by default) */}
        <div className="container mx-auto px-4 max-w-5xl">
          <AdSlot placement="homepage-below-tool" format="horizontal" />
        </div>

        {/* ─── SECTION 1: HOW IT WORKS (3 STEPS) ──────────────────── */}
        <section id="how-it-works" className="py-16 section-divider border-t border-border/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">How It Works</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-foreground">
                Geotag Any Photo in 3 Simple Steps
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Add precise geographic location metadata to your pictures in less than a minute — no software, no account, no cost.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  icon: Upload,
                  step: "1",
                  title: "Upload Your Photos",
                  desc: "Drag and drop or select JPG, PNG, WebP, or HEIC files. Everything stays local in your browser — zero server uploads.",
                },
                {
                  icon: MapPin,
                  step: "2",
                  title: "Set the GPS Location",
                  desc: "Click anywhere on the interactive map, type an address or city into the search bar, or enter exact latitude and longitude coordinates.",
                },
                {
                  icon: Download,
                  step: "3",
                  title: "Download Geotagged Photos",
                  desc: "Save individual photos with verified EXIF GPS metadata, or download your entire batch organized in a convenient ZIP archive.",
                },
              ].map(({ icon: Icon, step, title, desc }) => (
                <Card key={step} className="group relative h-full overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-card to-transparent p-7 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-lg">
                  <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100" />
                  <div className="w-14 h-14 rounded-2xl bg-primary/12 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-xs font-bold font-display">
                    {step}
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2 text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 2: WHAT GPS DATA IS ADDED ───────────────────── */}
        <section id="what-gps-data" className="py-16 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <MapPin className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">EXIF Metadata</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-foreground">
                What GPS Data Is Added to Your Photos?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Standard geographic metadata is embedded into the photo header according to the EXIF 2.32 standard, making your images recognizable across all operating systems, mapping platforms, and photo organizers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              {[
                { icon: MapPin, color: "text-primary", bg: "from-primary/10", border: "border-primary/20", title: "Latitude & Longitude", desc: "Rational degree, minute, second fractions paired with N/S and E/W hemisphere flags." },
                { icon: Mountain, color: "text-emerald-600 dark:text-emerald-400", bg: "from-emerald-500/10", border: "border-emerald-500/20", title: "Elevation / Altitude", desc: "Height in meters above sea level stored with standard sea-level reference flags." },
                { icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "from-amber-500/10", border: "border-amber-500/20", title: "UTC Timestamp", desc: "Precise date and time of the location fix stored in standard EXIF date/time format." },
                { icon: Tag, color: "text-violet-600 dark:text-violet-400", bg: "from-violet-500/10", border: "border-violet-500/20", title: "Keywords & Notes", desc: "Optional descriptions and organizational tags embedded directly into EXIF headers." },
              ].map(({ icon: Icon, color, bg, border, title, desc }) => (
                <Card key={title} className={`group relative h-full overflow-hidden rounded-2xl border ${border} bg-gradient-to-br ${bg} via-card to-transparent p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-lg`}>
                  <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100" />
                  <div className={`w-11 h-11 rounded-xl ${bg.replace("from-", "bg-")} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
                  </div>
                  <h3 className="font-display font-semibold text-sm mb-1 text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </Card>
              ))}
            </div>

            <div className="max-w-2xl mx-auto text-center rounded-xl bg-card border border-border p-4 text-xs sm:text-sm text-muted-foreground">
              <strong className="text-foreground">Zero Image Quality Loss:</strong> FreeGeoTagger updates only binary metadata header chunks. Pixel bitstreams are never decoded and recompressed, guaranteeing 100% lossless preservation of your original photo quality.
            </div>
          </div>
        </section>

        {/* ─── SECTION 3: SUPPORTED FILE FORMATS ──────────────────── */}
        <section id="supported-formats" className="py-16 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <FileCheck className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">Format Matrix</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-foreground">
                Supported File Formats &amp; Technical Behavior
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                FreeGeoTagger handles the standard image formats used by smartphones, cameras, and creative tools with format-specific binary precision.
              </p>
            </div>

            <div className="max-w-4xl mx-auto overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3.5">Format</th>
                    <th className="px-4 py-3.5">Extension</th>
                    <th className="px-4 py-3.5">Metadata Method</th>
                    <th className="px-4 py-3.5">Pixel Preservation</th>
                    <th className="px-4 py-3.5">Compatibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground">JPEG / JPG</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">.jpg, .jpeg</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">APP1 Exif Segment</td>
                    <td className="px-4 py-3.5"><Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-[11px]">100% Lossless</Badge></td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">Universal (all OS &amp; apps)</td>
                  </tr>
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground">PNG</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">.png</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">Binary eXIf Chunk + CRC32</td>
                    <td className="px-4 py-3.5"><Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-[11px]">100% Lossless</Badge></td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">Modern viewers, GIS, web</td>
                  </tr>
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground">WebP</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">.webp</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">RIFF Container + EXIF Chunk</td>
                    <td className="px-4 py-3.5"><Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-[11px]">100% Lossless</Badge></td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">Browsers, Android, modern OS</td>
                  </tr>
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground">HEIC / HEIF</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">.heic</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">Client-side JPEG Transcode</td>
                    <td className="px-4 py-3.5"><Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25 text-[11px]">High Quality (0.95)</Badge></td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">Universal JPEG export</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── SECTION 4: BATCH GEOTAGGING ────────────────────────── */}
        <section id="batch-geotagging" className="py-16 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-3 text-primary">
                  <Layers className="h-5 w-5" aria-hidden="true" />
                  <span className="text-sm font-semibold font-display uppercase tracking-wider">Batch Workflow</span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 leading-tight text-foreground">
                  Batch Photo Geotagging Made Fast &amp; Effortless
                </h2>
                <div className="space-y-3.5 text-muted-foreground text-sm leading-relaxed">
                  <p>
                    When returning from a shoot, job site inspection, or vacation, geotagging photos one at a time is slow. FreeGeoTagger includes a fast batch engine allowing you to tag hundreds of images in seconds.
                  </p>
                  <p>
                    Drop multiple images into the uploader, set your desired location once on the map or via search, and click <strong className="text-foreground">Apply to All Photos</strong>. You can then fine-tune individual pins or download the whole collection as a clean ZIP file.
                  </p>
                  <div className="pt-2">
                    <Link href="/blog/how-to-bulk-geotag-photos">
                      <a className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium text-sm">
                        Read our complete guide to bulk photo geotagging <ArrowRight className="h-4 w-4" />
                      </a>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { title: "Multi-File Queue", desc: "Upload dozens of photos simultaneously with live thumbnail previews." },
                  { title: "1-Click Batch Apply", desc: "Set location once and apply across all queued images immediately." },
                  { title: "Single Adjustments", desc: "Select specific thumbnails to reposition individual coordinates." },
                  { title: "Consolidated ZIP", desc: "Export all processed photos organized in a single archive." },
                ].map(({ title, desc }) => (
                  <Card key={title} className="group h-full rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.035] p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-lg">
                    <h3 className="font-display font-semibold text-sm mb-1 text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 5: WHY CHOOSE FREEGEOTAGGER (COMPARISON) ───── */}
        <section id="why-choose" className="py-16 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <Check className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">Comparison</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-foreground">
                FreeGeoTagger vs. Other Geotagging Tools
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Most online geotagging utilities charge subscriptions, require accounts, or upload private photos to remote servers. FreeGeoTagger does none of that.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Suspense fallback={<div className="h-64 rounded-xl border bg-muted/20 animate-pulse" />}>
                <ToolComparisonTable />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Pre-allocated ad slot area (Phase 16 - Inactive by default) */}
        <div className="container mx-auto px-4 max-w-5xl">
          <AdSlot placement="homepage-mid-content" format="horizontal" />
        </div>

        {/* ─── SECTION 6: GEOTAGGING VS GPS FINDER ────────────────── */}
        <section id="geotagging-vs-gps-finder" className="py-16 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <Compass className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">Tool Guidance</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-foreground">
                Photo Geotagging vs. GPS Location Detection
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Do you need to add location data to a photo, or check where a photo was already taken? Choose the right tool for your task.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-transparent p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100" />
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-4 text-primary font-bold">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2 text-foreground">Photo Geotagger (This Tool)</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Use this tool when your photo lacks location coordinates, or has incorrect coordinates. You choose where the photo belongs, and FreeGeoTagger writes new EXIF GPS tags directly into the image file.
                  </p>
                </div>
                <div className="text-xs font-semibold text-primary">
                  Active Tool · Add &amp; Edit Coordinates
                </div>
              </Card>

              <Card className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.035] p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100" />
                <div>
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4 text-foreground font-bold">
                    <Search className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2 text-foreground">GPS Photo Finder</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Use GPS Finder when an image already has embedded location data and you simply want to view where it was captured on a map, copy coordinates, or open Google Maps.
                  </p>
                </div>
                <div>
                  <Link href="/gps-finder">
                    <a className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium text-sm">
                      Open GPS Photo Finder <ArrowRight className="h-4 w-4" />
                    </a>
                  </Link>
                </div>
              </Card>

              <Card className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.035] p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100" />
                <div>
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4 text-foreground font-bold">
                    <Camera className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2 text-foreground">EXIF Metadata Viewer</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Use EXIF Viewer to inspect complete technical photography data: camera settings, ISO, aperture, shutter speed, lens models, dimensions, timestamps, and raw EXIF tags.
                  </p>
                </div>
                <div>
                  <Link href="/exif-viewer">
                    <a className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium text-sm">
                      Open EXIF Viewer <ArrowRight className="h-4 w-4" />
                    </a>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ─── SECTION 7: PRIVACY & LOCAL PROCESSING ──────────────── */}
        <section id="privacy" className="py-16 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 mb-3 text-primary">
                  <Lock className="h-5 w-5" aria-hidden="true" />
                  <span className="text-sm font-semibold font-display uppercase tracking-wider">Privacy Architecture</span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-foreground">
                  100% Client-Side Privacy by Design
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                  Your photos are sensitive. FreeGeoTagger was built from the ground up so your images never leave your device.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: Upload, label: "No image uploads", sub: "Files stay on your device" },
                  { icon: HardDrive, label: "No cloud storage", sub: "Zero server interaction" },
                  { icon: Eye, label: "No tracking", sub: "No analytics on images" },
                  { icon: UserX, label: "No account needed", sub: "Use instantly, anonymously" },
                ].map(({ icon: Icon, label, sub }) => (
                  <Card key={label} className="group relative h-full overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-card to-transparent p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-lg">
                    <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100" />
                    <div className="w-11 h-11 rounded-xl bg-primary/12 flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <p className="font-display font-semibold text-sm mb-1 text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </Card>
                ))}
              </div>

              <p className="text-muted-foreground text-center text-sm leading-relaxed">
                All metadata reading and binary injection executes using standard Web APIs inside your browser tab. Once the page is loaded, the geotagging engine functions offline with zero network transmission.
              </p>
            </div>
          </div>
        </section>

        {/* ─── SECTION 8: COMMON USE CASES ────────────────────────── */}
        <section id="use-cases" className="py-16 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <Users className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">Use Cases</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-foreground">
                Who Uses FreeGeoTagger?
              </h2>
              <p className="text-center text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Any time accurate photo location metadata matters — FreeGeoTagger delivers it privately and instantly.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { icon: HomeIcon, title: "Real Estate Agents", desc: "Tag property listing photos with precise coordinates for MLS feeds and local buyer discovery.", link: "/blog/how-to-geotag-photos-for-real-estate" },
                { icon: Building, title: "Small Businesses & Local SEO", desc: "Embed accurate business coordinates into photos before uploading to Google Business Profile.", link: "/blog/how-to-geotag-photos-for-google-business-profile" },
                { icon: Camera, title: "Photographers", desc: "Organize shoots by location, maintain Lightroom archives, and geotag DSLR/mirrorless shots.", link: "/blog/how-to-bulk-geotag-photos" },
                { icon: Globe, title: "Surveyors & Field Teams", desc: "Document infrastructure inspections, construction progress, and environmental survey points.", link: null },
                { icon: Newspaper, title: "Journalists & Researchers", desc: "Provide transparent geographic context for field photography and investigative reporting.", link: null },
                { icon: Smartphone, title: "Smartphone Users", desc: "Fix iPhone or Android photos that lost coordinates due to airplane mode or messaging apps.", link: "/blog/how-to-add-gps-to-iphone-photos" },
              ].map(({ icon: Icon, title, desc, link }) => (
                <Card key={title} className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.035] p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-lg">
                  <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100" />
                  <div>
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/15">
                        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      </div>
                      <h3 className="font-display font-semibold text-sm text-foreground">{title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{desc}</p>
                  </div>
                  {link && (
                    <Link href={link}>
                      <a className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1">
                        Read guide <ArrowRight className="h-3 w-3" />
                      </a>
                    </Link>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 9: RELATED TOOLS & GUIDES ───────────────────── */}
        <section id="guides" className="py-16 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">Resources</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-foreground">
                Helpful Geotagging Guides &amp; Tools
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                Browse our complete collection of photo geotagging tutorials and free utilities.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { title: "GPS Photo Finder", href: "/gps-finder", desc: "Extract and view existing GPS coordinates on an interactive map.", icon: Search, label: "Free tool" },
                { title: "EXIF Metadata Viewer", href: "/exif-viewer", desc: "Inspect camera settings, ISO, exposure, lens details, and raw EXIF tags.", icon: FileCheck, label: "Free tool" },
                { title: "Bulk Geotagging Guide", href: "/blog/how-to-bulk-geotag-photos", desc: "Learn batch workflows for tagging hundreds of photos simultaneously.", icon: Layers, label: "Guide" },
                { title: "Add GPS to iPhone Photos", href: "/blog/how-to-add-gps-to-iphone-photos", desc: "Step-by-step tutorial for iOS camera photos and AirDrop files.", icon: Smartphone, label: "Guide" },
                { title: "Add GPS to Android Photos", href: "/blog/how-to-geotag-photos-android", desc: "Easy guide for geotagging photos on Android smartphones.", icon: Smartphone, label: "Guide" },
                { title: "What Is EXIF GPS Metadata?", href: "/blog/what-is-exif-gps-metadata", desc: "Deep dive into EXIF tags, coordinate formats, and standards.", icon: Tag, label: "Explainer" },
                { title: "Remove GPS from Photos", href: "/blog/how-to-remove-gps-data-from-photos", desc: "Protect privacy by stripping location data before public sharing.", icon: UserX, label: "Privacy" },
                { title: "Fix Wrong GPS Location", href: "/blog/how-to-fix-wrong-gps-location-on-photos", desc: "Resolve drifting coordinates, clock drift, and misplaced pins.", icon: Compass, label: "Troubleshooting" },
                { title: "Best Free Geotagging Tools", href: "/blog/best-free-photo-geotagging-tools", desc: "Comparison of free online, desktop, and CLI geotaggers in 2026.", icon: BookOpen, label: "Comparison" },
              ].map(({ title, href, desc, icon: Icon, label }) => (
                <Link key={title} href={href}>
                  <a className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    <Card className="relative h-full min-h-[184px] overflow-hidden rounded-2xl border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.035] p-5 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/45 group-hover:shadow-lg">
                      <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100" />
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {label}
                        </span>
                      </div>
                      <h3 className="mt-4 font-display text-base font-bold text-foreground transition-colors group-hover:text-primary">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        Explore <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Pre-allocated ad slot area (Phase 16 - Inactive by default) */}
        <div className="container mx-auto px-4 max-w-4xl">
          <AdSlot placement="homepage-bottom" format="horizontal" />
        </div>

        {/* ─── SECTION 10: FAQ (12 QUESTIONS) ─────────────────────── */}
        <section id="faq" className="py-16 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <HelpCircle className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">FAQ</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                Everything you need to know about geotagging photos with FreeGeoTagger
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-2.5">
              {HOME_FAQS.map((faq, i) => (
                <Card key={i} className="overflow-hidden border border-border/70 rounded-xl shadow-sm">
                  <button
                    type="button"
                    className="w-full px-5 py-4 text-left flex items-start justify-between gap-4 hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    data-testid={`button-faq-${i}`}
                    aria-expanded={openFaq === i}
                  >
                    <span className="font-display font-semibold text-sm leading-snug text-foreground" data-testid={`text-faq-question-${i}`}>
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform duration-200 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-muted-foreground text-sm leading-relaxed border-t border-border/40 pt-3" data-testid={`text-faq-answer-${i}`}>
                      {faq.a}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
