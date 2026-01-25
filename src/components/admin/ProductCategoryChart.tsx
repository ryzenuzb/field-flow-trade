import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

interface Product {
  id: string;
  category: string;
  price: number;
  stock_quantity: number | null;
  location?: string | null;
}

interface ProductCategoryChartProps {
  products: Product[];
}

const COLORS = [
  "hsl(142, 76%, 36%)", // green
  "hsl(25, 95%, 53%)",  // orange
  "hsl(43, 96%, 56%)",  // yellow
  "hsl(201, 96%, 32%)", // blue
  "hsl(280, 67%, 50%)", // purple
  "hsl(340, 82%, 52%)", // pink
];

const CATEGORY_LABELS: Record<string, string> = {
  Sabzavot: "Sabzavotlar",
  Meva: "Mevalar",
  Don: "Don mahsulotlari",
  Sut: "Sut mahsulotlari",
  Boshqa: "Boshqa",
};

export const ProductCategoryChart = ({ products }: ProductCategoryChartProps) => {
  // Group products by category
  const categoryData = products.reduce((acc, product) => {
    const category = product.category || "Boshqa";
    if (!acc[category]) {
      acc[category] = { count: 0, totalValue: 0 };
    }
    acc[category].count += 1;
    acc[category].totalValue += product.price * (product.stock_quantity || 0);
    return acc;
  }, {} as Record<string, { count: number; totalValue: number }>);

  const chartData = Object.entries(categoryData).map(([category, data]) => ({
    name: CATEGORY_LABELS[category] || category,
    value: data.count,
    totalValue: data.totalValue,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Mahsulotlar kategoriyasi
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Ma'lumot yo'q
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} ta mahsulot`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
