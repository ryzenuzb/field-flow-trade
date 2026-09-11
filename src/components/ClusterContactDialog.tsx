import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClusterContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Stage = "form" | "sending" | "success";

const ClusterContactDialog = ({
  open,
  onOpenChange,
}: ClusterContactDialogProps) => {
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("form");
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [hectares, setHectares] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStage("form");
        setFullName("");
        setPhone("");
        setCompanyName("");
        setHectares("");
        setMessage("");
      }, 250);
      return () => clearTimeout(t);
    }

    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAuthRequired(true);
      } else {
        setAuthRequired(false);
      }
      setLoading(false);
    })();
  }, [open]);

  const submit = async () => {
    if (!fullName.trim() || !phone.trim()) {
      toast({
        title: "Maydonlarni to'ldiring",
        description: "Ism-familiya va telefon raqami majburiy",
        variant: "destructive",
      });
      return;
    }

    setStage("sending");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Tizimga kiring",
          description: "So'rov yuborish uchun avval tizimga kiring",
          variant: "destructive",
        });
        setStage("form");
        return;
      }

      const { error } = await supabase.from("cluster_inquiries" as any).insert({
        user_id: user.id,
        full_name: fullName.trim().slice(0, 120),
        phone: phone.trim().slice(0, 20),
        company_name: companyName.trim().slice(0, 120) || null,
        hectares: hectares ? parseFloat(hectares) : null,
        message: message.trim().slice(0, 500) || null,
      });

      if (error) throw error;
      setStage("success");
    } catch (e: any) {
      toast({
        title: "Xatolik",
        description: e.message || "So'rovni yuborishda xatolik yuz berdi",
        variant: "destructive",
      });
      setStage("form");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {stage === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-poppins">
                <Building2 className="w-5 h-5 text-primary" />
                Klaster tarifi uchun so'rov
              </DialogTitle>
              <DialogDescription>
                Korporativ yechim haqida batafsil ma'lumot olish uchun so'rov qoldiring
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tarif</span>
                <span className="font-medium text-foreground">Klaster</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Narxi</span>
                <span className="font-medium text-foreground">Kelishilgan narxda</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hisoblash</span>
                <span className="font-medium text-foreground">Gektarbay</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : authRequired ? (
              <div className="space-y-3 pt-2 text-center">
                <p className="text-sm text-muted-foreground">
                  So'rov qoldirish uchun tizimga kiring.
                </p>
                <Button className="w-full" onClick={() => (window.location.href = "/auth")}>
                  Tizimga kirish
                </Button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cluster-name">Ism-familiya *</Label>
                    <Input
                      id="cluster-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ism familiya"
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cluster-phone">Telefon *</Label>
                    <Input
                      id="cluster-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998901234567"
                      maxLength={20}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cluster-company">Kompaniya / Klaster</Label>
                    <Input
                      id="cluster-company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Kompaniya nomi"
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cluster-hectares">Gektar maydoni</Label>
                    <Input
                      id="cluster-hectares"
                      type="number"
                      min={0}
                      step={0.1}
                      value={hectares}
                      onChange={(e) => setHectares(e.target.value)}
                      placeholder="Masalan: 150"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cluster-message">Qo'shimcha ma'lumot</Label>
                  <Textarea
                    id="cluster-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ekin turi, hudud va qiziqtirgan savollaringiz..."
                    maxLength={500}
                    rows={3}
                  />
                </div>

                <Button className="btn-farm w-full" onClick={submit}>
                  <Send className="w-4 h-4 mr-2" />
                  So'rov yuborish
                </Button>
              </div>
            )}
          </>
        )}

        {stage === "sending" && (
          <div className="py-12 flex flex-col items-center text-center space-y-4">
            <DialogHeader className="sr-only">
              <DialogTitle>Yuborilmoqda</DialogTitle>
            </DialogHeader>
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">So'rov yuborilmoqda...</p>
          </div>
        )}

        {stage === "success" && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <DialogHeader className="sr-only">
              <DialogTitle>So'rov yuborildi</DialogTitle>
            </DialogHeader>
            <span className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="w-11 h-11" />
            </span>
            <h3 className="text-xl font-poppins font-semibold text-foreground">
              So'rov muvaffaqiyatli yuborildi
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Tez orada menejerimiz siz bilan bog'lanadi va batafsil narxlar bilan tanishtiradi.
            </p>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Holat: ko'rib chiqilmoqda
            </Badge>
            <Button className="btn-farm w-full mt-2" onClick={() => onOpenChange(false)}>
              Yopish
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClusterContactDialog;
