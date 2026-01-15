import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, RefreshCw, LayoutDashboard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminCommandPanel } from "@/components/AdminCommandPanel";
import { AdminStats } from "@/components/admin/AdminStats";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { SellerVerificationPanel } from "@/components/admin/SellerVerificationPanel";
import { UsersTable } from "@/components/admin/UsersTable";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { ProductsTable } from "@/components/admin/ProductsTable";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  location: string | null;
  created_at: string;
  roles?: { role: string }[];
}

interface Product {
  id: string;
  title: string;
  price: number;
  unit: string;
  category: string;
  stock_quantity: number | null;
  is_active: boolean | null;
  created_at: string;
  seller?: {
    full_name: string;
  };
}

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string | null;
  created_at: string;
  products?: {
    title: string;
    unit: string;
  };
  buyer?: {
    full_name: string;
  };
  seller?: {
    full_name: string;
  };
}

interface Verification {
  id: string;
  user_id: string;
  verification_type: string;
  document_url: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  verified_at: string | null;
  profile?: {
    full_name: string;
    phone: string | null;
    location: string | null;
  };
}

interface DailyMetric {
  date: string;
  new_orders: number | null;
  total_gmv: number | null;
  total_commission: number | null;
  new_users: number | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasAdminRole = roles?.some(r => r.role === "admin");
      
      if (!hasAdminRole) {
        toast({
          title: "Ruxsat yo'q",
          description: "Sizda admin paneliga kirish huquqi yo'q",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadData();
    } catch (error: unknown) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Xatolik yuz berdi",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [
        usersRes,
        productsRes,
        ordersRes,
        verificationsRes,
        metricsRes,
        rolesRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*, products(title, unit)").order("created_at", { ascending: false }),
        supabase.from("seller_verifications").select("*").order("created_at", { ascending: false }),
        supabase.from("daily_metrics").select("*").order("date", { ascending: false }).limit(30),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      const profilesMap = new Map((usersRes.data || []).map(p => [p.user_id, p]));

      // Merge roles with users
      const usersWithRoles = (usersRes.data || []).map(user => ({
        ...user,
        roles: (rolesRes.data || []).filter(r => r.user_id === user.user_id),
      }));

      // Merge seller names with products
      const productsWithSeller = (productsRes.data || []).map(product => ({
        ...product,
        seller: profilesMap.get(product.seller_id) 
          ? { full_name: profilesMap.get(product.seller_id)!.full_name }
          : undefined,
      }));

      // Merge buyer/seller names with orders
      const ordersWithNames = (ordersRes.data || []).map(order => ({
        ...order,
        buyer: profilesMap.get(order.buyer_id)
          ? { full_name: profilesMap.get(order.buyer_id)!.full_name }
          : undefined,
        seller: order.seller_id && profilesMap.get(order.seller_id)
          ? { full_name: profilesMap.get(order.seller_id)!.full_name }
          : undefined,
      }));

      // Merge profile with verifications
      const verificationsWithProfile = (verificationsRes.data || []).map(v => ({
        ...v,
        profile: profilesMap.get(v.user_id)
          ? {
              full_name: profilesMap.get(v.user_id)!.full_name,
              phone: profilesMap.get(v.user_id)!.phone,
              location: profilesMap.get(v.user_id)!.location,
            }
          : undefined,
      }));

      setUsers(usersWithRoles);
      setProducts(productsWithSeller as Product[]);
      setOrders(ordersWithNames as Order[]);
      setVerifications(verificationsWithProfile as Verification[]);
      setDailyMetrics((metricsRes.data || []).reverse() as DailyMetric[]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleNavigate = (section: string) => {
    setActiveTab(section);
  };

  const handleSearchUser = (userId: string) => {
    setActiveTab("users");
    toast({
      title: "Foydalanuvchi topildi",
      description: `User ID: ${userId}`,
    });
  };

  const handleSearchProduct = (productId: string) => {
    setActiveTab("products");
    toast({
      title: "Mahsulot topildi",
      description: `Product ID: ${productId}`,
    });
  };

  const handleSearchOrder = (orderId: string) => {
    setActiveTab("orders");
    toast({
      title: "Buyurtma topildi",
      description: `Order ID: ${orderId}`,
    });
  };

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total_price || 0), 0),
    pendingVerifications: verifications.filter(v => v.status === "pending").length,
    totalFarmers: users.filter(u => u.roles?.some(r => r.role === "farmer")).length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    deliveredOrders: orders.filter(o => o.status === "delivered").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">FarmTrade Boshqaruv</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Yangilash
            </Button>
            <AdminCommandPanel
              users={users}
              products={products}
              orders={orders}
              onNavigate={handleNavigate}
              onSignOut={handleSignOut}
              onSearchUser={handleSearchUser}
              onSearchProduct={handleSearchProduct}
              onSearchOrder={handleSearchOrder}
            />
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Chiqish
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-background">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-background">
              Foydalanuvchilar
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-background">
              Mahsulotlar
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-background">
              Buyurtmalar
            </TabsTrigger>
            <TabsTrigger value="verifications" className="data-[state=active]:bg-background">
              Tasdiqlash
              {stats.pendingVerifications > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                  {stats.pendingVerifications}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <AdminStats stats={stats} />
            <RevenueChart dailyMetrics={dailyMetrics} />
          </TabsContent>

          <TabsContent value="users">
            <UsersTable users={users} />
          </TabsContent>

          <TabsContent value="products">
            <ProductsTable products={products} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTable orders={orders} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="verifications">
            <SellerVerificationPanel verifications={verifications} onRefresh={loadData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
