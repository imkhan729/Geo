import { useState, useCallback, useEffect, useRef } from "react";
import { MapPin, Download, Loader2, Tags, Coffee, Github, RefreshCw, CheckCircle, Upload, X, Search, Navigation, Locate, ImageIcon, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export default function Home() {
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
  const { toast } = useToast();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current).setView([latitude, longitude], 4);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const customIcon = L.divIcon({
      html: `
        <div style="
          background-color: #e74c3c;
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>
      `,
      className: "custom-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });

    const marker = L.marker([latitude, longitude], { 
      icon: customIcon,
      draggable: true 
    }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setLatitude(pos.lat);
      setLongitude(pos.lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setLatitude(lat);
      setLongitude(lng);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

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
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([result.lat, result.lng], 15);
        }
        toast({
          title: "Location found",
          description: result.displayName.substring(0, 80),
        });
      } else {
        toast({
          title: "Location not found",
          description: "Try a different search term",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Search failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, toast]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
        }
        toast({
          title: "Location found",
          description: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
        setIsLocating(false);
      },
      (error) => {
        toast({
          title: "Location error",
          description: error.message,
          variant: "destructive",
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [toast]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newImages: ImageFile[] = [];

    for (const file of fileArray) {
      const isAccepted = ACCEPTED_EXTENSIONS.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      
      if (!isAccepted) continue;
      if (file.size > 20 * 1024 * 1024) continue;

      try {
        let previewFile = file;
        
        if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
          const jpegBlob = await convertHeicToJpeg(file);
          previewFile = new File([jpegBlob], file.name, { type: "image/jpeg" });
        }

        const dataUrl = await readFileAsDataUrl(previewFile);
        const existingGps = file.type === "image/jpeg" || file.type === "image/jpg" 
          ? extractExistingGps(dataUrl) 
          : null;

        newImages.push({
          id: generateId(),
          file,
          preview: dataUrl,
          name: file.name,
          type: file.type || "image/heic",
          size: file.size,
          existingGps,
          status: "pending"
        });
      } catch (err) {
        console.error("Error processing file:", err);
      }
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const handleReset = useCallback(() => {
    setImages([]);
    setKeywords("");
    setDescription("");
    setProcessedCount(0);
  }, []);

  const processAndDownloadAll = useCallback(async () => {
    if (images.length === 0) {
      toast({
        title: "No images",
        description: "Please upload at least one image",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);

    const geotag: GeotagData = {
      latitude,
      longitude,
      keywords: keywords || undefined,
      description: description || undefined,
    };

    const updatedImages = [...images];
    let successCount = 0;

    for (let i = 0; i < updatedImages.length; i++) {
      const img = updatedImages[i];
      updatedImages[i] = { ...img, status: "processing" };
      setImages([...updatedImages]);

      try {
        const blob = await addGeotagToImage(img.file, geotag);
        downloadGeotaggedImage(blob, img.name);
        updatedImages[i] = { ...img, status: "success" };
        successCount++;
      } catch (error) {
        console.error("Error processing image:", error);
        updatedImages[i] = { 
          ...img, 
          status: "error", 
          error: error instanceof Error ? error.message : "Failed to process" 
        };
      }

      setImages([...updatedImages]);
      setProcessedCount(i + 1);
    }

    setIsProcessing(false);

    if (successCount > 0) {
      toast({
        title: "Done!",
        description: `${successCount} image${successCount !== 1 ? "s" : ""} geotagged`,
      });
    }
  }, [images, latitude, longitude, keywords, description, toast]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h1 className="text-base font-bold" data-testid="text-logo-title">FreeGeoTagger</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {images.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleReset}
                  data-testid="button-reset"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: "calc(100vh - 120px)" }}>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search for a place or address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pr-10"
                  data-testid="input-search-location"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={handleSearch}
                  disabled={isSearching}
                  data-testid="button-search-location"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                title="Use my location"
                data-testid="button-use-my-location"
              >
                {isLocating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Locate className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div 
              ref={mapRef} 
              className="flex-1 min-h-[300px] rounded-md overflow-hidden border border-border"
              data-testid="map-container"
            />
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8">Lat</span>
                <Input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={latitude.toFixed(6)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && validateCoordinates(val, longitude)) {
                      setLatitude(val);
                    }
                  }}
                  className="h-8 text-sm"
                  data-testid="input-latitude"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8">Lon</span>
                <Input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={longitude.toFixed(6)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && validateCoordinates(latitude, val)) {
                      setLongitude(val);
                    }
                  }}
                  className="h-8 text-sm"
                  data-testid="input-longitude"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div
              className={`flex-1 min-h-[200px] rounded-md border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragging 
                  ? "border-primary bg-primary/10" 
                  : "border-sky-400 bg-sky-500/10 hover:bg-sky-500/20"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
              data-testid="dropzone"
            >
              <input
                id="file-input"
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(",")}
                multiple
                onChange={handleFileInput}
                className="hidden"
                data-testid="input-files"
              />
              
              {images.length === 0 ? (
                <div className="text-center p-6">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-sky-500" />
                  <p className="text-lg font-medium text-sky-600 dark:text-sky-400 mb-1" data-testid="text-upload-title">
                    Drop
                  </p>
                  <p className="text-sky-600 dark:text-sky-400 font-medium">
                    JPG / HEIC / PNG / WebP
                  </p>
                  <p className="text-sky-600 dark:text-sky-400 mb-1">
                    photos here
                  </p>
                  <p className="text-sky-500 text-sm">or</p>
                  <p className="text-sky-600 dark:text-sky-400 font-medium">
                    click to upload
                  </p>
                </div>
              ) : (
                <div className="w-full h-full p-3 overflow-auto">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {images.map((img) => (
                      <div key={img.id} className="relative group aspect-square" data-testid={`card-image-${img.id}`}>
                        <img
                          src={img.preview}
                          alt={img.name}
                          className="w-full h-full object-cover rounded-md"
                          data-testid={`img-thumbnail-${img.id}`}
                        />
                        
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5 invisible group-hover:visible"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(img.id);
                          }}
                          data-testid={`button-remove-${img.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>

                        {img.status === "processing" && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        )}
                        
                        {img.status === "success" && (
                          <div className="absolute bottom-1 left-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                        )}
                        
                        {img.status === "error" && (
                          <div className="absolute bottom-1 left-1">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div 
                      className="aspect-square border-2 border-dashed border-sky-400 rounded-md flex items-center justify-center cursor-pointer hover:bg-sky-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById("file-input")?.click();
                      }}
                    >
                      <Upload className="h-6 w-6 text-sky-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <Card className="p-4" data-testid="card-options">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Keywords (optional)</label>
                    <Input
                      placeholder="travel, nature, sunset"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="h-8 text-sm"
                      data-testid="input-keywords"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Description (optional)</label>
                    <Textarea
                      placeholder="Enter a description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="text-sm resize-none"
                      data-testid="input-description"
                    />
                  </div>
                  
                  <Button
                    onClick={processAndDownloadAll}
                    disabled={isProcessing || images.length === 0}
                    className="w-full"
                    data-testid="button-process-all"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing {processedCount}/{images.length}...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Geotag & Download ({images.length})
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-3" data-testid="footer">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span data-testid="text-privacy-notice">100% private - all processing in your browser</span>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                data-testid="link-github"
              >
                <Github className="h-3 w-3" />
                GitHub
              </a>
              <a 
                href="https://buymeacoffee.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                data-testid="link-donate"
              >
                <Coffee className="h-3 w-3" />
                Donate
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
