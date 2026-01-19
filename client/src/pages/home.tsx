import { useState, useCallback } from "react";
import { MapPin, Download, Loader2, Tags, Coffee, Github, RefreshCw, CheckCircle } from "lucide-react";
import { MultiImageUploader } from "@/components/multi-image-uploader";
import { GeotagMap } from "@/components/geotag-map";
import { MetadataForm } from "@/components/metadata-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ImageFile, 
  GeotagData, 
  addGeotagToImage, 
  downloadGeotaggedImage 
} from "@/lib/geotag-utils";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [keywords, setKeywords] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const { toast } = useToast();

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  const handleReset = useCallback(() => {
    setImages([]);
    setLatitude(40.7128);
    setLongitude(-74.0060);
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
      } catch (error) {
        console.error("Error processing image:", error);
        updatedImages[i] = { 
          ...img, 
          status: "error", 
          error: error instanceof Error ? error.message : "Failed to process" 
        };
        errorCount++;
      }

      setImages([...updatedImages]);
      setProcessedCount(i + 1);
    }

    setIsProcessing(false);

    if (successCount > 0) {
      toast({
        title: "Processing complete",
        description: `${successCount} image${successCount !== 1 ? "s" : ""} geotagged and downloaded`,
      });
    }

    if (errorCount > 0) {
      toast({
        title: "Some images failed",
        description: `${errorCount} image${errorCount !== 1 ? "s" : ""} could not be processed`,
        variant: "destructive",
      });
    }
  }, [images, latitude, longitude, keywords, description, toast]);

  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight" data-testid="text-logo-title">FreeGeoTagger</h1>
                <p className="text-xs text-muted-foreground hidden sm:block" data-testid="text-logo-subtitle">Add GPS to your photos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {hasImages && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  data-testid="button-reset"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {!hasImages ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-main-heading">
                Free Photo Geotagging Tool
              </h2>
              <p className="text-lg text-muted-foreground mb-6" data-testid="text-main-subtitle">
                Add GPS coordinates to your photos - 100% free, no signup required
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8" data-testid="badge-row-features">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span data-testid="text-badge-gps">Add GPS Data</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tags className="h-4 w-4 text-yellow-500" />
                  <span data-testid="text-badge-batch">Batch Processing</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Download className="h-4 w-4 text-green-500" />
                  <span data-testid="text-badge-privacy">100% Private</span>
                </div>
              </div>
            </div>
            
            <MultiImageUploader
              images={images}
              onImagesChange={setImages}
            />

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="text-center p-6" data-testid="card-feature-upload">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2" data-testid="text-feature-title-upload">Upload Images</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-feature-desc-upload">
                  Upload one or multiple photos (JPG, PNG, WebP, HEIC supported)
                </p>
              </Card>
              
              <Card className="text-center p-6" data-testid="card-feature-location">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2" data-testid="text-feature-title-location">Set Location</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-feature-desc-location">
                  Click on the map or search for a place to set coordinates
                </p>
              </Card>
              
              <Card className="text-center p-6" data-testid="card-feature-download">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2" data-testid="text-feature-title-download">Download</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-feature-desc-download">
                  Get your geotagged photos with embedded GPS coordinates
                </p>
              </Card>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <MultiImageUploader
                  images={images}
                  onImagesChange={setImages}
                />
                
                <MetadataForm
                  keywords={keywords}
                  description={description}
                  onKeywordsChange={setKeywords}
                  onDescriptionChange={setDescription}
                />
              </div>
              
              <div className="space-y-6">
                <GeotagMap
                  latitude={latitude}
                  longitude={longitude}
                  onLocationChange={handleLocationChange}
                />
                
                <Card className="p-6" data-testid="card-action-panel">
                  <div className="flex flex-col gap-4">
                    <div className="text-center">
                      <h3 className="font-semibold mb-2" data-testid="text-action-title">
                        Ready to Geotag
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid="text-action-summary">
                        {images.length} image{images.length !== 1 ? "s" : ""} will be tagged with coordinates:
                      </p>
                      <p className="text-sm font-mono mt-1" data-testid="text-coordinates">
                        {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </p>
                    </div>
                    
                    <Button
                      size="lg"
                      onClick={processAndDownloadAll}
                      disabled={isProcessing || images.length === 0}
                      className="w-full"
                      data-testid="button-process-all"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing {processedCount}/{images.length}...
                        </>
                      ) : (
                        <>
                          <Download className="h-5 w-5 mr-2" />
                          Geotag & Download All
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center" data-testid="text-processing-note">
                      Files will be saved with "_geotagged" suffix
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-auto" data-testid="footer">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span data-testid="text-privacy-notice">All processing happens in your browser</span>
              <span className="hidden sm:inline">•</span>
              <span data-testid="text-open-source">Open Source (MIT)</span>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                data-testid="link-github"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a 
                href="https://buymeacoffee.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                data-testid="link-donate"
              >
                <Coffee className="h-4 w-4" />
                Donate
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
