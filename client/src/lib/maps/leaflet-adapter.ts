import type { MapPickerAdapter } from "../geocoding/types";

let _L: any = null;
async function getL() {
  if (!_L) {
    const leafletUrl = "/vendor/leaflet.esm.js";
    const leaflet = await import(/* @vite-ignore */ leafletUrl);
    _L = leaflet.default ?? leaflet;
  }
  return _L;
}

export class LeafletAdapter implements MapPickerAdapter {
  private map: any = null;
  private marker: any = null;
  private changeCallbacks: Array<(lat: number, lng: number) => void> = [];
  private isDestroyed = false;

  async init(
    container: HTMLElement,
    options: { lat: number; lng: number; zoom: number; readOnly?: boolean }
  ): Promise<void> {
    if (this.isDestroyed || !container) return;

    const L = await getL();
    if (this.isDestroyed) return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const { lat, lng, zoom, readOnly = false } = options;

    const map = L.map(container, {
      scrollWheelZoom: "center",
    }).setView([lat, lng], zoom);
    this.map = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const customIcon = L.divIcon({
      html: `<div style="background:#2D6A4F;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 3px 10px rgba(45,106,79,0.5);"></div>`,
      className: "custom-leaflet-marker",
      iconSize: [26, 26],
      iconAnchor: [13, 26],
    });

    const marker = L.marker([lat, lng], {
      icon: customIcon,
      draggable: !readOnly,
    }).addTo(map);
    this.marker = marker;

    if (!readOnly) {
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        const roundedLat = Math.round(pos.lat * 1000000) / 1000000;
        const roundedLng = Math.round(pos.lng * 1000000) / 1000000;
        this.notifyChange(roundedLat, roundedLng);
      });

      map.on("click", (e: any) => {
        const roundedLat = Math.round(e.latlng.lat * 1000000) / 1000000;
        const roundedLng = Math.round(e.latlng.lng * 1000000) / 1000000;
        marker.setLatLng([roundedLat, roundedLng]);
        this.notifyChange(roundedLat, roundedLng);
      });
    }

    requestAnimationFrame(() => {
      map.invalidateSize();
    });
  }

  setCoordinates(lat: number, lng: number): void {
    if (!this.marker || !this.map) return;
    const curPos = this.marker.getLatLng();
    const dist = Math.abs(curPos.lat - lat) + Math.abs(curPos.lng - lng);

    if (dist > 0.00001) {
      this.marker.setLatLng([lat, lng]);
      this.map.panTo([lat, lng], { animate: true });
    }
  }

  onCoordinatesChange(callback: (lat: number, lng: number) => void): void {
    this.changeCallbacks.push(callback);
  }

  private notifyChange(lat: number, lng: number): void {
    for (const cb of this.changeCallbacks) {
      try {
        cb(lat, lng);
      } catch (err) {
        console.error("[LeafletAdapter] Change callback error:", err);
      }
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    this.changeCallbacks = [];
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }
}
