import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Reviews", href: "#testimonials" },
  { label: "About", href: "#about" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

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
      if (!session) { setIsAdmin(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate("/");
  };

  const handleNavClick = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-border" style={{ backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="text-lg font-bold text-white flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="ToolsBazzar" className="h-8 w-8 rounded" />
          <span>ToolsBazzar</span>
        </Link>

        {/* Desktop nav */}
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
              <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 transition-colors bg-transparent border-0 cursor-pointer">
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

        {/* Hamburger */}
        <button
          className="md:hidden p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          style={{ color: 'white' }}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden fixed inset-x-0 top-16 bottom-0 z-[99] overflow-y-auto"
          style={{ backgroundColor: '#0a0a0a' }}
        >
          <div className="flex flex-col">
            {navLinks.map((l) => (
              <button
                key={l.label}
                onClick={() => handleNavClick(l.href)}
                className="text-left text-base font-medium px-5 py-4 border-b transition-colors bg-transparent cursor-pointer"
                style={{ color: 'white', borderColor: '#222', backgroundColor: '#0f0f0f' }}
              >
                {l.label}
              </button>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-base font-medium px-5 py-4 border-b flex items-center gap-2"
                style={{ color: '#22d3ee', borderColor: '#222', backgroundColor: '#0f0f0f' }}
                onClick={() => setOpen(false)}
              >
                <Shield className="h-4 w-4" /> Admin
              </Link>
            )}
          </div>

          <div className="p-5 space-y-3 mt-4">
            {loggedIn ? (
              <>
                <Button
                  size="lg"
                  className="w-full min-h-[48px] font-semibold text-white border-0"
                  style={{ backgroundColor: '#0891b2' }}
                  asChild
                >
                  <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                </Button>
                <button
                  onClick={handleLogout}
                  className="w-full min-h-[48px] rounded-md text-base font-medium transition-colors cursor-pointer border"
                  style={{ color: '#f87171', backgroundColor: 'transparent', borderColor: '#7f1d1d' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-h-[48px]"
                  style={{ color: 'white', borderColor: '#333', backgroundColor: 'transparent' }}
                  asChild
                >
                  <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
                </Button>
                <Button
                  size="lg"
                  className="w-full min-h-[48px] font-semibold text-white border-0"
                  style={{ backgroundColor: '#0891b2' }}
                  asChild
                >
                  <Link to="/register" onClick={() => setOpen(false)}>Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
