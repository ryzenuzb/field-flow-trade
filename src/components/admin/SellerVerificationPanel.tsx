import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Verification {
  id: string;
  user_id: string;
  verification_type: string;
  document_url: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  verified_at: string | null;
  profile?: {
    full_name: string;
    phone: string | null;
    location: string | null;
  };
}

interface SellerVerificationPanelProps {
  verifications: Verification[];
  onRefresh: () => void;
}

export const SellerVerificationPanel = ({ verifications, onRefresh }: SellerVerificationPanelProps) => {
  const { toast } = useToast();
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("seller_verifications")
        .update({
          status,
          notes,
          verified_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      // If approved, assign farmer role
      if (status === "approved" && selectedVerification) {
        const { error: roleError } = await supabase.rpc("assign_farmer_role", {
          user_id_param: selectedVerification.user_id,
        });

        if (roleError) {
          console.error("Error assigning farmer role:", roleError);
        }
      }

      toast({
        title: "Muvaffaqiyat",
        description: status === "approved" ? "Sotuvchi tasdiqlandi" : "So'rov rad etildi",
      });

      setSelectedVerification(null);
      setNotes("");
      onRefresh();
    } catch (error: unknown) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Tasdiqlangan</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rad etilgan</Badge>;
      default:
        return <Badge variant="secondary">Kutilmoqda</Badge>;
    }
  };

  const getVerificationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      identity: "Shaxsni tasdiqlash",
      farm: "Ferma hujjatlari",
      business: "Biznes litsenziya",
    };
    return types[type] || type;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sotuvchi Tasdiqlash So'rovlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tasdiqlash so'rovlari yo'q
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foydalanuvchi</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell className="font-medium">
                      {verification.profile?.full_name || "Noma'lum"}
                    </TableCell>
                    <TableCell>{verification.profile?.phone || "-"}</TableCell>
                    <TableCell>{getVerificationTypeLabel(verification.verification_type)}</TableCell>
                    <TableCell>
                      {verification.created_at
                        ? format(new Date(verification.created_at), "dd.MM.yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(verification.status)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVerification(verification);
                          setNotes(verification.notes || "");
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ko'rish
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tasdiqlash Tafsilotlari</DialogTitle>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Foydalanuvchi</p>
                  <p className="font-medium">{selectedVerification.profile?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium">{selectedVerification.profile?.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joylashuv</p>
                  <p className="font-medium">{selectedVerification.profile?.location || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hujjat turi</p>
                  <p className="font-medium">
                    {getVerificationTypeLabel(selectedVerification.verification_type)}
                  </p>
                </div>
              </div>

              {selectedVerification.document_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Hujjat</p>
                  <a
                    href={selectedVerification.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    Hujjatni ko'rish
                  </a>
                </div>
              )}

              {selectedVerification.status === "pending" && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Izoh</p>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Izoh qo'shing..."
                      rows={3}
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(selectedVerification.id, "rejected")}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      Rad etish
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(selectedVerification.id, "approved")}
                      disabled={loading}
                      className="bg-primary"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      )}
                      Tasdiqlash
                    </Button>
                  </DialogFooter>
                </>
              )}

              {selectedVerification.status !== "pending" && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Qaror</p>
                  <p className="font-medium">{getStatusBadge(selectedVerification.status)}</p>
                  {selectedVerification.notes && (
                    <p className="mt-2 text-sm">{selectedVerification.notes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
