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

  // Lock body scroll when mobile menu is open
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white md:bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo - always visible */}
        <Link to="/" className="text-lg font-bold text-foreground flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="ToolsBazzar" className="h-8 w-8 rounded" />
          <span className="truncate">ToolsBazzar</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
          {isAdmin && (
            <Link to="/admin" className="text-sm text-accent hover:text-foreground transition-colors flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {loggedIn ? (
            <Button size="sm" className="gradient-btn border-0 font-semibold" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" className="gradient-btn border-0 font-semibold" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Hamburger button - mobile only */}
        <button
          className="md:hidden text-foreground p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-[#111] overflow-y-auto">
          <div className="flex flex-col">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors px-5 py-3.5 border-b border-border"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-base font-medium text-accent hover:text-foreground hover:bg-secondary/50 transition-colors px-5 py-3.5 border-b border-border flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <Shield className="h-4 w-4" /> Admin
              </Link>
            )}
          </div>

          <div className="p-4 space-y-3 mt-auto">
            {loggedIn ? (
              <>
                <Button size="lg" className="gradient-btn border-0 font-semibold w-full min-h-[44px]" asChild>
                  <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-h-[44px]"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="lg" className="w-full min-h-[44px]" asChild>
                  <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
                </Button>
                <Button size="lg" className="gradient-btn border-0 font-semibold w-full min-h-[44px]" asChild>
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
