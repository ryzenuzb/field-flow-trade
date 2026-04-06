import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playNotificationSound } from "@/lib/notificationSound";

const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  processing: "Qabul qilindi",
  shipped: "Yuborildi",
  delivered: "Yetkazildi",
  cancelled: "Rad etildi",
};

interface NotificationHookProps {
  userId: string | undefined;
  isFarmer: boolean;
}

const saveNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) => {
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    link,
  });
};

export const useNotifications = ({ userId, isFarmer }: NotificationHookProps) => {
  const { toast } = useToast();
  const [farmerProductIds, setFarmerProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId || !isFarmer) return;
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("id").eq("seller_id", userId);
      if (data) setFarmerProductIds(data.map((p) => p.id));
    };
    fetchProducts();
  }, [userId, isFarmer]);

  // Buyer: Order status changes
  useEffect(() => {
    if (!userId || isFarmer) return;

    const channel = supabase
      .channel("buyer-order-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `buyer_id=eq.${userId}` },
        async (payload) => {
          const newStatus = payload.new.status as string;
          const oldStatus = payload.old.status as string;
          if (newStatus !== oldStatus) {
            const { data: product } = await supabase
              .from("products")
              .select("title")
              .eq("id", payload.new.product_id)
              .single();
            const productName = product?.title || "Mahsulot";
            const statusLabel = statusLabels[newStatus] || newStatus;

            playNotificationSound(newStatus === "cancelled" ? "warning" : "success");
            toast({
              title: "📦 Buyurtma holati yangilandi",
              description: `"${productName}" buyurtmangiz holati: ${statusLabel}`,
              variant: newStatus === "cancelled" ? "destructive" : "default",
            });

            await saveNotification(
              userId,
              "Buyurtma holati yangilandi",
              `"${productName}" holati: ${statusLabel}`,
              "order",
              "/orders"
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, isFarmer, toast]);

  // Farmer: New orders
  useEffect(() => {
    if (!userId || !isFarmer || farmerProductIds.length === 0) return;

    const channel = supabase
      .channel("farmer-new-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          if (farmerProductIds.includes(payload.new.product_id)) {
            const { data: product } = await supabase
              .from("products")
              .select("title")
              .eq("id", payload.new.product_id)
              .single();
            const productName = product?.title || "Mahsulot";

            playNotificationSound("success");
            toast({
              title: "🛒 Yangi buyurtma!",
              description: `"${productName}" uchun ${payload.new.quantity} dona buyurtma keldi`,
            });

            await saveNotification(
              userId,
              "Yangi buyurtma!",
              `"${productName}" uchun ${payload.new.quantity} dona buyurtma`,
              "order",
              "/farmer"
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, isFarmer, farmerProductIds, toast]);

  // Farmer: Low stock alerts
  useEffect(() => {
    if (!userId || !isFarmer) return;

    const channel = supabase
      .channel("farmer-stock-alerts")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        async (payload) => {
          if (
            payload.new.seller_id === userId &&
            payload.new.stock_quantity !== null &&
            payload.new.stock_quantity < 5 &&
            payload.new.stock_quantity !== payload.old.stock_quantity
          ) {
            playNotificationSound("warning");
            toast({
              title: "⚠️ Zaxira kam!",
              description: `"${payload.new.title}" mahsulotingiz zaxirasi ${payload.new.stock_quantity} ta qoldi`,
              variant: "destructive",
            });

            await saveNotification(
              userId,
              "Zaxira kam!",
              `"${payload.new.title}" zaxirasi ${payload.new.stock_quantity} ta qoldi`,
              "stock",
              "/farmer"
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, isFarmer, toast]);

  // Chat message notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("chat-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "private_messages" },
        async (payload) => {
          if (payload.new.sender_id !== userId) {
            const { data: participant } = await supabase
              .from("chat_participants")
              .select("room_id")
              .eq("room_id", payload.new.room_id)
              .eq("user_id", userId)
              .maybeSingle();

            if (participant) {
              const { data: sender } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("user_id", payload.new.sender_id)
                .single();
              const senderName = sender?.full_name || "Foydalanuvchi";

              playNotificationSound("message");
              toast({
                title: "💬 Yangi xabar",
                description: `${senderName}: ${payload.new.content.substring(0, 50)}${payload.new.content.length > 50 ? "..." : ""}`,
              });

              await saveNotification(
                userId,
                "Yangi xabar",
                `${senderName}: ${payload.new.content.substring(0, 100)}`,
                "message",
                "/chat"
              );
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, toast]);
};
