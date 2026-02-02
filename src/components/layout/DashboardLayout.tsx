import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Users,
  MapPin,
  Brain,
  Home,
  TrendingUp,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { path: "/", label: "Visão Geral", icon: BarChart3 },
  { path: "/regional", label: "Regional", icon: MapPin },
  { path: "/clientes", label: "Clientes", icon: Users, disabled: true },
  { path: "/inteligencia", label: "Inteligência", icon: Brain, disabled: true },
];
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2 animate-fade-in">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-sidebar-foreground">HM Rubber</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.disabled ? "#" : item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary/20 text-primary border-l-2 border-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-primary",
                    item.disabled && "opacity-50 cursor-not-allowed",
                    "animate-slide-in-left opacity-0"
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={(e) => item.disabled && e.preventDefault()}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.disabled && (
                    <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Em breve</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border space-y-3">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Dashboard v1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="font-bold">HM Rubber</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
