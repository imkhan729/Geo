import { useState, useCallback, useEffect, useRef } from "react";
import {
  Download, Loader2, Upload, X, Search, Locate,
  CheckCircle, AlertCircle, Camera, Shield, Zap,
  ChevronDown, Sparkles, PenLine, Trash2, HelpCircle,
  Globe, MapPin, Lock, Users, Check, Clock, Mountain,
  Compass, HardDrive, Eye, UserX, Plane, Newspaper,
  Building, Home as HomeIcon
} from "lucide-react";
import logoImage from "@assets/Geo_Tagger_Logo_2.webp-removebg-preview_1768829275162.png";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
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
import { updatePageSEO, SEO_CONFIG } from "@/lib/seo";

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

export default function Home() {
  const [mode, setMode] = useState<"landing" | "geotagger">("landing");

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.home);
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
      html: `<div style="background:#3b82f6;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
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
    { q: "Is GeoTagger really free?", a: "Yes. GeoTagger is completely free with no hidden fees, subscriptions, or watermarks." },
    { q: "Are my photos uploaded to any server?", a: "No. All processing happens locally in your browser. Your photos never leave your device." },
    { q: "Can I geotag multiple photos at once?", a: "Yes. Batch geotagging is fully supported — upload multiple photos and apply the same location to all." },
    { q: "What file formats are supported?", a: "JPG, PNG, WebP, and HEIC are all supported. Note that non-JPEG files are automatically converted to high-quality JPEG to support standard GPS metadata." },
    { q: "Will geotagging affect image quality?", a: "No. Only metadata is modified — image quality remains completely unchanged." },
    { q: "Does this work on mobile devices?", a: "Yes. GeoTagger works on modern mobile browsers including Chrome, Safari, and Firefox." },
  ];

  const currentImage = images[selectedImageIndex] || images[0];
  const existingGpsText = currentImage?.existingGps
    ? `${currentImage.existingGps.lat.toFixed(4)},${currentImage.existingGps.lng.toFixed(4)}`
    : "No existing geotags";

  const clearAll = useCallback(() => {
    setImages([]);
    setKeywords("");
    setDescription("");
    setSelectedImageIndex(0);
    setMode("landing");
  }, []);

  if (mode === "geotagger") {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border glass sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center justify-between h-16">
              <button onClick={() => { setMode("landing"); setImages([]); }} className="hover:opacity-80 transition-opacity" data-testid="button-home">
                <img src={logoImage} alt="GeoTagger" className="h-[42px]" />
              </button>
              <ThemeToggle data-testid="button-theme-toggle" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="h-[350px] lg:h-[400px] flex flex-col gap-3">
                <Card className="h-full flex flex-col overflow-hidden">
                  <CardHeader className="flex-none py-3 px-4 border-b border-border">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-sm font-medium" data-testid="text-image-count">{images.length} image{images.length !== 1 ? "s" : ""}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => document.getElementById("add-more")?.click()} data-testid="button-add-more">
                        <Upload className="h-4 w-4 mr-1" /> Add more
                      </Button>
                      <input id="add-more" type="file" accept={ACCEPTED_EXTENSIONS.join(",")} multiple onChange={(e) => e.target.files && processFiles(e.target.files)} className="hidden" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 flex flex-col p-0">
                    <div className="flex-1 bg-muted/30 flex items-center justify-center overflow-hidden relative p-4">
                      {currentImage && (
                        <img src={currentImage.preview} alt={currentImage.name} className="max-w-full max-h-full object-contain shadow-sm" data-testid="img-preview-main" />
                      )}
                    </div>
                    {images.length > 1 && (
                      <div className="flex-none p-2 border-t border-border overflow-x-auto bg-background/50 backdrop-blur-sm">
                        <div className="flex gap-2">
                          {images.map((img, idx) => (
                            <button
                              key={img.id}
                              onClick={() => setSelectedImageIndex(idx)}
                              className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${idx === selectedImageIndex ? "border-primary" : "border-transparent hover:border-muted-foreground/50"}`}
                              data-testid={`button-select-image-${idx}`}
                            >
                              <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-0.5 right-0.5 h-4 w-4 opacity-0 hover:opacity-100 transition-opacity"
                                onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                                data-testid={`button-remove-${img.id}`}
                              >
                                <X className="h-2 w-2" />
                              </Button>
                              {img.status === "success" && <CheckCircle className="absolute bottom-0.5 left-0.5 h-3 w-3 text-green-500" />}
                              {img.status === "error" && <AlertCircle className="absolute bottom-0.5 left-0.5 h-3 w-3 text-destructive" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="relative h-[350px] lg:h-[400px] rounded-xl overflow-hidden border border-border shadow-sm group">
                <div ref={mapRef} className="absolute inset-0 z-0 bg-muted" data-testid="map-container" />

                {/* Overlay Controls */}
                <div className="absolute top-4 right-4 z-[500] flex gap-2 items-start transition-opacity duration-300">
                  <div className="relative w-64 md:w-80 shadow-lg hover:scale-[1.01] transition-transform">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      placeholder="Search for a place..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-9 pr-10 h-10 bg-background/95 backdrop-blur-md border-border/60 shadow-sm rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-primary/50"
                      data-testid="input-search"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                      {isSearching ? (
                        <div className="h-8 w-8 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-transparent text-primary hover:text-primary/80"
                          onClick={handleSearch}
                          disabled={isSearching}
                          data-testid="button-search"
                        >
                          <div className="sr-only">Search</div>
                          <span className="text-xs font-semibold mr-1">Go</span>
                        </Button>
                      )}
                    </div>

                    {/* Autocomplete Suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-md border border-border/60 shadow-lg rounded-lg overflow-hidden z-[1001] max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            className="w-full text-left px-4 py-2 hover:bg-primary/10 transition-colors text-sm flex items-start gap-2 border-b border-border/30 last:border-0"
                            onClick={() => handleSelectSuggestion(suggestion)}
                          >
                            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{suggestion.displayName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleUseMyLocation}
                    disabled={isLocating}
                    title="My location"
                    className="h-10 w-10 bg-background/95 backdrop-blur-md border border-border/60 shadow-lg rounded-lg hover:bg-background transition-transform hover:scale-105"
                    data-testid="button-locate"
                  >
                    {isLocating ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Locate className="h-4 w-4 text-primary" />}
                  </Button>
                </div>
              </div>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-sm font-medium">Existing Geotags</label>
                      <button
                        onClick={() => setShowExistingGeotags(!showExistingGeotags)}
                        className="text-xs text-primary hover:underline"
                        data-testid="button-show-existing"
                      >
                        ({showExistingGeotags ? "hide" : "show"})
                      </button>
                    </div>
                    <Input
                      value={showExistingGeotags ? existingGpsText : ""}
                      placeholder="Hidden"
                      readOnly
                      className="bg-background"
                      data-testid="input-existing-geotags"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-sm font-medium">New Geotags</label>
                    </div>
                    <Input
                      value={`${latitude.toFixed(4)},${longitude.toFixed(4)}`}
                      readOnly
                      className="bg-background font-mono"
                      data-testid="input-new-geotags"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-sm font-medium">Keywords and Tags</label>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <Input
                      placeholder="travel, nature, sunset"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="bg-background"
                      data-testid="input-keywords"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-sm font-medium">Description / Alternative Text</label>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <Input
                      placeholder="Add a description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-background"
                      data-testid="input-description"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center">
                  <Button onClick={writeExifOnly} disabled={isWritingExif || isProcessing} className="bg-blue-600 hover:bg-blue-700" data-testid="button-write-exif">
                    {isWritingExif ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Writing {processedCount}/{images.length}</>
                    ) : (
                      <><PenLine className="h-4 w-4 mr-2" /> Write EXIF Tags</>
                    )}
                  </Button>
                  <Button onClick={processAndDownloadAll} disabled={isProcessing || isWritingExif} variant="outline" className="bg-green-600 hover:bg-green-700 text-white border-green-600" data-testid="button-download">
                    {isProcessing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Downloading {processedCount}/{images.length}</>
                    ) : (
                      <><Download className="h-4 w-4 mr-2" /> Download</>
                    )}
                  </Button>
                  <Button onClick={clearAll} variant="outline" data-testid="button-clear">
                    <Trash2 className="h-4 w-4 mr-2" /> Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 text-center max-w-6xl">
          <Badge className="mb-6 shadow-hover" variant="secondary"><Sparkles className="h-3 w-3 mr-1" /> Free with GeoTagger</Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Add GPS Location to</span>
            <br />
            <span className="gradient-text">Your Photos Instantly</span>
          </h1>
          <h2 className="text-xl md:text-2xl lg:text-3xl text-muted-foreground font-medium mb-8 max-w-3xl mx-auto">
            Free Online Image Geotagging Tool — No Uploads, No Accounts
          </h2>

          <Card
            className={`max-w-2xl mx-auto cursor-pointer transition-all duration-500 border-2 border-dashed shadow-hover ${isDragging ? "border-primary bg-primary/10 scale-105" : "border-primary/30 hover:border-primary/50 hover:shadow-xl"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => handleDrop(e)}
            onClick={() => document.getElementById("hero-upload")?.click()}
            data-testid="dropzone"
          >
            <CardContent className="py-14">
              <Upload className={`h-14 w-14 mx-auto mb-5 text-primary transition-transform duration-300 ${isDragging ? "scale-125" : ""}`} />
              <h3 className="text-2xl font-semibold mb-3">Drop photos here to geotag</h3>
              <p className="text-muted-foreground mb-5 text-lg">or click to browse</p>
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                <Badge variant="outline" className="text-sm">JPG</Badge>
                <Badge variant="outline" className="text-sm">PNG*</Badge>
                <Badge variant="outline" className="text-sm">WebP*</Badge>
                <Badge variant="outline" className="text-sm">HEIC*</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">* Non-JPEG files are converted to JPEG to ensure Exif compatibility.</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">All files are processed locally on your device for maximum privacy and security.</p>
              <input id="hero-upload" type="file" accept={ACCEPTED_EXTENSIONS.join(",")} multiple onChange={(e) => e.target.files && processFiles(e.target.files)} className="hidden" />
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /> Works entirely in your browser</span>
            <span className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /> No sign-up, no fees, no limits</span>
            <span className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /> Fast batch geotagging</span>
            <span className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /> Supports JPG, PNG, WebP & HEIC</span>
          </div>
        </div>
      </section>

      <section id="what-is-geotagger" className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Globe className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">What Is GeoTagger?</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p className="text-lg leading-relaxed">
                GeoTagger is a free, privacy-first online tool that lets you add GPS coordinates to your photos directly in your browser. Geotag multiple images at once, embed accurate location metadata, and download your photos instantly — without uploading them to any server.
              </p>
              <p className="leading-relaxed">
                Geotagging adds latitude and longitude information to a photo's EXIF metadata, allowing images to be organized, searched, verified, and displayed on maps based on where they were taken.
              </p>
              <p className="leading-relaxed">
                Whether you're a professional photographer cataloging shoots, a real estate agent documenting properties, a researcher collecting field data, or a traveler preserving memories — GeoTagger provides a fast, accurate, and secure solution.
              </p>
              <p className="leading-relaxed">
                Unlike traditional photo software, GeoTagger does not upload your images. Everything happens locally in your browser, ensuring full privacy and compatibility across platforms like Google Photos, Apple Photos, Adobe Lightroom, and mapping tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="what-is-geotagging" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <MapPin className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">What Is Image Geotagging?</h2>
            </div>
            <p className="text-lg text-muted-foreground text-center mb-8">
              Image geotagging is the process of embedding GPS location data into a photo's metadata. This includes:
            </p>
            <div className="grid md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="card-3d h-full">
                <Card className="card-3d-inner text-center p-5 h-full bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                    <MapPin className="h-6 w-6 text-blue-500 icon-glow" />
                  </div>
                  <h4 className="font-semibold">Latitude & Longitude</h4>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner text-center p-5 h-full bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-amber-500 icon-glow" />
                  </div>
                  <h4 className="font-semibold">Timestamp</h4>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner text-center p-5 h-full bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <Mountain className="h-6 w-6 text-emerald-500 icon-glow" />
                  </div>
                  <h4 className="font-semibold">Altitude</h4>
                  <p className="text-xs text-muted-foreground">(when available)</p>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner text-center p-5 h-full bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                    <Compass className="h-6 w-6 text-purple-500 icon-glow" />
                  </div>
                  <h4 className="font-semibold">Camera Direction</h4>
                </Card>
              </div>
            </div>
            <p className="text-muted-foreground text-center mt-6">
              Geotagged images can be displayed on maps, sorted by location, and used in location-based platforms, GIS systems, and photo management software.
            </p>
          </div>
        </div>
      </section>

      <section id="privacy" className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Lock className="h-8 w-8 text-green-500" />
              <h2 className="text-3xl font-bold">Privacy-First by Design</h2>
            </div>
            <p className="text-xl text-muted-foreground mb-8">Your privacy matters.</p>
            <div className="grid md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-5 text-center h-full bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-6 w-6 text-green-500 icon-glow" />
                  </div>
                  <p className="font-medium">No image uploads</p>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-5 text-center h-full bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                    <HardDrive className="h-6 w-6 text-green-500 icon-glow" />
                  </div>
                  <p className="font-medium">No cloud storage</p>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-5 text-center h-full bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                    <Eye className="h-6 w-6 text-green-500 icon-glow" />
                  </div>
                  <p className="font-medium">No tracking</p>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-5 text-center h-full bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                    <UserX className="h-6 w-6 text-green-500 icon-glow" />
                  </div>
                  <p className="font-medium">No accounts required</p>
                </Card>
              </div>
            </div>
            <p className="text-muted-foreground mt-6">
              GeoTagger processes all images locally in your browser. Once you close the page, nothing is stored or retained.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">Why Choose GeoTagger?</h2>
            </div>
            <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to add GPS coordinates to photos — completely free</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="card-3d h-full">
              <Card className="card-3d-inner text-center p-6 h-full bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4 animate-float">
                  <Shield className="h-8 w-8 text-green-500 icon-glow" />
                </div>
                <h3 className="font-semibold mb-2">100% Private</h3>
                <p className="text-sm text-muted-foreground">Your photos never leave your device.</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner text-center p-6 h-full bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
                <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-4 animate-float-delay-1">
                  <Zap className="h-8 w-8 text-yellow-500 icon-glow" />
                </div>
                <h3 className="font-semibold mb-2">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">No uploads. Batch geotag multiple photos in seconds.</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner text-center p-6 h-full bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4 animate-float-delay-2">
                  <Globe className="h-8 w-8 text-blue-500 icon-glow" />
                </div>
                <h3 className="font-semibold mb-2">Universal Compatibility</h3>
                <p className="text-sm text-muted-foreground">Embedded GPS metadata works across all major platforms.</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner text-center p-6 h-full bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4 animate-float-delay-3">
                  <Camera className="h-8 w-8 text-purple-500 icon-glow" />
                </div>
                <h3 className="font-semibold mb-2">All Major Formats</h3>
                <p className="text-sm text-muted-foreground">JPG, PNG, WebP, and HEIC (auto-converted).</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="who-should-use" className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Users className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">Who Should Use GeoTagger?</h2>
            </div>
            <p className="text-center text-muted-foreground mb-8">GeoTagger is ideal for:</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-4 flex items-center gap-4 h-full hover-scale">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm">Photographers organizing location-based shoots</span>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-4 flex items-center gap-4 h-full hover-scale">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <HomeIcon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm">Real estate agents tagging property photos</span>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-4 flex items-center gap-4 h-full hover-scale">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm">Surveyors & researchers collecting field data</span>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-4 flex items-center gap-4 h-full hover-scale">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Plane className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm">Travelers & bloggers preserving memories</span>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-4 flex items-center gap-4 h-full hover-scale">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Newspaper className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm">Journalists verifying photo locations</span>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-4 flex items-center gap-4 h-full hover-scale">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm">Businesses managing location-aware media</span>
                </Card>
              </div>
            </div>
            <p className="text-center text-muted-foreground mt-6">
              If your images need accurate location data, GeoTagger saves time while maintaining privacy.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to geotag your photos</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="card-3d h-full">
              <Card className="card-3d-inner text-center p-6 h-full bg-gradient-to-br from-primary/10 to-transparent">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-float">
                  <Upload className="h-8 w-8 text-primary icon-glow" />
                </div>
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-sm font-bold">1</div>
                <h3 className="font-semibold mb-2">Upload Photos</h3>
                <p className="text-sm text-muted-foreground">Drag and drop or select one or multiple images</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner text-center p-6 h-full bg-gradient-to-br from-primary/10 to-transparent">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-float-delay-1">
                  <MapPin className="h-8 w-8 text-primary icon-glow" />
                </div>
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-sm font-bold">2</div>
                <h3 className="font-semibold mb-2">Set Location</h3>
                <p className="text-sm text-muted-foreground">Click on the map, search an address, or use GPS</p>
              </Card>
            </div>
            <div className="card-3d h-full">
              <Card className="card-3d-inner text-center p-6 h-full bg-gradient-to-br from-primary/10 to-transparent">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-float-delay-2">
                  <Download className="h-8 w-8 text-primary icon-glow" />
                </div>
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-sm font-bold">3</div>
                <h3 className="font-semibold mb-2">Download</h3>
                <p className="text-sm text-muted-foreground">Get photos with embedded GPS metadata instantly</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="vs-others" className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">GeoTagger vs Other Geotagging Tools</h2>
            <p className="text-muted-foreground mb-8">Unlike traditional software or paid tools:</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto mb-6">
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-4 text-center h-full bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                    <Check className="h-5 w-5 text-green-500 icon-glow" />
                  </div>
                  <p className="text-sm font-medium">No subscriptions</p>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-4 text-center h-full bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                    <Check className="h-5 w-5 text-green-500 icon-glow" />
                  </div>
                  <p className="text-sm font-medium">No file limits</p>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-4 text-center h-full bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                    <Check className="h-5 w-5 text-green-500 icon-glow" />
                  </div>
                  <p className="text-sm font-medium">No uploads</p>
                </Card>
              </div>
              <div className="card-3d h-full">
                <Card className="card-3d-inner p-4 text-center h-full bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                    <Check className="h-5 w-5 text-green-500 icon-glow" />
                  </div>
                  <p className="text-sm font-medium">No installation</p>
                </Card>
              </div>
              <div className="card-3d h-full col-span-2 md:col-span-1">
                <Card className="card-3d-inner p-4 text-center h-full bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                    <Check className="h-5 w-5 text-green-500 icon-glow" />
                  </div>
                  <p className="text-sm font-medium">Works in browser</p>
                </Card>
              </div>
            </div>
            <p className="text-muted-foreground">
              Most alternatives require accounts, paid plans, or cloud uploads — GeoTagger does not.
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <Card key={i} className="overflow-hidden">
                <button
                  className="w-full p-4 text-left flex items-center justify-between gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  data-testid={`button-faq-${i}`}
                >
                  <span className="font-medium" data-testid={`text-faq-question-${i}`}>{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-muted-foreground text-sm" data-testid={`text-faq-answer-${i}`}>{faq.a}</div>
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
