import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/ui/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Tractor,
  Shield,
  AlertCircle
} from "lucide-react";

type VerificationStatus = "pending" | "approved" | "rejected" | null;

interface ExistingVerification {
  id: string;
  verification_type: string;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  document_url: string | null;
}

const FarmerApplication = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isFarmer, setIsFarmer] = useState(false);
  const [existingVerifications, setExistingVerifications] = useState<ExistingVerification[]>([]);
  
  // Form state
  const [verificationType, setVerificationType] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);

      // Check if already a farmer
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasFarmerRole = roles?.some(r => r.role === "farmer");
      setIsFarmer(hasFarmerRole || false);

      // Get existing verifications
      const { data: verifications } = await supabase
        .from("seller_verifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setExistingVerifications(verifications || []);
    } catch (error) {
      console.error("Error checking user status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Xatolik",
          description: "Fayl hajmi 5MB dan oshmasligi kerak",
          variant: "destructive",
        });
        return;
      }
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Xatolik",
          description: "Faqat JPG, PNG, WEBP yoki PDF formatidagi fayllar qabul qilinadi",
          variant: "destructive",
        });
        return;
      }
      setDocument(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !verificationType || !document) {
      toast({
        title: "Xatolik",
        description: "Barcha maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    // Check for existing pending verification of same type
    const hasPending = existingVerifications.some(
      v => v.verification_type === verificationType && v.status === "pending"
    );
    if (hasPending) {
      toast({
        title: "Xatolik",
        description: "Ushbu turdagi ariza allaqachon ko'rib chiqilmoqda",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Upload document
      const fileExt = document.name.split(".").pop();
      const fileName = `${user.id}/${verificationType}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("product-images")
        .upload(fileName, document);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      // Create verification record
      const { error: insertError } = await supabase
        .from("seller_verifications")
        .insert({
          user_id: user.id,
          verification_type: verificationType,
          document_url: publicUrl,
          notes: notes.trim() || null,
          status: "pending",
        });

      if (insertError) throw insertError;

      toast({
        title: "Muvaffaqiyat!",
        description: "Arizangiz qabul qilindi. Tez orada ko'rib chiqiladi.",
      });

      // Reset form and refresh
      setVerificationType("");
      setDocument(null);
      setNotes("");
      checkUserStatus();
    } catch (error: unknown) {
      console.error("Error submitting application:", error);
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Ariza yuborishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Tasdiqlangan
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rad etilgan
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Ko'rib chiqilmoqda
          </Badge>
        );
    }
  };

  const getVerificationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      identity: "Shaxsni tasdiqlash (Pasport/ID)",
      farm: "Ferma hujjatlari",
      business: "Biznes litsenziya",
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (isFarmer) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Siz allaqachon fermer sifatida tasdiqlangansiz!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Mahsulotlaringizni qo'shish va sotish uchun fermer paneliga o'ting.
                </p>
                <Button onClick={() => navigate("/farmer")} className="bg-primary">
                  <Tractor className="w-4 h-4 mr-2" />
                  Fermer Paneliga O'tish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tractor className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Fermer Bo'lish Uchun Ariza
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Platformamizda mahsulotlaringizni sotish uchun hujjatlaringizni yuklang va tasdiqlanishni kuting.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Application Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Yangi Ariza Yuborish
              </CardTitle>
              <CardDescription>
                Tasdiqlash uchun hujjatlaringizni yuklang
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Hujjat Turi *</Label>
                  <Select value={verificationType} onValueChange={setVerificationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hujjat turini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id_card">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Shaxsni tasdiqlash (Pasport/ID)
                        </div>
                      </SelectItem>
                      <SelectItem value="farm_photo">
                        <div className="flex items-center gap-2">
                          <Tractor className="w-4 h-4" />
                          Ferma hujjatlari/rasmi
                        </div>
                      </SelectItem>
                      <SelectItem value="business_license">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Biznes litsenziya
                        </div>
                      </SelectItem>
                      <SelectItem value="location">
                        <div className="flex items-center gap-2">
                          <Tractor className="w-4 h-4" />
                          Joylashuv hujjati
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document">Hujjat Yuklash *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <Input
                      id="document"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="document" className="cursor-pointer">
                      {document ? (
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">{document.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Fayl yuklash uchun bosing
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, WEBP yoki PDF (max 5MB)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Qo'shimcha Izoh</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Qo'shimcha ma'lumot kiriting (ixtiyoriy)"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Arizangiz 1-3 ish kuni ichida ko'rib chiqiladi. Natija haqida xabar olasiz.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting || !verificationType || !document}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Yuborilmoqda...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Ariza Yuborish
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Mening Arizalarim
              </CardTitle>
              <CardDescription>
                Yuborilgan arizalar holati
              </CardDescription>
            </CardHeader>
            <CardContent>
              {existingVerifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Hali ariza yuborilmagan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {existingVerifications.map((verification) => (
                    <div
                      key={verification.id}
                      className="p-4 border border-border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {getVerificationTypeLabel(verification.verification_type)}
                        </span>
                        {getStatusBadge(verification.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Yuborilgan: {verification.created_at 
                          ? new Date(verification.created_at).toLocaleDateString("uz-UZ")
                          : "-"
                        }
                      </p>
                      
                      {verification.status === "rejected" && verification.notes && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription className="text-sm">
                            <strong>Sabab:</strong> {verification.notes}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {verification.document_url && (
                        <a
                          href={verification.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          Hujjatni ko'rish
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FarmerApplication;
