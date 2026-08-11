import { Handshake, FlaskConical, Percent, Users, Sprout, LineChart, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HowItWorksSection = () => {
  const navigate = useNavigate();

  const blocks = [
    {
      icon: Handshake,
      badge: "Marketplace",
      title: "Shaffof Marketplace",
      description:
        "Fermerlar va ulgurji xaridorlar o'rtasida vositachilarsiz to'g'ridan-to'g'ri aloqa. Narxlar ochiq, kelishuvlar shaffof.",
      points: [
        { icon: Users, text: "Vositachilarsiz to'g'ridan-to'g'ri savdo" },
        { icon: Percent, text: "Har bir muvaffaqiyatli kelishuvdan bor-yo'g'i 1–1.5% tranzaksiya komissiyasi" },
        { icon: Sprout, text: "Mahsulot sifati va sotuvchi tasdiqlangan profil" },
      ],
      action: { label: "Bozorni ko'rish", onClick: () => navigate("/marketplace") },
      featured: true,
    },
    {
      icon: FlaskConical,
      badge: "Soil Check",
      title: "Soil Check (Tuproq tahlili)",
      description:
        "Yirik klasterlar va agro-kompaniyalar uchun tuproq tarkibini laboratoriya darajasida tahlil qilish tizimi.",
      points: [
        { icon: FlaskConical, text: "Tuproq tarkibi: azot, fosfor, kaliy, pH va organik modda" },
        { icon: LineChart, text: "Kelgusi yil uchun eng serdaromad ekin navbati tavsiyasi" },
        { icon: Users, text: "Klasterlar uchun shaxsiy menejer va tahliliy hisobotlar" },
      ],
      action: { label: "Tahlilga buyurtma", onClick: () => navigate("/soil-check") },
      featured: false,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            🌾 Qanday ishlaydi
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-poppins font-bold text-foreground mb-4">
            Biz <span className="gradient-text">qanday ishlaymiz?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            FarmTrade dehqonchilikni raqamlashtiradi: shaffof savdo va ilmiy asoslangan tuproq tahlili.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {blocks.map((block, i) => {
            const Icon = block.icon;
            return (
              <Card
                key={i}
                className={`relative h-full overflow-hidden transition-transform hover:-translate-y-1 ${
                  block.featured
                    ? "border-primary/40 bg-primary/5 shadow-lg"
                    : "border-border bg-card"
                }`}
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-1">{block.badge}</Badge>
                      <h3 className="text-2xl font-poppins font-semibold text-foreground">
                        {block.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6">{block.description}</p>

                  <ul className="space-y-4 mb-8">
                    {block.points.map((p, j) => {
                      const PIcon = p.icon;
                      return (
                        <li key={j} className="flex items-start gap-3">
                          <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <PIcon className="w-4 h-4" />
                          </span>
                          <span className="text-sm text-foreground/90 leading-relaxed pt-1.5">
                            {p.text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <Button
                    onClick={block.action.onClick}
                    variant={block.featured ? "default" : "outline"}
                    className={block.featured ? "btn-farm w-full" : "w-full"}
                  >
                    {block.action.label}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
