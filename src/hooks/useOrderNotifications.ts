import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  processing: "Qabul qilindi",
  shipped: "Yuborildi",
  delivered: "Yetkazildi",
  cancelled: "Rad etildi",
};

export const useOrderNotifications = (userId: string | undefined) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('order-status-changes')
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
            // Fetch product info for notification
            const { data: product } = await supabase
              .from('products')
              .select('title')
              .eq('id', payload.new.product_id)
              .single();

            const productName = product?.title || "Mahsulot";
            const statusLabel = statusLabels[newStatus] || newStatus;

            toast({
              title: "Buyurtma holati yangilandi",
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
  }, [userId, toast]);
};
