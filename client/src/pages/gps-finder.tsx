import { useState, useCallback, useEffect, useRef } from "react";
import { Eye, FileImage, Copy, Check, Globe, ArrowRight, MapPin, Upload } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import L from "leaflet";
import logoImage from "@assets/Geo_Tagger_Logo_2.webp_1768827957680.jpg";
import { 
  readFileAsDataUrl,
  extractExistingGps,
  convertHeicToJpeg
} from "@/lib/geotag-utils";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <Link href="/" className="hover:opacity-80" data-testid="link-logo">
            <img src={logoImage} alt="GeoTagger" className="h-[42px]" />
          </Link>
          <nav className="hidden md:flex flex-wrap items-center gap-6 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-home">Home</Link>
            <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">Features</Link>
            <Link href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-how">How it Works</Link>
            <Link href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-faq">FAQ</Link>
          </nav>
          <ThemeToggle data-testid="button-theme" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
              <Eye className="h-3 w-3 mr-1" /> Free Tool
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">GPS Finder</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Extract GPS coordinates from any geotagged photo. Upload an image to discover where it was taken and view the exact location on a map.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span>View exact location on map</span>
              </div>
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4 text-green-500" />
                <span>Copy coordinates instantly</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-500" />
                <span>Open in Google Maps</span>
              </div>
            </div>
          </div>

          {!extractedGps ? (
            <Card
              className={`cursor-pointer transition-all border-2 border-dashed ${isDragging ? "border-green-500 bg-green-500/5" : "border-green-500/30 hover:border-green-500/50"}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={handleDrop}
              onClick={() => document.getElementById("finder-input")?.click()}
              data-testid="dropzone-finder"
            >
              <CardContent className="py-16">
                <FileImage className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold mb-2">Drop an image to find its location</h3>
                <p className="text-muted-foreground mb-4">or click to browse your files</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="outline">JPG</Badge>
                  <Badge variant="outline">PNG</Badge>
                  <Badge variant="outline">WebP</Badge>
                  <Badge variant="outline">HEIC</Badge>
                </div>
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
                <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20" data-testid="badge-location-found">Location Found</Badge>
                <h2 className="text-2xl font-bold mb-2" data-testid="text-gps-title">GPS Coordinates Extracted</h2>
                <p className="text-muted-foreground" data-testid="text-filename">{extractedGps.fileName}</p>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div ref={mapRef} className="h-[400px] rounded-t-lg" data-testid="map-finder" />
                  <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Coordinates</p>
                      <p className="text-xl font-mono font-bold" data-testid="text-coordinates">
                        {extractedGps.lat.toFixed(6)}, {extractedGps.lng.toFixed(6)}
                      </p>
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
                <Button variant="outline" onClick={() => setExtractedGps(null)} data-testid="button-check-another">
                  <Upload className="h-4 w-4 mr-2" /> Check Another Image
                </Button>
                <Link href="/">
                  <Button data-testid="button-geotag">
                    <MapPin className="h-4 w-4 mr-2" /> Geotag Your Photos
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <Card className="text-center p-6">
              <FileImage className="h-10 w-10 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">Upload Any Image</h3>
              <p className="text-sm text-muted-foreground">Support for JPG, PNG, WebP, and HEIC files up to 20MB</p>
            </Card>
            <Card className="text-center p-6">
              <MapPin className="h-10 w-10 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">View on Map</h3>
              <p className="text-sm text-muted-foreground">See the exact location where the photo was taken on an interactive map</p>
            </Card>
            <Card className="text-center p-6">
              <Globe className="h-10 w-10 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">Explore Further</h3>
              <p className="text-sm text-muted-foreground">Copy coordinates or open the location directly in Google Maps</p>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-10 mt-16">
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
                  <li><Link href="/#features" className="hover:text-foreground transition-colors">Features</Link></li>
                  <li><Link href="/#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link></li>
                  <li><Link href="/gps-finder" className="hover:text-foreground transition-colors">GPS Finder</Link></li>
                  <li><Link href="/#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                  <li><Link href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
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
