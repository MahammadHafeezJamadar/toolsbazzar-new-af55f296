import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Reviews", href: "#testimonials" },
  { label: "About", href: "#about" },
];

const Navbar = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setLoggedIn(true);
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();
      if (data?.is_admin) setIsAdmin(true);
    };
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
      if (!session) setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleNavClick = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-border overflow-hidden" style={{ backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="text-lg font-bold text-white flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="ToolsBazzar" className="h-8 w-8 rounded" />
          <span>ToolsBazzar</span>
        </Link>

        {/* Desktop nav only */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <button
              key={l.label}
              onClick={() => handleNavClick(l.href)}
              className="text-sm text-gray-400 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
            >
              {l.label}
            </button>
          ))}
          {isAdmin && (
            <Link to="/admin" className="text-sm text-cyan-400 hover:text-white transition-colors flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          {loggedIn ? (
            <>
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold border-0" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <button
                onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors bg-transparent border-0 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold border-0" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
