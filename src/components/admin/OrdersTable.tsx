import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ShoppingCart, Loader2 } from "lucide-react";
import {
  ORDER_STATUS_TRANSITIONS,
  canTransitionTo,
} from "@/lib/validations/order";

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string | null;
  created_at: string;
  products?: { title: string; unit: string };
  buyer?: { full_name: string };
  seller?: { full_name: string };
}

interface OrdersTableProps {
  orders: Order[];
  onRefresh: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Kutilmoqda",
  accepted: "Qabul qilindi",
  processing: "Tayyorlanmoqda",
  shipped: "Yuborildi",
  delivered: "Yetkazildi",
  disputed: "Nizo",
  refunded: "Qaytarildi",
  cancelled: "Bekor qilindi",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-purple-100 text-purple-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  disputed: "bg-orange-100 text-orange-800",
  refunded: "bg-gray-200 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export const OrdersTable = ({ orders, onRefresh }: OrdersTableProps) => {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<{
    orderId: string;
    from: string;
    to: string;
  } | null>(null);
  const [reason, setReason] = useState("");

  const requiresReason = (status: string) =>
    status === "cancelled" || status === "disputed" || status === "refunded";

  const performUpdate = async (orderId: string, newStatus: string, reasonText?: string) => {
    setUpdatingId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("update-order-status-v2", {
        body: { order_id: orderId, status: newStatus, reason: reasonText },
      });
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || "Xatolik");

      toast({
        title: "Muvaffaqiyat",
        description: `Holat: ${STATUS_LABELS[newStatus] || newStatus}`,
      });
      onRefresh();
    } catch (error: unknown) {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Holatni yangilab bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
      setPendingChange(null);
      setReason("");
    }
  };

  const handleStatusChange = (orderId: string, currentStatus: string, newStatus: string) => {
    if (currentStatus === newStatus) return;
    if (!canTransitionTo(currentStatus, newStatus)) {
      toast({
        title: "Ruxsat etilmagan o'tish",
        description: `${STATUS_LABELS[currentStatus]} → ${STATUS_LABELS[newStatus]} mumkin emas`,
        variant: "destructive",
      });
      return;
    }
    if (requiresReason(newStatus)) {
      setPendingChange({ orderId, from: currentStatus, to: newStatus });
      return;
    }
    performUpdate(orderId, newStatus);
  };

  const getStatusBadge = (status: string | null) => {
    const key = status || "pending";
    return (
      <Badge className={STATUS_BADGE[key] || "bg-gray-100 text-gray-800"}>
        {STATUS_LABELS[key] || key}
      </Badge>
    );
  };

  const getAvailableOptions = (currentStatus: string) => {
    const transitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
    return [currentStatus, ...transitions];
  };

  return (
    <>
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
                  {orders.map((order) => {
                    const currentStatus = order.status || "pending";
                    const options = getAvailableOptions(currentStatus);
                    const isFinal = options.length === 1;
                    return (
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
                          {updatingId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Select
                              value={currentStatus}
                              onValueChange={(value) =>
                                handleStatusChange(order.id, currentStatus, value)
                              }
                              disabled={isFinal}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {options.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {STATUS_LABELS[opt] || opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pendingChange}
        onOpenChange={(open) => {
          if (!open) {
            setPendingChange(null);
            setReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sababni kiriting</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingChange &&
                `${STATUS_LABELS[pendingChange.from]} → ${STATUS_LABELS[pendingChange.to]} uchun sabab majburiy.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Sabab</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Qisqacha tushuntirish..."
              maxLength={500}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingChange) return;
                if (reason.trim().length < 3) {
                  toast({
                    title: "Sabab juda qisqa",
                    description: "Kamida 3 ta belgi kiriting",
                    variant: "destructive",
                  });
                  return;
                }
                performUpdate(pendingChange.orderId, pendingChange.to, reason.trim());
              }}
            >
              Tasdiqlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
