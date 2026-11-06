import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    if (window.location.hash.includes("type=recovery")) setReady(true);
    supabase.auth.getSession().then(({ data }) => data.session && setReady(true));
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Parol kamida 8 belgidan iborat bo'lsin.");
    if (password !== confirm) return setError("Parollar mos kelmadi.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.code === "weak_password" ? "Kuchliroq parol tanlang." : error.code === "same_password" ? "Yangi parol eskisidan farq qilishi kerak." : "Parol yangilanmadi. Havola eskirgan bo'lishi mumkin — qaytadan so'rang.");
      return;
    }
    toast({ title: "Parol yangilandi", description: "Endi yangi parol bilan foydalanishingiz mumkin." });
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Yangi parol o'rnatish</CardTitle>
          <CardDescription>Yangi parolingizni kiriting.</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="space-y-3 text-center">
              <p className="text-muted-foreground">Havola tekshirilmoqda... Agar bu sahifani emaildagi havola orqali ochmagan bo'lsangiz, qaytadan so'rang.</p>
              <Button variant="outline" onClick={() => navigate("/forgot-password")}>Yangi havola so'rash</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rp-pass">Yangi parol</Label>
                <Input id="rp-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rp-confirm">Parolni takrorlang</Label>
                <Input id="rp-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Parolni saqlash
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
