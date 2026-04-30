import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, Users, CalendarClock, BarChart3, Monitor } from "lucide-react";

const items = [
  { to: "/admin/dashboard", label: "Dash", icon: LayoutDashboard },
  { to: "/admin/finance", label: "Finance", icon: Wallet },
  { to: "/admin", label: "Users", icon: Users },
  { to: "/admin/renewals", label: "Renew", icon: CalendarClock },
  { to: "/admin/analytics", label: "Stats", icon: BarChart3 },
  { to: "/admin/devices", label: "Devices", icon: Monitor },
];

const AdminBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to: string) =>
    to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(to);

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around"
      style={{
        backgroundColor: "#0f0f0f",
        borderTop: "1px solid #1e1e1e",
        height: 60,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map((item) => {
        const active = isActive(item.to);
        const Icon = item.icon;
        return (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full bg-transparent border-0 cursor-pointer transition-colors"
            style={{ color: active ? "#22d3ee" : "#6b7280" }}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AdminBottomNav;
