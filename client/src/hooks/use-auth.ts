import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface AuthUser {
  id: string;
  email: string | undefined;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

function mapSupabaseUser(user: SupabaseUser | null): AuthUser | null {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email,
    firstName: metadata.full_name?.split(" ")[0] || metadata.name?.split(" ")[0] || null,
    lastName: metadata.full_name?.split(" ").slice(1).join(" ") || metadata.name?.split(" ").slice(1).join(" ") || null,
    profileImageUrl: metadata.avatar_url || metadata.picture || null,
  };
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const supabase = await getSupabase();
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(currentSession);
          setUser(mapSupabaseUser(currentSession?.user || null));
          setIsLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, newSession) => {
            if (mounted) {
              setSession(newSession);
              setUser(mapSupabaseUser(newSession?.user || null));
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Auth init error:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const supabase = await getSupabase();
      await supabase.auth.signOut();
      queryClient.clear();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [queryClient]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    logout,
    isLoggingOut,
    accessToken: session?.access_token,
  };
}
