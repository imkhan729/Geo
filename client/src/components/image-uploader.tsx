import { useState, useRef, useCallback } from "react";
import { Upload, Image as ImageIcon, X, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  isProcessing: boolean;
  previewUrl: string | null;
  onReset: () => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/tiff", "image/heic", "image/webp"];

export function ImageUploader({ onImageSelect, isProcessing, previewUrl, onReset }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
      return "Please upload a JPG, PNG, TIFF, HEIC, or WebP image.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 20MB.";
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onImageSelect(file);
  }, [onImageSelect]);

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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  if (previewUrl) {
    return (
      <Card className="relative overflow-hidden">
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Uploaded image preview" 
            className="w-full max-h-80 object-contain bg-muted/30"
            data-testid="img-preview"
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm"
            onClick={onReset}
            data-testid="button-reset"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card
        className={`relative cursor-pointer transition-all duration-200 hover-elevate ${
          isDragging 
            ? "border-primary border-2 bg-primary/5" 
            : "border-dashed border-2"
        } ${isProcessing ? "pointer-events-none opacity-60" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        data-testid="dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/tiff,image/heic,image/webp"
          onChange={handleFileChange}
          className="hidden"
          data-testid="input-file"
        />
        
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="mb-4 p-4 rounded-full bg-primary/10">
            {isDragging ? (
              <ImageIcon className="h-10 w-10 text-primary" />
            ) : (
              <Upload className="h-10 w-10 text-primary" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold mb-2" data-testid="text-upload-title">
            {isDragging ? "Drop your image here" : "Upload an image"}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-4" data-testid="text-upload-instruction">
            Drag and drop or click to browse
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground" data-testid="badge-row-formats">
            <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate" data-testid="badge-format-jpg">JPG</Badge>
            <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate" data-testid="badge-format-png">PNG</Badge>
            <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate" data-testid="badge-format-tiff">TIFF</Badge>
            <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate" data-testid="badge-format-heic">HEIC</Badge>
            <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate" data-testid="badge-format-webp">WebP</Badge>
          </div>
          
          <p className="text-xs text-muted-foreground mt-3" data-testid="text-file-size-limit">
            Max file size: 20MB
          </p>
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md" data-testid="error-upload">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
