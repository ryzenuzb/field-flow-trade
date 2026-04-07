import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown, UserCheck, AlertCircle } from "lucide-react";
import { useMemo } from "react";

interface StatsData {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingVerifications: number;
  totalFarmers: number;
  pendingOrders: number;
  deliveredOrders: number;
}

interface DailyMetric {
  date: string;
  new_orders: number | null;
  total_gmv: number | null;
  total_commission: number | null;
  new_users: number | null;
}

interface AdminStatsProps {
  stats: StatsData;
  dailyMetrics?: DailyMetric[];
}

const TrendIndicator = ({ current, previous, suffix = "" }: { current: number; previous: number; suffix?: string }) => {
  if (previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  const isPositive = change >= 0;
  
  return (
    <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-destructive"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      <span>{isPositive ? "+" : ""}{change.toFixed(1)}%</span>
      {suffix && <span className="text-muted-foreground font-normal">{suffix}</span>}
    </div>
  );
};

export const AdminStats = ({ stats, dailyMetrics = [] }: AdminStatsProps) => {
  const trends = useMemo(() => {
    if (dailyMetrics.length < 2) return null;
    
    const half = Math.floor(dailyMetrics.length / 2);
    const recent = dailyMetrics.slice(half);
    const older = dailyMetrics.slice(0, half);

    const sum = (arr: DailyMetric[], key: keyof DailyMetric) =>
      arr.reduce((s, m) => s + (Number(m[key]) || 0), 0);

    return {
      orders: { current: sum(recent, "new_orders"), previous: sum(older, "new_orders") },
      revenue: { current: sum(recent, "total_gmv"), previous: sum(older, "total_gmv") },
      users: { current: sum(recent, "new_users"), previous: sum(older, "new_users") },
    };
  }, [dailyMetrics]);

  const statCards = [
    {
      title: "Jami Foydalanuvchilar",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: trends ? { current: trends.users.current, previous: trends.users.previous } : null,
      trendSuffix: "vs oldingi davr",
    },
    {
      title: "Fermerlar",
      value: stats.totalFarmers,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: null,
      trendSuffix: "",
    },
    {
      title: "Jami Mahsulotlar",
      value: stats.totalProducts,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: null,
      trendSuffix: "",
    },
    {
      title: "Jami Buyurtmalar",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: trends ? { current: trends.orders.current, previous: trends.orders.previous } : null,
      trendSuffix: "vs oldingi davr",
    },
    {
      title: "Jami Daromad",
      value: `${stats.totalRevenue.toLocaleString()} so'm`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      trend: trends ? { current: trends.revenue.current, previous: trends.revenue.previous } : null,
      trendSuffix: "vs oldingi davr",
    },
    {
      title: "Kutilayotgan Buyurtmalar",
      value: stats.pendingOrders,
      icon: AlertCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      trend: null,
      trendSuffix: "",
    },
    {
      title: "Yetkazilgan Buyurtmalar",
      value: stats.deliveredOrders,
      icon: TrendingUp,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      trend: null,
      trendSuffix: "",
    },
    {
      title: "Tasdiqlash Kutilmoqda",
      value: stats.pendingVerifications,
      icon: UserCheck,
      color: "text-red-600",
      bgColor: "bg-red-50",
      trend: null,
      trendSuffix: "",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.trend && (
              <TrendIndicator
                current={stat.trend.current}
                previous={stat.trend.previous}
                suffix={stat.trendSuffix}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
