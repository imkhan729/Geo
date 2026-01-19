import { 
  MapPin, 
  Calendar, 
  Camera, 
  Smartphone, 
  Settings2, 
  Aperture, 
  Timer, 
  Gauge, 
  Zap,
  Copy,
  Download,
  Check,
  Mountain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExifData, formatCoordinates, formatCoordinatesDecimal } from "@/lib/exif-utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface MetadataPanelProps {
  data: ExifData;
  hasGps: boolean;
  rawTags: Record<string, unknown> | null;
}

interface MetadataItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}

function MetadataItem({ icon, label, value }: MetadataItemProps) {
  if (!value) return null;
  const testId = `metadata-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0" data-testid={testId}>
      <div className="p-2 rounded-md bg-muted flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5" data-testid={`${testId}-label`}>{label}</p>
        <p className="text-sm font-medium break-words" data-testid={`${testId}-value`}>{value}</p>
      </div>
    </div>
  );
}

export function MetadataPanel({ data, hasGps, rawTags }: MetadataPanelProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyCoordinates = async () => {
    if (!hasGps || !data.gps.latitude || !data.gps.longitude) return;
    
    const coords = formatCoordinatesDecimal(data.gps.latitude, data.gps.longitude);
    try {
      await navigator.clipboard.writeText(coords);
      setCopied(true);
      toast({
        title: "Coordinates copied",
        description: coords,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDownloadJson = () => {
    const exportData = {
      extracted: new Date().toISOString(),
      gps: data.gps,
      dateTime: data.dateTime,
      camera: data.camera,
      image: data.image,
      software: data.software,
      settings: {
        exposureTime: data.exposureTime,
        fNumber: data.fNumber,
        iso: data.iso,
        focalLength: data.focalLength,
        flash: data.flash,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "image-metadata.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Metadata saved as JSON file",
    });
  };

  const hasAnyData = data.dateTime || data.camera.make || data.camera.model || 
                     data.software || data.exposureTime || data.fNumber || 
                     data.iso || data.focalLength || hasGps;

  return (
    <Card data-testid="card-metadata-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2" data-testid="text-metadata-title">
            <Settings2 className="h-5 w-5 text-primary" />
            Image Metadata
          </CardTitle>
          {hasAnyData && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadJson}
              data-testid="button-download-json"
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {hasGps && data.gps.latitude && data.gps.longitude && (
          <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20" data-testid="section-gps-location">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5" data-testid="text-gps-label">GPS Location</p>
                  <p className="text-sm font-semibold" data-testid="text-coordinates">
                    {formatCoordinates(data.gps.latitude, data.gps.longitude)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1" data-testid="text-coordinates-decimal">
                    {formatCoordinatesDecimal(data.gps.latitude, data.gps.longitude)}
                  </p>
                  {data.gps.altitude && (
                    <div className="flex items-center gap-1 mt-2">
                      <Mountain className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground" data-testid="text-altitude">
                        {data.gps.altitude.toFixed(1)}m altitude
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCoordinates}
                data-testid="button-copy-coords"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {!hasGps && (
          <div className="mb-4 p-4 bg-muted/50 rounded-lg" data-testid="section-no-gps">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium" data-testid="text-no-gps-title">No location data found</p>
                <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-no-gps-desc">
                  This image does not contain GPS coordinates in its metadata.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-0">
          <MetadataItem
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            label="Date & Time"
            value={data.dateTime}
          />
          
          {(data.camera.make || data.camera.model) && (
            <MetadataItem
              icon={<Camera className="h-4 w-4 text-muted-foreground" />}
              label="Camera"
              value={[data.camera.make, data.camera.model].filter(Boolean).join(" ")}
            />
          )}
          
          <MetadataItem
            icon={<Smartphone className="h-4 w-4 text-muted-foreground" />}
            label="Software"
            value={data.software}
          />

          {(data.image.width && data.image.height) && (
            <MetadataItem
              icon={<Settings2 className="h-4 w-4 text-muted-foreground" />}
              label="Resolution"
              value={`${data.image.width} × ${data.image.height}`}
            />
          )}
          
          <MetadataItem
            icon={<Timer className="h-4 w-4 text-muted-foreground" />}
            label="Exposure Time"
            value={data.exposureTime}
          />
          
          <MetadataItem
            icon={<Aperture className="h-4 w-4 text-muted-foreground" />}
            label="Aperture"
            value={data.fNumber}
          />
          
          <MetadataItem
            icon={<Gauge className="h-4 w-4 text-muted-foreground" />}
            label="ISO"
            value={data.iso ? String(data.iso) : null}
          />
          
          <MetadataItem
            icon={<Camera className="h-4 w-4 text-muted-foreground" />}
            label="Focal Length"
            value={data.focalLength}
          />
          
          <MetadataItem
            icon={<Zap className="h-4 w-4 text-muted-foreground" />}
            label="Flash"
            value={data.flash}
          />
        </div>

        {!hasAnyData && (
          <div className="text-center py-6" data-testid="section-no-metadata">
            <p className="text-sm text-muted-foreground" data-testid="text-no-metadata">
              No EXIF metadata found in this image.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
