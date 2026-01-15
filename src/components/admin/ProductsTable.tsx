import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Package, Eye, EyeOff } from "lucide-react";

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

interface ProductsTableProps {
  products: Product[];
  onRefresh: () => void;
}

export const ProductsTable = ({ products, onRefresh }: ProductsTableProps) => {
  const { toast } = useToast();

  const toggleProductStatus = async (productId: string, currentStatus: boolean | null) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !currentStatus })
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyat",
        description: currentStatus ? "Mahsulot yashirildi" : "Mahsulot faollashtirildi",
      });

      onRefresh();
    } catch (error: unknown) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      vegetables: "Sabzavotlar",
      fruits: "Mevalar",
      grains: "Don mahsulotlari",
      dairy: "Sut mahsulotlari",
      other: "Boshqa",
    };
    return categories[category] || category;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Mahsulotlar ({products.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Mahsulotlar topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Sotuvchi</TableHead>
                  <TableHead>Narx</TableHead>
                  <TableHead>Ombor</TableHead>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Yaratilgan</TableHead>
                  <TableHead>Amal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell>{product.seller?.full_name || "Noma'lum"}</TableCell>
                    <TableCell>
                      {product.price.toLocaleString()} so'm/{product.unit}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.stock_quantity && product.stock_quantity > 0 ? "outline" : "destructive"}>
                        {product.stock_quantity || 0} {product.unit}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getCategoryLabel(product.category)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Faol" : "Nofaol"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(product.created_at), "dd.MM.yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleProductStatus(product.id, product.is_active)}
                      >
                        {product.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Yashirish
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Ko'rsatish
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
