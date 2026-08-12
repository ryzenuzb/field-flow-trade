import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Method = "click" | "payme" | "uzum";
type Stage = "select" | "processing" | "success";

const METHODS: {
  id: Method;
  name: string;
  caption: string;
  cardClass: string;
  logoClass: string;
  logo: string;
}[] = [
  {
    id: "click",
    name: "Click",
    caption: "Click Up / Click Evolution",
    cardClass: "border-click/40 hover:border-click bg-click/5 hover:bg-click/10",
    logoClass: "bg-click text-click-foreground",
    logo: "C",
  },
  {
    id: "payme",
    name: "Payme",
    caption: "Payme mobil ilovasi",
    cardClass: "border-payme/40 hover:border-payme bg-payme/5 hover:bg-payme/10",
    logoClass: "bg-payme text-payme-foreground",
    logo: "P",
  },
  {
    id: "uzum",
    name: "Uzum Pay",
    caption: "Uzum Bank to'lovi",
    cardClass: "border-uzum/40 hover:border-uzum bg-uzum/5 hover:bg-uzum/10",
    logoClass: "bg-uzum text-uzum-foreground",
    logo: "U",
  },
];

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
  const [stage, setStage] = useState<Stage>("select");
  const [method, setMethod] = useState<Method | null>(null);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStage("select");
        setMethod(null);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handlePay = (id: Method) => {
    setMethod(id);
    setStage("processing");
    setTimeout(() => setStage("success"), 1800);
  };

  const active = METHODS.find((m) => m.id === method);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        {stage === "select" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-poppins">
                <CreditCard className="w-5 h-5 text-primary" />
                To'lovni amalga oshirish
              </DialogTitle>
              <DialogDescription>
                To'lov tizimini tanlang — to'lov xavfsiz tarzda amalga oshiriladi
              </DialogDescription>
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

            <div className="space-y-3 pt-1">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handlePay(m.id)}
                  className={cn(
                    "w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all hover:shadow-soft active:scale-[0.99]",
                    m.cardClass
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
                    <span className="block text-xs text-muted-foreground">{m.caption}</span>
                  </span>
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Bu demo to'lov — haqiqiy pul yechilmaydi
            </p>
          </>
        )}

        {stage === "processing" && (
          <div className="py-10 flex flex-col items-center text-center space-y-4">
            <DialogHeader className="sr-only">
              <DialogTitle>To'lov amalga oshirilmoqda</DialogTitle>
            </DialogHeader>
            <span
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold",
                active?.logoClass
              )}
            >
              {active?.logo}
            </span>
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              {active?.name} orqali to'lov amalga oshirilmoqda...
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Iltimos kutib turing, {amount.toLocaleString()} so'm miqdoridagi to'lov
              tasdiqlanmoqda
            </p>
          </div>
        )}

        {stage === "success" && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <DialogHeader className="sr-only">
              <DialogTitle>To'lov muvaffaqiyatli</DialogTitle>
            </DialogHeader>
            <span className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="w-11 h-11" />
            </span>
            <h3 className="text-xl font-poppins font-semibold text-foreground">
              To'lov muvaffaqiyatli amalga oshirildi
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {planName} faollashtirildi. {active?.name} orqali{" "}
              {amount.toLocaleString()} so'm to'landi.
            </p>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Tranzaksiya: DEMO-{Date.now().toString().slice(-8)}
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
