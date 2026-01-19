import { useCallback, useState } from "react";
import { Upload, X, ImageIcon, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageFile, generateId, readFileAsDataUrl, extractExistingGps, convertHeicToJpeg } from "@/lib/geotag-utils";

interface MultiImageUploaderProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

export function MultiImageUploader({
  images,
  onImagesChange,
  maxFiles = 20,
  maxSizeMB = 20
}: MultiImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAcceptedFile = (file: File): boolean => {
    const typeMatch = ACCEPTED_TYPES.includes(file.type);
    const extMatch = ACCEPTED_EXTENSIONS.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    return typeMatch || extMatch;
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    
    if (images.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    const newImages: ImageFile[] = [];

    for (const file of fileArray) {
      if (!isAcceptedFile(file)) {
        setError(`Unsupported file type: ${file.name}`);
        continue;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large: ${file.name} (max ${maxSizeMB}MB)`);
        continue;
      }

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
        setError(`Failed to process: ${file.name}`);
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
  }, [images, onImagesChange, maxFiles, maxSizeMB]);

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
    onImagesChange(images.filter(img => img.id !== id));
  }, [images, onImagesChange]);

  const clearAll = useCallback(() => {
    onImagesChange([]);
  }, [onImagesChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <Card
        className={`relative cursor-pointer transition-colors hover-elevate ${
          isDragging ? "border-primary bg-primary/5" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
        data-testid="dropzone-multi"
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
        
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
          <div className="mb-4 p-4 rounded-full bg-primary/10">
            {isDragging ? (
              <ImageIcon className="h-10 w-10 text-primary" />
            ) : (
              <Upload className="h-10 w-10 text-primary" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold mb-2" data-testid="text-upload-title">
            {isDragging ? "Drop images here" : "Upload images to geotag"}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-4" data-testid="text-upload-instruction">
            Drag and drop or click to browse (up to {maxFiles} images)
          </p>
          
          <div className="flex flex-wrap justify-center gap-2" data-testid="badge-row-formats">
            <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate" data-testid="badge-format-jpg">JPG</Badge>
            <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate" data-testid="badge-format-png">PNG</Badge>
            <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate" data-testid="badge-format-webp">WebP</Badge>
            <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate" data-testid="badge-format-heic">HEIC</Badge>
          </div>
          
          <p className="text-xs text-muted-foreground mt-3" data-testid="text-file-size-limit">
            Max file size: {maxSizeMB}MB each
          </p>
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md" data-testid="error-upload">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium" data-testid="text-image-count">
              {images.length} image{images.length !== 1 ? "s" : ""} selected
            </h4>
            <Button variant="ghost" size="sm" onClick={clearAll} data-testid="button-clear-all">
              Clear all
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" data-testid="grid-thumbnails">
            {images.map((img) => (
              <Card key={img.id} className="relative group overflow-visible" data-testid={`card-image-${img.id}`}>
                <div className="aspect-square relative overflow-hidden rounded-t-md">
                  <img
                    src={img.preview}
                    alt={img.name}
                    className="w-full h-full object-cover"
                    data-testid={`img-thumbnail-${img.id}`}
                  />
                  
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 invisible group-hover:visible transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    data-testid={`button-remove-${img.id}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {img.status === "processing" && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                  
                  {img.status === "success" && (
                    <div className="absolute top-1 left-1">
                      <Badge variant="default" className="bg-green-600 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Done
                      </Badge>
                    </div>
                  )}
                  
                  {img.status === "error" && (
                    <div className="absolute top-1 left-1">
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="p-2">
                  <p className="text-xs font-medium truncate" data-testid={`text-filename-${img.id}`}>
                    {img.name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(img.size)}
                    </span>
                    {img.existingGps && (
                      <Badge variant="outline" className="text-xs no-default-hover-elevate" data-testid={`badge-has-gps-${img.id}`}>
                        Has GPS
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
