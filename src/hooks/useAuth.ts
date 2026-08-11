import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";



interface AuthState {
  user: { id: string; email?: string } | null;
  profile: {
    full_name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    is_blocked: boolean;
  } | null;
  roles: string[];
  loading: boolean;
  isAuthenticated: boolean;
  isFarmer: boolean;
  isAdmin: boolean;
  isSubAdmin: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    roles: [],
    loading: true,
    isAuthenticated: false,
    isFarmer: false,
    isAdmin: false,
    isSubAdmin: false,
  });

  const fetchUserData = useCallback(async (userId: string, email?: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("full_name, email, phone, location, is_blocked").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const roles = (rolesRes.data || []).map(r => r.role);
    const profile = profileRes.data;

    setState({
      user: { id: userId, email },
      profile: profile ? {
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        is_blocked: profile.is_blocked || false,
      } : null,
      roles,
      loading: false,
      isAuthenticated: true,
      isFarmer: roles.includes("farmer"),
      isAdmin: roles.includes("admin"),
      isSubAdmin: roles.includes("sub_admin"),
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email);
      } else {
        setState(prev => ({ ...prev, user: null, profile: null, roles: [], loading: false, isAuthenticated: false, isFarmer: false, isAdmin: false, isSubAdmin: false }));
      }
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchUserData(user.id, user.email ?? undefined);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signOut = useCallback(async () => {
    clearOtpVerified();
    await supabase.auth.signOut();
  }, []);


  const updateProfile = useCallback(async (data: { full_name?: string; phone?: string; location?: string }) => {
    if (!state.user) return { error: "Not authenticated" };
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("user_id", state.user.id);
    if (!error && state.user) {
      await fetchUserData(state.user.id, state.user.email);
    }
    return { error: error?.message || null };
  }, [state.user, fetchUserData]);

  return { ...state, signOut, updateProfile, refetch: () => state.user && fetchUserData(state.user.id, state.user.email) };
};

/**
 * Hook that redirects if user doesn't have required role.
 * Usage: useRequireRole('farmer', '/auth')
 */
export const useRequireRole = (
  requiredRole: string | null,
  redirectTo: string = "/auth"
) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (auth.loading) return;

    if (!auth.isAuthenticated) {
      navigate(redirectTo);
      return;
    }

    if (requiredRole && !auth.roles.includes(requiredRole)) {
      toast({
        title: "Ruxsat yo'q",
        description: "Ushbu sahifaga kirish huquqingiz yo'q",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [auth.loading, auth.isAuthenticated, auth.user?.id, auth.roles, requiredRole, navigate, redirectTo, toast]);



  return auth;
};

/**
 * Hook that requires authentication only (any role).
 */
export const useRequireAuth = (redirectTo: string = "/auth") => {
  return useRequireRole(null, redirectTo);
};
