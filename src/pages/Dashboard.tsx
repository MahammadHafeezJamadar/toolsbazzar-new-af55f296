import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, ExternalLink, Download, User } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  name: string;
  plan: string;
  subscription_active: boolean;
  expiry_date: string | null;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name, plan, subscription_active, expiry_date")
        .eq("id", session.user.id)
        .single();

      if (error) {
        toast.error("Failed to load profile");
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    getProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="glass border-b border-border/30 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-xl font-bold gradient-text">MyFlow</Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subscription Card */}
          <div className="glass rounded-xl p-6">
            <h2 className="font-semibold mb-4 text-lg">Subscription</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={profile?.subscription_active ? "default" : "destructive"} className={profile?.subscription_active ? "gradient-btn border-0 text-primary-foreground" : ""}>
                  {profile?.subscription_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="text-sm font-medium">{profile?.plan || "None"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expires</span>
                <span className="text-sm font-medium">{profile?.expiry_date || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="glass rounded-xl p-6">
            <h2 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <User className="h-5 w-5" /> Profile
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">{profile?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{profile?.email}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="glass rounded-xl p-6">
            <h2 className="font-semibold mb-4 text-lg">Quick Actions</h2>
            <div className="space-y-3">
              <Button className="w-full gradient-btn border-0 text-primary-foreground font-semibold">
                <ExternalLink className="h-4 w-4 mr-2" /> Open Google Flow
              </Button>
              <Button variant="outline" className="w-full border-border/50">
                <Download className="h-4 w-4 mr-2" /> Download Extension
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
