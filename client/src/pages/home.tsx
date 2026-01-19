import { useState, useCallback, useEffect, useRef } from "react";
import { 
  Download, Loader2, Upload, X, Search, Locate, 
  CheckCircle, AlertCircle, Camera, Shield, Zap,
  ChevronDown, Sparkles, PenLine, Trash2, HelpCircle
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
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

export default function Home() {
  const [mode, setMode] = useState<"landing" | "geotagger">("landing");
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
  const { toast } = useToast();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

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

  const faqs = [
    { q: "Is this tool really free?", a: "Yes! FreeGeoTagger is 100% free with no hidden costs, subscriptions, or watermarks." },
    { q: "Are my photos uploaded to any server?", a: "No. All processing happens directly in your browser. Your photos never leave your device." },
    { q: "What file formats are supported?", a: "We support JPG, JPEG, PNG, WebP, and HEIC files up to 20MB each." },
    { q: "Will GPS work with PNG files?", a: "PNG has limited EXIF support. GPS coordinates may not display in all viewers. JPG works best." },
    { q: "Can I geotag multiple photos at once?", a: "Yes! Upload multiple photos and they'll all get the same GPS coordinates you select." },
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
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 flex items-center justify-between h-14">
            <button onClick={() => { setMode("landing"); setImages([]); }} className="hover:opacity-80" data-testid="button-home">
              <img src={logoImage} alt="GeoTagger" className="h-[42px]" />
            </button>
            <ThemeToggle data-testid="button-theme-toggle" />
          </div>
        </header>

        <main className="flex-1 p-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-3">
                <Card className="overflow-hidden">
                  <CardHeader className="py-3 px-4 border-b border-border">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-sm font-medium" data-testid="text-image-count">{images.length} image{images.length !== 1 ? "s" : ""}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => document.getElementById("add-more")?.click()} data-testid="button-add-more">
                        <Upload className="h-4 w-4 mr-1" /> Add more
                      </Button>
                      <input id="add-more" type="file" accept={ACCEPTED_EXTENSIONS.join(",")} multiple onChange={(e) => e.target.files && processFiles(e.target.files)} className="hidden" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                      {currentImage && (
                        <img src={currentImage.preview} alt={currentImage.name} className="w-full h-full object-contain" data-testid="img-preview-main" />
                      )}
                    </div>
                    {images.length > 1 && (
                      <div className="p-2 border-t border-border overflow-x-auto">
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

                <div ref={mapRef} className="flex-1 min-h-[300px] rounded-lg overflow-hidden border border-border" data-testid="map-container" />
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
                  <Button onClick={processAndDownloadAll} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700" data-testid="button-write-exif">
                    {isProcessing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing {processedCount}/{images.length}</>
                    ) : (
                      <><PenLine className="h-4 w-4 mr-2" /> Write EXIF Tags</>
                    )}
                  </Button>
                  <Button onClick={processAndDownloadAll} disabled={isProcessing} variant="outline" className="bg-green-600 hover:bg-green-700 text-white border-green-600" data-testid="button-download">
                    <Download className="h-4 w-4 mr-2" /> Download
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <a href="/" className="hover:opacity-80" data-testid="link-logo">
            <img src={logoImage} alt="GeoTagger" className="h-[42px]" />
          </a>
          <nav className="hidden md:flex flex-wrap items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-how-it-works">How it Works</a>
            <a href="/gps-finder" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-gps-finder">GPS Finder</a>
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

      <section id="what-is-geotagger" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">What is GeoTagger?</h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="text-lg leading-relaxed">
                GeoTagger is a professional-grade, browser-based tool designed to embed GPS coordinates directly into your digital photographs. This process, known as geotagging, adds precise location metadata to your images, enabling them to be organized, searched, and displayed on maps based on where they were captured.
              </p>
              <p className="leading-relaxed">
                Whether you're a professional photographer cataloging shoots across multiple locations, a real estate agent documenting property listings, a researcher conducting field studies, or simply someone who wants to remember exactly where a special moment was captured — GeoTagger provides the solution you need.
              </p>
              <p className="leading-relaxed">
                Unlike traditional photo management software, GeoTagger operates entirely within your web browser. Your images are never uploaded to external servers, ensuring complete privacy and data security. The embedded GPS coordinates become part of the image's EXIF metadata, making them universally compatible with photo viewers, social media platforms, and mapping applications.
              </p>
            </div>
          </div>
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

      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="md:max-w-sm">
              <img src={logoImage} alt="GeoTagger" className="h-[59px] mb-4" />
              <p className="text-sm text-muted-foreground mb-2">100% free, open source, and private.</p>
              <p className="text-sm text-muted-foreground">Your photos never leave your browser. No data is collected.</p>
            </div>
            <div className="flex flex-wrap gap-8">
              <div>
                <h4 className="font-semibold mb-3">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#features" className="hover:text-foreground transition-colors" data-testid="link-footer-features">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-foreground transition-colors" data-testid="link-footer-how">How it Works</a></li>
                  <li><a href="/gps-finder" className="hover:text-foreground transition-colors" data-testid="link-footer-finder">GPS Finder</a></li>
                  <li><a href="#faq" className="hover:text-foreground transition-colors" data-testid="link-footer-faq">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-footer-privacy">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-foreground transition-colors" data-testid="link-footer-terms">Terms of Service</a></li>
                  <li><a href="/cookies" className="hover:text-foreground transition-colors" data-testid="link-footer-cookies">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} GeoTagger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
