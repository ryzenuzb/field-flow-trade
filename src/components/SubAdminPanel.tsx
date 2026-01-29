import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  Users, 
  Package, 
  ClipboardList, 
  CheckCircle,
  ArrowRight,
  Loader2
} from "lucide-react";

interface SubAdminStats {
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  pendingVerifications: number;
}

const SubAdminPanel = () => {
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SubAdminStats>({
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    pendingVerifications: 0
  });

  useEffect(() => {
    checkSubAdminRole();
  }, []);

  const checkSubAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user has sub_admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const hasSubAdminRole = roles?.some(r => r.role === 'sub_admin');
      setIsSubAdmin(hasSubAdminRole || false);

      if (hasSubAdminRole) {
        await fetchStats();
      }
    } catch (error) {
      console.error("Error checking sub-admin role:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch basic stats for sub-admin panel
      const [usersRes, productsRes, ordersRes, verificationsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('seller_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalProducts: productsRes.count || 0,
        pendingOrders: ordersRes.count || 0,
        pendingVerifications: verificationsRes.count || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  if (loading) {
    return null;
  }

  if (!isSubAdmin) {
    return null;
  }

  const quickActions = [
    {
      icon: Users,
      title: "Foydalanuvchilar",
      description: "Foydalanuvchilarni boshqarish",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      icon: Package,
      title: "Mahsulotlar",
      description: "Mahsulotlarni moderatsiya qilish",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30"
    },
    {
      icon: ClipboardList,
      title: "Buyurtmalar",
      description: "Buyurtmalarni kuzatish",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
      icon: CheckCircle,
      title: "Tasdiqlash",
      description: "Fermer tasdiqlarini ko'rish",
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30"
    }
  ];

  return (
    <section className="py-12 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700">
            <Shield className="w-3 h-3 mr-1" />
            Kichik Admin Panel
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-poppins font-bold text-foreground mb-4">
            Xush kelibsiz, <span className="text-amber-600 dark:text-amber-400">Admin!</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Platformani boshqarish uchun tezkor havolalar va statistika
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
              <div className="text-sm text-muted-foreground">Foydalanuvchilar</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-foreground">{stats.totalProducts}</div>
              <div className="text-sm text-muted-foreground">Mahsulotlar</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-foreground">{stats.pendingOrders}</div>
              <div className="text-sm text-muted-foreground">Kutayotgan buyurtmalar</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-amber-600" />
              <div className="text-2xl font-bold text-foreground">{stats.pendingVerifications}</div>
              <div className="text-sm text-muted-foreground">Tasdiqlar</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              Tezkor harakatlar
            </CardTitle>
            <CardDescription>
              Admin paneliga o'tib to'liq boshqaruv imkoniyatlaridan foydalaning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <div 
                    key={index}
                    className="p-4 rounded-lg border border-border hover:border-amber-300 dark:hover:border-amber-700 transition-colors cursor-pointer group"
                  >
                    <div className={`w-10 h-10 rounded-lg ${action.bgColor} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <h4 className="font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <Link to="/admin">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  Admin Paneliga O'tish
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SubAdminPanel;
