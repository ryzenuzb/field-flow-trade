import { useEffect, useState } from "react";
import { Loader2, Save, CreditCard, Check, X, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Provider = "click" | "payme" | "uzum";

const PROVIDERS: { id: Provider; label: string; dot: string }[] = [
  { id: "click", label: "Click", dot: "bg-click" },
  { id: "payme", label: "Payme", dot: "bg-payme" },
  { id: "uzum", label: "Uzum Pay", dot: "bg-uzum" },
];

interface SettingRow {
  provider: Provider;
  card_number: string;
  card_holder: string;
  bank_name: string;
  phone: string;
  instructions: string;
  is_active: boolean;
}

interface RequestRow {
  id: string;
  plan_name: string;
  amount: number;
  provider: Provider;
  payer_name: string | null;
  payer_phone: string | null;
  receipt_url: string | null;
  status: string;
  created_at: string;
}

const emptyRow = (provider: Provider): SettingRow => ({
  provider,
  card_number: "",
  card_holder: "",
  bank_name: "",
  phone: "",
  instructions: "",
  is_active: true,
});

export const PaymentSettingsPanel = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Record<Provider, SettingRow>>({
    click: emptyRow("click"),
    payme: emptyRow("payme"),
    uzum: emptyRow("uzum"),
  });
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Provider | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: settings }, { data: reqs }] = await Promise.all([
      supabase.from("payment_settings" as any).select("*"),
      supabase
        .from("payment_requests" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const next = {
      click: emptyRow("click"),
      payme: emptyRow("payme"),
      uzum: emptyRow("uzum"),
    } as Record<Provider, SettingRow>;
    ((settings as any[]) || []).forEach((s: any) => {
      next[s.provider as Provider] = {
        provider: s.provider,
        card_number: s.card_number || "",
        card_holder: s.card_holder || "",
        bank_name: s.bank_name || "",
        phone: s.phone || "",
        instructions: s.instructions || "",
        is_active: s.is_active,
      };
    });
    setRows(next);
    setRequests(((reqs as any[]) || []) as RequestRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (provider: Provider) => {
    const row = rows[provider];
    if (!row.card_number.trim() || !row.card_holder.trim()) {
      toast({
        title: "Ma'lumot to'liq emas",
        description: "Karta raqami va karta egasi ismini kiriting",
        variant: "destructive",
      });
      return;
    }
    setSaving(provider);
    const { error } = await supabase.from("payment_settings" as any).upsert(
      {
        provider,
        card_number: row.card_number.trim(),
        card_holder: row.card_holder.trim(),
        bank_name: row.bank_name.trim() || null,
        phone: row.phone.trim() || null,
        instructions: row.instructions.trim() || null,
        is_active: row.is_active,
      },
      { onConflict: "provider" }
    );
    setSaving(null);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saqlandi", description: `${provider.toUpperCase()} to'lov ma'lumotlari yangilandi` });
    load();
  };

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("payment_requests" as any)
      .update({ status })
      .eq("id", id);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "approved" ? "Tasdiqlandi" : "Rad etildi" });
    load();
  };

  const openReceipt = async (path: string) => {
    const { data } = await supabase.storage
      .from("payment-receipts")
      .createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Karta ma'lumotlari
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Bu ma'lumotlar to'lov oynasida foydalanuvchiga ko'rsatiladi. Karta raqamini faqat shu
            yerdan kiriting.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {PROVIDERS.map((p) => {
            const row = rows[p.id];
            return (
              <div key={p.id} className="rounded-xl border border-border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <span className={`w-3 h-3 rounded-full ${p.dot}`} />
                    {p.label}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${p.id}`} className="text-sm text-muted-foreground">
                      Faol
                    </Label>
                    <Switch
                      id={`active-${p.id}`}
                      checked={row.is_active}
                      onCheckedChange={(v) =>
                        setRows((r) => ({ ...r, [p.id]: { ...r[p.id], is_active: v } }))
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Karta raqami</Label>
                    <Input
                      inputMode="numeric"
                      maxLength={25}
                      placeholder="8600 1234 5678 9012"
                      value={row.card_number}
                      onChange={(e) =>
                        setRows((r) => ({
                          ...r,
                          [p.id]: { ...r[p.id], card_number: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Karta egasi</Label>
                    <Input
                      maxLength={100}
                      placeholder="MURODJON MAHMUDOV"
                      value={row.card_holder}
                      onChange={(e) =>
                        setRows((r) => ({
                          ...r,
                          [p.id]: { ...r[p.id], card_holder: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bank</Label>
                    <Input
                      maxLength={100}
                      placeholder="Uzcard / Humo / Uzum Bank"
                      value={row.bank_name}
                      onChange={(e) =>
                        setRows((r) => ({
                          ...r,
                          [p.id]: { ...r[p.id], bank_name: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Aloqa telefoni</Label>
                    <Input
                      maxLength={20}
                      placeholder="+998901234567"
                      value={row.phone}
                      onChange={(e) =>
                        setRows((r) => ({ ...r, [p.id]: { ...r[p.id], phone: e.target.value } }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Ko'rsatma (ixtiyoriy)</Label>
                  <Textarea
                    maxLength={500}
                    rows={2}
                    placeholder="To'lovni amalga oshirgach kvitansiya rasmini yuklang"
                    value={row.instructions}
                    onChange={(e) =>
                      setRows((r) => ({
                        ...r,
                        [p.id]: { ...r[p.id], instructions: e.target.value },
                      }))
                    }
                  />
                </div>

                <Button onClick={() => save(p.id)} disabled={saving === p.id}>
                  {saving === p.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Saqlash
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            To'lov so'rovlari ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Hozircha to'lov so'rovlari yo'q
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center gap-3 justify-between rounded-lg border border-border p-3"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">
                      {r.plan_name} — {Number(r.amount).toLocaleString()} so'm
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.provider.toUpperCase()} · {r.payer_name || "—"} ·{" "}
                      {r.payer_phone || "—"} ·{" "}
                      {new Date(r.created_at).toLocaleString("uz-UZ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        r.status === "approved"
                          ? "bg-primary/10 text-primary"
                          : r.status === "rejected"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {r.status === "approved"
                        ? "Tasdiqlangan"
                        : r.status === "rejected"
                        ? "Rad etilgan"
                        : "Kutilmoqda"}
                    </Badge>
                    {r.receipt_url && (
                      <Button size="sm" variant="outline" onClick={() => openReceipt(r.receipt_url!)}>
                        Kvitansiya
                      </Button>
                    )}
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => setStatus(r.id, "approved")}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setStatus(r.id, "rejected")}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSettingsPanel;
