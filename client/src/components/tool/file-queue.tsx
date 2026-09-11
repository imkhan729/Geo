import React from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Download,
  Trash2,
  Upload,
  FileImage,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageFile, formatFileSize, formatCoordinates } from "@/lib/geotag-utils";

export interface FileQueueProps {
  images: ImageFile[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onRemoveImage: (id: string) => void;
  onClearAll: () => void;
  onAddMoreClick: () => void;
  onDownloadSingle?: (image: ImageFile) => void;
  className?: string;
}

export function FileQueue({
  images,
  selectedIndex,
  onSelectIndex,
  onRemoveImage,
  onClearAll,
  onAddMoreClick,
  onDownloadSingle,
  className = "",
}: FileQueueProps) {
  if (images.length === 0) return null;

  const totalBytes = images.reduce((sum, img) => sum + img.size, 0);
  const formattedTotalSize = formatFileSize(totalBytes);
  const successCount = images.filter((img) => img.status === "success").length;

  return (
    <div className={`flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden ${className}`}>
      {/* Queue Toolbar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-muted/30 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 font-mono text-xs font-semibold px-2 py-0.5">
            {images.length} {images.length === 1 ? "Photo" : "Photos"}
          </Badge>
          <span className="text-xs text-muted-foreground">({formattedTotalSize})</span>
          {successCount > 0 && (
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-xs font-medium px-2 py-0.5">
              <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
              {successCount} tagged
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddMoreClick}
            className="h-8 text-xs font-medium border-primary/25 hover:border-primary/50 text-primary hover:bg-primary/10"
            data-testid="button-add-more"
          >
            <Upload className="h-3 w-3 mr-1.5" aria-hidden="true" />
            Add More
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            data-testid="button-clear-all"
          >
            <Trash2 className="h-3 w-3 mr-1.5" aria-hidden="true" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Scrollable File Card List */}
      <div
        className="p-3 max-h-[380px] overflow-y-auto space-y-2.5 divide-y divide-border/30"
        role="region"
        aria-label="Uploaded photos queue"
        tabIndex={0}
      >
        {images.map((img, idx) => {
          const isSelected = idx === selectedIndex;
          const ext = img.name.split(".").pop()?.toUpperCase() || "IMG";
          const formattedSize = formatFileSize(img.size);

          return (
            <div
              key={img.id}
              onClick={() => onSelectIndex(idx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectIndex(idx);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Photo ${idx + 1} of ${images.length}: ${img.name}. ${
                isSelected ? "Currently selected." : "Click to select."
              }`}
              className={`pt-2.5 first:pt-0 group relative flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? "border-primary/60 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                  : "border-border/60 hover:border-border hover:bg-muted/30"
              }`}
              data-testid={`queue-item-${idx}`}
            >
              {/* Thumbnail Container */}
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted/60 shrink-0 border border-border/60 flex items-center justify-center">
                <img
                  src={img.preview}
                  alt={img.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {img.status === "processing" && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" aria-hidden="true" />
                  </div>
                )}
                {img.status === "success" && (
                  <div className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                    <CheckCircle className="h-3 w-3" aria-hidden="true" />
                  </div>
                )}
                {img.status === "error" && (
                  <div className="absolute bottom-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* Photo Metadata Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground truncate max-w-[180px] sm:max-w-[260px]" title={img.name}>
                    {img.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-border bg-muted/40 shrink-0">
                    {ext}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                  <span>{formattedSize}</span>
                  <span>•</span>
                  {img.existingGps ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      GPS Detected ({img.existingGps.lat.toFixed(3)}, {img.existingGps.lng.toFixed(3)})
                    </span>
                  ) : (
                    <span className="text-muted-foreground/70">No GPS</span>
                  )}
                </div>

                {/* Status indicator badge */}
                <div className="mt-1 flex items-center gap-1.5">
                  {img.status === "pending" && (
                    <span className="text-[11px] text-muted-foreground">Ready to tag</span>
                  )}
                  {img.status === "processing" && (
                    <span className="text-[11px] text-primary flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                      Writing EXIF...
                    </span>
                  )}
                  {img.status === "success" && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" aria-hidden="true" />
                      EXIF Tagged & Verified
                    </span>
                  )}
                  {img.status === "error" && (
                    <span className="text-[11px] text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      {img.error || "Failed to process"}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {img.status === "success" && onDownloadSingle && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadSingle(img);
                    }}
                    className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                    title={`Download ${img.name}`}
                    aria-label={`Download tagged photo ${img.name}`}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(img.id);
                  }}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  title={`Remove ${img.name}`}
                  aria-label={`Remove photo ${img.name}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
