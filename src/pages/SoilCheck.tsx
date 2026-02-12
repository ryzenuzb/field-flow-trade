import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Microscope, CheckCircle, Clock, Leaf, ArrowRight, Beaker } from "lucide-react";
import SoilRequestForm from "@/components/soil/SoilRequestForm";
import SoilRequestList from "@/components/soil/SoilRequestList";

const SoilCheck = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    checkAuth();
  }, []);

  const steps = [
    {
      icon: Leaf,
      title: "So'rov yuboring",
      description: "Yer joylashuvi, maydoni va oldingi ekinlar haqida ma'lumot bering",
      badge: "1-qadam",
    },
    {
      icon: CheckCircle,
      title: "Bepul tekshiruv",
      description: "Mutaxassis yeringizga kelib, dastlabki bepul tekshiruv o'tkazadi",
      badge: "BEPUL",
    },
    {
      icon: Beaker,
      title: "Batafsil tahlil",
      description: "Tuproq unumdorligi, pH, namlik va NPK darajasi to'liq tahlil qilinadi",
      badge: "Pullik",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden section-field">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30">
            🌱 Soil Check – Tuproq Tahlili
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-poppins font-bold text-foreground mb-6">
            Yer <span className="gradient-text">Unumdorligini</span> Tekshiring
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Birinchi tekshiruv mutlaqo bepul! Mutaxassislar yeringizga kelib, tuproq holatini baholaydi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {userId ? (
              <Button onClick={() => setShowForm(true)} className="btn-farm text-lg px-8 py-4 h-auto">
                Bepul Tekshiruv So'rovi
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")} className="btn-farm text-lg px-8 py-4 h-auto">
                Ro'yxatdan O'ting
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-poppins font-bold text-center text-foreground mb-12">
            Qanday ishlaydi?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <Card key={i} className="text-center product-card">
                  <CardContent className="p-8">
                    <Badge className={`mb-4 ${step.badge === "BEPUL" ? "bg-green-100 text-green-700 border-green-200" : step.badge === "Pullik" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-primary/10 text-primary border-primary/20"}`}>
                      {step.badge}
                    </Badge>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Request Form Dialog */}
      {showForm && userId && (
        <SoilRequestForm
          userId={userId}
          open={showForm}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* My Requests */}
      {userId && (
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-poppins font-bold text-foreground mb-8">
              Mening So'rovlarim
            </h2>
            <SoilRequestList userId={userId} />
          </div>
        </section>
      )}
    </div>
  );
};

export default SoilCheck;
