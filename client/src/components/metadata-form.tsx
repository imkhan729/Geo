import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tags, FileText } from "lucide-react";

interface MetadataFormProps {
  keywords: string;
  description: string;
  onKeywordsChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function MetadataForm({
  keywords,
  description,
  onKeywordsChange,
  onDescriptionChange
}: MetadataFormProps) {
  return (
    <Card data-testid="card-metadata-form">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2" data-testid="text-metadata-title">
          <Tags className="h-5 w-5 text-primary" />
          Optional Metadata
        </CardTitle>
        <p className="text-sm text-muted-foreground" data-testid="text-metadata-instruction">
          Add keywords and description to your images
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block" data-testid="label-keywords">
            Keywords
          </label>
          <Input
            placeholder="travel, nature, sunset (comma-separated)"
            value={keywords}
            onChange={(e) => onKeywordsChange(e.target.value)}
            data-testid="input-keywords"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separate multiple keywords with commas
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block" data-testid="label-description">
            Description
          </label>
          <Textarea
            placeholder="Enter a description for the image..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            data-testid="input-description"
          />
        </div>
        
        <div className="p-3 bg-muted/50 rounded-md" data-testid="info-compatibility">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> GPS coordinates work best with JPG files. PNG and WebP have limited EXIF support, and some viewers may not display the embedded location. HEIC files will be converted to JPG.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
