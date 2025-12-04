import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";

export const OrderNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id);
    });

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  useOrderNotifications(userId);

  return <>{children}</>;
};
