import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  const [mobileOpen, setMobileOpen] = useState(false);

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
    setMobileOpen(false);
    setTimeout(() => {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-border" style={{ backgroundColor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="container mx-auto flex items-center justify-between h-16 px-4 max-w-full">
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <Link to="/" className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-display min-w-0">
            <img src="/logo.png" alt="ToolsBazzar" className="h-8 w-8 rounded shrink-0" />
            <span className="truncate">ToolsBazzar</span>
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold shrink-0"
              style={{
                background: 'linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))',
                color: '#0a0a0a',
              }}
            >
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <button
              key={l.label}
              onClick={() => handleNavClick(l.href)}
              className="text-sm hover:text-white transition-colors bg-transparent border-0 cursor-pointer hover-underline pb-1"
              style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
            >
              {l.label}
            </button>
          ))}
          {loggedIn ? (
            <>
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold border-0 uppercase" style={{ letterSpacing: '0.04em' }} asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <button
                onClick={handleLogout}
                className="text-sm text-red-400 hover:text-red-300 transition-colors bg-transparent border-0 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hover:text-white" style={{ color: 'rgba(255,255,255,0.7)' }} asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold border-0 uppercase" style={{ letterSpacing: '0.04em' }} asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-border text-white"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-[320px] border-border p-0" style={{ background: '#0a0a0a' }}>
              <SheetHeader className="p-5 border-b border-border">
                <SheetTitle className="text-white flex items-center gap-2 font-display">
                  <img src="/logo.png" alt="ToolsBazzar" className="h-7 w-7 rounded" />
                  ToolsBazzar
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col p-4 gap-1">
                {navLinks.map((l) => (
                  <button
                    key={l.label}
                    onClick={() => handleNavClick(l.href)}
                    className="text-left px-4 py-3 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    {l.label}
                  </button>
                ))}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold"
                    style={{
                      background: 'linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))',
                      color: '#0a0a0a',
                    }}
                  >
                    <Shield className="h-4 w-4" /> Admin Panel
                  </Link>
                )}
                <div className="h-px bg-border my-3" />
                {loggedIn ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-center px-4 py-3 rounded-lg text-sm font-semibold uppercase bg-cyan-600 hover:bg-cyan-700 text-white"
                      style={{ letterSpacing: '0.04em' }}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 mt-1"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-center px-4 py-3 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-center px-4 py-3 rounded-lg text-sm font-semibold uppercase bg-cyan-600 hover:bg-cyan-700 text-white mt-1"
                      style={{ letterSpacing: '0.04em' }}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
