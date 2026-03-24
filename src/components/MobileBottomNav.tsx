import { useLocation, useNavigate } from "react-router-dom";
import { Home, CreditCard, LayoutDashboard, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const items = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Pricing", icon: CreditCard, path: "/#pricing" },
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Profile", icon: User, path: "/profile" },
  ];

  // Hide on admin pages — admin has its own bottom nav
  if (location.pathname.startsWith("/admin")) return null;

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path.startsWith("/#")) return location.pathname === "/" && location.hash === path.replace("/", "");
    return location.pathname === path;
  };

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around"
      style={{
        backgroundColor: "#0f0f0f",
        borderTop: "1px solid #1e1e1e",
        height: 60,
      }}
    >
      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.label}
            onClick={() => {
              if (item.path === "/#pricing") {
                if (location.pathname !== "/") {
                  navigate("/");
                  setTimeout(() => document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" }), 300);
                } else {
                  document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" });
                }
              } else {
                navigate(item.path);
              }
            }}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full bg-transparent border-0 cursor-pointer transition-colors"
            style={{ color: active ? "#22d3ee" : "#6b7280" }}
          >
            <item.icon size={22} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}

      {loggedIn ? (
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full bg-transparent border-0 cursor-pointer transition-colors"
          style={{ color: "#ef4444" }}
        >
          <LogOut size={22} />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      ) : (
        <button
          onClick={() => navigate("/login")}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full bg-transparent border-0 cursor-pointer transition-colors"
          style={{ color: location.pathname === "/login" ? "#22d3ee" : "#6b7280" }}
        >
          <User size={22} />
          <span className="text-[10px] font-medium">Login</span>
        </button>
      )}
    </div>
  );
};

export default MobileBottomNav;
