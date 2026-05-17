import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, Share2, Users, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralCardProps {
  userId: string;
}

export const ReferralCard = ({ userId }: ReferralCardProps) => {
  const { toast } = useToast();
  const [code, setCode] = useState<string>("");
  const [referredCount, setReferredCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("user_id", userId).maybeSingle(),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("referred_by", userId),
      ]);
      setCode(profile?.referral_code || "");
      setReferredCount(count || 0);
      setLoading(false);
    };
    load();
  }, [userId]);

  const link = code ? `${window.location.origin}/auth?ref=${code}` : "";

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: "Nusxalandi", description: `${label} buferga ko'chirildi` });
    } catch {
      toast({ title: "Xatolik", description: "Nusxalashda xatolik", variant: "destructive" });
    }
  };

  const share = async () => {
    const text = `FarmTrade'ga taklif qilaman! Mening kodim: ${code}\n${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FarmTrade taklif", text, url: link });
      } catch { /* user cancelled */ }
    } else {
      copy(text, "Taklif matni");
    }
  };

  if (loading) return null;

  return (
    <Card className="mt-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <CardTitle>Do'stlaringizni taklif qiling</CardTitle>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Users className="w-3 h-3" />
            {referredCount} ta taklif qilingan
          </Badge>
        </div>
        <CardDescription>
          Taklif kodingiz orqali ro'yxatdan o'tgan har bir foydalanuvchi sizga bonus olib keladi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={code} readOnly className="font-mono text-lg font-bold tracking-wider text-center" />
          <Button variant="outline" size="icon" onClick={() => copy(code, "Kod")} title="Kodni nusxalash">
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex gap-2">
          <Input value={link} readOnly className="text-xs" />
          <Button variant="outline" size="icon" onClick={() => copy(link, "Havola")} title="Havolani nusxalash">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={share} className="w-full">
          <Share2 className="w-4 h-4 mr-2" />
          Ulashish
        </Button>
      </CardContent>
    </Card>
  );
};
