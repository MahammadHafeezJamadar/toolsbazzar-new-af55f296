import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNavigation from "./AdminNavigation";
import { Button } from "@/components/ui/button";

interface AdminShellProps { title: string; children: ReactNode; actions?: ReactNode }
export default function AdminShell({ title, children, actions }: AdminShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single();
      if (!active) return;
      if (!profile?.is_admin || session.user.email?.toLowerCase() !== "hafeezjamadar295@gmail.com") { toast.error("Admin access only"); navigate("/dashboard"); return; }
      setAuthChecked(true);
    })();
    return () => { active = false; };
  }, [navigate]);
  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/login"); };
  if (!authChecked) return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Verifying admin access...</div>;
  return <div className="min-h-screen bg-background md:flex">
    <AdminNavigation active={location.pathname === "/admin/gmail" ? "gmail" : "finance"} onLogout={handleLogout} />
    <main className="min-w-0 flex-1">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-8"><h1 className="text-xl font-semibold tracking-normal">{title}</h1><div className="flex flex-wrap items-center gap-2">{actions}</div></header>
      <div className="mx-auto max-w-7xl p-4 pb-24 md:p-8">
        {location.pathname !== "/admin/gmail" && <nav aria-label="Finance and analytics views" className="mb-5 flex flex-wrap gap-2 border-b border-border pb-3">
          {[{ path: "/admin/dashboard", label: "Overview" }, { path: "/admin/finance", label: "Finance" }, { path: "/admin/analytics", label: "Analytics" }].map((item) => <Button key={item.path} variant="ghost" size="sm" onClick={() => navigate(item.path)} className={location.pathname === item.path ? "bg-accent/10 text-accent" : "text-muted-foreground"}>{item.label}</Button>)}
        </nav>}
        {children}
      </div>
    </main>
  </div>;
}
