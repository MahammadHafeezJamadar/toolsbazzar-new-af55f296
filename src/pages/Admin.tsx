import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, Save, Shield, KeyRound, Cookie, Monitor, X, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: string;
  subscription_active: boolean;
  expiry_date: string | null;
  google_email: string | null;
  google_password: string | null;
  cookies_json: any;
  credits_total: number;
  credits_used: number;
  daily_credits_limit: number;
  credits_used_today: number;
  last_reset_date: string | null;
}

interface DeviceSession {
  id: string;
  device_id: string;
  device_info: string;
  ip_address: string | null;
  login_time: string;
  last_active_time: string;
  is_active: boolean;
}

const Admin = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [globalCookiesOpen, setGlobalCookiesOpen] = useState(false);
  const [globalCookies, setGlobalCookies] = useState("");
  const [globalCookiesLoading, setGlobalCookiesLoading] = useState(false);
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
      await loadSessionCounts();
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
      .select("id, email, name, plan, subscription_active, expiry_date, google_email, google_password, cookies_json, credits_total, credits_used, daily_credits_limit, credits_used_today, last_reset_date")
      .order("email");
    if (error) toast.error("Failed to load users");
    else setUsers(data || []);
    setLoading(false);
  };

  const loadSessionCounts = async () => {
    const { data, error } = await supabase
      .from("user_sessions")
      .select("user_id, is_active");

    if (!error && data) {
      const counts: Record<string, number> = {};
      data.forEach((s: any) => {
        if (s.is_active) {
          counts[s.user_id] = (counts[s.user_id] || 0) + 1;
        }
      });
      setSessionCounts(counts);
    }
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

  const updateField = async (userId: string, field: string, value: any) => {
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

  const deleteUser = async (userId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await supabase.functions.invoke("delete-user", {
      body: { user_id: userId },
    });

    if (res.error || res.data?.error) {
      toast.error(res.data?.error || res.error?.message || "Failed to delete user");
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User deleted");
    }
  };

  const loadGlobalCookies = async () => {
    const { data } = await supabase
      .from("global_settings")
      .select("value")
      .eq("key", "global_cookies")
      .single();
    if (data?.value) setGlobalCookies(data.value);
  };

  const saveGlobalCookies = async () => {
    if (globalCookies.trim()) {
      try {
        JSON.parse(globalCookies);
      } catch {
        toast.error("Invalid JSON");
        return;
      }
    }
    setGlobalCookiesLoading(true);
    const { data: existing } = await supabase
      .from("global_settings")
      .select("id")
      .eq("key", "global_cookies")
      .single();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("global_settings")
        .update({ value: globalCookies.trim() || null, updated_at: new Date().toISOString() })
        .eq("key", "global_cookies"));
    } else {
      ({ error } = await supabase
        .from("global_settings")
        .insert({ key: "global_cookies", value: globalCookies.trim() || null }));
    }
    setGlobalCookiesLoading(false);
    if (error) toast.error("Failed to save global cookies");
    else {
      toast.success("Global cookies saved");
      setGlobalCookiesOpen(false);
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
            <Shield className="h-5 w-5" /> ToolzBazzar Admin
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <Dialog open={globalCookiesOpen} onOpenChange={(open) => {
            setGlobalCookiesOpen(open);
            if (open) loadGlobalCookies();
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-btn border-0 text-primary-foreground font-semibold">
                <Globe className="h-4 w-4 mr-2" /> Set Global Cookies
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border/50 max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Global Cookies
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                When set, these cookies will be used for ALL users instead of individual user cookies.
              </p>
              <Textarea
                value={globalCookies}
                onChange={(e) => setGlobalCookies(e.target.value)}
                className="bg-secondary/50 border-border/50 font-mono text-xs min-h-[200px]"
                placeholder='[{"name":"...", "value":"..."}]'
              />
              <Button
                className="w-full gradient-btn border-0 text-primary-foreground font-semibold"
                onClick={saveGlobalCookies}
                disabled={globalCookiesLoading}
              >
                <Save className="h-4 w-4 mr-2" /> {globalCookiesLoading ? "Saving..." : "Save Global Cookies"}
              </Button>
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
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Credits</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Expiry</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Sessions</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Credentials</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    toggleSubscription={toggleSubscription}
                    updateField={updateField}
                    activeDevices={sessionCounts[u.id] || 0}
                    onSessionRevoked={loadSessionCounts}
                    onDeleteUser={deleteUser}
                  />
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
  activeDevices,
  onSessionRevoked,
  onDeleteUser,
}: {
  user: UserProfile;
  toggleSubscription: (id: string, current: boolean) => void;
  updateField: (id: string, field: string, value: any) => void;
  activeDevices: number;
  onSessionRevoked: () => void;
  onDeleteUser: (id: string) => Promise<void>;
}) => {
  const [plan, setPlan] = useState(user.plan);
  const [expiry, setExpiry] = useState(user.expiry_date || "");
  const [creditsTotal, setCreditsTotal] = useState(String(user.credits_total ?? 1000));
  const [dailyLimit, setDailyLimit] = useState(String(user.daily_credits_limit ?? 100));
  const [credOpen, setCredOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [googleEmail, setGoogleEmail] = useState(user.google_email || "");
  const [googlePassword, setGooglePassword] = useState(user.google_password || "");
  const [cookiesJson, setCookiesJson] = useState(
    user.cookies_json ? JSON.stringify(user.cookies_json, null, 2) : ""
  );

  const loadSessions = async () => {
    setSessionsLoading(true);
    const { data, error } = await supabase
      .from("user_sessions")
      .select("id, device_id, device_info, ip_address, login_time, last_active_time, is_active")
      .eq("user_id", user.id)
      .order("last_active_time", { ascending: false });

    if (error) toast.error("Failed to load sessions");
    else setSessions(data || []);
    setSessionsLoading(false);
  };

  const revokeSession = async (sessionId: string) => {
    const { error } = await supabase
      .from("user_sessions")
      .update({ is_active: false })
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to revoke session");
    } else {
      setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, is_active: false } : s));
      onSessionRevoked();
      toast.success("Session revoked");
    }
  };

  const saveCreds = async () => {
    let parsedCookies = null;
    if (cookiesJson.trim()) {
      try {
        parsedCookies = JSON.parse(cookiesJson);
      } catch {
        toast.error("Invalid JSON for cookies");
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        google_email: googleEmail || null,
        google_password: googlePassword || null,
        cookies_json: parsedCookies,
      })
      .eq("id", user.id);

    if (error) toast.error("Failed to save credentials");
    else {
      toast.success("Credentials saved");
      setCredOpen(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            type="number"
            value={creditsTotal}
            onChange={(e) => setCreditsTotal(e.target.value)}
            className="h-8 w-20 text-xs bg-secondary/50 border-border/50"
          />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateField(user.id, "credits_total", parseInt(creditsTotal) || 0)}>
            <Save className="h-3 w-3" />
          </Button>
        </div>
        <span className="text-[10px] text-muted-foreground">Used: {user.credits_used ?? 0}</span>
        <div className="flex items-center gap-1 mt-1">
          <Input
            type="number"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value)}
            className="h-7 w-16 text-[10px] bg-secondary/50 border-border/50"
            placeholder="Daily"
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateField(user.id, "daily_credits_limit", parseInt(dailyLimit) || 0)}>
            <Save className="h-3 w-3" />
          </Button>
        </div>
        <span className="text-[10px] text-muted-foreground">Daily: {user.credits_used_today ?? 0}/{user.daily_credits_limit ?? 100}</span>
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Monitor className="h-3 w-3 mr-1" />
            {activeDevices} {activeDevices === 1 ? "device" : "devices"}
          </Badge>
          <Dialog open={sessionsOpen} onOpenChange={(open) => {
            setSessionsOpen(open);
            if (open) loadSessions();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-border/50 text-xs">
                View Devices
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border/50 max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" /> Sessions — {user.email}
                </DialogTitle>
              </DialogHeader>
              {sessionsLoading ? (
                <div className="text-center text-muted-foreground py-8">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No sessions found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">Device</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">IP Address</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">Login Time</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">Last Active</th>
                        <th className="text-left text-xs font-medium text-muted-foreground py-2 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s) => (
                        <tr key={s.id} className="border-b border-border/10">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{s.device_info}</span>
                              {s.is_active ? (
                                <Badge variant="default" className="text-[10px] px-1.5 py-0 gradient-btn border-0 text-primary-foreground">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Revoked</Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">{s.ip_address || "—"}</td>
                          <td className="py-2 px-3 text-muted-foreground">{formatDate(s.login_time)}</td>
                          <td className="py-2 px-3 text-muted-foreground">{formatDate(s.last_active_time)}</td>
                          <td className="py-2 px-3">
                            {s.is_active && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => revokeSession(s.id)}
                              >
                                <X className="h-3 w-3 mr-1" /> Revoke
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </td>
      <td className="p-4">
        <Dialog open={credOpen} onOpenChange={setCredOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-border/50 text-xs">
              <KeyRound className="h-3 w-3 mr-1" /> Set Credentials
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-border/50 max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Credentials — {user.email}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Google Email</Label>
                <Input value={googleEmail} onChange={(e) => setGoogleEmail(e.target.value)} className="mt-1 bg-secondary/50 border-border/50" />
              </div>
              <div>
                <Label>Google Password</Label>
                <Input type="password" value={googlePassword} onChange={(e) => setGooglePassword(e.target.value)} className="mt-1 bg-secondary/50 border-border/50" />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Cookie className="h-3 w-3" /> Cookies JSON</Label>
                <Textarea
                  value={cookiesJson}
                  onChange={(e) => setCookiesJson(e.target.value)}
                  className="mt-1 bg-secondary/50 border-border/50 font-mono text-xs min-h-[120px]"
                  placeholder='[{"name":"...", "value":"..."}]'
                />
              </div>
              <Button className="w-full gradient-btn border-0 text-primary-foreground font-semibold" onClick={saveCreds}>
                <Save className="h-4 w-4 mr-2" /> Save Credentials
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </td>
      <td className="p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="text-xs">
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete their account and all data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDeleteUser(user.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
    </tr>
  );
};

export default Admin;
