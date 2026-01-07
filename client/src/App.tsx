import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Bible from "@/pages/bible";
import Hymns from "@/pages/hymns";
import LibraryPage from "@/pages/library";
import LivestreamCompanion from "@/pages/livestream";
import Settings from "@/pages/settings";
import Auth from "@/pages/auth";
import AuthCallback from "@/pages/auth-callback";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
            <span className="text-primary font-serif text-2xl font-semibold">C</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Home : Landing} />
      <Route path="/auth" component={Auth} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/bible" component={Bible} />
      <Route path="/hymns" component={Hymns} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/livestream" component={LivestreamCompanion} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
