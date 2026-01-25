import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface Order {
  id: string;
  status: string | null;
  total_price: number;
}

interface OrderStatusChartProps {
  orders: Order[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Kutilmoqda",
  accepted: "Qabul qilingan",
  processing: "Jarayonda",
  shipped: "Yuborilgan",
  delivered: "Yetkazilgan",
  cancelled: "Bekor qilingan",
  disputed: "Nizoli",
  refunded: "Qaytarilgan",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(43, 96%, 56%)",
  accepted: "hsl(201, 96%, 32%)",
  processing: "hsl(280, 67%, 50%)",
  shipped: "hsl(25, 95%, 53%)",
  delivered: "hsl(142, 76%, 36%)",
  cancelled: "hsl(0, 84%, 60%)",
  disputed: "hsl(340, 82%, 52%)",
  refunded: "hsl(0, 0%, 50%)",
};

export const OrderStatusChart = ({ orders }: OrderStatusChartProps) => {
  // Group orders by status
  const statusData = orders.reduce((acc, order) => {
    const status = order.status || "pending";
    if (!acc[status]) {
      acc[status] = { count: 0, totalValue: 0 };
    }
    acc[status].count += 1;
    acc[status].totalValue += order.total_price || 0;
    return acc;
  }, {} as Record<string, { count: number; totalValue: number }>);

  const chartData = Object.entries(statusData).map(([status, data]) => ({
    name: STATUS_LABELS[status] || status,
    count: data.count,
    value: data.totalValue,
    fill: STATUS_COLORS[status] || "hsl(var(--primary))",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Buyurtmalar holati
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Ma'lumot yo'q
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [`${value} ta`, "Buyurtmalar"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
