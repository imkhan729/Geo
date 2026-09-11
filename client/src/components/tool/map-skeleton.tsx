import { MapPin } from "lucide-react";

export interface MapSkeletonProps {
  className?: string;
}

export function MapSkeleton({ className = "h-[380px] w-full" }: MapSkeletonProps) {
  return (
    <div
      className={`relative rounded-xl border border-border bg-muted/30 flex flex-col items-center justify-center animate-pulse ${className}`}
      style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--border)/0.5) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
      aria-label="Loading interactive map"
      role="status"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
        <MapPin className="h-5 w-5 animate-bounce" />
      </div>
      <span className="text-xs text-muted-foreground font-medium">Loading map tiles...</span>
    </div>
  );
}

export default MapSkeleton;
