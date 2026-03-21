import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "About", href: "#about" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
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
      if (!session) { setIsAdmin(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="text-lg font-bold text-foreground">
          ToolzBazzar
        </Link>
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
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-card border-t border-border p-4 flex flex-col gap-3">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="text-muted-foreground hover:text-foreground py-2" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          {isAdmin && (
            <Link to="/admin" className="text-accent hover:text-foreground py-2 flex items-center gap-1" onClick={() => setOpen(false)}>
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          <div className="flex gap-2 pt-2">
            {loggedIn ? (
              <Button size="sm" className="gradient-btn border-0 font-semibold flex-1" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="flex-1">
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" className="gradient-btn border-0 font-semibold flex-1" asChild>
                  <Link to="/register">Get Started</Link>
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
