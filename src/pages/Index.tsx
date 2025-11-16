import { ArrowRight, Sprout, Users, MessageCircle, Bot, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import farmHeroImage from "@/assets/farm-hero.jpg";
import Navigation from "@/components/ui/navigation";
import AIAssistant from "@/components/AIAssistant";

const Index = () => {
  const features = [
    {
      icon: Sprout,
      title: "Mahsulot Savdosi",
      description: "Sifatli qishloq xo'jaligi mahsulotlarini to'g'ridan-to'g'ri fermerlardan sotib oling va soting",
      color: "text-green-600"
    },
    {
      icon: Users,
      title: "Fermerlar Jamiyati",
      description: "Bir-biringiz bilan bog'laning, tajriba almashing va hamkorlik qiling",
      color: "text-blue-600"
    },
    {
      icon: MessageCircle,
      title: "Real-time Chat",
      description: "Xaridorlar va sotuvchilar o'rtasida tezkor muloqot va savol-javob",
      color: "text-purple-600"
    },
    {
      icon: Bot,
      title: "AI Yordamchi",
      description: "Fermerchilik bo'yicha AI maslahatchi va savdo optimizatsiyasi",
      color: "text-orange-600"
    }
  ];

  const stats = [
    { number: "500+", label: "Faol Fermerlar" },
    { number: "2,000+", label: "Mahsulotlar" },
    { number: "50,000+", label: "Muvaffaqiyatli Savdolar" },
    { number: "15+", label: "Viloyatlar" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={farmHeroImage}
            alt="Farm landscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 animate-float">
              🌱 Fermerlar uchun #1 Platforma
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-poppins font-bold text-white mb-6 fade-in">
              Farm<span className="text-green-400">Trade</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-200 mb-8 slide-up">
              Fermerlar va bog'bonlar uchun zamonaviy savdo-sotiq platformasi. 
              Mahsulotlaringizni soting, yangi xaridorlar toping va AI yordamchi bilan muvaffaqiyatga erishing.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 slide-up">
              <Button className="btn-farm text-lg px-8 py-4 h-auto">
                Hoziroq Boshlash
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" className="text-lg px-8 py-4 h-auto bg-white/10 border-white/30 text-white hover:bg-white/20">
                Bozorni Ko'rish
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 section-field">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-poppins font-bold text-foreground mb-6">
              Nima uchun <span className="gradient-text">FarmTrade?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Zamonaviy texnologiyalar yordamida fermerchilik faoliyatingizni yangi bosqichga olib chiqing
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="product-card text-center h-full">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center ${feature.color}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-poppins font-semibold mb-3 text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-light">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-poppins font-bold text-white mb-6">
            Fermerchilikda Yangi Imkoniyatlar
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Minglab fermerlar allaqachon FarmTrade orqali o'z bizneslarini rivojlantirishmoqda. 
            Siz ham qo'shiling!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="btn-earth text-lg px-8 py-4 h-auto">
              Ro'yxatdan O'tish
            </Button>
            <Button variant="outline" className="text-lg px-8 py-4 h-auto bg-white/10 border-white/30 text-white hover:bg-white/20">
              Ko'proq Ma'lumot
            </Button>
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              🤖 AI Texnologiya
            </Badge>
            <h2 className="text-4xl font-bold mb-4">AI Fermer Yordamchisi</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Qishloq xo'jaligi bo'yicha savollaringizga sun'iy intellekt orqali professional maslahat oling
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <AIAssistant />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-rich text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sprout className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-poppins font-bold">FarmTrade</span>
              </div>
              <p className="text-gray-300">
                Fermerlar uchun zamonaviy savdo-sotiq platformasi
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platforma</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Bozor</li>
                <li>AI Yordamchi</li>
                <li>Chat</li>
                <li>Profil</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Yordam</h4>
              <ul className="space-y-2 text-gray-300">
                <li>FAQ</li>
                <li>Qo'llab-quvvatlash</li>
                <li>Qoidalar</li>
                <li>Maxfiylik</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Bog'lanish</h4>
              <ul className="space-y-2 text-gray-300">
                <li>+998 90 123 45 67</li>
                <li>info@farmtrade.uz</li>
                <li>Toshkent, O'zbekiston</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-600 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 FarmTrade. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
