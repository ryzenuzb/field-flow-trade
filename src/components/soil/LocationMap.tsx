import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
  draggable?: boolean;
  clickable?: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
}

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const LocationMap = ({ lat, lng, zoom = 13, className = "h-48 w-full rounded-lg", draggable = false, clickable = false, onPositionChange }: LocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([lat, lng], zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable }).addTo(map);
    
    if (draggable && onPositionChange) {
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onPositionChange(pos.lat, pos.lng);
      });
    }

    if (clickable && onPositionChange) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        marker.setLatLng([newLat, newLng]);
        onPositionChange(newLat, newLng);
      });
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoom);
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  return <div ref={mapRef} className={className} />;
};

export default LocationMap;
