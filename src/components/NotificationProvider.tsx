import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | undefined>();
  const [isFarmer, setIsFarmer] = useState(false);

  useEffect(() => {
    const checkUserAndRole = async (id: string | undefined) => {
      if (!id) {
        setUserId(undefined);
        setIsFarmer(false);
        return;
      }

      setUserId(id);

      // Check if user is farmer
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', id);

      const hasFarmerRole = roles?.some(r => r.role === 'farmer') || false;
      setIsFarmer(hasFarmerRole);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      checkUserAndRole(session?.user?.id);
    });

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      checkUserAndRole(user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  useNotifications({ userId, isFarmer });

  return <>{children}</>;
};
