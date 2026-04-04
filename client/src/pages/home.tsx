import { useState, useCallback, useEffect, useRef } from "react";
import {
  Download, Loader2, Upload, X, Search, Locate,
  CheckCircle, AlertCircle, Camera, Shield, Zap,
  ChevronDown, Sparkles, PenLine, Trash2, HelpCircle,
  Globe, MapPin, Lock, Users, Check, Clock, Mountain,
  Compass, HardDrive, Eye, UserX, Plane, Newspaper,
  Building, Home as HomeIcon
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { EclipseButton } from "@/components/ui/eclipse-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import L from "leaflet";
import {
  ImageFile,
  GeotagData,
  addGeotagToImage,
  downloadGeotaggedImage,
  generateId,
  readFileAsDataUrl,
  extractExistingGps,
  convertHeicToJpeg,
  reverseGeocode,
  searchPlaces,
  PlaceSuggestion,
  validateCoordinates,
  downloadAsZip
} from "@/lib/geotag-utils";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { updatePageSEO, injectPageSchema, SEO_CONFIG } from "@/lib/seo";

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

/** 3-D tilt effect for .neon-card, .neon-card-amber, .neon-panel elements */
function useTiltCards(dep?: unknown) {
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.neon-card:not([data-no-tilt]), .neon-card-amber:not([data-no-tilt]), .neon-panel:not([data-no-tilt])');
    const handlers: Array<{ el: HTMLElement; move: (e: MouseEvent) => void; leave: () => void }> = [];

    cards.forEach((card) => {
      const move = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = (e.clientX - cx) / (r.width / 2);
        const dy = (e.clientY - cy) / (r.height / 2);
        card.style.setProperty('--tilt-x', `${(-dy * 8).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(dx * 8).toFixed(2)}deg`);
      };

      const leave = () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      };

      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', leave);
      handlers.push({ el: card, move, leave });
    });

    return () => {
      handlers.forEach(({ el, move, leave }) => {
        el.removeEventListener('mousemove', move);
        el.removeEventListener('mouseleave', leave);
      });
    };
  }, [dep]);
}

export default function Home() {
  const [mode, setMode] = useState<"landing" | "geotagger">("landing");

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.home);

    // Re-inject home-specific schemas (restores them if user navigated away and back)
    injectPageSchema('home-software', {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "FreeGeoTagger",
      "alternateName": "GeoTagger",
      "applicationCategory": "PhotographyApplication",
      "applicationSubCategory": "Image Editing",
      "operatingSystem": "Web Browser",
      "browserRequirements": "Chrome, Firefox, Safari, Edge",
      "description": "FreeGeoTagger is a free browser-based tool to add GPS location data to JPEG, PNG, WebP, and HEIC photos — without uploading files to any server. Supports batch geotagging, address search, and interactive map selection.",
      "featureList": [
        "Batch geotagging",
        "Privacy-first — no file uploads",
        "Interactive map pin selection",
        "Address and place name search",
        "GPS coordinate entry",
        "EXIF metadata editing",
        "JPG, PNG, WebP, HEIC support",
        "No account required",
        "Zero image quality loss"
      ],
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "1284",
        "bestRating": "5",
        "worstRating": "1"
      },
      "url": "https://freegeotagger.com",
      "screenshot": "https://freegeotagger.com/og-image.png"
    });

    injectPageSchema('home-webpage', {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Geotag Photos Free – Add GPS Coordinates to Any Photo Online | FreeGeoTagger",
      "url": "https://freegeotagger.com/",
      "description": "Add GPS location data to photos instantly — free, private and browser-based. No uploads, no accounts, no limits.",
      "inLanguage": "en-US",
      "isPartOf": { "@type": "WebSite", "name": "FreeGeoTagger", "url": "https://freegeotagger.com" },
      "dateModified": "2026-03-30",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://freegeotagger.com/" }
        ]
      }
    });

    injectPageSchema('home-howto', {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Geotag Photos Online for Free",
      "description": "Add GPS location data to your photos in three simple steps using FreeGeoTagger — no uploads, no accounts, no software to install.",
      "totalTime": "PT2M",
      "estimatedCost": { "@type": "MonetaryAmount", "currency": "USD", "value": "0" },
      "step": [
        {
          "@type": "HowToStep",
          "position": "1",
          "name": "Upload Your Photos",
          "text": "Drag and drop your JPG, PNG, WebP, or HEIC photos onto the GeoTagger tool, or click to browse and select one or multiple files. Files stay on your device — nothing is uploaded."
        },
        {
          "@type": "HowToStep",
          "position": "2",
          "name": "Set the GPS Location",
          "text": "Click on the interactive map to pin the exact location, search for an address or city name, or use your device's current GPS coordinates. Latitude and longitude are set instantly."
        },
        {
          "@type": "HowToStep",
          "position": "3",
          "name": "Download Your Geotagged Photos",
          "text": "Click Download to get your photos with GPS coordinates embedded in the EXIF metadata. No quality loss — only metadata is changed. Batch download multiple photos as a ZIP file."
        }
      ],
      "tool": { "@type": "HowToTool", "name": "FreeGeoTagger", "url": "https://freegeotagger.com" }
    });

    injectPageSchema('home-faq', {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is GeoTagger really free?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. GeoTagger is completely free with no hidden fees, subscriptions, watermarks, or file limits. There are no account requirements." }
        },
        {
          "@type": "Question",
          "name": "Are my photos uploaded to any server?",
          "acceptedAnswer": { "@type": "Answer", "text": "No. All image processing happens locally in your browser using JavaScript. Your photos never leave your device — not even temporarily." }
        },
        {
          "@type": "Question",
          "name": "Can I geotag multiple photos at once?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. Batch geotagging is fully supported. Upload multiple photos and apply the same GPS location to all of them at once, then download as individual files or a ZIP archive." }
        },
        {
          "@type": "Question",
          "name": "What image file formats does GeoTagger support?",
          "acceptedAnswer": { "@type": "Answer", "text": "GeoTagger supports JPG, PNG, WebP, and HEIC files. HEIC files (iPhone photos) are automatically converted to high-quality JPEG for full EXIF GPS compatibility." }
        },
        {
          "@type": "Question",
          "name": "Will geotagging affect my image quality?",
          "acceptedAnswer": { "@type": "Answer", "text": "No. GeoTagger only modifies the EXIF metadata of your images. The actual photo pixel data remains completely unchanged — there is zero quality loss." }
        },
        {
          "@type": "Question",
          "name": "Does GeoTagger work on mobile devices?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. GeoTagger works on modern mobile browsers including Chrome for Android, Safari for iOS, and Firefox Mobile." }
        },
        {
          "@type": "Question",
          "name": "How do I add GPS coordinates to a photo taken without location data?",
          "acceptedAnswer": { "@type": "Answer", "text": "Upload your photo to GeoTagger, then use the interactive map to click on the correct location, search for an address, or enter GPS coordinates manually. Then download the geotagged version with embedded EXIF GPS data." }
        },
        {
          "@type": "Question",
          "name": "What is EXIF GPS metadata?",
          "acceptedAnswer": { "@type": "Answer", "text": "EXIF (Exchangeable Image File Format) GPS metadata is location information embedded inside a photo file. It stores latitude, longitude, altitude, and optionally compass direction — allowing apps like Google Photos and Apple Photos to show where a photo was taken on a map." }
        },
        {
          "@type": "Question",
          "name": "Can I use GeoTagger to remove GPS location from photos?",
          "acceptedAnswer": { "@type": "Answer", "text": "GeoTagger is designed to add GPS data to photos, not remove it. To strip location data from images for privacy, you can use your operating system's built-in tools or a dedicated EXIF remover. However, GeoTagger can overwrite existing GPS coordinates by applying a new location." }
        },
        {
          "@type": "Question",
          "name": "How does GeoTagger process images without uploading them?",
          "acceptedAnswer": { "@type": "Answer", "text": "GeoTagger uses the browser's built-in File API and JavaScript to read your image files directly on your device. GPS coordinates are written into the EXIF metadata using client-side code, and the processed file is generated as a download link in your browser — all without any server communication." }
        }
      ]
    });
  }, []);

  const [images, setImages] = useState<ImageFile[]>([]);
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [keywords, setKeywords] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showExistingGeotags, setShowExistingGeotags] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWritingExif, setIsWritingExif] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ignoreSearchRef = useRef(false);
  const [processedBlobs, setProcessedBlobs] = useState<Map<string, Blob>>(new Map());
  const { toast } = useToast();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const handleSelectSuggestion = useCallback((suggestion: PlaceSuggestion) => {
    ignoreSearchRef.current = true;
    setSearchQuery(suggestion.displayName);
    setLatitude(suggestion.lat);
    setLongitude(suggestion.lng);
    setSuggestions([]);
    setShowSuggestions(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([suggestion.lat, suggestion.lng], 13);

      // Update marker position
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          layer.setLatLng([suggestion.lat, suggestion.lng]);
        }
      });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2 && !ignoreSearchRef.current) {
        const results = await searchPlaces(searchQuery);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      ignoreSearchRef.current = false;
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (mode !== "geotagger" || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current).setView([latitude, longitude], 4);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const customIcon = L.divIcon({
      html: `<div style="background:#2D6A4F;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(45,106,79,0.5);"></div>`,
      className: "custom-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });

    const marker = L.marker([latitude, longitude], { icon: customIcon, draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setLatitude(pos.lat);
      setLongitude(pos.lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng([e.latlng.lat, e.latlng.lng]);
      setLatitude(e.latlng.lat);
      setLongitude(e.latlng.lng);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mode]);

  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await reverseGeocode(searchQuery);
      if (result) {
        setLatitude(result.lat);
        setLongitude(result.lng);
        mapInstanceRef.current?.setView([result.lat, result.lng], 15);
        toast({ title: "Location found", description: result.displayName.substring(0, 60) });
      } else {
        toast({ title: "Not found", description: "Try a different search", variant: "destructive" });
      }
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, toast]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", variant: "destructive" });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 15);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [toast]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const isAccepted = ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
      if (!isAccepted || file.size > 20 * 1024 * 1024) continue;

      try {
        let previewFile = file;
        if (file.name.toLowerCase().endsWith(".heic")) {
          const jpegBlob = await convertHeicToJpeg(file);
          previewFile = new File([jpegBlob], file.name, { type: "image/jpeg" });
        }

        const dataUrl = await readFileAsDataUrl(previewFile);
        const existingGps = extractExistingGps(dataUrl);

        setImages(prev => [...prev, {
          id: generateId(),
          file,
          preview: dataUrl,
          name: file.name,
          type: file.type || "image/heic",
          size: file.size,
          existingGps,
          status: "pending"
        }]);
      } catch (err) {
        console.error(err);
      }
    }

    if (fileArray.length > 0) {
      setMode("geotagger");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== id);
      if (newImages.length === 0) setMode("landing");
      return newImages;
    });
  }, []);

  const writeExifOnly = useCallback(async () => {
    if (images.length === 0) return;
    setIsWritingExif(true);
    setProcessedCount(0);

    const geotag: GeotagData = { latitude, longitude, keywords: keywords || undefined, description: description || undefined };
    const updatedImages = [...images];
    const newBlobs = new Map<string, Blob>();
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < updatedImages.length; i++) {
      const img = updatedImages[i];
      updatedImages[i] = { ...img, status: "processing" };
      setImages([...updatedImages]);

      try {
        const blob = await addGeotagToImage(img.file, geotag);
        newBlobs.set(img.id, blob);
        updatedImages[i] = { ...img, status: "success" };
        successCount++;
      } catch (err) {
        updatedImages[i] = { ...img, status: "error" };
        errorCount++;
        console.error(`Failed to process ${img.name}:`, err);
      }
      setImages([...updatedImages]);
      setProcessedCount(i + 1);
    }

    setProcessedBlobs(newBlobs);
    setIsWritingExif(false);

    if (errorCount === 0) {
      toast({ title: "EXIF Tags Written!", description: `${successCount} image${successCount !== 1 ? "s" : ""} geotagged successfully. Click Download to save.` });
    } else if (successCount > 0) {
      toast({ title: "Partially Complete", description: `${successCount} succeeded, ${errorCount} failed.`, variant: "destructive" });
    } else {
      toast({ title: "Failed", description: "Could not process any images. Please try again.", variant: "destructive" });
    }
  }, [images, latitude, longitude, keywords, description, toast]);

  const processAndDownloadAll = useCallback(async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProcessedCount(0);

    const geotag: GeotagData = { latitude, longitude, keywords: keywords || undefined, description: description || undefined };
    const updatedImages = [...images];
    let successCount = 0;
    let errorCount = 0;
    const successfulFiles: { name: string; blob: Blob }[] = [];

    for (let i = 0; i < updatedImages.length; i++) {
      const img = updatedImages[i];
      updatedImages[i] = { ...img, status: "processing" };
      setImages([...updatedImages]);

      try {
        const existingBlob = processedBlobs.get(img.id);
        const blob = existingBlob || await addGeotagToImage(img.file, geotag);

        successfulFiles.push({ name: img.name, blob });
        updatedImages[i] = { ...img, status: "success" };
        successCount++;
      } catch (err) {
        updatedImages[i] = { ...img, status: "error" };
        errorCount++;
        console.error(`Failed to process ${img.name}:`, err);
      }
      setImages([...updatedImages]);
      setProcessedCount(i + 1);
    }

    if (successfulFiles.length === 1) {
      downloadGeotaggedImage(successfulFiles[0].blob, successfulFiles[0].name);
    } else if (successfulFiles.length > 1) {
      await downloadAsZip(successfulFiles);
    }

    setIsProcessing(false);
    setProcessedBlobs(new Map());

    if (errorCount === 0) {
      toast({ title: "Download Complete!", description: `${successCount} image${successCount !== 1 ? "s" : ""} geotagged and downloaded successfully` });
    } else if (successCount > 0) {
      toast({ title: "Partially Complete", description: `${successCount} succeeded, ${errorCount} failed. Check failed images and try again.`, variant: "destructive" });
    } else {
      toast({ title: "Download Failed", description: "Could not process any images. Please try again.", variant: "destructive" });
    }
  }, [images, latitude, longitude, keywords, description, toast, processedBlobs]);

  const faqs = [
    { q: "Is GeoTagger really free?", a: "Yes. GeoTagger is completely free with no hidden fees, subscriptions, watermarks, or file limits. No account required." },
    { q: "Are my photos uploaded to any server?", a: "No. All image processing happens entirely in your browser using JavaScript. Your photos never leave your device — not even temporarily." },
    { q: "Can I geotag multiple photos at once?", a: "Yes. Batch geotagging is fully supported — upload multiple photos and apply the same GPS location to all at once, then download individually or as a ZIP archive." },
    { q: "What image file formats are supported?", a: "JPG, PNG, WebP, and HEIC are all supported. HEIC files (iPhone photos) are automatically converted to high-quality JPEG for full EXIF GPS compatibility. JPG, PNG, and WebP retain their original format." },
    { q: "Will geotagging affect my image quality?", a: "No. GeoTagger only modifies the EXIF metadata — the actual pixel data remains completely untouched. There is zero quality loss." },
    { q: "Does GeoTagger work on mobile devices?", a: "Yes. GeoTagger works on modern mobile browsers including Chrome for Android, Safari for iOS, and Firefox Mobile." },
    { q: "How do I add GPS coordinates to a photo taken without location data?", a: "Upload your photo, then use the interactive map to click on the correct location, search for an address or city, or enter GPS coordinates manually. Click Download to save the geotagged version with embedded EXIF GPS data." },
    { q: "What is EXIF GPS metadata?", a: "EXIF GPS metadata is location information embedded inside a photo file — including latitude, longitude, and optionally altitude and compass direction. Apps like Google Photos, Apple Photos, and Adobe Lightroom use this data to show where a photo was taken on a map." },
    { q: "Which platforms recognize geotagged photos?", a: "GPS-tagged photos are recognized by Google Photos, Apple Photos, Adobe Lightroom, Windows File Explorer, macOS Preview, most GIS software, and any platform that reads standard EXIF metadata." },
  ];

  const currentImage = images[selectedImageIndex] || images[0];
  const existingGpsText = currentImage?.existingGps
    ? `${currentImage.existingGps.lat.toFixed(4)},${currentImage.existingGps.lng.toFixed(4)}`
    : "No existing geotags";

  useTiltCards(mode);

  const clearAll = useCallback(() => {
    setImages([]);
    setKeywords("");
    setDescription("");
    setSelectedImageIndex(0);
    setMode("landing");
  }, []);

  if (mode === "geotagger") {
    return (
      <div className="min-h-screen flex flex-col bg-muted/20">

        <Header />

        <main className="flex-1 py-5 px-4">
          <div className="container mx-auto max-w-6xl space-y-4">

            {/* ── Photo + Map row ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Photo panel */}
              <div data-no-tilt className="neon-panel flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden" style={{ height: "360px" }}>
                {/* Panel top bar */}
                <div className="flex-none flex items-center justify-between px-4 py-2.5 border-b border-border/70 bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Camera className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-semibold font-display text-foreground" data-testid="text-image-count">
                      {images.length} image{images.length !== 1 ? "s" : ""}
                    </span>
                    {currentImage && (
                      <span className="text-xs text-muted-foreground truncate hidden sm:block max-w-[120px]">{currentImage.name}</span>
                    )}
                  </div>
                  <button
                    onClick={() => document.getElementById("add-more")?.click()}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/70 bg-primary/8 hover:bg-primary/12 px-2.5 py-1 rounded-lg border border-primary/20 transition-all"
                    data-testid="button-add-more"
                  >
                    <Upload className="h-3 w-3" /> Add more
                  </button>
                  <input id="add-more" type="file" accept={ACCEPTED_EXTENSIONS.join(",")} multiple onChange={(e) => e.target.files && processFiles(e.target.files)} className="hidden" />
                </div>

                {/* Image preview */}
                <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden"
                  style={{ background: "repeating-conic-gradient(hsl(var(--muted)/40) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px" }}>
                  {currentImage ? (
                    <img
                      src={currentImage.preview}
                      alt={currentImage.name}
                      className="max-w-full max-h-full object-contain drop-shadow-md"
                      data-testid="img-preview-main"
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm">No image selected</div>
                  )}
                  {currentImage?.status === "success" && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
                      <CheckCircle className="h-3 w-3" /> Tagged
                    </div>
                  )}
                  {currentImage?.status === "error" && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-destructive text-destructive-foreground text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
                      <AlertCircle className="h-3 w-3" /> Failed
                    </div>
                  )}
                  {currentImage?.status === "processing" && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="flex-none px-3 py-2 border-t border-border/70 bg-background/40 overflow-x-auto">
                    <div className="flex gap-1.5">
                      {images.map((img, idx) => (
                        <button
                          key={img.id}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${idx === selectedImageIndex ? "border-primary ring-2 ring-primary/20 scale-105" : "border-border/40 hover:border-primary/40 opacity-60 hover:opacity-100"}`}
                          data-testid={`button-select-image-${idx}`}
                        >
                          <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                          <button
                            className="absolute top-0.5 right-0.5 h-3.5 w-3.5 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                            data-testid={`button-remove-${img.id}`}
                          >
                            <X className="h-2 w-2" />
                          </button>
                          {img.status === "success" && <CheckCircle className="absolute bottom-0.5 left-0.5 h-3 w-3 text-primary drop-shadow" />}
                          {img.status === "error" && <AlertCircle className="absolute bottom-0.5 left-0.5 h-3 w-3 text-destructive drop-shadow" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Map panel */}
              <div data-no-tilt className="neon-panel flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden" style={{ height: "360px" }}>
                {/* Search bar — sits above the map, full width */}
                <div className="flex-none px-3 py-2.5 border-b border-border/70 bg-card z-10">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search any city, address or landmark…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="w-full pl-10 pr-4 h-9 rounded-xl bg-muted/50 border border-border/60 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                        data-testid="input-search"
                      />
                      {/* Autocomplete dropdown */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-[1001] max-h-56 overflow-y-auto">
                          {suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              className="w-full text-left px-4 py-2.5 hover:bg-primary/8 transition-colors text-sm flex items-start gap-2.5 border-b border-border/20 last:border-0"
                              onClick={() => handleSelectSuggestion(suggestion)}
                            >
                              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1 text-foreground">{suggestion.displayName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Search button */}
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold font-display hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center gap-2 shadow-sm"
                      data-testid="button-search"
                    >
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      <span className="hidden sm:inline">Search</span>
                    </button>

                    {/* Locate me button */}
                    <button
                      onClick={handleUseMyLocation}
                      disabled={isLocating}
                      title="Use my location"
                      className="h-9 w-9 rounded-xl bg-muted/60 border border-border/60 hover:bg-muted text-primary flex items-center justify-center transition-all disabled:opacity-60 hover:border-primary/40"
                      data-testid="button-locate"
                    >
                      {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Map fills remaining space */}
                <div className="flex-1 min-h-0 relative">
                  <div ref={mapRef} className="absolute inset-0 z-0" data-testid="map-container" />
                  {/* Coordinate pill */}
                  <div className="absolute bottom-2.5 left-2.5 z-[400] flex items-center gap-1.5 bg-card/95 backdrop-blur-sm border border-border/70 px-2.5 py-1 rounded-lg shadow-sm pointer-events-none">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="text-xs font-mono text-foreground">{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Metadata + Actions ─────────────────────────── */}
            <div data-no-tilt className="neon-card rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
                {/* Existing GPS */}
                <div className="px-5 py-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Existing GPS</label>
                    <button
                      onClick={() => setShowExistingGeotags(!showExistingGeotags)}
                      className="text-[10px] text-primary hover:text-primary/70 font-semibold uppercase tracking-wide transition-colors"
                      data-testid="button-show-existing"
                    >
                      {showExistingGeotags ? "hide" : "show"}
                    </button>
                  </div>
                  <input
                    value={showExistingGeotags ? existingGpsText : ""}
                    placeholder="Hidden"
                    readOnly
                    className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border/50 font-mono text-xs text-muted-foreground focus:outline-none"
                    data-testid="input-existing-geotags"
                  />
                </div>

                {/* New Coordinates */}
                <div className="px-5 py-4 space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" /> New Coordinates
                  </label>
                  <input
                    value={`${latitude.toFixed(4)},  ${longitude.toFixed(4)}`}
                    readOnly
                    className="w-full h-9 px-3 rounded-lg bg-primary/6 border border-primary/25 font-mono text-xs font-semibold text-primary focus:outline-none"
                    data-testid="input-new-geotags"
                  />
                </div>

                {/* Keywords */}
                <div className="px-5 py-4 space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    Keywords <HelpCircle className="h-3 w-3 opacity-50" />
                  </label>
                  <input
                    placeholder="travel, nature, sunset"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border/60 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
                    data-testid="input-keywords"
                  />
                </div>

                {/* Description */}
                <div className="px-5 py-4 space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    Description <HelpCircle className="h-3 w-3 opacity-50" />
                  </label>
                  <input
                    placeholder="Add a description…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border/60 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
                    data-testid="input-description"
                  />
                </div>
              </div>

              {/* Action row */}
              <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-t border-border/50 bg-muted/20">
                {/* Write EXIF */}
                <EclipseButton
                  text={isWritingExif ? `Writing ${processedCount}/${images.length}…` : "Write EXIF Tags"}
                  leftIcon={<PenLine className="h-4 w-4" />}
                  isLoading={isWritingExif}
                  onClick={writeExifOnly}
                  disabled={isWritingExif || isProcessing}
                  size="sm"
                  data-testid="button-write-exif"
                />

                {/* Download */}
                <EclipseButton
                  text={isProcessing ? `Saving ${processedCount}/${images.length}…` : "Download"}
                  leftIcon={<Download className="h-4 w-4" />}
                  isLoading={isProcessing}
                  onClick={processAndDownloadAll}
                  disabled={isProcessing || isWritingExif}
                  size="sm"
                  data-testid="button-download"
                />

                {/* Clear */}
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border/70 bg-background text-sm font-medium text-muted-foreground"
                  data-testid="button-clear"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </button>

                <span className="ml-auto text-xs text-muted-foreground/70 hidden sm:flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-primary/60" />
                  Photos never leave your device
                </span>
              </div>
            </div>

          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <div className="absolute inset-0 topo-pattern opacity-50 pointer-events-none" aria-hidden="true" />
        {/* Gradient orb */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/6 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/6 text-primary text-xs font-semibold font-display">
              <Sparkles className="h-3 w-3" />
              Free Forever · No Account · No Uploads
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-[1.1] tracking-tight">
              Geotag Photos Free —{" "}
              <span className="gradient-text">Add GPS in Seconds</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-2 max-w-xl mx-auto leading-relaxed">
              Add GPS coordinates to any photo entirely in your browser — free, private, and instant. No software to install, no account required, zero quality loss.
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              JPG · PNG · WebP · HEIC &nbsp;|&nbsp; Batch geotagging &nbsp;|&nbsp; EXIF GPS metadata
            </p>
          </div>

          {/* Upload dropzone */}
          <div
            className={`neon-card max-w-2xl mx-auto cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${isDragging ? "border-primary bg-primary/6 scale-[1.02] shadow-xl" : "border-primary/25 bg-card/60"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => handleDrop(e)}
            onClick={() => document.getElementById("hero-upload")?.click()}
            id="upload-widget"
            data-testid="dropzone"
            role="button"
            aria-label="Upload photos to geotag"
          >
            <div className="py-10 px-8 text-center">
              {/* Icon cluster */}
              <div className="flex items-end justify-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center opacity-60 -rotate-6 shadow-sm">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className={`w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-md transition-transform duration-300 ${isDragging ? "scale-125 bg-primary/15" : "animate-float"}`}>
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center opacity-60 rotate-6 shadow-sm">
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>

              <h2 className="font-display text-xl font-bold mb-1.5 text-foreground">
                {isDragging ? "Release to upload" : "Drop your photos here"}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                or <span className="text-primary font-semibold">click to browse</span> files from your device
              </p>

              {/* Format badges */}
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                {["JPG", "PNG", "WebP"].map(fmt => (
                  <span key={fmt} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-primary/20 bg-primary/5 text-primary">
                    {fmt}
                  </span>
                ))}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-amber-500/30 bg-amber-500/8 text-amber-700 dark:text-amber-400">
                  HEIC → JPG
                </span>
              </div>

              <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5">
                <Lock className="h-3 w-3 text-primary/60" />
                Processed locally — your photos never leave this page
              </p>
              <input id="hero-upload" type="file" accept={ACCEPTED_EXTENSIONS.join(",")} multiple onChange={(e) => e.target.files && processFiles(e.target.files)} className="hidden" />
            </div>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-7 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary flex-shrink-0" /> 100% browser-based</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary flex-shrink-0" /> No sign-up or fees</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary flex-shrink-0" /> Batch multiple photos</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary flex-shrink-0" /> Zero quality loss</span>
          </div>
        </div>
      </section>

      {/* ─── WHAT IS GEOTAGGER ───────────────────────────────── */}
      <section id="what-is-geotagger" className="py-16 section-divider">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 text-primary">
                <Globe className="h-5 w-5" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">About the Tool</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-5 leading-tight">
                What Is FreeGeoTagger?
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="leading-relaxed">
                  FreeGeoTagger is a free, privacy-first tool that lets you <strong className="text-foreground">add GPS coordinates to photos</strong> directly in your browser — no software to install, no account to create.
                </p>
                <p className="leading-relaxed">
                  Upload one photo or a whole batch, pin the location on an interactive map or search any address worldwide, then download your images with precise GPS metadata embedded in the EXIF data.
                </p>
                <p className="leading-relaxed">
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
                <Card key={title} className="neon-card p-5 h-full border border-border">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                    <Icon className={`h-5 w-5 ${color} icon-glow`} />
                  </div>
                  <h3 className="font-display font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHAT IS GEOTAGGING ─────────────────────────────── */}
      <section id="what-is-geotagging" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4 text-primary">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-semibold font-display uppercase tracking-wider">Education</span>
            </div>
            <h2 className="font-display text-3xl font-bold mb-3">What Is Image Geotagging?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Geotagging embeds precise GPS location data into a photo's EXIF metadata — making images searchable, mappable, and location-aware.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
            {[
              { icon: MapPin, color: "text-primary", bg: "from-primary/10", border: "border-primary/20", title: "Latitude & Longitude", desc: "Precise geographic coordinates" },
              { icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "from-amber-500/10", border: "border-amber-500/20", title: "Timestamp", desc: "Date and time of capture" },
              { icon: Mountain, color: "text-emerald-600 dark:text-emerald-400", bg: "from-emerald-500/10", border: "border-emerald-500/20", title: "Altitude", desc: "Elevation above sea level" },
              { icon: Compass, color: "text-violet-600 dark:text-violet-400", bg: "from-violet-500/10", border: "border-violet-500/20", title: "Direction", desc: "Camera compass heading" },
            ].map(({ icon: Icon, color, bg, border, title, desc }) => (
              <Card key={title} className={`neon-card text-center p-5 h-full bg-gradient-to-br ${bg} to-transparent border ${border}`}>
                <div className={`w-11 h-11 rounded-xl ${bg.replace('from-', 'bg-')} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`h-6 w-6 ${color} icon-glow`} />
                </div>
                <h3 className="font-display font-semibold text-sm mb-1">{title}</h3>
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
      <section id="privacy" className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-4 text-primary">
                <Lock className="h-5 w-5" />
                <span className="text-sm font-semibold font-display uppercase tracking-wider">Privacy</span>
              </div>
              <h2 className="font-display text-3xl font-bold mb-3">Privacy-First by Design</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Your photos are sensitive. GeoTagger was built from the ground up so your images never leave your device.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: Upload, label: "No image uploads", sub: "Files stay on your device" },
                { icon: HardDrive, label: "No cloud storage", sub: "Zero server interaction" },
                { icon: Eye, label: "No tracking", sub: "No analytics on images" },
                { icon: UserX, label: "No account needed", sub: "Use instantly, anonymously" },
              ].map(({ icon: Icon, label, sub }) => (
                <Card key={label} className="neon-card p-5 text-center h-full bg-gradient-to-br from-primary/8 to-transparent border border-primary/15">
                  <div className="w-11 h-11 rounded-xl bg-primary/12 flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-5 w-5 text-primary icon-glow" />
                  </div>
                  <p className="font-display font-semibold text-sm mb-1">{label}</p>
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
      <section id="features" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4 text-primary">
              <Zap className="h-5 w-5" />
              <span className="text-sm font-semibold font-display uppercase tracking-wider">Features</span>
            </div>
            <h2 className="font-display text-3xl font-bold mb-3">Why Choose FreeGeoTagger?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Everything you need to add GPS coordinates to photos — completely free, forever</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { icon: Shield, color: "text-primary", bg: "bg-primary/10 border-primary/20", anim: "animate-float", title: "100% Private", desc: "Photos never leave your browser. Zero uploads, zero exposure." },
              { icon: Zap, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", anim: "animate-float-delay-1", title: "Lightning Fast", desc: "No server round-trips. Batch geotag dozens of photos in seconds." },
              { icon: Globe, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", anim: "animate-float-delay-2", title: "Universal GPS Format", desc: "Standard EXIF GPS data works in Google Photos, Lightroom, GIS tools." },
              { icon: Camera, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", anim: "animate-float-delay-3", title: "Multi-Format Support", desc: "JPG & PNG & WebP natively. HEIC auto-converts to JPEG." },
            ].map(({ icon: Icon, color, bg, anim, title, desc }) => (
              <Card key={title} className={`neon-card text-center p-6 h-full bg-gradient-to-br ${bg.split(' ')[0].replace('bg-', 'from-')} to-transparent border ${bg.split(' ')[1]}`}>
                <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center mx-auto mb-4 ${anim} border`}>
                  <Icon className={`h-7 w-7 ${color} icon-glow`} />
                </div>
                <h3 className="font-display font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHO SHOULD USE ─────────────────────────────────── */}
      <section id="who-should-use" className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4 text-primary">
              <Users className="h-5 w-5" />
              <span className="text-sm font-semibold font-display uppercase tracking-wider">Use Cases</span>
            </div>
            <h2 className="font-display text-3xl font-bold mb-3">Who Uses FreeGeoTagger?</h2>
            <p className="text-center text-muted-foreground max-w-lg mx-auto">
              Any time accurate photo location data matters — GeoTagger delivers it privately and instantly.
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
              <Card key={title} className="neon-card p-5 flex flex-col gap-3 h-full border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/15">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-sm">{title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold font-display uppercase tracking-wider">How It Works</span>
            </div>
            <h2 className="font-display text-3xl font-bold mb-3">Geotag Photos in 3 Steps</h2>
            <p className="text-muted-foreground max-w-md mx-auto">From upload to download in under a minute — no account, no software, no cost</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Upload, step: "1", title: "Upload Your Photos", desc: "Drag and drop or click to select one or multiple JPG, PNG, WebP, or HEIC files. Files stay on your device.", anim: "animate-float" },
              { icon: MapPin, step: "2", title: "Set the GPS Location", desc: "Click the interactive map to pin a location, search for any address worldwide, or use your device's current GPS.", anim: "animate-float-delay-1" },
              { icon: Download, step: "3", title: "Download Geotagged Photos", desc: "Get your photos with GPS coordinates embedded in the EXIF metadata. Download all at once as a ZIP file.", anim: "animate-float-delay-2" },
            ].map(({ icon: Icon, step, title, desc, anim }) => (
              <Card key={step} className="neon-card text-center p-7 h-full bg-gradient-to-br from-primary/8 to-transparent border border-primary/15">
                <div className={`w-16 h-16 rounded-2xl bg-primary/12 flex items-center justify-center mx-auto mb-4 ${anim} border border-primary/20`}>
                  <Icon className="h-8 w-8 text-primary icon-glow" />
                </div>
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-xs font-bold font-display">
                  {step}
                </div>
                <h3 className="font-display font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VS OTHERS / COMPARISON TABLE ───────────────────── */}
      <section id="vs-others" className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4 text-primary">
              <Check className="h-5 w-5" />
              <span className="text-sm font-semibold font-display uppercase tracking-wider">Comparison</span>
            </div>
            <h2 className="font-display text-3xl font-bold mb-3">FreeGeoTagger vs Other Geotagging Tools</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Most geotagging tools require accounts, paid plans, or upload your photos to the cloud. FreeGeoTagger does none of that.
            </p>
          </div>

          {/* Comparison table */}
          <div className="max-w-3xl mx-auto overflow-hidden rounded-xl border border-border shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary/8 border-b border-border">
                    <th className="text-left px-5 py-3.5 font-display font-semibold text-foreground">Feature</th>
                    <th className="text-center px-4 py-3.5 font-display font-semibold text-primary">FreeGeoTagger</th>
                    <th className="text-center px-4 py-3.5 font-display font-semibold text-muted-foreground">Desktop Software</th>
                    <th className="text-center px-4 py-3.5 font-display font-semibold text-muted-foreground">Cloud Tools</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Free to use", true, "Sometimes", "Rarely"],
                    ["No account required", true, true, false],
                    ["No file uploads", true, true, false],
                    ["Works in browser", true, false, true],
                    ["Batch geotagging", true, true, "Limited"],
                    ["HEIC support", true, "Limited", "Limited"],
                    ["Zero quality loss", true, true, "Varies"],
                  ].map(([feat, us, desktop, cloud], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-5 py-3 text-foreground font-medium">{feat}</td>
                      <td className="text-center px-4 py-3">
                        {us === true ? <Check className="h-4 w-4 text-primary mx-auto" /> : <span className="text-muted-foreground text-xs">{us}</span>}
                      </td>
                      <td className="text-center px-4 py-3">
                        {desktop === true ? <Check className="h-4 w-4 text-muted-foreground mx-auto" /> : desktop === false ? <span className="text-destructive text-xs font-medium">✕</span> : <span className="text-muted-foreground text-xs">{desktop}</span>}
                      </td>
                      <td className="text-center px-4 py-3">
                        {cloud === true ? <Check className="h-4 w-4 text-muted-foreground mx-auto" /> : cloud === false ? <span className="text-destructive text-xs font-medium">✕</span> : <span className="text-muted-foreground text-xs">{cloud}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4 text-primary">
              <HelpCircle className="h-5 w-5" />
              <span className="text-sm font-semibold font-display uppercase tracking-wider">FAQ</span>
            </div>
            <h2 className="font-display text-3xl font-bold mb-3">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Everything you need to know about geotagging photos with FreeGeoTagger</p>
          </div>
          <div className="max-w-2xl mx-auto space-y-2.5">
            {faqs.map((faq, i) => (
              <Card key={i} className="overflow-hidden border-border/60">
                <button
                  className="w-full px-5 py-4 text-left flex items-start justify-between gap-4 hover:bg-muted/30 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  data-testid={`button-faq-${i}`}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-display font-semibold text-sm leading-snug" data-testid={`text-faq-question-${i}`}>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
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

      <Footer />
    </div>
  );
}
