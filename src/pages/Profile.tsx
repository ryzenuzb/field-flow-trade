import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Phone, MapPin, Save, Edit, Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const auth = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.isAuthenticated) {
      navigate("/auth");
      return;
    }
    // Set profile data when available
    if (auth.profile) {
      setFormData({
        fullName: auth.profile.full_name || "",
        email: auth.profile.email || auth.user?.email || "",
        phone: auth.profile.phone || "",
        location: auth.profile.location || "",
      });
    }
    if (auth.user) {
      fetchOrders(auth.user.id);
    }
  }, [auth.loading, auth.isAuthenticated, auth.profile, auth.user]);

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(title, price, unit, image_url)")
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setOrders(data || []);
    } catch {
      toast({ title: "Xatolik", description: "Buyurtmalarni yuklashda xatolik", variant: "destructive" });
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await auth.updateProfile({
      full_name: formData.fullName,
      phone: formData.phone || undefined,
      location: formData.location || undefined,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Xatolik", description: error, variant: "destructive" });
    } else {
      setIsEditing(false);
      toast({ title: "Saqlandi", description: "Profil ma'lumotlaringiz yangilandi" });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Kutilmoqda",
      processing: "Qabul qilindi",
      shipped: "Yuborildi",
      delivered: "Yetkazildi",
      cancelled: "Bekor qilindi",
    };
    return map[status] || status;
  };

  const getStatusVariant = (status: string) => {
    if (status === "delivered") return "default";
    if (status === "cancelled") return "destructive";
    if (status === "pending") return "secondary";
    return "outline";
  };

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold">Profil</CardTitle>
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Saqlash
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Tahrirlash
                  </>
                )}
              </Button>
            </div>
            <CardDescription>Shaxsiy ma'lumotlaringizni boshqaring</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4 pb-6 border-b">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {formData.fullName?.charAt(0)?.toUpperCase() || <User className="w-10 h-10" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{formData.fullName || "Foydalanuvchi"}</h3>
                <p className="text-muted-foreground">{formData.email}</p>
                {auth.isFarmer && (
                  <Badge className="mt-1" variant="secondary">Fermer</Badge>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  To'liq ism
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input id="email" type="email" value={formData.email} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefon
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  disabled={!isEditing}
                  placeholder="+998 90 123 45 67"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Manzil
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Toshkent, O'zbekiston"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{orders.length}</p>
                <p className="text-sm text-muted-foreground">Buyurtmalar</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {orders.filter((o) => o.status === "delivered").length}
                </p>
                <p className="text-sm text-muted-foreground">Yetkazilgan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders History */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              <CardTitle>Buyurtmalar tarixi</CardTitle>
            </div>
            <CardDescription>Sizning barcha buyurtmalaringiz</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Hozircha buyurtmalar yo'q</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mahsulot</TableHead>
                      <TableHead>Miqdor</TableHead>
                      <TableHead>Narx</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Sana</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.products?.title || "Noma'lum"}
                        </TableCell>
                        <TableCell>
                          {order.quantity} {order.products?.unit || "dona"}
                        </TableCell>
                        <TableCell>{order.total_price.toLocaleString("uz-UZ")} so'm</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString("uz-UZ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
