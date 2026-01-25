import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DataExportProps {
  users: any[];
  products: any[];
  orders: any[];
}

export const DataExport = ({ users, products, orders }: DataExportProps) => {
  const [exportType, setExportType] = useState<string>("users");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const convertToCSV = (data: any[], headers: string[]): string => {
    const headerRow = headers.join(",");
    const dataRows = data.map((item) =>
      headers.map((header) => {
        const value = item[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && value.includes(",")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(",")
    );
    return [headerRow, ...dataRows].join("\n");
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      let csv = "";
      let filename = "";
      const now = new Date().toISOString().split("T")[0];

      switch (exportType) {
        case "users":
          csv = convertToCSV(users, ["full_name", "phone", "location", "created_at"]);
          filename = `foydalanuvchilar_${now}.csv`;
          break;
        case "products":
          csv = convertToCSV(products, ["title", "price", "unit", "category", "stock_quantity", "is_active", "created_at"]);
          filename = `mahsulotlar_${now}.csv`;
          break;
        case "orders":
          csv = convertToCSV(
            orders.map((o) => ({
              ...o,
              product_title: o.products?.title || "N/A",
              buyer_name: o.buyer?.full_name || "N/A",
            })),
            ["product_title", "buyer_name", "quantity", "total_price", "status", "created_at"]
          );
          filename = `buyurtmalar_${now}.csv`;
          break;
        default:
          throw new Error("Noma'lum eksport turi");
      }

      downloadCSV(csv, filename);
      toast({
        title: "Muvaffaqiyatli",
        description: `${filename} yuklab olindi`,
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Eksport qilishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Ma'lumotlarni eksport qilish
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={exportType} onValueChange={setExportType}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Turini tanlang" />
            </SelectTrigger>
            <SelectContent className="bg-background border">
              <SelectItem value="users">Foydalanuvchilar ({users.length})</SelectItem>
              <SelectItem value="products">Mahsulotlar ({products.length})</SelectItem>
              <SelectItem value="orders">Buyurtmalar ({orders.length})</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            CSV yuklab olish
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
