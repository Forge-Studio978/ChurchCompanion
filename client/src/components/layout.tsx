import { Header } from "./header";
import { BottomNav } from "./navigation";

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export function Layout({ children, showNav = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pb-24 md:pb-0">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
