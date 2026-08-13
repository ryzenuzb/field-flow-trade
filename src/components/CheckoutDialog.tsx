import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  ShieldCheck,
  Upload,
  ArrowLeft,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Provider = "click" | "payme" | "uzum";
type Stage = "select" | "pay" | "sending" | "success";

interface PaymentSetting {
  provider: Provider;
  card_number: string;
  card_holder: string;
  bank_name: string | null;
  phone: string | null;
  instructions: string | null;
}

const METHODS: {
  id: Provider;
  name: string;
  caption: string;
  cardClass: string;
  logoClass: string;
  logo: string;
  appUrl: string;
}[] = [
  {
    id: "click",
    name: "Click",
    caption: "Click Up ilovasi orqali o'tkazma",
    cardClass: "border-click/40 hover:border-click bg-click/5 hover:bg-click/10",
    logoClass: "bg-click text-click-foreground",
    logo: "C",
    appUrl: "https://my.click.uz/",
  },
  {
    id: "payme",
    name: "Payme",
    caption: "Payme ilovasi orqali o'tkazma",
    cardClass: "border-payme/40 hover:border-payme bg-payme/5 hover:bg-payme/10",
    logoClass: "bg-payme text-payme-foreground",
    logo: "P",
    appUrl: "https://payme.uz/",
  },
  {
    id: "uzum",
    name: "Uzum Pay",
    caption: "Uzum Bank ilovasi orqali o'tkazma",
    cardClass: "border-uzum/40 hover:border-uzum bg-uzum/5 hover:bg-uzum/10",
    logoClass: "bg-uzum text-uzum-foreground",
    logo: "U",
    appUrl: "https://uzumbank.uz/",
  },
];

const formatCard = (v: string) =>
  v.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim() || v;

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName?: string;
  amount?: number;
}

const CheckoutDialog = ({
  open,
  onOpenChange,
  planName = "Fermer tarifi",
  amount = 40000,
}: CheckoutDialogProps) => {
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("select");
  const [provider, setProvider] = useState<Provider | null>(null);
  const [settings, setSettings] = useState<Record<string, PaymentSetting>>({});
  const [loading, setLoading] = useState(true);
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStage("select");
        setProvider(null);
        setReceipt(null);
      }, 250);
      return () => clearTimeout(t);
    }

    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }
      setAuthRequired(false);
      const { data } = await supabase
        .from("payment_settings" as any)
        .select("provider, card_number, card_holder, bank_name, phone, instructions")
        .eq("is_active", true);
      const map: Record<string, PaymentSetting> = {};
      ((data as any[]) || []).forEach((s: any) => (map[s.provider] = s));
      setSettings(map);
      setLoading(false);
    })();
  }, [open]);

  const active = METHODS.find((m) => m.id === provider);
  const setting = provider ? settings[provider] : undefined;

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Nusxalandi", description: label });
    } catch {
      toast({ title: "Nusxalab bo'lmadi", variant: "destructive" });
    }
  };

  const submit = async () => {
    if (!provider) return;
    setStage("sending");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Tizimga kiring",
          description: "To'lovni tasdiqlash uchun avval tizimga kiring",
          variant: "destructive",
        });
        setStage("pay");
        return;
      }

      let receiptPath: string | null = null;
      if (receipt) {
        if (receipt.size > 5 * 1024 * 1024) {
          toast({
            title: "Fayl juda katta",
            description: "Kvitansiya hajmi 5MB dan oshmasligi kerak",
            variant: "destructive",
          });
          setStage("pay");
          return;
        }
        const ext = receipt.name.split(".").pop()?.toLowerCase() || "jpg";
        receiptPath = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("payment-receipts")
          .upload(receiptPath, receipt);
        if (upErr) throw upErr;
      }

      const { error } = await supabase.from("payment_requests" as any).insert({
        user_id: user.id,
        plan_name: planName,
        amount,
        provider,
        payer_name: payerName.trim().slice(0, 100) || null,
        payer_phone: payerPhone.trim().slice(0, 20) || null,
        receipt_url: receiptPath,
      });
      if (error) throw error;

      setStage("success");
    } catch (e: any) {
      toast({
        title: "Xatolik",
        description: e.message || "To'lovni yuborishda xatolik",
        variant: "destructive",
      });
      setStage("pay");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[470px] max-h-[90vh] overflow-y-auto">
        {stage === "select" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-poppins">
                <CreditCard className="w-5 h-5 text-primary" />
                To'lovni amalga oshirish
              </DialogTitle>
              <DialogDescription>To'lov tizimini tanlang</DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tarif</span>
                <span className="font-medium text-foreground">{planName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Muddat</span>
                <span className="font-medium text-foreground">1 oy</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Jami</span>
                <span className="text-2xl font-bold text-primary">
                  {amount.toLocaleString()} so'm
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {METHODS.map((m) => {
                  const available = !!settings[m.id];
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!available}
                      onClick={() => {
                        setProvider(m.id);
                        setStage("pay");
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all hover:shadow-soft active:scale-[0.99]",
                        m.cardClass,
                        !available && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span
                        className={cn(
                          "w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold shrink-0",
                          m.logoClass
                        )}
                      >
                        {m.logo}
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold text-foreground">{m.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {available ? m.caption : "Hozircha mavjud emas"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              To'lov karta orqali to'g'ridan-to'g'ri amalga oshiriladi
            </p>
          </>
        )}

        {stage === "pay" && active && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-poppins">
                <span
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                    active.logoClass
                  )}
                >
                  {active.logo}
                </span>
                {active.name} orqali to'lov
              </DialogTitle>
              <DialogDescription>
                {active.name} ilovasini ochib, quyidagi kartaga{" "}
                {amount.toLocaleString()} so'm o'tkazing
              </DialogDescription>
            </DialogHeader>

            {setting && (
              <div className="rounded-xl border-2 border-border p-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Karta raqami</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold tracking-wider text-foreground">
                      {formatCard(setting.card_number)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copy(setting.card_number, "Karta raqami")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Karta egasi</Label>
                    <p className="font-medium text-foreground">{setting.card_holder}</p>
                  </div>
                  {setting.bank_name && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Bank</Label>
                      <p className="font-medium text-foreground">{setting.bank_name}</p>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">To'lov summasi</span>
                  <span className="text-lg font-bold text-primary">
                    {amount.toLocaleString()} so'm
                  </span>
                </div>
                {setting.instructions && (
                  <p className="text-xs text-muted-foreground">{setting.instructions}</p>
                )}
              </div>
            )}

            <Button variant="outline" className="w-full" asChild>
              <a href={active.appUrl} target="_blank" rel="noopener noreferrer">
                {active.name} ilovasini ochish
              </a>
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="payer-name">Ismingiz</Label>
                <Input
                  id="payer-name"
                  maxLength={100}
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Ism familiya"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payer-phone">Telefon</Label>
                <Input
                  id="payer-phone"
                  maxLength={20}
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="+998901234567"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="receipt">Kvitansiya rasmi (ixtiyoriy)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="receipt"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" onClick={() => setStage("select")}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Ortga
              </Button>
              <Button className="btn-farm flex-1" onClick={submit}>
                To'lovni tasdiqlash
              </Button>
            </div>
          </>
        )}

        {stage === "sending" && (
          <div className="py-12 flex flex-col items-center text-center space-y-4">
            <DialogHeader className="sr-only">
              <DialogTitle>Yuborilmoqda</DialogTitle>
            </DialogHeader>
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">To'lov ma'lumotlari yuborilmoqda...</p>
          </div>
        )}

        {stage === "success" && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <DialogHeader className="sr-only">
              <DialogTitle>To'lov yuborildi</DialogTitle>
            </DialogHeader>
            <span className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="w-11 h-11" />
            </span>
            <h3 className="text-xl font-poppins font-semibold text-foreground">
              To'lov muvaffaqiyatli yuborildi
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {planName} uchun {amount.toLocaleString()} so'm to'lov {active?.name} orqali
              qayd etildi. Admin tasdiqlagach tarif faollashadi.
            </p>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Holat: tasdiqlash kutilmoqda
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

export default CheckoutDialog;
