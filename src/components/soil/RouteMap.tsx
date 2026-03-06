import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface RouteMapProps {
  destLat: number;
  destLng: number;
  destName?: string;
}

const RouteMap = ({ destLat, destLng, destName }: RouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);

  const adminIcon = L.divIcon({
    html: `<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const destIcon = L.divIcon({
    html: `<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView([destLat, destLng], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapInstanceRef.current = map;

    // Add destination marker immediately
    L.marker([destLat, destLng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`📍 ${destName || "Fermer joylashuvi"}`)
      .openPopup();

    // Get admin's current location
    if (!navigator.geolocation) {
      setError("GPS qo'llab-quvvatlanmaydi");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const startLat = pos.coords.latitude;
        const startLng = pos.coords.longitude;

        // Add admin marker
        L.marker([startLat, startLng], { icon: adminIcon })
          .addTo(map)
          .bindPopup("📍 Sizning joylashuvingiz");

        // Fetch route from OSRM
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`
          );
          const data = await res.json();

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coords: [number, number][] = route.geometry.coordinates.map(
              (c: [number, number]) => [c[1], c[0]] as [number, number]
            );

            // Draw yellow route line
            const routeLine = L.polyline(coords, {
              color: "#f59e0b",
              weight: 5,
              opacity: 0.85,
              smoothFactor: 1,
            }).addTo(map);

            // Fit map to show entire route
            map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

            // Show distance & duration
            const km = (route.distance / 1000).toFixed(1);
            const mins = Math.round(route.duration / 60);
            setDistance(`${km} km`);
            setDuration(mins >= 60 ? `${Math.floor(mins / 60)} soat ${mins % 60} daqiqa` : `${mins} daqiqa`);
          } else {
            // Fallback: straight line
            L.polyline([[startLat, startLng], [destLat, destLng]], {
              color: "#f59e0b",
              weight: 3,
              dashArray: "10, 10",
              opacity: 0.7,
            }).addTo(map);
            map.fitBounds([[startLat, startLng], [destLat, destLng]], { padding: [40, 40] });
          }
        } catch {
          // Fallback: straight line
          L.polyline([[startLat, startLng], [destLat, destLng]], {
            color: "#f59e0b",
            weight: 3,
            dashArray: "10, 10",
            opacity: 0.7,
          }).addTo(map);
          map.fitBounds([[startLat, startLng], [destLat, destLng]], { padding: [40, 40] });
        }
        setLoading(false);
      },
      () => {
        setError("GPS ruxsat berilmadi. Faqat manzil ko'rsatiladi.");
        map.setView([destLat, destLng], 13);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [destLat, destLng]);

  const openInYandex = () => {
    window.open(`https://yandex.uz/maps/?rtext=~${destLat},${destLng}&rtt=auto`, "_blank");
  };

  return (
    <div className="space-y-3">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Joylashuv aniqlanmoqda...
        </div>
      )}
      {error && <p className="text-sm text-amber-600">⚠️ {error}</p>}
      {distance && duration && (
        <div className="flex gap-4 text-sm font-medium">
          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">🚗 {distance}</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">⏱ {duration}</span>
        </div>
      )}
      <div ref={mapRef} className="h-[350px] w-full rounded-lg border border-border" />
      <Button variant="outline" size="sm" onClick={openInYandex} className="w-full">
        <Navigation className="w-4 h-4 mr-2" />
        Yandex Xaritada ochish
      </Button>
    </div>
  );
};

export default RouteMap;
