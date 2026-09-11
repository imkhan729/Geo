import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Download,
  Loader2,
  Upload,
  X,
  Search,
  Locate,
  CheckCircle,
  AlertCircle,
  Camera,
  Shield,
  Zap,
  ChevronDown,
  Sparkles,
  PenLine,
  Trash2,
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
  Plane,
  Newspaper,
  Building,
  Home as HomeIcon,
  Tag,
  FileText,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToolComparisonTable } from "@/components/tool-comparison-table";
import { Dropzone } from "@/components/tool/dropzone";
import { FileQueue } from "@/components/tool/file-queue";
import { CoordinatePanel } from "@/components/tool/coordinate-panel";
import { LeafletMap } from "@/components/tool/leaflet-map";
import { BatchActions } from "@/components/tool/batch-actions";

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
  formatFileSize,
} from "@/lib/geotag-utils";
import { useToast } from "@/hooks/use-toast";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";

export default function Home() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [altitude, setAltitude] = useState<number | undefined>(undefined);
  const [keywords, setKeywords] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWritingExif, setIsWritingExif] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [processedBlobs, setProcessedBlobs] = useState<Map<string, Blob>>(new Map());
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.home);

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
      mainEntity: [
        {
          "@type": "Question",
          name: "Is FreeGeoTagger really free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. FreeGeoTagger is completely free with no hidden fees, subscriptions, watermarks, or file limits. There are no account requirements.",
          },
        },
        {
          "@type": "Question",
          name: "Are my photos uploaded to any server?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. All image processing happens locally in your browser using JavaScript. Your photos never leave your device — not even temporarily.",
          },
        },
        {
          "@type": "Question",
          name: "Can I geotag multiple photos at once?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Batch geotagging is fully supported. Upload multiple photos and apply the same GPS location to all of them at once, then download as individual files or a ZIP archive.",
          },
        },
        {
          "@type": "Question",
          name: "What image file formats does FreeGeoTagger support?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "FreeGeoTagger supports JPG, PNG, WebP, and HEIC files. HEIC files (iPhone photos) are automatically converted to high-quality JPEG for full EXIF GPS compatibility.",
          },
        },
        {
          "@type": "Question",
          name: "Will geotagging affect my image quality?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. FreeGeoTagger only modifies the EXIF metadata of your images. The actual photo pixel data remains completely unchanged — there is zero quality loss.",
          },
        },
        {
          "@type": "Question",
          name: "Does FreeGeoTagger work on mobile devices?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. FreeGeoTagger works on modern mobile browsers including Chrome for Android, Safari for iOS, and Firefox Mobile.",
          },
        },
        {
          "@type": "Question",
          name: "How do I add GPS coordinates to a photo taken without location data?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Upload your photo to FreeGeoTagger, then use the interactive map to click on the correct location, search for an address, or enter GPS coordinates manually. Then download the geotagged version with embedded EXIF GPS data.",
          },
        },
        {
          "@type": "Question",
          name: "What is EXIF GPS metadata?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "EXIF (Exchangeable Image File Format) GPS metadata is location information embedded inside a photo file. It stores latitude, longitude, altitude, and optionally compass direction — allowing apps like Google Photos and Apple Photos to show where a photo was taken on a map.",
          },
        },
        {
          "@type": "Question",
          name: "Can I use FreeGeoTagger to remove GPS location from photos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "FreeGeoTagger is designed to add GPS data to photos. To overwrite existing GPS coordinates, simply apply a new location to the photo.",
          },
        },
        {
          "@type": "Question",
          name: "How does FreeGeoTagger process images without uploading them?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "FreeGeoTagger uses the browser's built-in File API and JavaScript to read your image files directly on your device. GPS coordinates are written into the EXIF metadata using client-side code, and the processed file is generated as a download link in your browser — all without any server communication.",
          },
        },
      ],
    });
  }, []);

  const processFiles = useCallback(async (incomingFiles: File[]) => {
    const newItems: ImageFile[] = [];

    for (const file of incomingFiles) {
      try {
        let previewFile = file;
        if (file.name.toLowerCase().endsWith(".heic")) {
          const jpegBlob = await convertHeicToJpeg(file);
          previewFile = new File([jpegBlob], file.name, { type: "image/jpeg" });
        }

        const dataUrl = await readFileAsDataUrl(previewFile);
        const existingGps = await extractExistingGps(dataUrl);

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
      }
    }

    if (newItems.length > 0) {
      setImages((prev) => {
        const nextList = [...prev, ...newItems];
        // If first upload and image has existing GPS, initialize map to it
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
      if (filtered.length === 0) {
        setSelectedImageIndex(0);
      } else {
        setSelectedImageIndex((cur) => (cur >= filtered.length ? filtered.length - 1 : cur));
      }
      return filtered;
    });
  }, []);

  const clearAll = useCallback(() => {
    setImages([]);
    setKeywords("");
    setDescription("");
    setSelectedImageIndex(0);
    setProcessedBlobs(new Map());
    setProcessedCount(0);
  }, []);

  const writeExifOnly = useCallback(async () => {
    if (images.length === 0) return;
    setIsWritingExif(true);
    setProcessedCount(0);

    const geotag: GeotagData = {
      latitude,
      longitude,
      altitude,
      keywords: keywords.trim() || undefined,
      description: description.trim() || undefined,
    };

    const updated = [...images];
    const newBlobs = new Map(processedBlobs);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < updated.length; i++) {
      const img = updated[i];
      updated[i] = { ...img, status: "processing" };
      setImages([...updated]);

      try {
        const { blob, verification } = await addGeotagAndVerify(img.file, geotag);

        if (verification.isValid && verification.coordinatesVerified) {
          newBlobs.set(img.id, blob);
          updated[i] = {
            ...img,
            status: "success",
            verification,
          };
          successCount++;
        } else {
          updated[i] = {
            ...img,
            status: "error",
            error: verification.error || "EXIF verification failed: coordinates mismatch",
            verification,
          };
          errorCount++;
        }
      } catch (err: any) {
        updated[i] = {
          ...img,
          status: "error",
          error: err.message || "Failed to embed GPS",
        };
        errorCount++;
        console.error(`Failed to process ${img.name}:`, err);
      }

      setImages([...updated]);
      setProcessedCount(i + 1);
    }

    setProcessedBlobs(newBlobs);
    setIsWritingExif(false);

    if (errorCount === 0) {
      toast({
        title: "EXIF GPS Embedded & Verified!",
        description: `${successCount} photo${successCount !== 1 ? "s" : ""} tagged and binary-verified successfully.`,
      });
    } else if (successCount > 0) {
      toast({
        title: "Partially Complete",
        description: `${successCount} verified, ${errorCount} failed verification.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Verification Failed",
        description: "Could not embed or verify GPS metadata in output files.",
        variant: "destructive",
      });
    }
  }, [images, latitude, longitude, altitude, keywords, description, processedBlobs, toast]);

  const processAndDownloadAll = useCallback(async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProcessedCount(0);

    const geotag: GeotagData = {
      latitude,
      longitude,
      altitude,
      keywords: keywords.trim() || undefined,
      description: description.trim() || undefined,
    };

    const updated = [...images];
    const successfulFiles: { name: string; blob: Blob }[] = [];
    const newBlobs = new Map(processedBlobs);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < updated.length; i++) {
      const img = updated[i];
      updated[i] = { ...img, status: "processing" };
      setImages([...updated]);

      try {
        let blob = newBlobs.get(img.id);
        if (!blob) {
          const res = await addGeotagAndVerify(img.file, geotag);
          if (!res.verification.isValid || !res.verification.coordinatesVerified) {
            throw new Error(res.verification.error || "EXIF verification failed");
          }
          blob = res.blob;
          newBlobs.set(img.id, blob);
          updated[i] = { ...img, status: "success", verification: res.verification };
        } else {
          updated[i] = { ...img, status: "success" };
        }

        successfulFiles.push({ name: img.name, blob });
        successCount++;
      } catch (err: any) {
        updated[i] = { ...img, status: "error", error: err.message || "Download failed" };
        errorCount++;
        console.error(`Failed to save ${img.name}:`, err);
      }

      setImages([...updated]);
      setProcessedCount(i + 1);
    }

    setProcessedBlobs(newBlobs);

    if (successfulFiles.length === 1) {
      await downloadGeotaggedImage(successfulFiles[0].blob, successfulFiles[0].name);
    } else if (successfulFiles.length > 1) {
      await downloadAsZip(successfulFiles);
    }

    setIsProcessing(false);

    if (errorCount === 0) {
      toast({
        title: "Download Complete!",
        description: `${successCount} photo${successCount !== 1 ? "s" : ""} saved with verified GPS metadata.`,
      });
    } else if (successCount > 0) {
      toast({
        title: "Download Partially Complete",
        description: `${successCount} downloaded, ${errorCount} failed.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Download Failed",
        description: "Could not package images. Please try again.",
        variant: "destructive",
      });
    }
  }, [images, latitude, longitude, altitude, keywords, description, processedBlobs, toast]);

  const handleDownloadSingle = useCallback(async (image: ImageFile) => {
    try {
      const geotag: GeotagData = {
        latitude,
        longitude,
        altitude,
        keywords: keywords.trim() || undefined,
        description: description.trim() || undefined,
      };

      let blob = processedBlobs.get(image.id);
      if (!blob) {
        const res = await addGeotagAndVerify(image.file, geotag);
        if (!res.verification.isValid || !res.verification.coordinatesVerified) {
          throw new Error(res.verification.error || "EXIF verification failed");
        }
        blob = res.blob;
      }

      await downloadGeotaggedImage(blob, image.name);
      toast({
        title: "Photo Downloaded",
        description: `Saved ${image.name} with verified GPS metadata.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Download Failed",
        description: `Could not save ${image.name}: ${err.message || err}`,
        variant: "destructive",
      });
    }
  }, [latitude, longitude, altitude, keywords, description, processedBlobs, toast]);

  const currentImage = images[selectedImageIndex] || images[0];

  const faqs = [
    {
      q: "Is FreeGeoTagger really free?",
      a: "Yes. FreeGeoTagger is completely free with no hidden fees, subscriptions, watermarks, or file limits. No account required.",
    },
    {
      q: "Are my photos uploaded to any server?",
      a: "No. All image processing happens entirely in your browser using JavaScript. Your photos never leave your device — not even temporarily.",
    },
    {
      q: "Can I geotag multiple photos at once?",
      a: "Yes. Batch geotagging is fully supported — upload multiple photos and apply the same GPS location to all at once, then download individually or as a ZIP archive.",
    },
    {
      q: "What image file formats are supported?",
      a: "JPG, PNG, WebP, and HEIC are all supported. HEIC files (iPhone photos) are automatically converted to high-quality JPEG for full EXIF GPS compatibility. JPG, PNG, and WebP retain their original format.",
    },
    {
      q: "Will geotagging affect my image quality?",
      a: "No. FreeGeoTagger only modifies the EXIF metadata — the actual pixel data remains completely untouched. There is zero quality loss.",
    },
    {
      q: "Does FreeGeoTagger work on mobile devices?",
      a: "Yes. FreeGeoTagger works on modern mobile browsers including Chrome for Android, Safari for iOS, and Firefox Mobile.",
    },
    {
      q: "How do I add GPS coordinates to a photo taken without location data?",
      a: "Upload your photo, then use the interactive map to click on the correct location, search for an address or city, or enter GPS coordinates manually. Click Download to save the geotagged version with embedded EXIF GPS data.",
    },
    {
      q: "What is EXIF GPS metadata?",
      a: "EXIF GPS metadata is location information embedded inside a photo file — including latitude, longitude, and optionally altitude and compass direction. Apps like Google Photos, Apple Photos, and Adobe Lightroom use this data to show where a photo was taken on a map.",
    },
    {
      q: "Which platforms recognize geotagged photos?",
      a: "GPS-tagged photos are recognized by Google Photos, Apple Photos, Adobe Lightroom, Windows File Explorer, macOS Preview, most GIS software, and any platform that reads standard EXIF metadata.",
    },
  ];

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
                              {currentImage ? formatFileSize(currentImage.size) : ""}
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
                    </div>

                    {/* Right Column: Interactive Leaflet Map */}
                    <div className="lg:col-span-6 space-y-4">
                      <LeafletMap
                        latitude={latitude}
                        longitude={longitude}
                        onCoordinatesChange={(lat, lng) => {
                          setLatitude(lat);
                          setLongitude(lng);
                        }}
                      />

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

                  {/* Row 2: Batch Actions and Download Panel */}
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
              )}
            </div>
          </div>
        </section>

        {/* ─── WHAT IS FREEGEOTAGGER ───────────────────────────────── */}
        <section id="what-is-geotagger" className="py-16 section-divider border-t border-border/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-4 text-primary">
                  <Globe className="h-5 w-5" aria-hidden="true" />
                  <span className="text-sm font-semibold font-display uppercase tracking-wider">About the Tool</span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-5 leading-tight text-foreground">
                  What Is FreeGeoTagger?
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    FreeGeoTagger is a free, privacy-first tool that lets you <strong className="text-foreground">add GPS coordinates to photos</strong> directly in your browser — no software to install, no account to create.
                  </p>
                  <p>
                    Upload one photo or a whole batch, pin the location on an interactive map or search any address worldwide, then download your images with precise GPS metadata embedded in the EXIF data.
                  </p>
                  <p>
                    Compatible with <strong className="text-foreground">Google Photos, Apple Photos, Adobe Lightroom, Windows Explorer</strong>, and any platform that reads standard EXIF GPS metadata.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Shield, color: "text-primary", bg: "bg-primary/10", title: "100% Private", desc: "No uploads. Photos never leave your device." },
                  { icon: Zap, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", title: "Instant Processing", desc: "No server round-trips — results in seconds." },
                  { icon: Globe, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10", title: "Universal Format", desc: "Standard EXIF GPS recognized everywhere." },
                  { icon: Camera, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10", title: "All Major Formats", desc: "JPG, PNG, WebP & HEIC supported." },
                ].map(({ icon: Icon, color, bg, title, desc }) => (
                  <Card key={title} className="p-5 h-full border border-border bg-card shadow-sm rounded-xl">
                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                      <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
                    </div>
                    <h3 className="font-display font-semibold text-sm mb-1 text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── WHAT IS GEOTAGGING ─────────────────────────────── */}
        <section id="what-is-geotagging" className="py-16 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <MapPin className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">Education</span>
              </div>
              <h2 className="font-display text-3xl font-bold mb-3 text-foreground">What Is Image Geotagging?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Geotagging embeds precise GPS location data into a photo's EXIF metadata — making images searchable, mappable, and location-aware.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              {[
                { icon: MapPin, color: "text-primary", bg: "from-primary/10", border: "border-primary/20", title: "Latitude & Longitude", desc: "Precise geographic coordinates" },
                { icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "from-amber-500/10", border: "border-amber-500/20", title: "Timestamp", desc: "Date and time of capture" },
                { icon: Mountain, color: "text-emerald-600 dark:text-emerald-400", bg: "from-emerald-500/10", border: "border-emerald-500/20", title: "Altitude", desc: "Elevation above sea level" },
                { icon: Compass, color: "text-violet-600 dark:text-violet-400", bg: "from-violet-500/10", border: "border-violet-500/20", title: "Direction", desc: "Camera compass heading" },
              ].map(({ icon: Icon, color, bg, border, title, desc }) => (
                <Card key={title} className={`text-center p-5 h-full bg-gradient-to-br ${bg} to-transparent border ${border} rounded-xl shadow-sm`}>
                  <div className={`w-11 h-11 rounded-xl ${bg.replace("from-", "bg-")} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
                  </div>
                  <h3 className="font-display font-semibold text-sm mb-1 text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </Card>
              ))}
            </div>

            <p className="text-muted-foreground text-center text-sm max-w-2xl mx-auto">
              Geotagged images display on maps in Google Photos &amp; Apple Photos, integrate with GIS software, and satisfy location verification requirements for journalism, insurance, and real estate.
            </p>
          </div>
        </section>

        {/* ─── PRIVACY ────────────────────────────────────────── */}
        <section id="privacy" className="py-16 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 mb-3 text-primary">
                  <Lock className="h-5 w-5" aria-hidden="true" />
                  <span className="text-sm font-semibold font-display uppercase tracking-wider">Privacy</span>
                </div>
                <h2 className="font-display text-3xl font-bold mb-3 text-foreground">Privacy-First by Design</h2>
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
                  <Card key={label} className="p-5 text-center h-full bg-gradient-to-br from-primary/8 to-transparent border border-primary/15 rounded-xl shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-primary/12 flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <p className="font-display font-semibold text-sm mb-1 text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </Card>
                ))}
              </div>

              <p className="text-muted-foreground text-center text-sm">
                All processing happens using JavaScript inside your browser tab. When you close the page, nothing is retained.
              </p>
            </div>
          </div>
        </section>

        {/* ─── FEATURES ───────────────────────────────────────── */}
        <section id="features" className="py-16 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <Zap className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">Features</span>
              </div>
              <h2 className="font-display text-3xl font-bold mb-3 text-foreground">Why Choose FreeGeoTagger?</h2>
              <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">Everything you need to add GPS coordinates to photos — completely free, forever</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
              {[
                { icon: Shield, color: "text-primary", bg: "bg-primary/10 border-primary/20", title: "100% Private", desc: "Photos never leave your browser. Zero uploads, zero exposure." },
                { icon: Zap, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", title: "Lightning Fast", desc: "No server round-trips. Batch geotag dozens of photos in seconds." },
                { icon: Globe, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", title: "Universal GPS Format", desc: "Standard EXIF GPS data works in Google Photos, Lightroom, GIS tools." },
                { icon: Camera, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", title: "Multi-Format Support", desc: "JPG, PNG & WebP natively. HEIC auto-converts to JPEG." },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <Card key={title} className="text-center p-6 h-full border border-border bg-card rounded-xl shadow-sm">
                  <div className={`w-14 h-14 rounded-2xl ${bg.split(" ")[0]} flex items-center justify-center mx-auto mb-4 border ${bg.split(" ")[1]}`}>
                    <Icon className={`h-7 w-7 ${color}`} aria-hidden="true" />
                  </div>
                  <h3 className="font-display font-semibold mb-2 text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WHO SHOULD USE ─────────────────────────────────── */}
        <section id="who-should-use" className="py-16 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <Users className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">Use Cases</span>
              </div>
              <h2 className="font-display text-3xl font-bold mb-3 text-foreground">Who Uses FreeGeoTagger?</h2>
              <p className="text-center text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Any time accurate photo location data matters — FreeGeoTagger delivers it privately and instantly.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { icon: Camera, title: "Photographers", desc: "Organize location-based shoots and ensure portfolio images are georeferenced for clients and stock platforms." },
                { icon: HomeIcon, title: "Real Estate Agents", desc: "Tag property listing photos with precise GPS coordinates for MLS submissions and location verification." },
                { icon: Globe, title: "Surveyors & Researchers", desc: "Embed accurate field coordinates into documentation photos for scientific reporting and GIS workflows." },
                { icon: Plane, title: "Travelers & Bloggers", desc: "Preserve precise location memories in travel photos so they display correctly on map-based albums." },
                { icon: Newspaper, title: "Journalists", desc: "Verify and embed photo location metadata for editorial accountability and digital asset management." },
                { icon: Building, title: "Businesses", desc: "Manage location-aware media libraries with accurate GPS data for marketing, compliance, and logistics." },
              ].map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="p-5 flex flex-col gap-3 h-full border border-border bg-card rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/15">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="font-display font-semibold text-sm text-foreground">{title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ───────────────────────────────────── */}
        <section id="how-it-works" className="py-16 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">How It Works</span>
              </div>
              <h2 className="font-display text-3xl font-bold mb-3 text-foreground">Geotag Photos in 3 Steps</h2>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">From upload to download in under a minute — no account, no software, no cost</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Upload, step: "1", title: "Upload Your Photos", desc: "Drag and drop or click to select one or multiple JPG, PNG, WebP, or HEIC files. Files stay on your device." },
                { icon: MapPin, step: "2", title: "Set the GPS Location", desc: "Click the interactive map to pin a location, search for any address worldwide, or use your device's current GPS." },
                { icon: Download, step: "3", title: "Download Geotagged Photos", desc: "Get your photos with GPS coordinates embedded in the EXIF metadata. Download all at once as a ZIP file." },
              ].map(({ icon: Icon, step, title, desc }) => (
                <Card key={step} className="text-center p-7 h-full bg-gradient-to-br from-primary/8 to-transparent border border-primary/15 rounded-xl shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-primary/12 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-xs font-bold font-display">
                    {step}
                  </div>
                  <h3 className="font-display font-semibold mb-2 text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── VS OTHERS / COMPARISON TABLE ───────────────────── */}
        <section id="vs-others" className="py-16 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <Check className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">Comparison</span>
              </div>
              <h2 className="font-display text-3xl font-bold mb-3 text-foreground">FreeGeoTagger vs Other Geotagging Tools</h2>
              <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Most geotagging tools require accounts, paid plans, or upload your photos to the cloud. FreeGeoTagger does none of that.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <ToolComparisonTable />
            </div>
          </div>
        </section>

        {/* ─── FAQ ────────────────────────────────────────────── */}
        <section id="faq" className="py-16 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <HelpCircle className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">FAQ</span>
              </div>
              <h2 className="font-display text-3xl font-bold mb-3 text-foreground">Frequently Asked Questions</h2>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">Everything you need to know about geotagging photos with FreeGeoTagger</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-2.5">
              {faqs.map((faq, i) => (
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
