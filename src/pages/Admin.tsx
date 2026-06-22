import { useEffect, useState, useCallback, useMemo } from "react";
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
import { DataExport } from "@/components/admin/DataExport";
import { MessageCenter } from "@/components/admin/MessageCenter";
import { AdvancedFilters, FilterState } from "@/components/admin/AdvancedFilters";
import { ProductCategoryChart } from "@/components/admin/ProductCategoryChart";
import { OrderStatusChart } from "@/components/admin/OrderStatusChart";
import { RegionalStats } from "@/components/admin/RegionalStats";
import AdminSoilPanel from "@/components/soil/AdminSoilPanel";
import { ErrorLogsTable } from "@/components/admin/ErrorLogsTable";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email?: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
  is_blocked?: boolean;
  blocked_at?: string | null;
  block_reason?: string | null;
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
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    category: "all",
    dateFrom: "",
    dateTo: "",
    role: "all",
  });

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

      setCurrentUserId(user.id);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasAdminRole = roles?.some(r => r.role === "admin");
      const hasSubAdminRole = roles?.some(r => r.role === "sub_admin");
      
      if (!hasAdminRole && !hasSubAdminRole) {
        toast({
          title: "Ruxsat yo'q",
          description: "Sizda admin paneliga kirish huquqi yo'q",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Check if main admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", user.id)
        .maybeSingle();

      const isMain = hasAdminRole && profile?.email === "admin@gmail.com";
      setIsMainAdmin(isMain);
      setIsSubAdmin(hasSubAdminRole && !isMain);
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

  // Real-time subscriptions for admin dashboard
  useEffect(() => {
    if (!isAdmin) return;

    const ordersChannel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadData();
      })
      .subscribe();

    const productsChannel = supabase
      .channel('admin-products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadData();
      })
      .subscribe();

    const usersChannel = supabase
      .channel('admin-users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadData();
      })
      .subscribe();

    const verificationsChannel = supabase
      .channel('admin-verifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_verifications' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(verificationsChannel);
    };
  }, [isAdmin, loadData]);

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

  // Filter functions using useMemo
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !filters.search ||
        user.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.phone?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.location?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesRole =
        filters.role === "all" ||
        (filters.role === "farmer" && user.roles?.some((r) => r.role === "farmer")) ||
        (filters.role === "admin" && user.roles?.some((r) => r.role === "admin")) ||
        (filters.role === "sub_admin" && user.roles?.some((r) => r.role === "sub_admin")) ||
        (filters.role === "buyer" && !user.roles?.some((r) => ["farmer", "admin", "sub_admin"].includes(r.role)));

      const matchesDate =
        (!filters.dateFrom || new Date(user.created_at) >= new Date(filters.dateFrom)) &&
        (!filters.dateTo || new Date(user.created_at) <= new Date(filters.dateTo));

      return matchesSearch && matchesRole && matchesDate;
    });
  }, [users, filters]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !filters.search ||
        product.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.seller?.full_name?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesCategory =
        filters.category === "all" || product.category === filters.category;

      const matchesDate =
        (!filters.dateFrom || new Date(product.created_at) >= new Date(filters.dateFrom)) &&
        (!filters.dateTo || new Date(product.created_at) <= new Date(filters.dateTo));

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [products, filters]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !filters.search ||
        order.products?.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.buyer?.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.seller?.full_name?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus =
        filters.status === "all" || order.status === filters.status;

      const matchesDate =
        (!filters.dateFrom || new Date(order.created_at) >= new Date(filters.dateFrom)) &&
        (!filters.dateTo || new Date(order.created_at) <= new Date(filters.dateTo));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, filters]);

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
              <h1 className="text-xl font-bold">
                {isMainAdmin ? "Admin Panel" : "Kichik Admin Panel"}
              </h1>
              <p className="text-sm text-muted-foreground">
                FarmTrade Boshqaruv {isSubAdmin && "(Cheklangan huquqlar)"}
              </p>
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
          <TabsList className="bg-muted/50 p-1 flex-wrap">
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
            {isMainAdmin && (
              <TabsTrigger value="tools" className="data-[state=active]:bg-background">
                Asboblar
              </TabsTrigger>
            )}
            <TabsTrigger value="soil" className="data-[state=active]:bg-background">
              🔬 Tuproq
            </TabsTrigger>
            <TabsTrigger value="errors" className="data-[state=active]:bg-background">
              🐛 Xatolar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <AdminStats stats={stats} dailyMetrics={dailyMetrics} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart dailyMetrics={dailyMetrics} />
              <OrderStatusChart orders={orders} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductCategoryChart products={products} />
              <RegionalStats users={users} products={products} />
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <AdvancedFilters
              type="users"
              onFilterChange={setFilters}
              activeFilters={filters}
            />
            <UsersTable 
              users={filteredUsers} 
              onRefresh={loadData} 
              isMainAdmin={isMainAdmin}
              isSubAdmin={isSubAdmin}
              currentUserId={currentUserId}
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <AdvancedFilters
              type="products"
              onFilterChange={setFilters}
              activeFilters={filters}
            />
            <ProductsTable products={filteredProducts} onRefresh={loadData} isSubAdmin={isSubAdmin} />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <AdvancedFilters
              type="orders"
              onFilterChange={setFilters}
              activeFilters={filters}
            />
            <OrdersTable orders={filteredOrders} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="verifications">
            <SellerVerificationPanel verifications={verifications} onRefresh={loadData} />
          </TabsContent>

          {/* Tools tab only visible for main admin */}
          {isMainAdmin && (
            <TabsContent value="tools" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DataExport users={users} products={products} orders={orders} />
                <MessageCenter users={users} />
              </div>
            </TabsContent>
          )}

          <TabsContent value="soil">
            <AdminSoilPanel />
          </TabsContent>

          <TabsContent value="errors">
            <ErrorLogsTable />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
