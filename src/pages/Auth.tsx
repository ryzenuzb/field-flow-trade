import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Tractor, User } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [userType, setUserType] = useState<"buyer" | "farmer">("buyer");

  const handleSignUp = async (e: React.FormEvent, isFarmer: boolean = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with additional info
        await supabase
          .from("profiles")
          .update({ phone, location })
          .eq("user_id", data.user.id);

        // If farmer, add farmer role using secure database function
        if (isFarmer) {
          const { error: roleError } = await supabase.rpc("assign_farmer_role", {
            user_id_param: data.user.id,
          });
          if (roleError) {
            console.error("Error assigning farmer role:", roleError);
          }
        }

        toast({
          title: "Ro'yxatdan o'tish muvaffaqiyatli!",
          description: isFarmer 
            ? "Fermer sifatida ro'yxatdan o'tdingiz. Iltimos, hisobingizga kiring" 
            : "Iltimos, hisobingizga kiring",
        });
      }
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent, checkFarmerRole: boolean = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user is blocked
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_blocked, block_reason")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (profileData?.is_blocked) {
          await supabase.auth.signOut();
          toast({
            title: "Hisob bloklangan",
            description: profileData.block_reason 
              ? `Sabab: ${profileData.block_reason}` 
              : "Sizning hisobingiz bloklangan. Iltimos, admin bilan bog'laning.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (checkFarmerRole) {
          // Check if user has farmer role
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .eq("role", "farmer")
            .maybeSingle();

          if (!roleData) {
            await supabase.auth.signOut();
            toast({
              title: "Ruxsat yo'q",
              description: "Bu hisob fermer sifatida ro'yxatdan o'tmagan",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          navigate("/farmer");
        } else {
          navigate("/");
        }
      }
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setLocation("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* User Type Selection */}
        <div className="flex justify-center gap-4">
          <Button
            variant={userType === "buyer" ? "default" : "outline"}
            onClick={() => { setUserType("buyer"); resetForm(); }}
            className="flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Xaridor
          </Button>
          <Button
            variant={userType === "farmer" ? "default" : "outline"}
            onClick={() => { setUserType("farmer"); resetForm(); }}
            className="flex items-center gap-2 bg-farm hover:bg-farm-dark"
          >
            <Tractor className="w-4 h-4" />
            Fermer
          </Button>
        </div>

        <Card className={userType === "farmer" ? "border-farm/50 shadow-lg shadow-farm/10" : ""}>
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              {userType === "farmer" && <Tractor className="w-6 h-6 text-farm" />}
              FarmTrade
            </CardTitle>
            <CardDescription className="text-center">
              {userType === "farmer" 
                ? "Fermerlar uchun maxsus kirish" 
                : "Qishloq xo'jaligi mahsulotlari savdosi"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userType === "buyer" ? (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Kirish</TabsTrigger>
                  <TabsTrigger value="signup">Ro'yxatdan o'tish</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={(e) => handleSignIn(e, false)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Parol</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Kirish
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={(e) => handleSignUp(e, false)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">To'liq ism</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Parol</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Telefon (ixtiyoriy)</Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-location">Joylashuv (ixtiyoriy)</Label>
                      <Input
                        id="signup-location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Ro'yxatdan o'tish
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              /* Farmer Section */
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Fermer kirish</TabsTrigger>
                  <TabsTrigger value="signup">Fermer ro'yxat</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={(e) => handleSignIn(e, true)} className="space-y-4">
                    <div className="p-3 bg-farm/10 rounded-lg border border-farm/20 mb-4">
                      <p className="text-sm text-muted-foreground">
                        🌾 Fermer sifatida kiring va o'z mahsulotlaringizni boshqaring
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="farmer-signin-email">Email</Label>
                      <Input
                        id="farmer-signin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="farmer-signin-password">Parol</Label>
                      <Input
                        id="farmer-signin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-farm hover:bg-farm-dark" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Tractor className="mr-2 h-4 w-4" />
                      Fermer kirish
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={(e) => handleSignUp(e, true)} className="space-y-4">
                    <div className="p-3 bg-farm/10 rounded-lg border border-farm/20 mb-4">
                      <p className="text-sm text-muted-foreground">
                        🚜 Fermer sifatida ro'yxatdan o'ting va mahsulotlaringizni sotishni boshlang
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="farmer-signup-name">To'liq ism</Label>
                      <Input
                        id="farmer-signup-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="farmer-signup-email">Email</Label>
                      <Input
                        id="farmer-signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="farmer-signup-password">Parol</Label>
                      <Input
                        id="farmer-signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="farmer-signup-phone">Telefon</Label>
                      <Input
                        id="farmer-signup-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="farmer-signup-location">Ferma joylashuvi</Label>
                      <Input
                        id="farmer-signup-location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Toshkent viloyati"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-farm hover:bg-farm-dark" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Tractor className="mr-2 h-4 w-4" />
                      Fermer ro'yxatdan o'tish
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
