import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface DailyMetric {
  date: string;
  new_orders: number | null;
  total_gmv: number | null;
  total_commission: number | null;
  new_users: number | null;
}

interface RevenueChartProps {
  dailyMetrics: DailyMetric[];
}

export const RevenueChart = ({ dailyMetrics }: RevenueChartProps) => {
  const chartData = dailyMetrics.map((metric) => ({
    date: new Date(metric.date).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" }),
    daromad: Number(metric.total_gmv || 0),
    komissiya: Number(metric.total_commission || 0),
    buyurtmalar: metric.new_orders || 0,
    foydalanuvchilar: metric.new_users || 0,
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daromad Trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} so'm`, ""]}
                />
                <Line
                  type="monotone"
                  dataKey="daromad"
                  stroke="hsl(142 70% 45%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(142 70% 45%)" }}
                  name="GMV"
                />
                <Line
                  type="monotone"
                  dataKey="komissiya"
                  stroke="hsl(200 85% 60%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(200 85% 60%)" }}
                  name="Komissiya"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buyurtmalar va Foydalanuvchilar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="buyurtmalar" fill="hsl(142 70% 45%)" name="Buyurtmalar" radius={[4, 4, 0, 0]} />
                <Bar dataKey="foydalanuvchilar" fill="hsl(35 40% 55%)" name="Yangi Foydalanuvchilar" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
