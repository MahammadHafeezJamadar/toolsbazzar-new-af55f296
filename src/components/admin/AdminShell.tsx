import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Wallet,
  Users,
  BarChart3,
  Monitor,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/finance", label: "Finance", icon: Wallet },
  { to: "/admin", label: "Users", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/devices", label: "Devices", icon: Monitor },
];

interface AdminShellProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

const AdminShell = ({ title, children, actions }: AdminShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();
      if (!active) return;
      if (!profile?.is_admin) {
        toast.error("Admin access only");
        navigate("/dashboard");
        return;
      }
      setAuthChecked(true);
    })();
    return () => { active = false; };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="text-muted-foreground text-sm">Verifying admin access...</div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="px-5 py-5 border-b" style={{ borderColor: "#1e1e1e" }}>
        <button
          onClick={() => navigate("/")}
          className="text-lg font-bold bg-clip-text text-transparent bg-transparent border-0 cursor-pointer"
          style={{ backgroundImage: "linear-gradient(135deg, hsl(174 72% 56%), hsl(150 60% 55%))" }}
        >
          ToolsBazzar
        </button>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Admin Panel</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active =
            item.to === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <button
              key={item.to}
              onClick={() => { navigate(item.to); setMobileOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a]"
              )}
              style={
                active
                  ? {
                      background: "linear-gradient(135deg, hsla(174,72%,46%,0.15), hsla(150,60%,50%,0.1))",
                      border: "1px solid hsla(174,72%,46%,0.3)",
                      boxShadow: "0 0 20px hsla(174,72%,46%,0.1)",
                    }
                  : undefined
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t" style={{ borderColor: "#1e1e1e" }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a]"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0a0a" }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-60 flex-col border-r sticky top-0 h-screen"
        style={{ background: "#0d0d0d", borderColor: "#1e1e1e" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside
            className="relative flex flex-col w-64 border-r"
            style={{ background: "#0d0d0d", borderColor: "#1e1e1e" }}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <header
          className="sticky top-0 z-40 border-b flex items-center justify-between px-4 md:px-6 h-14"
          style={{ background: "rgba(13,13,13,0.85)", backdropFilter: "blur(12px)", borderColor: "#1e1e1e" }}
        >
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-[#1a1a1a] text-foreground"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base md:text-lg font-semibold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default AdminShell;
