import { useState } from "react";
import { Check, Sparkles, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CheckoutDialog from "@/components/CheckoutDialog";
import ClusterContactDialog from "@/components/ClusterContactDialog";

const PricingSection = () => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [clusterOpen, setClusterOpen] = useState(false);


  const farmerFeatures = [
    "Real vaqtda narxlar monitoringi",
    "Onlayn marketplace — mahsulot sotish va sotib olish",
    "AI orqali o'simlik kasalliklarini aniqlash",
  ];

  const clusterFeatures = [
    "Fermer tarifidagi barcha imkoniyatlar",
    "Soil Check — tuproq tahlili va ekin tavsiyalari",
    "Tahliliy panellar va hisobotlar",
    "Shaxsiy menejer xizmati",
  ];

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            💳 Tariflar
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-poppins font-bold text-foreground mb-4">
            O'zingizga mos <span className="gradient-text">tarifni tanlang</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Kichik fermer xo'jaligidan yirik klasterlargacha — har bir ehtiyoj uchun yechim
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
          {/* Fermer */}
          <Card className="relative border-2 border-primary shadow-green overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary to-primary-light" />
            <Badge className="absolute top-5 right-5 bg-primary text-primary-foreground border-transparent">
              Ommabop
            </Badge>
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-poppins font-semibold text-foreground mb-1">Fermer</h3>
              <p className="text-muted-foreground mb-6">Oylik obuna — hamyonbop va qulay</p>

              <div className="flex items-end gap-2 mb-8">
                <span className="text-4xl lg:text-5xl font-bold text-primary">40 000</span>
                <span className="text-muted-foreground mb-1">so'm / oy</span>
              </div>

              <ul className="space-y-3 mb-8">
                {farmerFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-foreground">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              <Button className="btn-farm w-full justify-center" onClick={() => setCheckoutOpen(true)}>
                Hozir boshlash
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Klaster */}
          <Card className="border border-border shadow-soft">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-xl bg-muted text-secondary-foreground flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-poppins font-semibold text-foreground mb-1">Klaster</h3>
              <p className="text-muted-foreground mb-6">Korporativ yechim — gektarbay hisoblanadi</p>

              <div className="flex items-end gap-2 mb-8">
                <span className="text-3xl lg:text-4xl font-bold text-foreground">Kelishilgan narxda</span>
              </div>

              <ul className="space-y-3 mb-8">
                {clusterFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-foreground">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full" onClick={() => setClusterOpen(true)}>
                Aloqaga chiqish
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        planName="Fermer tarifi"
        amount={40000}
      />

      <ClusterContactDialog
        open={clusterOpen}
        onOpenChange={setClusterOpen}
      />
    </section>
  );
};

export default PricingSection;
