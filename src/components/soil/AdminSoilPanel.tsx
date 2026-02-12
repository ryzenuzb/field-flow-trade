import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Phone, User, Loader2, Eye, CheckCircle, Beaker } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  requested: { label: "Yangi", color: "bg-blue-100 text-blue-700" },
  visited: { label: "Tekshirildi", color: "bg-amber-100 text-amber-700" },
  analysis_pending: { label: "Tahlil kutilmoqda", color: "bg-purple-100 text-purple-700" },
  analysis_ready: { label: "Tahlil tayyor", color: "bg-green-100 text-green-700" },
  completed: { label: "Yakunlandi", color: "bg-green-100 text-green-700" },
};

const AdminSoilPanel = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [analysisTarget, setAnalysisTarget] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [visitForm, setVisitForm] = useState({ visit_notes: "", needs_analysis: "yes", analysis_price: "" });
  const [analysisForm, setAnalysisForm] = useState({
    fertility_score: "",
    soil_type: "",
    ph_level: "",
    moisture_level: "",
    nitrogen_level: "",
    phosphorus_level: "",
    potassium_level: "",
    crop_recommendations: "",
    fertilizer_suggestions: "",
    additional_notes: "",
  });

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("soil_inspection_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const markVisited = async (id: string) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const updates: any = {
      status: visitForm.needs_analysis === "yes" ? "analysis_pending" : "completed",
      visited_at: new Date().toISOString(),
      visited_by: user?.id,
      visit_notes: visitForm.visit_notes,
      needs_analysis: visitForm.needs_analysis === "yes",
    };
    if (visitForm.analysis_price) {
      updates.analysis_price = parseFloat(visitForm.analysis_price);
    }
    const { error } = await supabase.from("soil_inspection_requests").update(updates).eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Tekshiruv yakunlandi" });
      setSelected(null);
      setVisitForm({ visit_notes: "", needs_analysis: "yes", analysis_price: "" });
      fetchRequests();
    }
  };

  const submitAnalysis = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("soil_analysis_results").insert({
      request_id: analysisTarget,
      fertility_score: parseInt(analysisForm.fertility_score),
      soil_type: analysisForm.soil_type,
      ph_level: parseFloat(analysisForm.ph_level),
      moisture_level: parseFloat(analysisForm.moisture_level),
      nitrogen_level: analysisForm.nitrogen_level,
      phosphorus_level: analysisForm.phosphorus_level,
      potassium_level: analysisForm.potassium_level,
      crop_recommendations: analysisForm.crop_recommendations.split(",").map((s) => s.trim()).filter(Boolean),
      fertilizer_suggestions: analysisForm.fertilizer_suggestions.split(",").map((s) => s.trim()).filter(Boolean),
      additional_notes: analysisForm.additional_notes,
      analyzed_by: user?.id,
    });

    if (!error) {
      await supabase.from("soil_inspection_requests").update({ status: "analysis_ready" }).eq("id", analysisTarget);
      toast({ title: "✅ Tahlil natijalari yuklandi" });
      setShowAnalysisForm(false);
      setAnalysisForm({ fertility_score: "", soil_type: "", ph_level: "", moisture_level: "", nitrogen_level: "", phosphorus_level: "", potassium_level: "", crop_recommendations: "", fertilizer_suggestions: "", additional_notes: "" });
      fetchRequests();
    } else {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) return <p className="text-muted-foreground p-4">Yuklanmoqda...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-poppins font-bold">🔬 Tuproq Tekshiruv So'rovlari</h2>
        <Badge variant="secondary">{requests.length} ta so'rov</Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ism</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Joylashuv</TableHead>
              <TableHead>Maydon</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => {
              const status = statusConfig[req.status] || statusConfig.requested;
              return (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.contact_name}</TableCell>
                  <TableCell>{req.contact_phone}</TableCell>
                  <TableCell>{req.location_name || "—"}</TableCell>
                  <TableCell>{req.land_size} {req.land_size_unit}</TableCell>
                  <TableCell><Badge className={status.color}>{status.label}</Badge></TableCell>
                  <TableCell>{new Date(req.created_at).toLocaleDateString("uz-UZ")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {req.status === "requested" && (
                        <Button size="sm" variant="outline" onClick={() => setSelected(req)}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Tekshirdim
                        </Button>
                      )}
                      {req.status === "analysis_pending" && (
                        <Button size="sm" onClick={() => { setAnalysisTarget(req.id); setShowAnalysisForm(true); }}>
                          <Beaker className="w-4 h-4 mr-1" /> Tahlil yuklash
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mark Visited Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tekshiruv yakunlash - {selected?.contact_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tekshiruv natijalari</Label>
              <Textarea value={visitForm.visit_notes} onChange={(e) => setVisitForm({ ...visitForm, visit_notes: e.target.value })} placeholder="Dastlabki kuzatuvlar..." rows={3} />
            </div>
            <div>
              <Label>Batafsil tahlil kerakmi?</Label>
              <Select value={visitForm.needs_analysis} onValueChange={(v) => setVisitForm({ ...visitForm, needs_analysis: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Ha, tahlil kerak</SelectItem>
                  <SelectItem value="no">Yo'q, tahlil kerak emas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {visitForm.needs_analysis === "yes" && (
              <div>
                <Label>Tahlil narxi (so'm)</Label>
                <Input type="number" value={visitForm.analysis_price} onChange={(e) => setVisitForm({ ...visitForm, analysis_price: e.target.value })} placeholder="Masalan: 150000" />
              </div>
            )}
            <Button className="w-full" onClick={() => markVisited(selected?.id)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Saqlash
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Analysis Dialog */}
      <Dialog open={showAnalysisForm} onOpenChange={setShowAnalysisForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔬 Tahlil natijalarini yuklash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unumdorlik (0-100%)</Label>
                <Input type="number" min="0" max="100" value={analysisForm.fertility_score} onChange={(e) => setAnalysisForm({ ...analysisForm, fertility_score: e.target.value })} />
              </div>
              <div>
                <Label>Tuproq turi</Label>
                <Select value={analysisForm.soil_type} onValueChange={(v) => setAnalysisForm({ ...analysisForm, soil_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qumli">Qumli</SelectItem>
                    <SelectItem value="loyqa">Loyqa</SelectItem>
                    <SelectItem value="tuproq">Tuproq</SelectItem>
                    <SelectItem value="qora tuproq">Qora tuproq</SelectItem>
                    <SelectItem value="aralash">Aralash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>pH daraja</Label>
                <Input type="number" step="0.1" value={analysisForm.ph_level} onChange={(e) => setAnalysisForm({ ...analysisForm, ph_level: e.target.value })} />
              </div>
              <div>
                <Label>Namlik (%)</Label>
                <Input type="number" step="0.1" value={analysisForm.moisture_level} onChange={(e) => setAnalysisForm({ ...analysisForm, moisture_level: e.target.value })} />
              </div>
              <div>
                <Label>Azot (N)</Label>
                <Select value={analysisForm.nitrogen_level} onValueChange={(v) => setAnalysisForm({ ...analysisForm, nitrogen_level: v })}>
                  <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="past">Past</SelectItem>
                    <SelectItem value="o'rta">O'rta</SelectItem>
                    <SelectItem value="yuqori">Yuqori</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fosfor (P)</Label>
                <Select value={analysisForm.phosphorus_level} onValueChange={(v) => setAnalysisForm({ ...analysisForm, phosphorus_level: v })}>
                  <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="past">Past</SelectItem>
                    <SelectItem value="o'rta">O'rta</SelectItem>
                    <SelectItem value="yuqori">Yuqori</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kaliy (K)</Label>
                <Select value={analysisForm.potassium_level} onValueChange={(v) => setAnalysisForm({ ...analysisForm, potassium_level: v })}>
                  <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="past">Past</SelectItem>
                    <SelectItem value="o'rta">O'rta</SelectItem>
                    <SelectItem value="yuqori">Yuqori</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tavsiya etiladigan ekinlar</Label>
              <Input value={analysisForm.crop_recommendations} onChange={(e) => setAnalysisForm({ ...analysisForm, crop_recommendations: e.target.value })} placeholder="Bug'doy, paxta, sabzi (vergul bilan)" />
            </div>
            <div>
              <Label>Tavsiya etiladigan o'g'itlar</Label>
              <Input value={analysisForm.fertilizer_suggestions} onChange={(e) => setAnalysisForm({ ...analysisForm, fertilizer_suggestions: e.target.value })} placeholder="Azotli, fosforli o'g'it (vergul bilan)" />
            </div>
            <div>
              <Label>Qo'shimcha eslatmalar</Label>
              <Textarea value={analysisForm.additional_notes} onChange={(e) => setAnalysisForm({ ...analysisForm, additional_notes: e.target.value })} rows={3} />
            </div>
            <Button className="w-full btn-farm" onClick={submitAnalysis} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Tahlil natijasini saqlash
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSoilPanel;
