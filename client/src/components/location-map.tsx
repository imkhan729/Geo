import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeafletMap } from "@/components/tool/leaflet-map";

interface LocationMapProps {
  latitude: number;
  longitude: number;
}

export function LocationMap({ latitude, longitude }: LocationMapProps) {
  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank");
  };

  const openInOpenStreetMap = () => {
    window.open(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`, "_blank");
  };

  return (
    <Card data-testid="card-location-map">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2" data-testid="text-map-title">
            <MapPin className="h-5 w-5 text-primary" />
            Photo Location
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openInGoogleMaps}
              data-testid="button-google-maps"
            >
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Google Maps
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openInOpenStreetMap}
              data-testid="button-osm"
            >
              <ExternalLink className="h-4 w-4 mr-1.5" />
              OpenStreetMap
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px] rounded-md overflow-hidden border border-border" data-testid="map-container">
          <LeafletMap
            latitude={latitude}
            longitude={longitude}
            readOnly={true}
            className="w-full h-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
