import React, { useState, useRef, useCallback } from "react";
import { Upload, Camera, MapPin, Lock, AlertCircle, FileImage } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trackUploadOpened, trackUnsupportedFormat } from "@/lib/analytics";

export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onError?: (message: string) => void;
  className?: string;
  compact?: boolean;
}

export function Dropzone({
  onFilesSelected,
  onError,
  className = "",
  compact = false,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndFilterFiles = useCallback((rawFiles: FileList | File[]): File[] => {
    const list = Array.from(rawFiles);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of list) {
      const lower = file.name.toLowerCase();
      const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));

      if (!hasValidExt) {
        const ext = file.name.split(".").pop() || "unknown";
        trackUnsupportedFormat({ extension: ext });
        errors.push(`"${file.name}" has an unsupported format. Supported formats: JPG, PNG, WebP, HEIC.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}" exceeds the 20MB file limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0 && onError) {
      onError(errors[0]); // Report the first error to toast/notification
    }

    return validFiles;
  }, [onError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const valid = validateAndFilterFiles(e.dataTransfer.files);
      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    }
  }, [validateAndFilterFiles, onFilesSelected]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const valid = validateAndFilterFiles(e.target.files);
      if (valid.length > 0) {
        onFilesSelected(valid);
      }
      // Reset input value so the same file can be selected again if needed
      e.target.value = "";
    }
  }, [validateAndFilterFiles, onFilesSelected]);

  const triggerPicker = () => {
    trackUploadOpened();
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerPicker();
    }
  };

  if (compact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerPicker}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Add more photos to queue"
        className={`cursor-pointer rounded-xl border-2 border-dashed transition-all p-3 text-center flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isDragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border hover:border-primary/40 bg-muted/20 hover:bg-muted/40"
        } ${className}`}
      >
        <Upload className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        <span className="text-xs font-semibold text-foreground">
          {isDragging ? "Drop photos here" : "Add more photos (drag & drop or click)"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          multiple
          onChange={handleInputChange}
          className="hidden"
          tabIndex={-1}
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerPicker}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Upload photos to geotag. Drag and drop or press enter to browse files."
      id="upload-widget"
      data-testid="dropzone"
      className={`group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12 text-center max-w-2xl mx-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        isDragging
          ? "border-primary bg-primary/10 scale-[1.02] shadow-xl ring-4 ring-primary/20"
          : "border-primary/30 hover:border-primary/60 bg-card/70 hover:bg-card/90 shadow-md"
      } ${className}`}
    >
      {/* Icon cluster */}
      <div className="flex items-end justify-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-muted/70 border border-border/70 flex items-center justify-center opacity-60 -rotate-6 shadow-sm group-hover:rotate-0 transition-transform">
          <Camera className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div
          className={`w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shadow-md transition-transform duration-300 ${
            isDragging ? "scale-125 bg-primary/20" : "group-hover:scale-110"
          }`}
        >
          <Upload className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-muted/70 border border-border/70 flex items-center justify-center opacity-60 rotate-6 shadow-sm group-hover:rotate-0 transition-transform">
          <MapPin className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>

      <h2 className="font-display text-xl sm:text-2xl font-bold mb-2 text-foreground">
        {isDragging ? "Drop your photos here" : "Drag and drop your photos here"}
      </h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
        or <span className="text-primary font-semibold underline underline-offset-4 decoration-primary/30 group-hover:decoration-primary">click to browse</span> from your computer or phone
      </p>

      {/* Format badges */}
      <div className="flex flex-wrap justify-center items-center gap-2 mb-6">
        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-xs font-medium px-2.5 py-0.5">
          JPG / JPEG
        </Badge>
        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-xs font-medium px-2.5 py-0.5">
          PNG
        </Badge>
        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-xs font-medium px-2.5 py-0.5">
          WebP
        </Badge>
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium px-2.5 py-0.5">
          HEIC → JPG
        </Badge>
        <span className="text-xs text-muted-foreground ml-1">Up to 20MB per photo</span>
      </div>

      {/* Privacy guarantee */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80 bg-muted/40 rounded-full px-4 py-1.5 max-w-fit mx-auto border border-border/50">
        <Lock className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
        <span>100% Client-Side: Photos stay in your browser and are never uploaded</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        multiple
        onChange={handleInputChange}
        className="hidden"
        tabIndex={-1}
      />
    </div>
  );
}
