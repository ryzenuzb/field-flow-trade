import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Loader2, Navigation } from "lucide-react";
import LocationMap from "./LocationMap";

interface Props {
  userId: string;
  open: boolean;
  onClose: () => void;
}

const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uz`
    );
    const data = await res.json();
    if (data?.address) {
      const { state, county, town, village, city } = data.address;
      return [village || town || city, county, state].filter(Boolean).join(", ");
    }
    return data?.display_name || null;
  } catch {
    return null;
  }
};

const SoilRequestForm = ({ userId, open, onClose }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [form, setForm] = useState({
    location_name: "",
    latitude: "",
    longitude: "",
    land_size: "",
    land_size_unit: "gektar",
    previous_crops: "",
    contact_phone: "",
    contact_name: "",
    notes: "",
  });

  const hasCoords = !!form.latitude && !!form.longitude;

  const getGPS = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS mavjud emas", variant: "destructive" });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const locationName = await reverseGeocode(lat, lng);
        setForm((f) => ({
          ...f,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
          location_name: locationName || f.location_name,
        }));
        setGpsLoading(false);
        toast({ title: "📍 Joylashuv aniqlandi!", description: locationName || `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      },
      () => {
        toast({ title: "GPS xatosi", description: "Joylashuvni aniqlab bo'lmadi", variant: "destructive" });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleMapDrag = useCallback(async (lat: number, lng: number) => {
    const locationName = await reverseGeocode(lat, lng);
    setForm((f) => ({
      ...f,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
      location_name: locationName || f.location_name,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.land_size || !form.contact_phone || !form.contact_name) {
      toast({ title: "Barcha majburiy maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("soil_inspection_requests").insert({
      farmer_id: userId,
      location_name: form.location_name || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      land_size: parseFloat(form.land_size),
      land_size_unit: form.land_size_unit,
      previous_crops: form.previous_crops ? form.previous_crops.split(",").map((c) => c.trim()) : null,
      contact_phone: form.contact_phone,
      contact_name: form.contact_name,
      notes: form.notes || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ So'rov yuborildi!", description: "Mutaxassis siz bilan tez orada bog'lanadi" });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-poppins">🌱 Bepul Tekshiruv So'rovi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Ism *</Label>
              <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="To'liq ismingiz" required />
            </div>
            <div className="col-span-2">
              <Label>Telefon *</Label>
              <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="+998 90 123 45 67" required />
            </div>
          </div>

          {/* GPS Section */}
          <div className="space-y-2">
            <Label>Yer joylashuvi</Label>
            <div className="flex gap-2">
              <Input value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} placeholder="Viloyat, tuman, qishloq" className="flex-1" />
              <Button type="button" variant="outline" onClick={getGPS} disabled={gpsLoading} className="gap-2 shrink-0">
                {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                GPS
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Latitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="41.311081"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Longitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="69.240562"
                />
              </div>
            </div>
            <div className="space-y-2">
              <LocationMap
                lat={hasCoords ? parseFloat(form.latitude) : 41.311081}
                lng={hasCoords ? parseFloat(form.longitude) : 69.240562}
                zoom={hasCoords ? 13 : 6}
                draggable
                clickable
                onPositionChange={handleMapDrag}
                className="h-56 w-full rounded-lg border border-border"
              />
              <p className="text-xs text-muted-foreground">📌 Xaritadan bosib yoki markerni sudrab joylashuvni tanlang</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Yer maydoni *</Label>
              <Input type="number" step="0.1" value={form.land_size} onChange={(e) => setForm({ ...form, land_size: e.target.value })} placeholder="Masalan: 5" required />
            </div>
            <div>
              <Label>Birlik</Label>
              <Select value={form.land_size_unit} onValueChange={(v) => setForm({ ...form, land_size_unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gektar">Gektar</SelectItem>
                  <SelectItem value="sotix">Sotix</SelectItem>
                  <SelectItem value="kv_metr">Kv. metr</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Oldingi ekinlar</Label>
            <Input value={form.previous_crops} onChange={(e) => setForm({ ...form, previous_crops: e.target.value })} placeholder="Bug'doy, paxta, kartoshka (vergul bilan)" />
          </div>

          <div>
            <Label>Qo'shimcha izoh</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Yer haqida qo'shimcha ma'lumot..." rows={3} />
          </div>

          <Button type="submit" className="w-full btn-farm" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Bepul Tekshiruv So'rash
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SoilRequestForm;
