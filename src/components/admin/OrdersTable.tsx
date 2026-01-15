import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ShoppingCart, Loader2 } from "lucide-react";

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

interface OrdersTableProps {
  orders: Order[];
  onRefresh: () => void;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Kutilmoqda" },
  { value: "accepted", label: "Qabul qilindi" },
  { value: "shipped", label: "Yuborildi" },
  { value: "delivered", label: "Yetkazildi" },
  { value: "cancelled", label: "Bekor qilindi" },
];

export const OrdersTable = ({ orders, onRefresh }: OrdersTableProps) => {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const updateData: Record<string, unknown> = { status: newStatus };

      if (newStatus === "accepted") updateData.accepted_at = new Date().toISOString();
      if (newStatus === "shipped") updateData.shipped_at = new Date().toISOString();
      if (newStatus === "delivered") updateData.delivered_at = new Date().toISOString();
      if (newStatus === "cancelled") updateData.cancelled_at = new Date().toISOString();

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyat",
        description: "Buyurtma holati yangilandi",
      });

      onRefresh();
    } catch (error: unknown) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-green-100 text-green-800">Yetkazildi</Badge>;
      case "shipped":
        return <Badge className="bg-blue-100 text-blue-800">Yuborildi</Badge>;
      case "accepted":
        return <Badge className="bg-purple-100 text-purple-800">Qabul qilindi</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Bekor qilindi</Badge>;
      default:
        return <Badge variant="secondary">Kutilmoqda</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Buyurtmalar ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Buyurtmalar topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahsulot</TableHead>
                  <TableHead>Xaridor</TableHead>
                  <TableHead>Sotuvchi</TableHead>
                  <TableHead>Miqdor</TableHead>
                  <TableHead>Summa</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Amal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.products?.title || "Noma'lum"}
                    </TableCell>
                    <TableCell>{order.buyer?.full_name || "Noma'lum"}</TableCell>
                    <TableCell>{order.seller?.full_name || "Noma'lum"}</TableCell>
                    <TableCell>
                      {order.quantity} {order.products?.unit || ""}
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.total_price.toLocaleString()} so'm
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.created_at), "dd.MM.yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {updatingId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Select
                            value={order.status || "pending"}
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                            disabled={order.status === "delivered" || order.status === "cancelled"}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
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
