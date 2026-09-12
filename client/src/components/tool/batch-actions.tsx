import React from "react";
import {
  Download,
  PenLine,
  Trash2,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Archive,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EclipseButton } from "@/components/ui/eclipse-button";

export interface BatchActionsProps {
  totalImages: number;
  processedCount: number;
  isProcessing: boolean;
  isWritingExif: boolean;
  hasTaggedImages: boolean;
  onWriteExif: () => void;
  onDownloadAll: () => void;
  onClearAll: () => void;
  className?: string;
}

export function BatchActions({
  totalImages,
  processedCount,
  isProcessing,
  isWritingExif,
  hasTaggedImages,
  onWriteExif,
  onDownloadAll,
  onClearAll,
  className = "",
}: BatchActionsProps) {
  const isBusy = isProcessing || isWritingExif;
  const progressPercent = totalImages > 0 ? Math.round((processedCount / totalImages) * 100) : 0;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4 overflow-hidden ${className}`}>
      {/* ── Progress Bar (visible when busy or partially complete) ── */}
      {isBusy && (
        <div className="space-y-2" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-foreground flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
              {isWritingExif ? "Embedding EXIF GPS metadata..." : "Packaging files for download..."}
            </span>
            <span className="font-mono text-muted-foreground">
              {processedCount} / {totalImages} ({progressPercent}%)
            </span>
          </div>

          <div
            className="w-full h-2.5 rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Geotagging batch progress"
          >
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Row 1: Primary Action Buttons (Side by Side Grid) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Write EXIF / Apply GPS button */}
        <EclipseButton
          text={
            isWritingExif
              ? `Writing ${processedCount}/${totalImages}...`
              : totalImages > 1
              ? `Apply GPS to All (${totalImages})`
              : "Apply GPS to Photo"
          }
          leftIcon={<PenLine className="h-4 w-4 shrink-0" aria-hidden="true" />}
          isLoading={isWritingExif}
          onClick={onWriteExif}
          disabled={isBusy || totalImages === 0}
          size="default"
          className="w-full min-h-[44px]"
          data-testid="button-write-exif"
        />

        {/* Download Button */}
        <EclipseButton
          text={
            isProcessing
              ? `Saving ${processedCount}/${totalImages}...`
              : totalImages > 1
              ? `Download All as ZIP (${totalImages})`
              : "Download Geotagged Photo"
          }
          leftIcon={
            totalImages > 1 ? (
              <Archive className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
            )
          }
          isLoading={isProcessing}
          onClick={onDownloadAll}
          disabled={isBusy || totalImages === 0}
          size="default"
          className="w-full min-h-[44px]"
          data-testid="button-download"
        />
      </div>

      {/* ── Row 2: Secondary Utility & Privacy Badge ── */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/40">
        {/* Clear All Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClearAll}
          disabled={isBusy}
          className="min-h-[36px] px-3.5 rounded-xl border-border/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 shrink-0 text-xs font-medium"
          data-testid="button-clear"
          aria-label="Clear all photos from the workspace"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          Clear
        </Button>

        {/* Privacy Note */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 py-0.5">
          <Lock className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
          <span>Photos never leave your device</span>
        </div>
      </div>
    </div>
  );
}
