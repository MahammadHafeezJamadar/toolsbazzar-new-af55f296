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

const ADMIN_EMAIL = "hafeezjamadar295@gmail.com";

const Navbar = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setLoggedIn(true);
      setIsAdmin(session.user.email === ADMIN_EMAIL);
    };
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
      setIsAdmin(session?.user?.email === ADMIN_EMAIL);
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
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/" className="text-lg font-bold text-white flex items-center gap-2">
            <img src="/logo.png" alt="ToolsBazzar" className="h-8 w-8 rounded" />
            <span>ToolsBazzar</span>
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))',
                color: '#0a0a0a',
              }}
            >
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </div>

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
