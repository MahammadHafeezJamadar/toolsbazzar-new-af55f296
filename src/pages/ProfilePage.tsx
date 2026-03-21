import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Shield, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile_number: "",
    street_address: "",
    city: "",
    state: "",
    pin_code: "",
    country: "India",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("name, email, is_admin, mobile_number, street_address, city, state, pin_code, country")
        .eq("id", session.user.id)
        .single();

      if (error) { toast.error("Failed to load profile"); }
      else {
        setForm({
          name: data.name || "",
          email: data.email || "",
          mobile_number: (data as any).mobile_number || "",
          street_address: (data as any).street_address || "",
          city: (data as any).city || "",
          state: (data as any).state || "",
          pin_code: (data as any).pin_code || "",
          country: (data as any).country || "India",
        });
        setIsAdmin(!!data.is_admin);
      }
      setLoading(false);
    };
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Session expired"); setSaving(false); return; }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: form.name.trim() || null,
        mobile_number: form.mobile_number.trim() || null,
        street_address: form.street_address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        pin_code: form.pin_code.trim() || null,
        country: form.country.trim() || "India",
      } as any)
      .eq("id", session.user.id);

    setSaving(false);
    if (error) toast.error("Failed to save profile");
    else toast.success("Profile saved successfully!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const initials = (form.name || form.email || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="text-lg font-bold text-foreground">ToolzBazzar</Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin" className="flex items-center gap-1 text-accent"><Shield className="h-4 w-4" /> Admin</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground mb-8">My Profile</h1>

          {/* Avatar */}
          <div className="flex justify-center mb-8">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold border"
              style={{
                background: "linear-gradient(135deg, hsla(174, 72%, 46%, 0.2), hsla(150, 60%, 50%, 0.2))",
                borderColor: "hsla(174, 72%, 46%, 0.3)",
                color: "hsl(174 72% 56%)",
                boxShadow: "0 0 40px hsla(174, 72%, 46%, 0.1)",
              }}
            >
              {initials}
            </div>
          </div>

          {/* Form */}
          <div className="rounded-xl p-6 border space-y-5" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Full Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  maxLength={100}
                  className="bg-[#0a0a0a] border-[#1e1e1e] focus:border-accent"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Email Address</Label>
                <Input
                  value={form.email}
                  readOnly
                  className="bg-[#0a0a0a] border-[#1e1e1e] text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Mobile Number</Label>
              <Input
                value={form.mobile_number}
                onChange={(e) => setForm((f) => ({ ...f, mobile_number: e.target.value.replace(/[^0-9+\- ]/g, "") }))}
                maxLength={20}
                className="bg-[#0a0a0a] border-[#1e1e1e] focus:border-accent"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Street Address</Label>
              <Input
                value={form.street_address}
                onChange={(e) => setForm((f) => ({ ...f, street_address: e.target.value }))}
                maxLength={200}
                className="bg-[#0a0a0a] border-[#1e1e1e] focus:border-accent"
                placeholder="Enter your street address"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  maxLength={100}
                  className="bg-[#0a0a0a] border-[#1e1e1e] focus:border-accent"
                  placeholder="City"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  maxLength={100}
                  className="bg-[#0a0a0a] border-[#1e1e1e] focus:border-accent"
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">PIN Code</Label>
                <Input
                  value={form.pin_code}
                  onChange={(e) => setForm((f) => ({ ...f, pin_code: e.target.value.replace(/\D/g, "") }))}
                  maxLength={10}
                  className="bg-[#0a0a0a] border-[#1e1e1e] focus:border-accent"
                  placeholder="560001"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  maxLength={100}
                  className="bg-[#0a0a0a] border-[#1e1e1e] focus:border-accent"
                  placeholder="India"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))",
                color: "#0a0a0a",
                boxShadow: "0 0 30px hsla(174, 72%, 46%, 0.15)",
              }}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
