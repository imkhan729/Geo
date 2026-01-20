import { useState, useCallback, useEffect, useRef } from "react";
import {
  Eye, FileImage, Copy, Check, Globe, MapPin, Upload,
  Shield, Zap, Camera, Search, Info, ChevronDown,
  Smartphone, Laptop, Image as ImageIcon, Lock,
  CheckCircle, XCircle, AlertCircle, HelpCircle
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import L from "leaflet";
import logoImage from "@assets/Geo_Tagger_Logo_2.webp-removebg-preview_1768829275162.png";
import {
  readFileAsDataUrl,
  extractExistingGps,
  convertHeicToJpeg
} from "@/lib/geotag-utils";
import { useToast } from "@/hooks/use-toast";
import { updatePageSEO, SEO_CONFIG } from "@/lib/seo";

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

interface ExtractedGps {
  lat: number;
  lng: number;
  fileName: string;
}

export default function GpsFinder() {
  const [extractedGps, setExtractedGps] = useState<ExtractedGps | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    updatePageSEO(SEO_CONFIG.gpsFinder);
  }, []);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || !extractedGps) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current).setView([extractedGps.lat, extractedGps.lng], 15);
    mapInstanceRef.current = map;

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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [extractedGps]);

  const processFile = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const file = fileArray[0];

    if (!file) return;

    const isAccepted = ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isAccepted || file.size > 20 * 1024 * 1024) {
      toast({ title: "Invalid file", description: "Please upload a valid image file (JPG, PNG, WebP, HEIC)", variant: "destructive" });
      return;
    }

    try {
      let previewFile = file;
      if (file.name.toLowerCase().endsWith(".heic")) {
        const jpegBlob = await convertHeicToJpeg(file);
        previewFile = new File([jpegBlob], file.name, { type: "image/jpeg" });
      }

      const dataUrl = await readFileAsDataUrl(previewFile);
      const existingGps = extractExistingGps(dataUrl);

      if (existingGps) {
        setExtractedGps({ lat: existingGps.lat, lng: existingGps.lng, fileName: file.name });
        toast({ title: "Location found!", description: "GPS coordinates extracted successfully" });
      } else {
        toast({ title: "No GPS data", description: "This image has no location information embedded", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not process the image", variant: "destructive" });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files);
  }, [processFile]);

  const copyCoordinates = useCallback(async () => {
    if (!extractedGps) return;
    await navigator.clipboard.writeText(`${extractedGps.lat.toFixed(6)}, ${extractedGps.lng.toFixed(6)}`);
    setCopiedCoords(true);
    toast({ title: "Copied!", description: "Coordinates copied to clipboard" });
    setTimeout(() => setCopiedCoords(false), 2000);
  }, [extractedGps, toast]);

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
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="py-8 md:py-12 bg-gradient-to-b from-green-500/5 to-transparent">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20 shadow-hover">
              <Eye className="h-3 w-3 mr-1" /> Free GPS Location Finder
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Extract GPS Coordinates</span>
              <br />
              <span className="gradient-text">from Any Photo</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Discover where your photos were taken. Upload any image to instantly extract GPS location data and view it on an interactive map — 100% free and private.
            </p>

            {/* Upload Area */}
            {!extractedGps ? (
              <Card
                className={`max-w-2xl mx-auto cursor-pointer transition-all duration-500 border-2 border-dashed shadow-hover ${isDragging ? "border-green-500 bg-green-500/10 scale-105" : "border-green-500/30 hover:border-green-500/50 hover:shadow-xl"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById("finder-input")?.click()}
                data-testid="dropzone-finder"
              >
                <CardContent className="py-14">
                  <FileImage className={`h-14 w-14 mx-auto mb-5 text-green-500 transition-transform duration-300 ${isDragging ? "scale-125" : ""}`} />
                  <h3 className="text-2xl font-semibold mb-3">Drop your photo here</h3>
                  <p className="text-muted-foreground mb-5 text-lg">or click to browse your files</p>
                  <div className="flex flex-wrap justify-center gap-2 mb-5">
                    <Badge variant="outline" className="text-sm">JPG</Badge>
                    <Badge variant="outline" className="text-sm">PNG</Badge>
                    <Badge variant="outline" className="text-sm">WebP</Badge>
                    <Badge variant="outline" className="text-sm">HEIC</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">All processing happens locally in your browser. Your photos never leave your device.</p>
                  <input
                    id="finder-input"
                    type="file"
                    accept={ACCEPTED_EXTENSIONS.join(",")}
                    onChange={(e) => e.target.files && processFile(e.target.files)}
                    className="hidden"
                    data-testid="input-finder-file"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20" data-testid="badge-location-found">
                    <CheckCircle className="h-3 w-3 mr-1" /> Location Found
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-gps-title">GPS Coordinates Extracted</h2>
                  <p className="text-muted-foreground" data-testid="text-filename">{extractedGps.fileName}</p>
                </div>

                <Card className="max-w-3xl mx-auto">
                  <CardContent className="p-0">
                    <div ref={mapRef} className="h-[400px] md:h-[500px] rounded-t-lg" data-testid="map-finder" />
                    <div className="p-6 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">GPS Coordinates</p>
                          <p className="text-xl md:text-2xl font-mono font-bold" data-testid="text-coordinates">
                            {extractedGps.lat.toFixed(6)}, {extractedGps.lng.toFixed(6)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={copyCoordinates} data-testid="button-copy-coords">
                            {copiedCoords ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                            {copiedCoords ? "Copied!" : "Copy Coordinates"}
                          </Button>
                          <Button onClick={() => window.open(`https://www.google.com/maps?q=${extractedGps.lat},${extractedGps.lng}`, "_blank")} data-testid="button-open-maps">
                            <Globe className="h-4 w-4 mr-2" /> Open in Google Maps
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-wrap justify-center gap-4">
                  <Button variant="outline" size="lg" onClick={() => setExtractedGps(null)} data-testid="button-check-another">
                    <Upload className="h-4 w-4 mr-2" /> Check Another Photo
                  </Button>
                  <Link href="/">
                    <Button size="lg" data-testid="button-geotag">
                      <MapPin className="h-4 w-4 mr-2" /> Add GPS to Your Photos
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Instant GPS extraction</span>
              <span className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> 100% private & secure</span>
              <span className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> No uploads required</span>
              <span className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Works on all devices</span>
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
