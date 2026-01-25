import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  location: string | null;
  roles?: { role: string }[];
}

interface Product {
  id: string;
  location?: string | null;
  price: number;
  stock_quantity: number | null;
}

interface RegionalStatsProps {
  users: User[];
  products: Product[];
}

export const RegionalStats = ({ users, products }: RegionalStatsProps) => {
  // Extract regions from locations
  const extractRegion = (location: string | null): string => {
    if (!location) return "Noma'lum";
    const parts = location.split(",");
    return parts[0]?.trim() || "Noma'lum";
  };

  // Group users by region
  const usersByRegion = users.reduce((acc, user) => {
    const region = extractRegion(user.location);
    if (!acc[region]) {
      acc[region] = { total: 0, farmers: 0 };
    }
    acc[region].total += 1;
    if (user.roles?.some((r) => r.role === "farmer")) {
      acc[region].farmers += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; farmers: number }>);

  // Group products by region
  const productsByRegion = products.reduce((acc, product) => {
    const region = extractRegion(product.location);
    if (!acc[region]) {
      acc[region] = { count: 0, value: 0 };
    }
    acc[region].count += 1;
    acc[region].value += product.price * (product.stock_quantity || 0);
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  // Combine all regions
  const allRegions = new Set([
    ...Object.keys(usersByRegion),
    ...Object.keys(productsByRegion),
  ]);

  const regionData = Array.from(allRegions)
    .map((region) => ({
      region,
      users: usersByRegion[region]?.total || 0,
      farmers: usersByRegion[region]?.farmers || 0,
      products: productsByRegion[region]?.count || 0,
      value: productsByRegion[region]?.value || 0,
    }))
    .filter((r) => r.region !== "Noma'lum")
    .sort((a, b) => b.users - a.users)
    .slice(0, 8);

  const formatPrice = (price: number): string => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Hududlar statistikasi
        </CardTitle>
      </CardHeader>
      <CardContent>
        {regionData.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Hududlar bo'yicha ma'lumot yo'q
          </div>
        ) : (
          <div className="space-y-3">
            {regionData.map((data) => (
              <div
                key={data.region}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{data.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{data.users} foydalanuvchi</Badge>
                  <Badge variant="secondary">{data.farmers} fermer</Badge>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                    {data.products} mahsulot
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
