import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, XCircle, Truck, PackageCheck } from "lucide-react";

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string | null;
  created_at: string;
  products: {
    title: string;
    unit: string;
  };
}

interface FarmerOrdersTableProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: string) => void;
}

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">Kutilmoqda</Badge>;
    case 'processing':
      return <Badge className="bg-blue-500 hover:bg-blue-600">Qabul qilindi</Badge>;
    case 'shipped':
      return <Badge className="bg-purple-500 hover:bg-purple-600">Yuborildi</Badge>;
    case 'delivered':
      return <Badge className="bg-green-500 hover:bg-green-600">Yetkazildi</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Rad etildi</Badge>;
    default:
      return <Badge variant="secondary">{status || "Noma'lum"}</Badge>;
  }
};

export const FarmerOrdersTable = ({ orders, onUpdateStatus }: FarmerOrdersTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buyurtmalar</CardTitle>
        <CardDescription>Mahsulotlaringiz uchun qabul qilingan buyurtmalar</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mahsulot</TableHead>
              <TableHead>Miqdor</TableHead>
              <TableHead>Jami narx</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Hozircha buyurtmalar yo'q
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.products.title}</TableCell>
                  <TableCell>{order.quantity} {order.products.unit}</TableCell>
                  <TableCell>{order.total_price.toLocaleString()} so'm</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString('uz-UZ')}</TableCell>
                  <TableCell>
                    {order.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => onUpdateStatus(order.id, 'processing')}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Qabul
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onUpdateStatus(order.id, 'cancelled')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rad
                        </Button>
                      </div>
                    )}
                    {order.status === 'processing' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        onClick={() => onUpdateStatus(order.id, 'shipped')}
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        Yuborildi
                      </Button>
                    )}
                    {order.status === 'shipped' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => onUpdateStatus(order.id, 'delivered')}
                      >
                        <PackageCheck className="w-4 h-4 mr-1" />
                        Yetkazildi
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
