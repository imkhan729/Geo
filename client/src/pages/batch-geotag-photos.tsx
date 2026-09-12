import { useState, useCallback, useEffect, lazy, Suspense, useRef } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO_CONFIG, updatePageSEO, injectPageSchema } from "@/lib/seo";
import { AdSlot } from "@/components/ad-slot";
import { EclipseButton } from "@/components/ui/eclipse-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Check,
  FileText,
  Sliders,
  Globe,
  ChevronDown,
  ChevronUp,
  FileArchive,
  Info,
  Search,
} from "lucide-react";
import {
  ImageFile,
  formatFileSize,
  convertHeicToJpeg,
  readFileAsDataUrl,
  addGeotagAndVerify,
  extractExistingGps,
  GeotagData,
} from "@/lib/geotag-utils";
import {
  parseCoordinateCsv,
  matchCsvToImages,
  generateBatchExportCsv,
  formatBatchFilename,
  CsvCoordinateRow,
} from "@/lib/batch-workflow-utils";

const LeafletMap = lazy(() =>
  import("@/components/tool/leaflet-map").then((m) => ({ default: m.LeafletMap }))
);

export interface BatchItem {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  description?: string;
  existingGps?: { lat: number; lng: number; altitude?: number } | null;
  status: "pending" | "processing" | "success" | "error";
  selected: boolean;
  error?: string;
  verificationStatus?: string;
  processedBlob?: Blob;
}

export const BATCH_GEOTAG_FAQS = [
  {
    q: "How many photos can I batch geotag at once?",
    a: "FreeGeoTagger processes all images entirely within your browser's local memory, allowing you to comfortably batch geotag 50 to 100+ photos in a single session depending on your device RAM. Because files are never uploaded to a remote server, processing is instantaneous and 100% private.",
  },
  {
    q: "How does CSV coordinate mapping work?",
    a: "You can upload a simple CSV or TSV spreadsheet containing filenames and matching coordinates (columns: filename, latitude, longitude, and optional altitude/description). FreeGeoTagger automatically maps each row to your loaded photos, assigning unique GPS locations to individual files across your entire batch.",
  },
  {
    q: "Can I assign different locations to different photos in the same batch?",
    a: "Yes! Unlike basic geotaggers that force one single location onto all photos, FreeGeoTagger's batch workflow lets you select specific subsets of images using checkboxes and apply different GPS pins to each group, or use CSV import for per-file precision.",
  },
  {
    q: "Are my photos uploaded to any server during batch processing?",
    a: "No. FreeGeoTagger operates under a strict Zero-Upload Privacy Invariant. Every image decode, EXIF metadata injection, and ZIP archive creation executes purely in your browser's local JavaScript environment. No photos or location data ever leave your device.",
  },
  {
    q: "What image formats are supported in bulk geotagging?",
    a: "We support JPEG (.jpg, .jpeg), PNG, WebP, and Apple HEIC (.heic) files. HEIC photos from iPhones are automatically converted to universally compatible standard JPEG images before GPS tags are embedded.",
  },
  {
    q: "Does bulk geotagging compress or degrade photo quality?",
    a: "For JPEG images, FreeGeoTagger performs direct lossless binary EXIF header injection, preserving 100% of the original pixel data, sensor sharpness, and camera settings. For PNG and WebP, lossless canvas re-encoding is applied.",
  },
];

export default function BatchGeotagPhotosPage() {
  const { toast } = useToast();

  // Master batch items state
  const [items, setItems] = useState<BatchItem[]>([]);
  const [activePinLat, setActivePinLat] = useState<number>(37.7749);
  const [activePinLng, setActivePinLng] = useState<number>(-122.4194);
  const [activeAltitude, setActiveAltitude] = useState<string>("");
  const [activeDescription, setActiveDescription] = useState<string>("");
  const [renamePattern, setRenamePattern] = useState<string>("{name}");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvMatchCount, setCsvMatchCount] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // SEO & Structured Data
  useEffect(() => {
    updatePageSEO(SEO_CONFIG.batchGeotag);

    injectPageSchema("batch-geotag-webpage", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Batch Geotag Photos Online Free – Bulk GPS Image Tagger",
      url: "https://freegeotagger.com/batch-geotag-photos",
      description:
        "Batch geotag photos online free in your browser. Add GPS coordinates to multiple images at once, import CSV coordinates, or tag multi-locations privately.",
      inLanguage: "en-US",
      isPartOf: {
        "@type": "WebSite",
        name: "FreeGeoTagger",
        url: "https://freegeotagger.com",
      },
    });

    injectPageSchema("batch-geotag-breadcrumbs", {
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
          item: "https://freegeotagger.com/#tools",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Batch Geotag Photos",
          item: "https://freegeotagger.com/batch-geotag-photos",
        },
      ],
    });

    injectPageSchema("batch-geotag-webapp", {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "FreeGeoTagger Bulk Geotagging Tool",
      url: "https://freegeotagger.com/batch-geotag-photos",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "All",
      browserRequirements: "Requires modern web browser with HTML5 and WebAssembly support",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    });

    injectPageSchema("batch-geotag-faq", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: BATCH_GEOTAG_FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    });
  }, []);

  // Handle Photo File Additions
  const handleAddPhotos = useCallback(
    async (files: FileList | File[]) => {
      const incoming = Array.from(files);
      const newItems: BatchItem[] = [];

      for (const file of incoming) {
        try {
          let previewFile = file;
          if (file.name.toLowerCase().endsWith(".heic")) {
            const jpegBlob = await convertHeicToJpeg(file);
            previewFile = new File([jpegBlob], file.name.replace(/\.heic$/i, ".jpg"), {
              type: "image/jpeg",
            });
          }

          const dataUrl = await readFileAsDataUrl(previewFile);
          const existingGps = await extractExistingGps(dataUrl);

          newItems.push({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            file: previewFile,
            name: previewFile.name,
            size: previewFile.size,
            preview: dataUrl,
            latitude: existingGps?.lat,
            longitude: existingGps?.lng,
            altitude: existingGps?.altitude,
            existingGps,
            status: "pending",
            selected: true,
          });
        } catch (err) {
          console.error("Failed to parse image file:", err);
          toast({
            title: "File Error",
            description: `Failed to load ${file.name}. Please ensure it is a valid JPG, PNG, WebP, or HEIC image.`,
            variant: "destructive",
          });
        }
      }

      if (newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems]);
        toast({
          title: "Photos Added",
          description: `Added ${newItems.length} photo${newItems.length > 1 ? "s" : ""} to the batch queue.`,
        });
      }
    },
    [toast]
  );

  // Handle CSV Coordinate File Upload
  const handleCsvUpload = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const result = parseCoordinateCsv(text);

        if (result.errors.length > 0 && result.rows.length === 0) {
          setCsvErrors(result.errors);
          toast({
            title: "CSV Parsing Error",
            description: result.errors[0],
            variant: "destructive",
          });
          return;
        }

        setCsvErrors(result.errors);

        // Match against loaded items
        const matchMap = matchCsvToImages(result.rows, items);
        let matched = 0;

        setItems((prev) =>
          prev.map((item) => {
            const row = matchMap.get(item);
            if (row) {
              matched++;
              return {
                ...item,
                latitude: row.latitude,
                longitude: row.longitude,
                altitude: row.altitude !== undefined ? row.altitude : item.altitude,
                description: row.description || item.description,
              };
            }
            return item;
          })
        );

        setCsvMatchCount(matched);
        toast({
          title: "CSV Coordinates Mapped",
          description: `Successfully matched ${matched} of ${items.length} photo${items.length > 1 ? "s" : ""} from CSV.`,
        });
      } catch (err) {
        console.error("CSV error:", err);
        toast({
          title: "CSV Read Failed",
          description: "Could not read CSV file. Please verify it is a valid text file.",
          variant: "destructive",
        });
      }
    },
    [items, toast]
  );

  // Geocoding Search
  const handleGeocodeSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setActivePinLat(lat);
        setActivePinLng(lng);
        toast({
          title: "Location Found",
          description: data[0].display_name.split(",").slice(0, 3).join(","),
        });
      } else {
        toast({
          title: "Location Not Found",
          description: "Try searching for a different city, address, or landmark.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Search Unavailable",
        description: "Geocoding service unavailable. You can click directly on the map or enter coordinates manually.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, toast]);

  // Apply Active Coordinates to Selected Photos
  const applyCoordinatesToSelected = useCallback(() => {
    const selectedCount = items.filter((i) => i.selected).length;
    if (selectedCount === 0) {
      toast({
        title: "No Photos Selected",
        description: "Select one or more photos using the checkboxes to apply coordinates.",
        variant: "destructive",
      });
      return;
    }

    const altNum = activeAltitude.trim() ? parseFloat(activeAltitude) : undefined;

    setItems((prev) =>
      prev.map((item) =>
        item.selected
          ? {
              ...item,
              latitude: activePinLat,
              longitude: activePinLng,
              altitude: altNum !== undefined ? altNum : item.altitude,
              description: activeDescription.trim() || item.description,
            }
          : item
      )
    );

    toast({
      title: "Coordinates Assigned",
      description: `Assigned ${activePinLat.toFixed(4)}, ${activePinLng.toFixed(4)} to ${selectedCount} photo${selectedCount > 1 ? "s" : ""}.`,
    });
  }, [items, activePinLat, activePinLng, activeAltitude, activeDescription, toast]);

  // Selection Toggles
  const toggleSelectAll = useCallback((val: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: val })));
  }, []);

  const selectUntagged = useCallback(() => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.latitude === undefined || item.longitude === undefined,
      }))
    );
  }, []);

  const toggleItemSelect = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setCsvMatchCount(null);
    setCsvErrors([]);
    setProcessedCount(0);
  }, []);

  // Execute Batch Geotagging & ZIP Packaging
  const processAndDownloadZip = useCallback(async () => {
    if (items.length === 0) return;

    const readyItems = items.filter((i) => i.latitude !== undefined && i.longitude !== undefined);
    if (readyItems.length === 0) {
      toast({
        title: "Missing Coordinates",
        description: "Please assign GPS coordinates to at least one photo before downloading.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);

    try {
      const JSZipModule = await import("jszip");
      const JSZip = JSZipModule.default;
      const zip = new JSZip();

      const updatedItems = [...items];
      let completed = 0;

      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        if (item.latitude === undefined || item.longitude === undefined) {
          continue;
        }

        updatedItems[i] = { ...item, status: "processing" };
        setItems([...updatedItems]);

        try {
          const geotag: GeotagData = {
            latitude: item.latitude,
            longitude: item.longitude,
            altitude: item.altitude,
            description: item.description,
          };

          const result = await addGeotagAndVerify(item.file, geotag);
          const outputName = formatBatchFilename(
            item.name,
            renamePattern,
            i + 1,
            item.latitude,
            item.longitude
          );

          zip.file(outputName, result.blob);

          updatedItems[i] = {
            ...item,
            status: "success",
            verificationStatus: result.verification?.coordinatesVerified ? "Verified" : "Applied",
            processedBlob: result.blob,
          };
        } catch (err) {
          console.error(`Failed to geotag ${item.name}:`, err);
          updatedItems[i] = {
            ...item,
            status: "error",
            error: "Failed to embed GPS EXIF.",
          };
        }

        completed++;
        setProcessedCount(completed);
        setItems([...updatedItems]);
      }

      // Generate ZIP blob
      const zipContent = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      // Trigger download
      const downloadUrl = URL.createObjectURL(zipContent);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `freegeotagger-batch-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

      toast({
        title: "Batch Geotag Complete",
        description: `Successfully packaged ${completed} geotagged photo${completed > 1 ? "s" : ""} into ZIP.`,
      });
    } catch (err) {
      console.error("ZIP creation failed:", err);
      toast({
        title: "Processing Failed",
        description: "An error occurred while creating the batch ZIP archive.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [items, renamePattern, toast]);

  // Export Batch CSV Log
  const handleExportCsv = useCallback(() => {
    if (items.length === 0) return;

    const exportRows = items.map((i) => ({
      filename: i.name,
      latitude: i.latitude,
      longitude: i.longitude,
      altitude: i.altitude,
      description: i.description,
      status: i.status,
      verificationStatus: i.verificationStatus,
    }));

    const csvContent = generateBatchExportCsv(exportRows);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `freegeotagger-coordinates-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);

    toast({
      title: "CSV Exported",
      description: "Downloaded coordinate log spreadsheet.",
    });
  }, [items, toast]);

  const selectedCount = items.filter((i) => i.selected).length;
  const taggedCount = items.filter((i) => i.latitude !== undefined && i.longitude !== undefined).length;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main id="main-content" tabIndex={-1} className="outline-none flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-16 bg-gradient-to-b from-muted/50 to-background border-b border-border/40">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>/</li>
                <li>
                  <a href="/#tools" className="hover:text-foreground transition-colors">
                    Tools
                  </a>
                </li>
                <li>/</li>
                <li className="text-foreground font-medium" aria-current="page">
                  Batch Geotag Photos
                </li>
              </ol>
            </nav>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 border border-primary/20">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                Advanced Multi-File Workflow
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
                Batch Geotag Photos Online Free
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Add GPS coordinates to multiple photos simultaneously. Assign multi-location group pins,
                import CSV coordinate spreadsheets, and download organized ZIP archives with 100% client-side
                privacy.
              </p>
            </div>
          </div>
        </section>

        {/* Core Tool Section */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4 max-w-6xl space-y-8">
            {/* Upload Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo Dropzone Card */}
              <Card className="border-border/60 shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" aria-hidden="true" />
                    1. Upload Photo Batch
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select multiple JPG, PNG, WebP, or Apple HEIC files.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files) handleAddPhotos(e.dataTransfer.files);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-6 text-center cursor-pointer transition-all bg-muted/20 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[140px] flex flex-col items-center justify-center"
                    aria-label="Upload photo batch"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleAddPhotos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <Upload className="h-8 w-8 text-primary/70 mb-2" aria-hidden="true" />
                    <p className="text-sm font-medium text-foreground">Click or drag photos here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Processes locally in RAM. No file size or batch limits.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* CSV Coordinate Mapping Card */}
              <Card className="border-border/60 shadow-sm hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      2. Optional CSV Coordinate Import
                    </CardTitle>
                    {csvMatchCount !== null && (
                      <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                        {csvMatchCount} Matched
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    Auto-assign coordinates from a spreadsheet by filename.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    onClick={() => csvInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) handleCsvUpload(e.dataTransfer.files[0]);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        csvInputRef.current?.click();
                      }
                    }}
                    className="border-2 border-dashed border-border hover:border-emerald-500/60 rounded-xl p-6 text-center cursor-pointer transition-all bg-muted/20 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[140px] flex flex-col items-center justify-center"
                    aria-label="Upload CSV coordinate spreadsheet"
                  >
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv,.tsv,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleCsvUpload(e.target.files[0]);
                        e.target.value = "";
                      }}
                    />
                    <FileSpreadsheet className="h-8 w-8 text-emerald-600/70 dark:text-emerald-400/70 mb-2" aria-hidden="true" />
                    <p className="text-sm font-medium text-foreground">Upload CSV spreadsheet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Required headers: <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">filename, lat, lng</code>
                    </p>
                  </div>

                  {csvErrors.length > 0 && (
                    <div className="mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="font-medium">CSV Notice:</p>
                        <p>{csvErrors[0]}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Batch Workspace (When photos are loaded) */}
            {items.length > 0 && (
              <div className="space-y-6">
                {/* Batch Toolbar */}
                <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex flex-wrap items-center justify-between gap-4">
                  {/* Left: Selection stats & toggles */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-semibold">
                      {items.length} Photo{items.length > 1 ? "s" : ""}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {selectedCount} Selected
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        taggedCount === items.length
                          ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-xs"
                          : "border-amber-500/30 text-amber-600 bg-amber-500/10 text-xs"
                      }
                    >
                      {taggedCount} / {items.length} Coordinates Assigned
                    </Badge>

                    <div className="flex items-center gap-1.5 ml-2 border-l border-border pl-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSelectAll(true)}
                        className="h-7 text-xs px-2"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSelectAll(false)}
                        className="h-7 text-xs px-2 text-muted-foreground"
                      >
                        Deselect
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectUntagged}
                        className="h-7 text-xs px-2 text-amber-600 dark:text-amber-400"
                      >
                        Select Untagged
                      </Button>
                    </div>
                  </div>

                  {/* Right: Global Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCsv}
                      className="h-8 text-xs font-medium border-border"
                      title="Download CSV report of all batch coordinates"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                      Export CSV Log
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                      Clear All
                    </Button>
                  </div>
                </div>

                {/* Main Split Interface */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Photo Queue List (5 cols) */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
                        Photo Queue
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        Click checkbox to group-tag
                      </span>
                    </div>

                    <div className="max-h-[560px] overflow-y-auto space-y-2 p-1 pr-2 rounded-xl border border-border bg-muted/10">
                      {items.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            item.selected
                              ? "bg-primary/5 border-primary/40 shadow-xs"
                              : "bg-card border-border/70 hover:border-border"
                          }`}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleItemSelect(item.id)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                            aria-label={`Select ${item.name}`}
                          />

                          {/* Thumbnail */}
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/50">
                            <img
                              src={item.preview}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {item.status === "success" && (
                              <div className="absolute bottom-0.5 right-0.5 bg-emerald-500 text-white rounded-full p-0.5">
                                <Check className="h-2.5 w-2.5" aria-hidden="true" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate" title={item.name}>
                              {item.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {formatFileSize(item.size)}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              {item.latitude !== undefined && item.longitude !== undefined ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 bg-emerald-500/10 px-1.5 py-0"
                                >
                                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-amber-500/30 text-amber-600 bg-amber-500/10 px-1.5 py-0"
                                >
                                  No GPS
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Individual Remove */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Group Location Assignment & Map (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Location Assignment Card */}
                    <Card className="border-border bg-card shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                            Group Location Control
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Active for {selectedCount} Selected
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Search Bar */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Search city, address, or landmark..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleGeocodeSearch()}
                            className="text-xs h-9"
                          />
                          <Button
                            size="sm"
                            onClick={handleGeocodeSearch}
                            disabled={isSearching}
                            className="h-9 px-3 shrink-0 text-xs"
                          >
                            {isSearching ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                              <Search className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                          </Button>
                        </div>

                        {/* Interactive Leaflet Map */}
                        <div className="h-[280px] rounded-xl overflow-hidden border border-border">
                          <Suspense
                            fallback={
                              <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                Loading Interactive Map...
                              </div>
                            }
                          >
                            <LeafletMap
                              latitude={activePinLat}
                              longitude={activePinLng}
                              onCoordinatesChange={(lat, lng) => {
                                setActivePinLat(lat);
                                setActivePinLng(lng);
                              }}
                            />
                          </Suspense>
                        </div>

                        {/* Coordinate Input Controls */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Latitude</Label>
                            <Input
                              type="number"
                              step="0.000001"
                              value={activePinLat}
                              onChange={(e) => setActivePinLat(parseFloat(e.target.value) || 0)}
                              className="text-xs h-8 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Longitude</Label>
                            <Input
                              type="number"
                              step="0.000001"
                              value={activePinLng}
                              onChange={(e) => setActivePinLng(parseFloat(e.target.value) || 0)}
                              className="text-xs h-8 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Altitude (m)</Label>
                            <Input
                              type="number"
                              placeholder="e.g. 15"
                              value={activeAltitude}
                              onChange={(e) => setActiveAltitude(e.target.value)}
                              className="text-xs h-8 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Caption / Desc</Label>
                            <Input
                              type="text"
                              placeholder="Optional"
                              value={activeDescription}
                              onChange={(e) => setActiveDescription(e.target.value)}
                              className="text-xs h-8"
                            />
                          </div>
                        </div>

                        {/* Apply Button */}
                        <Button
                          onClick={applyCoordinatesToSelected}
                          disabled={selectedCount === 0}
                          className="w-full h-9 text-xs font-semibold"
                        >
                          <MapPin className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                          Apply Location to Selected Photos ({selectedCount})
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Batch Rename & Package Section */}
                    <Card className="border-border bg-card shadow-sm">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <Label className="text-xs font-medium">Batch Output File Pattern</Label>
                            <Input
                              value={renamePattern}
                              onChange={(e) => setRenamePattern(e.target.value)}
                              placeholder="{name}_geotagged"
                              className="text-xs h-8 font-mono max-w-sm"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Tokens: <code className="bg-muted px-1 rounded">&#123;name&#125;</code>, <code className="bg-muted px-1 rounded">&#123;index&#125;</code>, <code className="bg-muted px-1 rounded">&#123;lat&#125;</code>, <code className="bg-muted px-1 rounded">&#123;lng&#125;</code>
                            </p>
                          </div>

                          <EclipseButton
                            text={
                              isProcessing
                                ? `Geotagging ${processedCount}/${items.length}...`
                                : `Download Batch ZIP (${taggedCount})`
                            }
                            leftIcon={<FileArchive className="h-4 w-4" aria-hidden="true" />}
                            isLoading={isProcessing}
                            onClick={processAndDownloadZip}
                            disabled={isProcessing || taggedCount === 0}
                            size="default"
                            className="min-h-[44px] shrink-0"
                          />
                        </div>

                        {/* Progress Bar */}
                        {isProcessing && (
                          <div className="space-y-1.5" role="status" aria-live="polite">
                            <div className="flex justify-between text-xs font-mono text-muted-foreground">
                              <span>Embedding GPS EXIF metadata...</span>
                              <span>
                                {processedCount} / {items.length} (
                                {Math.round((processedCount / items.length) * 100)}%)
                              </span>
                            </div>
                            <div
                              className="w-full h-2 rounded-full bg-muted overflow-hidden"
                              role="progressbar"
                              aria-valuenow={Math.round((processedCount / items.length) * 100)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label="Batch geotagging progress"
                            >
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{
                                  width: `${Math.round((processedCount / items.length) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Ad Placement: batch-geotag-below-tool (Guarded, CLS protected) */}
        <div className="container mx-auto px-4 max-w-5xl my-6">
          <AdSlot placement="batch-geotag-below-tool" format="horizontal" />
        </div>

        {/* Educational Content Section (1,000+ words) */}
        <section className="py-12 md:py-16 bg-muted/20 border-t border-border/60">
          <div className="container mx-auto px-4 max-w-4xl space-y-12">
            {/* Guide Header */}
            <div>
              <div className="inline-flex items-center gap-2 mb-3 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  Comprehensive Guide
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
                Mastering Batch Photo Geotagging: Workflows, Spreadsheets & EXIF Standards
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Geotagging hundreds of field photos manually one by one is tedious, error-prone, and unsustainable
                for professionals. Whether managing property listings for real estate platforms, cataloging infrastructure
                survey assets, organizing field inspection reports, or archiving travel portfolios, an efficient batch
                workflow saves hours of administrative overhead. This guide explains how to structure batch geotagging
                pipelines, match spreadsheet coordinates, and safeguard client privacy.
              </p>
            </div>

            {/* Workflow Architectures */}
            <div className="space-y-4">
              <h3 className="text-xl font-display font-semibold">
                Three Professional Batch Geotagging Architectures
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Depending on your project requirements, batch image location tagging falls into three primary operational
                models:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-border bg-card">
                  <h4 className="font-semibold text-sm mb-1 text-primary">1. Single-Location Stamping</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ideal for events, architectural shoots, or single property listings where 20 to 50 photos were taken
                    at the exact same street address. FreeGeoTagger applies a single verified pin to all files instantly.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card">
                  <h4 className="font-semibold text-sm mb-1 text-primary">2. Multi-Group Queues</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Useful for field workers covering multiple adjacent sites in a day. Select photos 1 through 10 to tag Site A,
                    then select photos 11 through 25 to tag Site B, all within a single unified browser session.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card">
                  <h4 className="font-semibold text-sm mb-1 text-primary">3. CSV Spreadsheet Mapping</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The enterprise standard for drone operators, GIS surveyors, and e-commerce platforms. Upload a CSV with
                    exact file names and target coordinates to automate individual location assignment across dozens of files.
                  </p>
                </div>
              </div>
            </div>

            {/* CSV Specification Table */}
            <div className="space-y-4">
              <h3 className="text-xl font-display font-semibold">
                Preparing Your Coordinate CSV Spreadsheet
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                FreeGeoTagger includes a smart CSV/TSV parser that accommodates common spreadsheet headers and formatting
                conventions. Below is the recommended structure for preparing your data in Microsoft Excel, Google Sheets,
                or automated database exports:
              </p>

              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 font-semibold text-foreground">
                      <th className="p-3">Column Name</th>
                      <th className="p-3">Accepted Variations</th>
                      <th className="p-3">Format Example</th>
                      <th className="p-3">Requirement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-muted-foreground">
                    <tr>
                      <td className="p-3 font-mono font-medium text-foreground">filename</td>
                      <td className="p-3">file, name, photo, image</td>
                      <td className="p-3 font-mono">DSC_0042.jpg</td>
                      <td className="p-3 font-semibold text-primary">Required</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-medium text-foreground">latitude</td>
                      <td className="p-3">lat, y</td>
                      <td className="p-3 font-mono">37.774929</td>
                      <td className="p-3 font-semibold text-primary">Required (-90 to +90)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-medium text-foreground">longitude</td>
                      <td className="p-3">lng, lon, long, x</td>
                      <td className="p-3 font-mono">-122.419416</td>
                      <td className="p-3 font-semibold text-primary">Required (-180 to +180)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-medium text-foreground">altitude</td>
                      <td className="p-3">alt, elevation, ele</td>
                      <td className="p-3 font-mono">15.5</td>
                      <td className="p-3">Optional (meters above sea level)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-medium text-foreground">description</td>
                      <td className="p-3">desc, caption, title</td>
                      <td className="p-3">"West Corner Inspection"</td>
                      <td className="p-3">Optional (written to EXIF ImageDescription)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Browser Performance & Privacy Invariants */}
            <div className="space-y-4">
              <h3 className="text-xl font-display font-semibold">
                Client-Side Memory Management & Zero-Upload Privacy
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Many online file processors secretly transmit your client's high-resolution images to remote cloud servers
                where they may be cached, logged, or analyzed. FreeGeoTagger is architected with a fundamental Zero-Upload
                Invariant: all photo decodes, binary EXIF modifications, and ZIP file compressions occur strictly in your
                local browser memory.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When processing batches of 100+ images (often totaling several gigabytes), web browsers must manage RAM
                carefully to prevent tabs from crashing. FreeGeoTagger utilizes chunked sequential processing, revokes
                temporary object URLs immediately after packaging, and executes memory garbage collection between file writes.
                This allows smooth, reliable batch operations even on mobile devices and modest laptops.
              </p>
            </div>

            {/* Related Tools & Mandatory CTAs */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-display font-semibold">Explore Related Geotagging Utilities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <Link
                  href="/"
                  className="p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors block text-center"
                >
                  <MapPin className="h-4 w-4 mx-auto mb-1.5 text-primary" aria-hidden="true" />
                  <p className="text-xs font-semibold text-foreground">Single Geotagger</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Single pin workflow</p>
                </Link>

                <Link
                  href="/gps-finder"
                  className="p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors block text-center"
                >
                  <Globe className="h-4 w-4 mx-auto mb-1.5 text-primary" aria-hidden="true" />
                  <p className="text-xs font-semibold text-foreground">GPS Finder</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Extract locations</p>
                </Link>

                <Link
                  href="/exif-viewer"
                  className="p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors block text-center"
                >
                  <Info className="h-4 w-4 mx-auto mb-1.5 text-primary" aria-hidden="true" />
                  <p className="text-xs font-semibold text-foreground">EXIF Viewer</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Inspect camera tags</p>
                </Link>

                <Link
                  href="/remove-gps-from-photo"
                  className="p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors block text-center"
                >
                  <Trash2 className="h-4 w-4 mx-auto mb-1.5 text-primary" aria-hidden="true" />
                  <p className="text-xs font-semibold text-foreground">Remove GPS</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Strip location EXIF</p>
                </Link>

                <Link
                  href="/coordinate-converter"
                  className="p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors block text-center"
                >
                  <Sliders className="h-4 w-4 mx-auto mb-1.5 text-primary" aria-hidden="true" />
                  <p className="text-xs font-semibold text-foreground">Coordinates</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">DD to DMS converter</p>
                </Link>

                <Link
                  href="/blog/how-to-bulk-geotag-photos"
                  className="p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors block text-center"
                >
                  <FileText className="h-4 w-4 mx-auto mb-1.5 text-primary" aria-hidden="true" />
                  <p className="text-xs font-semibold text-foreground">Bulk Guide</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Workflow tutorial</p>
                </Link>
              </div>
            </div>

            {/* FAQ Accordion Section */}
            <div className="space-y-4 pt-6 border-t border-border">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="text-xl font-display font-semibold">
                  Frequently Asked Questions About Batch Geotagging
                </h3>
              </div>

              <div className="space-y-2">
                {BATCH_GEOTAG_FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-border/70 bg-card overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-expanded={isOpen}
                      >
                        <span>{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
