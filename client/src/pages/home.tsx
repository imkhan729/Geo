import { useState, useCallback } from "react";
import { MapPin, Shield, Zap, RefreshCw, Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/image-uploader";
import { MetadataPanel } from "@/components/metadata-panel";
import { LocationMap } from "@/components/location-map";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { extractExifData, type ExifResult } from "@/lib/exif-utils";

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exifResult, setExifResult] = useState<ExifResult | null>(null);

  const handleImageSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setImageFile(file);
    
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    try {
      const result = await extractExifData(file);
      setExifResult(result);
    } catch (error) {
      setExifResult({
        success: false,
        hasGps: false,
        data: null,
        error: "Failed to process image",
        rawTags: null,
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(null);
    setPreviewUrl(null);
    setExifResult(null);
    setIsProcessing(false);
  }, [previewUrl]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight" data-testid="text-logo-title">GeoFinder</h1>
                <p className="text-xs text-muted-foreground hidden sm:block" data-testid="text-logo-subtitle">Image Location Finder</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {imageFile && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  data-testid="button-reset-header"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Image
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!imageFile && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-main-heading">
                Free Image Location Finder
              </h2>
              <p className="text-lg text-muted-foreground mb-6" data-testid="text-main-subtitle">
                Upload an image to find where it was taken using GPS metadata
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8" data-testid="badge-row-features">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span data-testid="text-badge-private">100% Private</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span data-testid="text-badge-instant">Instant Results</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span data-testid="text-badge-free">Free Forever</span>
                </div>
              </div>
            </div>
            
            <ImageUploader
              onImageSelect={handleImageSelect}
              isProcessing={isProcessing}
              previewUrl={previewUrl}
              onReset={handleReset}
            />

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="text-center p-6" data-testid="card-feature-privacy">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2" data-testid="text-feature-title-privacy">Privacy First</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-feature-desc-privacy">
                  All processing happens in your browser. We never see or store your images.
                </p>
              </Card>
              
              <Card className="text-center p-6" data-testid="card-feature-analysis">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2" data-testid="text-feature-title-analysis">Instant Analysis</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-feature-desc-analysis">
                  Get location data and camera settings in milliseconds, no waiting.
                </p>
              </Card>
              
              <Card className="text-center p-6" data-testid="card-feature-map">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2" data-testid="text-feature-title-map">Interactive Map</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-feature-desc-map">
                  View the exact location on an interactive map with zoom controls.
                </p>
              </Card>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="max-w-2xl mx-auto text-center py-12" data-testid="status-processing">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium" data-testid="text-processing-title">Extracting metadata...</p>
            <p className="text-sm text-muted-foreground mt-1" data-testid="text-processing-subtitle">This only takes a moment</p>
          </div>
        )}

        {imageFile && !isProcessing && exifResult && (
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <ImageUploader
                  onImageSelect={handleImageSelect}
                  isProcessing={isProcessing}
                  previewUrl={previewUrl}
                  onReset={handleReset}
                />
                
                {exifResult.data && (
                  <MetadataPanel 
                    data={exifResult.data} 
                    hasGps={exifResult.hasGps}
                    rawTags={exifResult.rawTags}
                  />
                )}
              </div>
              
              <div>
                {exifResult.hasGps && exifResult.data?.gps.latitude && exifResult.data?.gps.longitude ? (
                  <LocationMap 
                    latitude={exifResult.data.gps.latitude} 
                    longitude={exifResult.data.gps.longitude} 
                  />
                ) : (
                  <Card className="h-full flex items-center justify-center p-8" data-testid="card-no-location">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2" data-testid="text-no-location-title">No Location Data</h3>
                      <p className="text-muted-foreground text-sm max-w-xs mx-auto" data-testid="text-no-location-desc">
                        This image doesn't contain GPS coordinates. The location where the photo was taken cannot be determined.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-auto" data-testid="footer">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span data-testid="text-privacy-notice">Images are processed locally. We never store your files.</span>
            </div>
            <p data-testid="text-copyright">&copy; {new Date().getFullYear()} GeoFinder. Free and open-source.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
