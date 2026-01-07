import { useEffect } from "react";
import { useLocation } from "wouter";
import { getSupabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      const supabase = await getSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );
      if (error) {
        console.error("Auth callback error:", error);
        navigate("/auth");
        return;
      }
      navigate("/");
    } catch (error) {
      console.error("Auth callback error:", error);
      navigate("/auth");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
