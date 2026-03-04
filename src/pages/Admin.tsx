import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LogOut, Plus, Save, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: string;
  subscription_active: boolean;
  expiry_date: string | null;
}

const ADMIN_EMAIL = "admin@myflow.com";

const Admin = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", plan: "Basic" });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      if (!profile?.is_admin) {
        toast.error("Access denied");
        navigate("/dashboard");
        return;
      }

      await loadUsers();
    };
    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name, plan, subscription_active, expiry_date")
      .order("email");
    if (error) toast.error("Failed to load users");
    else setUsers(data || []);
    setLoading(false);
  };

  const toggleSubscription = async (userId: string, current: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_active: !current })
      .eq("id", userId);
    if (error) toast.error("Update failed");
    else {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, subscription_active: !current } : u));
      toast.success("Updated");
    }
  };

  const updateField = async (userId: string, field: string, value: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", userId);
    if (error) toast.error("Update failed");
    else {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, [field]: value } : u));
      toast.success("Updated");
    }
  };

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
          <Link to="/" className="text-xl font-bold gradient-text flex items-center gap-2">
            <Shield className="h-5 w-5" /> MyFlow Admin
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-btn border-0 text-primary-foreground font-semibold">
                <Plus className="h-4 w-4 mr-2" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border/50">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Email</Label>
                  <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="mt-1 bg-secondary/50 border-border/50" />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="mt-1 bg-secondary/50 border-border/50" />
                </div>
                <div>
                  <Label>Plan</Label>
                  <Input value={newUser.plan} onChange={(e) => setNewUser({ ...newUser, plan: e.target.value })} className="mt-1 bg-secondary/50 border-border/50" />
                </div>
                <Button
                  className="w-full gradient-btn border-0 text-primary-foreground font-semibold"
                  onClick={async () => {
                    const { error } = await supabase.from("profiles").insert({
                      email: newUser.email,
                      name: newUser.name,
                      plan: newUser.plan,
                    });
                    if (error) toast.error(error.message);
                    else {
                      toast.success("User added");
                      setDialogOpen(false);
                      setNewUser({ email: "", name: "", plan: "Basic" });
                      loadUsers();
                    }
                  }}
                >
                  Add User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Plan</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Expiry</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow key={u.id} user={u} toggleSubscription={toggleSubscription} updateField={updateField} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserRow = ({
  user,
  toggleSubscription,
  updateField,
}: {
  user: UserProfile;
  toggleSubscription: (id: string, current: boolean) => void;
  updateField: (id: string, field: string, value: string) => void;
}) => {
  const [plan, setPlan] = useState(user.plan);
  const [expiry, setExpiry] = useState(user.expiry_date || "");

  return (
    <tr className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
      <td className="p-4 text-sm font-medium">{user.name || "—"}</td>
      <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          <Input
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="h-8 w-24 text-xs bg-secondary/50 border-border/50"
          />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateField(user.id, "plan", plan)}>
            <Save className="h-3 w-3" />
          </Button>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Switch checked={user.subscription_active} onCheckedChange={() => toggleSubscription(user.id, user.subscription_active)} />
          <Badge variant={user.subscription_active ? "default" : "secondary"} className={user.subscription_active ? "gradient-btn border-0 text-primary-foreground text-xs" : "text-xs"}>
            {user.subscription_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="h-8 text-xs bg-secondary/50 border-border/50"
          />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateField(user.id, "expiry_date", expiry)}>
            <Save className="h-3 w-3" />
          </Button>
        </div>
      </td>
      <td className="p-4">
        <span className="text-xs text-muted-foreground">—</span>
      </td>
    </tr>
  );
};

export default Admin;
