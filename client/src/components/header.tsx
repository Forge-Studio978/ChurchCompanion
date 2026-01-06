import { useAuth } from "@/hooks/use-auth";
import { TopNav } from "./navigation";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import { Link } from "wouter";

export function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const getInitials = () => {
    if (!user) return "?";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/">
            <a className="flex items-center gap-3" data-testid="link-home">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-serif text-lg font-semibold">C</span>
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight hidden sm:block">
                Christian Center
              </span>
            </a>
          </Link>

          <TopNav />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {isLoading ? (
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/library">
                      <a className="flex items-center gap-2 w-full cursor-pointer" data-testid="menu-library">
                        <User className="h-4 w-4" />
                        My Library
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <a className="flex items-center gap-2 w-full cursor-pointer" data-testid="menu-settings">
                        <Settings className="h-4 w-4" />
                        Settings
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-destructive focus:text-destructive cursor-pointer"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild data-testid="button-login">
                <a href="/api/login">Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
