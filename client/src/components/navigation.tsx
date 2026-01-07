import { Link, useLocation } from "wouter";
import { Book, Music, Library, Radio, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/bible", label: "Bible", icon: Book },
  { path: "/hymns", label: "Hymns", icon: Music },
  { path: "/library", label: "Library", icon: Library },
  { path: "/livestream", label: "Livestream", icon: Radio },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      <div className="mx-2 mb-2">
        <div className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-lg">
          <div className="flex items-center justify-around py-2.5 px-1">
            {navItems.map((item) => {
              const isActive = location === item.path || 
                (item.path !== "/" && location.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors",
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground"
                  )}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function TopNav() {
  const [location] = useLocation();

  return (
    <nav className="hidden md:flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = location === item.path || 
          (item.path !== "/" && location.startsWith(item.path));
        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            data-testid={`nav-desktop-${item.label.toLowerCase()}`}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
