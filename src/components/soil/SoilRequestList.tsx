import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Calendar, Leaf, Beaker, Download } from "lucide-react";
import jsPDF from "jspdf";
import LocationMap from "./LocationMap";

const statusConfig: Record<string, { label: string; color: string }> = {
  requested: { label: "So'rov yuborildi", color: "bg-blue-100 text-blue-700 border-blue-200" },
  visited: { label: "Tekshirildi", color: "bg-amber-100 text-amber-700 border-amber-200" },
  analysis_pending: { label: "Tahlil kutilmoqda", color: "bg-purple-100 text-purple-700 border-purple-200" },
  analysis_ready: { label: "Tahlil tayyor", color: "bg-green-100 text-green-700 border-green-200" },
  completed: { label: "Yakunlandi", color: "bg-green-100 text-green-700 border-green-200" },
};

interface AnalysisResult {
  fertility_score: number;
  soil_type: string;
  ph_level: number;
  moisture_level: number;
  nitrogen_level: string;
  phosphorus_level: string;
  potassium_level: string;
  crop_recommendations: string[];
  fertilizer_suggestions: string[];
  additional_notes: string;
}

const SoilRequestList = ({ userId }: { userId: string }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("soil_inspection_requests")
      .select("*")
      .eq("farmer_id", userId)
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  const viewResult = async (requestId: string) => {
    const { data } = await supabase
      .from("soil_analysis_results")
      .select("*")
      .eq("request_id", requestId)
      .single();
    if (data) {
      setSelectedResult(data as any);
      setSelectedRequest(requests.find((r) => r.id === requestId) || null);
    }
  };

  const downloadPDF = () => {
    if (!selectedResult) return;
    const doc = new jsPDF();
    const req = selectedRequest;
    let y = 20;

    doc.setFontSize(18);
    doc.text("Tuproq Tahlil Natijasi", 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.text("Farm Trade - Soil Check", 105, y, { align: "center" });
    y += 15;
    doc.setDrawColor(34, 139, 34);
    doc.line(20, y, 190, y);
    y += 10;

    if (req) {
      doc.setFontSize(12);
      doc.text("Yer ma'lumotlari:", 20, y);
      y += 8;
      doc.setFontSize(10);
      if (req.location_name) { doc.text(`Joylashuv: ${req.location_name}`, 25, y); y += 6; }
      if (req.latitude && req.longitude) { doc.text(`GPS: ${req.latitude}, ${req.longitude}`, 25, y); y += 6; }
      doc.text(`Maydon: ${req.land_size} ${req.land_size_unit}`, 25, y); y += 6;
      if (req.previous_crops?.length) {
        doc.text(`Oldingi ekinlar: ${(req.previous_crops as string[]).join(", ")}`, 25, y); y += 6;
      }
      doc.text(`Sana: ${new Date(req.created_at).toLocaleDateString("uz-UZ")}`, 25, y); y += 12;
    }

    doc.setFontSize(14);
    doc.text(`Unumdorlik: ${selectedResult.fertility_score}%`, 20, y);
    y += 12;

    doc.setFontSize(10);
    const metrics = [
      ["Tuproq turi", selectedResult.soil_type || "—"],
      ["pH daraja", selectedResult.ph_level?.toString() || "—"],
      ["Namlik", selectedResult.moisture_level ? `${selectedResult.moisture_level}%` : "—"],
      ["Azot (N)", selectedResult.nitrogen_level || "—"],
      ["Fosfor (P)", selectedResult.phosphorus_level || "—"],
      ["Kaliy (K)", selectedResult.potassium_level || "—"],
    ];

    metrics.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 25, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 80, y);
      y += 7;
    });
    y += 5;

    if (selectedResult.crop_recommendations?.length) {
      doc.setFontSize(12);
      doc.text("Tavsiya etiladigan ekinlar:", 20, y);
      y += 7;
      doc.setFontSize(10);
      doc.text(selectedResult.crop_recommendations.join(", "), 25, y, { maxWidth: 160 });
      y += 10;
    }

    if (selectedResult.fertilizer_suggestions?.length) {
      doc.setFontSize(12);
      doc.text("Tavsiya etiladigan o'g'itlar:", 20, y);
      y += 7;
      doc.setFontSize(10);
      doc.text(selectedResult.fertilizer_suggestions.join(", "), 25, y, { maxWidth: 160 });
      y += 10;
    }

    if (selectedResult.additional_notes) {
      doc.setFontSize(12);
      doc.text("Qo'shimcha eslatmalar:", 20, y);
      y += 7;
      doc.setFontSize(10);
      doc.text(selectedResult.additional_notes, 25, y, { maxWidth: 160 });
    }

    doc.save(`tuproq-tahlil-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  useEffect(() => {
    fetchRequests();
  }, [userId]);

  if (loading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;
  if (requests.length === 0)
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Leaf className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">Hali so'rov yo'q. Birinchi bepul tekshiruv so'rovini yuboring!</p>
        </CardContent>
      </Card>
    );

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {requests.map((req) => {
          const status = statusConfig[req.status] || statusConfig.requested;
          const hasCoords = req.latitude && req.longitude;
          return (
            <Card key={req.id} className="product-card overflow-hidden">
              {/* Mini map for requests with GPS */}
              {hasCoords && (
                <div className="h-32 w-full">
                  <LocationMap
                    lat={Number(req.latitude)}
                    lng={Number(req.longitude)}
                    zoom={12}
                    className="h-32 w-full"
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{req.location_name || "Yer maydoni"}</CardTitle>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {hasCoords && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>{Number(req.latitude).toFixed(4)}, {Number(req.longitude).toFixed(4)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{req.land_size} {req.land_size_unit}</span>
                </div>
                {req.previous_crops && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Leaf className="w-4 h-4" />
                    <span>{(req.previous_crops as string[]).join(", ")}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(req.created_at).toLocaleDateString("uz-UZ")}</span>
                </div>
                {req.analysis_price && (
                  <p className="text-sm font-medium text-foreground">
                    💰 Tahlil narxi: {Number(req.analysis_price).toLocaleString()} so'm
                  </p>
                )}
                {req.visit_notes && (
                  <p className="text-sm text-muted-foreground border-t pt-2 mt-2">
                    📝 {req.visit_notes}
                  </p>
                )}
                {(req.status === "analysis_ready" || req.status === "completed") && (
                  <Button size="sm" className="w-full mt-2" onClick={() => viewResult(req.id)}>
                    <Beaker className="w-4 h-4 mr-2" />
                    Tahlil natijasini ko'rish
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analysis Result Dialog */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-poppins">🔬 Tuproq Tahlil Natijasi</DialogTitle>
            <Button size="sm" variant="outline" onClick={downloadPDF} className="gap-2">
              <Download className="w-4 h-4" />
              PDF
            </Button>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              {/* Map in result dialog */}
              {selectedRequest?.latitude && selectedRequest?.longitude && (
                <LocationMap
                  lat={Number(selectedRequest.latitude)}
                  lng={Number(selectedRequest.longitude)}
                  className="h-40 w-full rounded-lg border border-border"
                />
              )}

              <div className="text-center py-4">
                <div className="text-5xl font-bold text-primary mb-1">{selectedResult.fertility_score}%</div>
                <p className="text-muted-foreground">Unumdorlik ko'rsatkichi</p>
                <div className="w-full bg-muted rounded-full h-3 mt-2">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                    style={{ width: `${selectedResult.fertility_score}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="Tuproq turi" value={selectedResult.soil_type} />
                <InfoCard label="pH daraja" value={selectedResult.ph_level?.toString()} />
                <InfoCard label="Namlik" value={`${selectedResult.moisture_level}%`} />
                <InfoCard label="Azot (N)" value={selectedResult.nitrogen_level} />
                <InfoCard label="Fosfor (P)" value={selectedResult.phosphorus_level} />
                <InfoCard label="Kaliy (K)" value={selectedResult.potassium_level} />
              </div>

              {selectedResult.crop_recommendations?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">🌾 Tavsiya etiladigan ekinlar</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResult.crop_recommendations.map((c, i) => (
                      <Badge key={i} variant="secondary">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedResult.fertilizer_suggestions?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">🧪 Tavsiya etiladigan o'g'itlar</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResult.fertilizer_suggestions.map((f, i) => (
                      <Badge key={i} className="bg-amber-100 text-amber-700 border-amber-200">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedResult.additional_notes && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">📝 Qo'shimcha eslatmalar</h4>
                  <p className="text-muted-foreground text-sm">{selectedResult.additional_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const InfoCard = ({ label, value }: { label: string; value?: string }) => (
  <div className="bg-muted/50 rounded-lg p-3 text-center">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-semibold text-foreground">{value || "—"}</p>
  </div>
);

export default SoilRequestList;
