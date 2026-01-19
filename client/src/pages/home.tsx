import { useState, useCallback, useEffect, useRef } from "react";
import { 
  Download, Loader2, Upload, X, Search, Locate, 
  CheckCircle, AlertCircle, Camera, Shield, Zap, Globe, 
  HelpCircle, ChevronDown, FileImage, Eye, Copy, Check,
  ArrowRight, Sparkles
} from "lucide-react";
import logoImage from "@assets/Geo_Tagger_Logo_2.webp_1768827957680.jpg";
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
  validateCoordinates
} from "@/lib/geotag-utils";
import { useToast } from "@/hooks/use-toast";

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

interface ExtractedGps {
  lat: number;
  lng: number;
  fileName: string;
}

export default function Home() {
  const [mode, setMode] = useState<"landing" | "geotagger" | "finder">("landing");
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
  const [extractedGps, setExtractedGps] = useState<ExtractedGps | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { toast } = useToast();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const finderMapRef = useRef<HTMLDivElement>(null);
  const finderMapInstanceRef = useRef<L.Map | null>(null);

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

  useEffect(() => {
    if (mode !== "finder" || !finderMapRef.current || !extractedGps) return;

    if (finderMapInstanceRef.current) {
      finderMapInstanceRef.current.remove();
    }

    const map = L.map(finderMapRef.current).setView([extractedGps.lat, extractedGps.lng], 15);
    finderMapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const customIcon = L.divIcon({
      html: `<div style="background:#22c55e;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
      className: "custom-marker",
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    L.marker([extractedGps.lat, extractedGps.lng], { icon: customIcon }).addTo(map);

    return () => {
      if (finderMapInstanceRef.current) {
        finderMapInstanceRef.current.remove();
        finderMapInstanceRef.current = null;
      }
    };
  }, [mode, extractedGps]);

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

  const processFiles = useCallback(async (files: FileList | File[], forFinder = false) => {
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

        if (forFinder) {
          if (existingGps) {
            setExtractedGps({ lat: existingGps.lat, lng: existingGps.lng, fileName: file.name });
            setMode("finder");
          } else {
            toast({ title: "No GPS data", description: "This image has no location information", variant: "destructive" });
          }
          return;
        }

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
    
    if (!forFinder && fileArray.length > 0) {
      setMode("geotagger");
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent, forFinder = false) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files, forFinder);
  }, [processFiles]);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== id);
      if (newImages.length === 0) setMode("landing");
      return newImages;
    });
  }, []);

  const processAndDownloadAll = useCallback(async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProcessedCount(0);

    const geotag: GeotagData = { latitude, longitude, keywords: keywords || undefined, description: description || undefined };
    const updatedImages = [...images];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < updatedImages.length; i++) {
      const img = updatedImages[i];
      updatedImages[i] = { ...img, status: "processing" };
      setImages([...updatedImages]);

      try {
        const blob = await addGeotagToImage(img.file, geotag);
        downloadGeotaggedImage(blob, img.name);
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

    setIsProcessing(false);
    
    if (errorCount === 0) {
      toast({ title: "Download Complete!", description: `${successCount} image${successCount !== 1 ? "s" : ""} geotagged and downloaded successfully` });
    } else if (successCount > 0) {
      toast({ title: "Partially Complete", description: `${successCount} succeeded, ${errorCount} failed. Check failed images and try again.`, variant: "destructive" });
    } else {
      toast({ title: "Download Failed", description: "Could not process any images. Please try again.", variant: "destructive" });
    }
  }, [images, latitude, longitude, keywords, description, toast]);

  const copyCoordinates = useCallback(async () => {
    if (!extractedGps) return;
    await navigator.clipboard.writeText(`${extractedGps.lat.toFixed(6)}, ${extractedGps.lng.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  }, [extractedGps]);

  const faqs = [
    { q: "Is this tool really free?", a: "Yes! FreeGeoTagger is 100% free with no hidden costs, subscriptions, or watermarks." },
    { q: "Are my photos uploaded to any server?", a: "No. All processing happens directly in your browser. Your photos never leave your device." },
    { q: "What file formats are supported?", a: "We support JPG, JPEG, PNG, WebP, and HEIC files up to 20MB each." },
    { q: "Will GPS work with PNG files?", a: "PNG has limited EXIF support. GPS coordinates may not display in all viewers. JPG works best." },
    { q: "Can I geotag multiple photos at once?", a: "Yes! Upload multiple photos and they'll all get the same GPS coordinates you select." },
  ];

  if (mode === "geotagger") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 flex items-center justify-between h-14">
            <button onClick={() => { setMode("landing"); setImages([]); }} className="hover:opacity-80" data-testid="button-home">
              <img src={logoImage} alt="GeoTagger" className="h-10" />
            </button>
            <ThemeToggle data-testid="button-theme-toggle" />
          </div>
        </header>

        <main className="flex-1 p-4">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: "calc(100vh - 130px)" }}>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Search for a place..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    data-testid="input-search"
                  />
                  <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={handleSearch} disabled={isSearching} data-testid="button-search">
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <Button variant="outline" size="icon" onClick={handleUseMyLocation} disabled={isLocating} title="My location" data-testid="button-locate">
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                </Button>
              </div>

              <div ref={mapRef} className="flex-1 min-h-[350px] rounded-lg overflow-hidden border border-border" data-testid="map-container" />
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">Lat</span>
                  <Input
                    type="number"
                    step="any"
                    value={latitude.toFixed(6)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && validateCoordinates(val, longitude)) setLatitude(val);
                    }}
                    className="h-7 text-sm border-0 bg-transparent p-0"
                    data-testid="input-latitude"
                  />
                </div>
                <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">Lon</span>
                  <Input
                    type="number"
                    step="any"
                    value={longitude.toFixed(6)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && validateCoordinates(latitude, val)) setLongitude(val);
                    }}
                    className="h-7 text-sm border-0 bg-transparent p-0"
                    data-testid="input-longitude"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Card className="flex-1 overflow-hidden">
                <CardHeader className="py-3 px-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium" data-testid="text-image-count">{images.length} image{images.length !== 1 ? "s" : ""} selected</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => document.getElementById("add-more")?.click()} data-testid="button-add-more">
                      <Upload className="h-4 w-4 mr-1" /> Add more
                    </Button>
                    <input id="add-more" type="file" accept={ACCEPTED_EXTENSIONS.join(",")} multiple onChange={(e) => e.target.files && processFiles(e.target.files)} className="hidden" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 overflow-auto" style={{ maxHeight: "280px" }}>
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img) => (
                      <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden" data-testid={`img-thumbnail-${img.id}`}>
                        <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(img.id)}
                          data-testid={`button-remove-${img.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        {img.status === "success" && <CheckCircle className="absolute bottom-1 left-1 h-4 w-4 text-green-500" />}
                        {img.status === "error" && <AlertCircle className="absolute bottom-1 left-1 h-4 w-4 text-destructive" />}
                        {img.status === "processing" && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Keywords (optional)</label>
                    <Input placeholder="travel, nature, sunset" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="mt-1" data-testid="input-keywords" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Description (optional)</label>
                    <Textarea placeholder="Add a description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 resize-none" data-testid="input-description" />
                  </div>
                  <Button onClick={processAndDownloadAll} disabled={isProcessing} className="w-full" size="lg" data-testid="button-download">
                    {isProcessing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing {processedCount}/{images.length}</>
                    ) : (
                      <><Download className="h-4 w-4 mr-2" /> Geotag & Download All</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (mode === "finder" && extractedGps) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 flex items-center justify-between h-14">
            <button onClick={() => { setMode("landing"); setExtractedGps(null); }} className="hover:opacity-80" data-testid="button-home-finder">
              <img src={logoImage} alt="GeoTagger" className="h-10" />
            </button>
            <ThemeToggle data-testid="button-theme-finder" />
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20" data-testid="badge-location-found">Location Found</Badge>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-gps-title">GPS Coordinates Extracted</h1>
              <p className="text-muted-foreground" data-testid="text-filename">{extractedGps.fileName}</p>
            </div>

            <Card className="mb-6">
              <CardContent className="p-0">
                <div ref={finderMapRef} className="h-[400px] rounded-t-lg" />
                <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Coordinates</p>
                    <p className="text-xl font-mono font-bold" data-testid="text-coordinates">{extractedGps.lat.toFixed(6)}, {extractedGps.lng.toFixed(6)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={copyCoordinates} data-testid="button-copy-coords">
                      {copiedCoords ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copiedCoords ? "Copied!" : "Copy"}
                    </Button>
                    <Button onClick={() => window.open(`https://www.google.com/maps?q=${extractedGps.lat},${extractedGps.lng}`, "_blank")} data-testid="button-open-maps">
                      <Globe className="h-4 w-4 mr-2" /> Open in Maps
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" onClick={() => { setMode("landing"); setExtractedGps(null); }} data-testid="button-back-home">
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" /> Back to Home
              </Button>
              <Button onClick={() => document.getElementById("finder-upload")?.click()} data-testid="button-check-another">
                <Eye className="h-4 w-4 mr-2" /> Check Another Image
              </Button>
              <input id="finder-upload" type="file" accept={ACCEPTED_EXTENSIONS.join(",")} onChange={(e) => e.target.files && processFiles(e.target.files, true)} className="hidden" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <a href="/" className="hover:opacity-80" data-testid="link-logo">
            <img src={logoImage} alt="GeoTagger" className="h-10" />
          </a>
          <nav className="hidden md:flex flex-wrap items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-how-it-works">How it Works</a>
            <a href="#finder" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-gps-finder">GPS Finder</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-faq">FAQ</a>
          </nav>
          <ThemeToggle data-testid="button-theme" />
        </div>
      </header>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4" variant="secondary"><Sparkles className="h-3 w-3 mr-1" /> 100% Free & Private</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Add GPS to Your Photos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Free online geotagging tool. Add location data to multiple photos at once. 
            No uploads, no accounts — everything happens in your browser.
          </p>

          <Card
            className={`max-w-2xl mx-auto cursor-pointer transition-all border-2 border-dashed ${isDragging ? "border-primary bg-primary/5" : "border-primary/30 hover:border-primary/50"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => handleDrop(e)}
            onClick={() => document.getElementById("hero-upload")?.click()}
            data-testid="dropzone"
          >
            <CardContent className="py-12">
              <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Drop photos here to geotag</h3>
              <p className="text-muted-foreground mb-4">or click to browse</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline">JPG</Badge>
                <Badge variant="outline">PNG</Badge>
                <Badge variant="outline">WebP</Badge>
                <Badge variant="outline">HEIC</Badge>
              </div>
              <input id="hero-upload" type="file" accept={ACCEPTED_EXTENSIONS.join(",")} multiple onChange={(e) => e.target.files && processFiles(e.target.files)} className="hidden" />
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="features" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why FreeGeoTagger?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to add GPS coordinates to your photos</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="text-center p-6">
              <Shield className="h-10 w-10 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">100% Private</h3>
              <p className="text-sm text-muted-foreground">Your photos never leave your device. All processing happens locally in your browser.</p>
            </Card>
            <Card className="text-center p-6">
              <Zap className="h-10 w-10 mx-auto mb-4 text-yellow-500" />
              <h3 className="font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">No waiting for uploads. Geotag multiple photos in seconds with batch processing.</p>
            </Card>
            <Card className="text-center p-6">
              <Camera className="h-10 w-10 mx-auto mb-4 text-blue-500" />
              <h3 className="font-semibold mb-2">All Formats</h3>
              <p className="text-sm text-muted-foreground">Support for JPG, PNG, WebP, and HEIC. HEIC files are auto-converted to JPG.</p>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to geotag your photos</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary font-bold">1</div>
              <h3 className="font-semibold mb-2">Upload Photos</h3>
              <p className="text-sm text-muted-foreground">Drag and drop or click to upload one or more photos</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary font-bold">2</div>
              <h3 className="font-semibold mb-2">Set Location</h3>
              <p className="text-sm text-muted-foreground">Click on the map, search for a place, or use your GPS</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary font-bold">3</div>
              <h3 className="font-semibold mb-2">Download</h3>
              <p className="text-sm text-muted-foreground">Get your photos with embedded GPS coordinates</p>
            </div>
          </div>
        </div>
      </section>

      <section id="finder" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Eye className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-bold mb-4">GPS Finder</h2>
            <p className="text-muted-foreground mb-8">Already have a geotagged photo? Upload it to extract and view the location on a map.</p>
            <Card
              className={`cursor-pointer transition-all border-2 border-dashed ${isDragging ? "border-green-500 bg-green-500/5" : "border-green-500/30 hover:border-green-500/50"}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => handleDrop(e, true)}
              onClick={() => document.getElementById("finder-input")?.click()}
              data-testid="dropzone-finder"
            >
              <CardContent className="py-8">
                <FileImage className="h-10 w-10 mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold mb-1">Drop an image to find its location</h3>
                <p className="text-sm text-muted-foreground">or click to browse</p>
                <input id="finder-input" type="file" accept={ACCEPTED_EXTENSIONS.join(",")} onChange={(e) => e.target.files && processFiles(e.target.files, true)} className="hidden" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="faq" className="py-16">
        <div className="container mx-auto px-4">
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

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <img src={logoImage} alt="GeoTagger" className="h-14 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-2">100% free, open source, and private</p>
          <p className="text-sm text-muted-foreground">Your photos never leave your browser. No data is collected.</p>
        </div>
      </footer>
    </div>
  );
}
