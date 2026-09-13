import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Calendar, 
  MapPin, 
  ArrowLeft,
  ShoppingBag,
  X,
  Loader2,
  Star,
  Trophy
} from "lucide-react";
import { RateOrderDialog } from "@/components/reviews/RateOrderDialog";
import { StarRating } from "@/components/reviews/StarRating";

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  product_id: string | null;
  products: {
    title: string;
    price: number;
    unit: string;
    image_url: string | null;
    location: string | null;
    seller_id: string;
  } | null;
}

interface ReviewInfo {
  rating: number;
  comment: string | null;
}

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewInfo>>({});
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndRole();
  }, []);

  const checkAuthAndRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user is a farmer
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    if (roles && roles.some(r => r.role === 'farmer')) {
      toast({
        title: "Ruxsat yo'q",
        description: "Fermerlar buyurtmalar sahifasiga kira olmaydi",
        variant: "destructive",
      });
      navigate('/farmer');
      return;
    }

    fetchOrders(user.id);
  };

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          quantity,
          total_price,
          status,
          created_at,
          product_id,
          products (
            title,
            price,
            unit,
            image_url,
            location,
            seller_id
          )
        `)
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("order_id, rating, comment")
        .eq("reviewer_id", userId);

      const map: Record<string, ReviewInfo> = {};
      (reviewData || []).forEach((r: any) => {
        if (r.order_id) map[r.order_id] = { rating: r.rating, comment: r.comment };
      });
      setReviews(map);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Xatolik",
        description: "Buyurtmalarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Kutilmoqda", variant: "secondary" },
      processing: { label: "Tayyorlanmoqda", variant: "default" },
      shipped: { label: "Yuborildi", variant: "outline" },
      delivered: { label: "Yetkazildi", variant: "default" },
      cancelled: { label: "Bekor qilindi", variant: "destructive" },
    };
    
    const config = statusConfig[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Xatolik",
          description: "Iltimos, tizimga kiring",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("update-order-status", {
        body: { order_id: orderId, status: "cancelled" },
      });

      if (error) throw error;

      toast({
        title: "Muvaffaqiyat",
        description: "Buyurtma bekor qilindi",
      });

      // Update local state
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "cancelled" } : order
        )
      );
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Xatolik",
        description: "Buyurtmani bekor qilishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-poppins font-bold text-foreground">
              Buyurtmalar tarixi
            </h1>
            <p className="text-muted-foreground mt-1">
              Barcha buyurtmalaringizni ko'ring va kuzating
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="w-24 h-24 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Hali buyurtmalar yo'q
              </h3>
              <p className="text-muted-foreground mb-6">
                Bozordan mahsulot xarid qiling va buyurtmalaringizni bu yerda ko'ring
              </p>
              <Button onClick={() => navigate("/marketplace")} className="btn-farm">
                Bozorga o'tish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Product Image */}
                    <div className="w-full sm:w-32 h-32 bg-secondary/50 flex-shrink-0">
                      {order.products?.image_url ? (
                        <img
                          src={order.products.image_url}
                          alt={order.products.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Order Details */}
                    <div className="flex-1 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {order.products?.title || "Mahsulot topilmadi"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Buyurtma #{order.id.slice(0, 8)}
                          </p>
                        </div>
                        {getStatusBadge(order.status || "pending")}
                      </div>

                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block">Miqdor</span>
                          <span className="font-medium">
                            {order.quantity} {order.products?.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Narx</span>
                          <span className="font-medium text-primary">
                            {order.total_price?.toLocaleString()} so'm
                          </span>
                        </div>
                        <div className="flex items-start gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="text-muted-foreground block">Sana</span>
                            <span className="font-medium text-xs">
                              {formatDate(order.created_at)}
                            </span>
                          </div>
                        </div>
                        {order.products?.location && (
                          <div className="flex items-start gap-1">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="text-muted-foreground block">Joylashuv</span>
                              <span className="font-medium text-xs">
                                {order.products.location}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Cancel button for pending orders */}
                      {order.status === "pending" && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                disabled={cancellingOrderId === order.id}
                              >
                                {cancellingOrderId === order.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Bekor qilinmoqda...
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4 mr-2" />
                                    Bekor qilish
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Buyurtmani bekor qilish</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Haqiqatan ham bu buyurtmani bekor qilmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Yo'q</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Ha, bekor qilish
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderHistory;
