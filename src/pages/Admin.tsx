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
import {
  LogOut, Save, Shield, KeyRound, Cookie, Monitor, X, Trash2, Globe,
  Users, CreditCard, Zap, TrendingUp, LayoutDashboard, Settings, ChevronUp, ChevronDown, Eye,
} from "lucide-react";
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
  created_at: string | null;
  mobile_number: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  country: string | null;
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

type AdminTab = "dashboard" | "users" | "settings";

const sidebarItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const Admin = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [globalCookiesOpen, setGlobalCookiesOpen] = useState(false);
  const [globalCookies, setGlobalCookies] = useState("");
  const [globalCookiesLoading, setGlobalCookiesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
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
      .select("id, email, name, plan, subscription_active, expiry_date, google_email, google_password, cookies_json, credits_total, credits_used, daily_credits_limit, credits_used_today, last_reset_date, created_at, mobile_number, street_address, city, state, pin_code, country")
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

  // Stats calculations
  const totalUsers = users.length;
  const activeSubscriptions = users.filter((u) => u.subscription_active).length;
  const totalCreditsUsed = users.reduce((sum, u) => sum + (u.credits_used ?? 0), 0);
  const planRevenue: Record<string, number> = { Basic: 299, Pro: 499, Ultra: 799 };
  const monthlyRevenue = users
    .filter((u) => u.subscription_active)
    .reduce((sum, u) => sum + (planRevenue[u.plan] || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0a0a" }}>
      {/* Sidebar */}
      <aside className="w-64 min-h-screen flex flex-col border-r" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold text-foreground">ToolzBazzar</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a]"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: "#1e1e1e" }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
          <Link
            to="/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-[#1a1a1a] transition-colors mt-1"
          >
            <Eye className="h-4 w-4" />
            User Dashboard
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {activeTab === "dashboard" && (
            <DashboardTab
              totalUsers={totalUsers}
              activeSubscriptions={activeSubscriptions}
              totalCreditsUsed={totalCreditsUsed}
              monthlyRevenue={monthlyRevenue}
            />
          )}
          {activeTab === "users" && (
            <UsersTab
              users={users}
              sessionCounts={sessionCounts}
              toggleSubscription={toggleSubscription}
              updateField={updateField}
              deleteUser={deleteUser}
              loadSessionCounts={loadSessionCounts}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab
              globalCookiesOpen={globalCookiesOpen}
              setGlobalCookiesOpen={setGlobalCookiesOpen}
              globalCookies={globalCookies}
              setGlobalCookies={setGlobalCookies}
              globalCookiesLoading={globalCookiesLoading}
              loadGlobalCookies={loadGlobalCookies}
              saveGlobalCookies={saveGlobalCookies}
            />
          )}
        </div>
      </main>
    </div>
  );
};

/* ─── Dashboard Tab ─── */
const StatCard = ({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: string;
}) => (
  <div className="rounded-xl p-5 border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
    <div className="flex items-center justify-between mb-3">
      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      {trend && (
        <span className="flex items-center gap-0.5 text-xs font-medium text-accent">
          <ChevronUp className="h-3 w-3" />
          {trend}
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
  </div>
);

const DashboardTab = ({
  totalUsers,
  activeSubscriptions,
  totalCreditsUsed,
  monthlyRevenue,
}: {
  totalUsers: number;
  activeSubscriptions: number;
  totalCreditsUsed: number;
  monthlyRevenue: number;
}) => (
  <div>
    <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={Users} label="Total Users" value={String(totalUsers)} trend="+12%" />
      <StatCard icon={CreditCard} label="Active Subscriptions" value={String(activeSubscriptions)} trend="+8%" />
      <StatCard icon={Zap} label="Total Credits Used" value={totalCreditsUsed.toLocaleString()} />
      <StatCard icon={TrendingUp} label="Revenue (est.)" value={`₹${monthlyRevenue.toLocaleString()}`} trend="+15%" />
    </div>
  </div>
);

/* ─── Users Tab ─── */
const UsersTab = ({
  users,
  sessionCounts,
  toggleSubscription,
  updateField,
  deleteUser,
  loadSessionCounts,
}: {
  users: UserProfile[];
  sessionCounts: Record<string, number>;
  toggleSubscription: (id: string, current: boolean) => void;
  updateField: (id: string, field: string, value: any) => void;
  deleteUser: (id: string) => Promise<void>;
  loadSessionCounts: () => void;
}) => (
  <div>
    <h1 className="text-2xl font-bold text-foreground mb-6">User Management</h1>
    <div className="rounded-xl border overflow-hidden" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
              <th className="text-left text-[11px] font-medium text-muted-foreground p-4 uppercase tracking-wider">Name</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground p-4 uppercase tracking-wider">Email</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground p-4 uppercase tracking-wider">Plan</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground p-4 uppercase tracking-wider">Status</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground p-4 uppercase tracking-wider">Credits</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground p-4 uppercase tracking-wider">Expiry</th>
              <th className="text-left text-[11px] font-medium text-muted-foreground p-4 uppercase tracking-wider">Actions</th>
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
);

/* ─── Settings Tab ─── */
const SettingsTab = ({
  globalCookiesOpen,
  setGlobalCookiesOpen,
  globalCookies,
  setGlobalCookies,
  globalCookiesLoading,
  loadGlobalCookies,
  saveGlobalCookies,
}: {
  globalCookiesOpen: boolean;
  setGlobalCookiesOpen: (v: boolean) => void;
  globalCookies: string;
  setGlobalCookies: (v: string) => void;
  globalCookiesLoading: boolean;
  loadGlobalCookies: () => void;
  saveGlobalCookies: () => void;
}) => {
  useEffect(() => {
    loadGlobalCookies();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
      <div className="rounded-xl border p-6 max-w-2xl" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <Globe className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Global Cookies</h3>
            <p className="text-xs text-muted-foreground">
              When set, these cookies will be used for ALL users instead of individual user cookies.
            </p>
          </div>
        </div>
        <Textarea
          value={globalCookies}
          onChange={(e) => setGlobalCookies(e.target.value)}
          className="font-mono text-xs min-h-[200px] border-[#1e1e1e] bg-[#0a0a0a] focus:border-accent"
          placeholder='[{"name":"...", "value":"..."}]'
        />
        <Button
          className="mt-4 gradient-btn border-0 font-semibold"
          onClick={saveGlobalCookies}
          disabled={globalCookiesLoading}
        >
          <Save className="h-4 w-4 mr-2" /> {globalCookiesLoading ? "Saving..." : "Save Global Cookies"}
        </Button>
      </div>
    </div>
  );
};

/* ─── User Row ─── */
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
  const [profileOpen, setProfileOpen] = useState(false);
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
    <tr className="hover:bg-[#1a1a1a] transition-colors" style={{ borderBottom: "1px solid #1e1e1e" }}>
      <td className="p-4 text-sm font-medium text-foreground">{user.name || "—"}</td>
      <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
      <td className="p-4">
        <Select
          value={plan}
          onValueChange={async (value) => {
            setPlan(value);
            const creditsMap: Record<string, number> = { Basic: 2000, Pro: 25000, Ultra: 45000 };
            const newCredits = creditsMap[value] || 2000;
            const { error } = await supabase
              .from("profiles")
              .update({ plan: value, credits_total: newCredits, credits_used: 0 })
              .eq("id", user.id);
            if (error) toast.error("Update failed");
            else {
              setCreditsTotal(String(newCredits));
              toast.success(`Plan set to ${value} — ${newCredits.toLocaleString()} credits`);
            }
          }}
        >
          <SelectTrigger className="h-8 w-28 text-xs bg-[#0a0a0a] border-[#1e1e1e] text-accent font-medium">
            <SelectValue placeholder="Select plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Basic">Basic — 2K</SelectItem>
            <SelectItem value="Pro">Pro — 25K</SelectItem>
            <SelectItem value="Ultra">Ultra — 45K</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Switch checked={user.subscription_active} onCheckedChange={() => toggleSubscription(user.id, user.subscription_active)} />
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
              user.subscription_active
                ? "bg-[#0d3320] text-[#34d399]"
                : "bg-[#331111] text-[#f87171]"
            }`}
          >
            {user.subscription_active ? "Active" : "Inactive"}
          </span>
        </div>
      </td>
      <td className="p-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={creditsTotal}
              onChange={(e) => setCreditsTotal(e.target.value)}
              className="h-7 w-20 text-xs bg-[#0a0a0a] border-[#1e1e1e]"
            />
            <button
              className="h-7 w-7 flex items-center justify-center rounded bg-[#1a1a3e] text-[#818cf8] hover:bg-[#252560] transition-colors"
              onClick={() => updateField(user.id, "credits_total", parseInt(creditsTotal) || 0)}
            >
              <Save className="h-3 w-3" />
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground block">Used: {user.credits_used ?? 0}</span>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className="h-6 w-16 text-[10px] bg-[#0a0a0a] border-[#1e1e1e]"
              placeholder="Daily"
            />
            <button
              className="h-6 w-6 flex items-center justify-center rounded bg-[#1a1a3e] text-[#818cf8] hover:bg-[#252560] transition-colors"
              onClick={() => updateField(user.id, "daily_credits_limit", parseInt(dailyLimit) || 0)}
            >
              <Save className="h-2.5 w-2.5" />
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground block">Daily: {user.credits_used_today ?? 0}/{user.daily_credits_limit ?? 100}</span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="h-7 text-xs bg-[#0a0a0a] border-[#1e1e1e]"
          />
          <button
            className="h-7 w-7 flex items-center justify-center rounded bg-[#0d3320] text-[#34d399] hover:bg-[#164e36] transition-colors"
            onClick={() => updateField(user.id, "expiry_date", expiry)}
          >
            <Save className="h-3 w-3" />
          </button>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* View Profile */}
          <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
            <DialogTrigger asChild>
              <button className="h-7 px-2.5 rounded text-[11px] font-medium bg-[#0d2818] text-[#34d399] hover:bg-[#164e36] transition-colors flex items-center gap-1">
                <Eye className="h-3 w-3" /> Profile
              </button>
            </DialogTrigger>
            <DialogContent className="border-[#1e1e1e] max-w-lg max-h-[80vh] overflow-y-auto" style={{ background: "#111111" }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <Eye className="h-4 w-4 text-accent" /> Profile — {user.name || user.email}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-2">
                <div>
                  <h4 className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">Basic Info</h4>
                  <div className="space-y-2">
                    <ProfileRow label="Full Name" value={user.name} />
                    <ProfileRow label="Email" value={user.email} />
                    <ProfileRow label="Mobile (WhatsApp)" value={(user as any).mobile_number} />
                    <ProfileRow label="Plan" value={user.plan} />
                    <ProfileRow label="Status" value={user.subscription_active ? "Active" : "Inactive"} isStatus statusActive={user.subscription_active} />
                  </div>
                </div>
                <div className="border-t pt-4" style={{ borderColor: "#1e1e1e" }}>
                  <h4 className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">Address</h4>
                  <div className="space-y-2">
                    <ProfileRow label="Street" value={(user as any).street_address} />
                    <ProfileRow label="City" value={(user as any).city} />
                    <ProfileRow label="State" value={(user as any).state} />
                    <ProfileRow label="PIN Code" value={(user as any).pin_code} />
                    <ProfileRow label="Country" value={(user as any).country} />
                  </div>
                </div>
                <div className="border-t pt-4" style={{ borderColor: "#1e1e1e" }}>
                  <h4 className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">Account</h4>
                  <div className="space-y-2">
                    <ProfileRow label="Credits" value={`${user.credits_used ?? 0} / ${user.credits_total ?? 0} used`} />
                    <ProfileRow label="Daily Limit" value={`${user.credits_used_today ?? 0} / ${user.daily_credits_limit ?? 0}`} />
                    <ProfileRow label="Expiry" value={user.expiry_date} />
                    <ProfileRow label="Registered" value={(user as any).created_at ? new Date((user as any).created_at).toLocaleDateString() : null} />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Set Credentials */}
          <Dialog open={credOpen} onOpenChange={setCredOpen}>
            <DialogTrigger asChild>
              <button className="h-7 px-2.5 rounded text-[11px] font-medium bg-[#1a1a3e] text-[#818cf8] hover:bg-[#252560] transition-colors flex items-center gap-1">
                <KeyRound className="h-3 w-3" /> Creds
              </button>
            </DialogTrigger>
            <DialogContent className="border-[#1e1e1e] max-w-lg" style={{ background: "#111111" }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <KeyRound className="h-4 w-4 text-accent" /> Credentials — {user.email}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Google Email</Label>
                  <Input value={googleEmail} onChange={(e) => setGoogleEmail(e.target.value)} className="mt-1 bg-[#0a0a0a] border-[#1e1e1e] focus:border-accent" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Google Password</Label>
                  <Input type="password" value={googlePassword} onChange={(e) => setGooglePassword(e.target.value)} className="mt-1 bg-[#0a0a0a] border-[#1e1e1e] focus:border-accent" />
                </div>
                <div>
                  <Label className="flex items-center gap-1 text-xs text-muted-foreground"><Cookie className="h-3 w-3" /> Cookies JSON</Label>
                  <Textarea
                    value={cookiesJson}
                    onChange={(e) => setCookiesJson(e.target.value)}
                    className="mt-1 bg-[#0a0a0a] border-[#1e1e1e] font-mono text-xs min-h-[120px] focus:border-accent"
                    placeholder='[{"name":"...", "value":"..."}]'
                  />
                </div>
                <Button className="w-full gradient-btn border-0 font-semibold" onClick={saveCreds}>
                  <Save className="h-4 w-4 mr-2" /> Save Credentials
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* View Devices */}
          <Dialog open={sessionsOpen} onOpenChange={(open) => {
            setSessionsOpen(open);
            if (open) loadSessions();
          }}>
            <DialogTrigger asChild>
              <button className="h-7 px-2.5 rounded text-[11px] font-medium bg-[#1a2332] text-[#38bdf8] hover:bg-[#1e3a52] transition-colors flex items-center gap-1">
                <Monitor className="h-3 w-3" /> {activeDevices}
              </button>
            </DialogTrigger>
            <DialogContent className="border-[#1e1e1e] max-w-2xl max-h-[80vh] overflow-y-auto" style={{ background: "#111111" }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <Monitor className="h-4 w-4 text-accent" /> Sessions — {user.email}
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
                      <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                        <th className="text-left text-[11px] font-medium text-muted-foreground py-2 px-3 uppercase tracking-wider">Device</th>
                        <th className="text-left text-[11px] font-medium text-muted-foreground py-2 px-3 uppercase tracking-wider">IP</th>
                        <th className="text-left text-[11px] font-medium text-muted-foreground py-2 px-3 uppercase tracking-wider">Login</th>
                        <th className="text-left text-[11px] font-medium text-muted-foreground py-2 px-3 uppercase tracking-wider">Last Active</th>
                        <th className="text-left text-[11px] font-medium text-muted-foreground py-2 px-3 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s) => (
                        <tr key={s.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{s.device_info}</span>
                              <span className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${
                                s.is_active
                                  ? "bg-[#0d3320] text-[#34d399]"
                                  : "bg-[#1e1e1e] text-muted-foreground"
                              }`}>
                                {s.is_active ? "Active" : "Revoked"}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">{s.ip_address || "—"}</td>
                          <td className="py-2 px-3 text-muted-foreground">{formatDate(s.login_time)}</td>
                          <td className="py-2 px-3 text-muted-foreground">{formatDate(s.last_active_time)}</td>
                          <td className="py-2 px-3">
                            {s.is_active && (
                              <button
                                className="h-6 px-2 rounded text-[10px] font-medium bg-[#331111] text-[#f87171] hover:bg-[#451a1a] transition-colors flex items-center gap-1"
                                onClick={() => revokeSession(s.id)}
                              >
                                <X className="h-2.5 w-2.5" /> Revoke
                              </button>
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

          {/* Activate / Deactivate */}
          <button
            className={`h-7 px-2.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              user.subscription_active
                ? "bg-[#332200] text-[#fb923c] hover:bg-[#4a3300]"
                : "bg-[#0d3320] text-[#34d399] hover:bg-[#164e36]"
            }`}
            onClick={() => toggleSubscription(user.id, user.subscription_active)}
          >
            {user.subscription_active ? "Deactivate" : "Activate"}
          </button>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="h-7 px-2.5 rounded text-[11px] font-medium bg-[#331111] text-[#f87171] hover:bg-[#451a1a] transition-colors flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-[#1e1e1e]" style={{ background: "#111111" }}>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Delete this user?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete their account and all data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-[#1e1e1e] border-[#2a2a2a] text-foreground hover:bg-[#2a2a2a]">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteUser(user.id)}
                  className="bg-[#7f1d1d] text-[#fca5a5] hover:bg-[#991b1b]"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
};

const ProfileRow = ({ label, value, isStatus, statusActive }: { label: string; value: string | null | undefined; isStatus?: boolean; statusActive?: boolean }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground text-xs">{label}</span>
    {isStatus ? (
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusActive ? "bg-[#0d3320] text-[#34d399]" : "bg-[#331111] text-[#f87171]"}`}>
        {value || "—"}
      </span>
    ) : (
      <span className="text-xs font-medium text-foreground">{value || "—"}</span>
    )}
  </div>
);

export default Admin;
