import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Mail, Wallet, LogOut, Eye, Shield, Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminNavigation({ active, onDashboard, onUsers, onLogout }: {
  active: "dashboard" | "users" | "gmail" | "finance";
  onDashboard?: () => void;
  onUsers?: () => void;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, action: onDashboard || (() => navigate("/admin")) },
    { id: "users", label: "Users", icon: Users, action: onUsers || (() => navigate("/admin?tab=users")) },
    { id: "gmail", label: "Gmail Management", icon: Mail, action: () => navigate("/admin/gmail") },
  ];
  const bottom = [
    { id: "finance", label: "Finance & Analytics", icon: Wallet, action: () => navigate("/admin/dashboard") },
    { id: "logout", label: "Logout", icon: LogOut, action: onLogout },
    { id: "user-dashboard", label: "User Dashboard", icon: Eye, action: () => navigate("/dashboard") },
  ];
  const content = (mini = false) => <>
    <div className={`flex items-center gap-3 border-b border-border ${mini ? "justify-center p-4" : "px-5 py-6"}`}>
      <Shield className="h-6 w-6 shrink-0 text-accent" />{!mini && <div><span className="text-lg font-bold">ToolsBazzar</span><p className="mt-1 text-xs text-muted-foreground">Admin Panel</p></div>}
    </div>
    <nav aria-label="Admin navigation" className="flex-1 space-y-2 p-3">
      {items.map(({ id, label, icon: Icon, action }) => <Button key={id} title={mini ? label : undefined} aria-label={label} aria-current={active === id ? "page" : undefined} variant="ghost"
        onClick={() => { action(); setOpen(false); }} className={`h-11 w-full ${mini ? "px-0" : "justify-start px-3"} ${active === id ? "admin-nav-active" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
        <Icon />{!mini && label}
      </Button>)}
    </nav>
    <div className="space-y-1 border-t border-border p-3">
      {bottom.map(({ id, label, icon: Icon, action }) => <Button key={id} variant="ghost" aria-label={label} title={mini ? label : undefined} onClick={() => { action(); setOpen(false); }}
        className={`h-11 w-full ${mini ? "px-0" : "justify-start px-3"} ${id === "finance" ? "admin-nav-active" : "text-muted-foreground"}`}><Icon />{!mini && label}</Button>)}
    </div>
  </>;
  return <>
    <aside className={`admin-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border md:flex ${collapsed ? "w-20" : "w-64"}`}>
      {content(collapsed)}
      <Button variant="ghost" className="absolute right-2 top-20 h-8 w-8 px-0 text-muted-foreground" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button>
    </aside>
    <div className={`hidden shrink-0 md:block ${collapsed ? "w-20" : "w-64"}`} />
    <header className="admin-sidebar sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
      <div className="flex items-center gap-2"><Button size="icon" variant="ghost" aria-label="Open admin menu" onClick={() => setOpen(true)}><Menu /></Button><Shield className="h-5 w-5 text-accent" /><span className="font-semibold">ToolsBazzar</span></div>
      <Button size="icon" variant="ghost" aria-label="User Dashboard" onClick={() => navigate("/dashboard")}><Eye /></Button>
    </header>
    {open && <div className="fixed inset-0 z-[110] md:hidden"><div className="absolute inset-0 bg-background/80" onClick={() => setOpen(false)} /><aside className="admin-sidebar relative flex h-full w-72 max-w-[90vw] flex-col border-r border-border">{content()}<Button className="absolute right-2 top-3" size="icon" variant="ghost" aria-label="Close admin menu" onClick={() => setOpen(false)}><X /></Button></aside></div>}
    <nav aria-label="Mobile admin navigation" className="admin-sidebar fixed inset-x-0 bottom-0 z-[100] flex h-[60px] items-center border-t border-border md:hidden">
      {[...items, bottom[0]].map(({ id, label, icon: Icon, action }) => <Button key={id} variant="ghost" aria-label={label} onClick={action} className={`h-full min-w-0 flex-1 flex-col gap-1 px-1 text-[10px] ${active === id ? "text-accent" : "text-muted-foreground"}`}><Icon /><span>{id === "gmail" ? "Gmail" : id === "finance" ? "Finance" : label}</span></Button>)}
    </nav>
  </>;
}