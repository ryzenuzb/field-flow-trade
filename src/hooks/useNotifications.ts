import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export const useNotifications = ({ userId, isFarmer }: NotificationHookProps) => {
  const { toast } = useToast();
  const [farmerProductIds, setFarmerProductIds] = useState<string[]>([]);

  // Fetch farmer's product IDs for order notifications
  useEffect(() => {
    if (!userId || !isFarmer) return;

    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', userId);
      
      if (data) {
        setFarmerProductIds(data.map(p => p.id));
      }
    };

    fetchProducts();
  }, [userId, isFarmer]);

  // Buyer: Order status changes
  useEffect(() => {
    if (!userId || isFarmer) return;

    const channel = supabase
      .channel('buyer-order-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${userId}`,
        },
        async (payload) => {
          const newStatus = payload.new.status as string;
          const oldStatus = payload.old.status as string;
          
          if (newStatus !== oldStatus) {
            const { data: product } = await supabase
              .from('products')
              .select('title')
              .eq('id', payload.new.product_id)
              .single();

            const productName = product?.title || "Mahsulot";
            const statusLabel = statusLabels[newStatus] || newStatus;

            toast({
              title: "📦 Buyurtma holati yangilandi",
              description: `"${productName}" buyurtmangiz holati: ${statusLabel}`,
              variant: newStatus === 'cancelled' ? 'destructive' : 'default',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isFarmer, toast]);

  // Farmer: New orders received
  useEffect(() => {
    if (!userId || !isFarmer || farmerProductIds.length === 0) return;

    const channel = supabase
      .channel('farmer-new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          // Check if order is for farmer's product
          if (farmerProductIds.includes(payload.new.product_id)) {
            const { data: product } = await supabase
              .from('products')
              .select('title')
              .eq('id', payload.new.product_id)
              .single();

            const productName = product?.title || "Mahsulot";
            const quantity = payload.new.quantity;
            const totalPrice = payload.new.total_price;

            toast({
              title: "🎉 Yangi buyurtma keldi!",
              description: `"${productName}" - ${quantity} dona, ${totalPrice.toLocaleString()} so'm`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isFarmer, farmerProductIds, toast]);

  // Farmer: Low stock alerts
  useEffect(() => {
    if (!userId || !isFarmer) return;

    const channel = supabase
      .channel('farmer-stock-alerts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `seller_id=eq.${userId}`,
        },
        (payload) => {
          const newStock = payload.new.stock_quantity as number;
          const oldStock = payload.old.stock_quantity as number;
          const productName = payload.new.title as string;

          // Alert when stock drops below 5
          if (newStock < 5 && oldStock >= 5) {
            toast({
              title: "⚠️ Zaxira kam qoldi!",
              description: `"${productName}" - faqat ${newStock} dona qoldi`,
              variant: "destructive",
            });
          }

          // Alert when stock reaches 0
          if (newStock === 0 && oldStock > 0) {
            toast({
              title: "🚫 Zaxira tugadi!",
              description: `"${productName}" zaxirasi tugadi. Yangilang!`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isFarmer, toast]);

  // New chat messages
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
        },
        async (payload) => {
          // Only notify if message is not from current user
          if (payload.new.sender_id !== userId) {
            // Check if user is participant in this room
            const { data: participation } = await supabase
              .from('chat_participants')
              .select('room_id')
              .eq('room_id', payload.new.room_id)
              .eq('user_id', userId)
              .single();

            if (participation) {
              // Get sender name
              const { data: sender } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', payload.new.sender_id)
                .single();

              const senderName = sender?.full_name || "Foydalanuvchi";
              const messagePreview = (payload.new.content as string).slice(0, 50) + 
                ((payload.new.content as string).length > 50 ? "..." : "");

              toast({
                title: `💬 ${senderName} xabar yubordi`,
                description: messagePreview,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);
};
