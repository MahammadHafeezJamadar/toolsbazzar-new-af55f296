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
  Phone, MapPin, Calendar, Clock, Search, UserCheck, Megaphone, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  referral_code: string | null;
  referred_by: string | null;
}

interface DeviceSession {
  id: string;
  device_id: string;
  device_info: string;
  device_name: string;
  device_type: string;
  login_count: number;
  ip_address: string | null;
  login_time: string;
  last_active_time: string;
  is_active: boolean;
}

type AdminTab = "dashboard" | "users" | "user-details" | "announcements" | "settings";

const sidebarItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "user-details", label: "User Details", icon: UserCheck },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "settings", label: "Settings", icon: Settings },
];

const Admin = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [referralCounts, setReferralCounts] = useState<Record<string, number>>({});
  const [globalCookiesOpen, setGlobalCookiesOpen] = useState(false);
  const [globalCookies, setGlobalCookies] = useState("");
  const [globalCookiesLoading, setGlobalCookiesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [liveUsersToday, setLiveUsersToday] = useState(0);
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
      await loadLiveUsers();
      await loadReferralCounts();
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
      .select("id, email, name, plan, subscription_active, expiry_date, google_email, google_password, cookies_json, credits_total, credits_used, daily_credits_limit, credits_used_today, last_reset_date, created_at, mobile_number, street_address, city, state, pin_code, country, referral_code, referred_by")
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

  const loadLiveUsers = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("user_sessions")
      .select("user_id")
      .gte("last_active_time", today.toISOString());
    if (data) {
      const uniqueUsers = new Set(data.map((s: any) => s.user_id));
      setLiveUsersToday(uniqueUsers.size);
    }
  };

  const loadReferralCounts = async () => {
    const { data } = await supabase.from("referrals").select("referrer_id");
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((r: any) => {
        counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1;
      });
      setReferralCounts(counts);
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
    <div className="min-h-screen pb-14 md:pb-0" style={{ background: "#0a0a0a" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen flex-col border-r fixed left-0 top-0 z-40" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold text-foreground">ToolsBazzar</span>
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

      {/* Mobile Top Bar */}
      <nav className="sticky top-0 z-50 border-b md:hidden" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-lg font-bold text-foreground">Admin</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard" className="text-muted-foreground"><Eye className="h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden flex items-center justify-around h-14" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 min-w-[60px] ${
              activeTab === item.id ? "text-accent" : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="md:ml-64 overflow-y-auto">
        <div className="p-4 md:p-8">
          {activeTab === "dashboard" && (
            <DashboardTab
              totalUsers={totalUsers}
              activeSubscriptions={activeSubscriptions}
              totalCreditsUsed={totalCreditsUsed}
              monthlyRevenue={monthlyRevenue}
              liveUsersToday={liveUsersToday}
            />
          )}
          {activeTab === "users" && (
            <UsersTab
              users={users}
              sessionCounts={sessionCounts}
              referralCounts={referralCounts}
              toggleSubscription={toggleSubscription}
              updateField={updateField}
              deleteUser={deleteUser}
              loadSessionCounts={loadSessionCounts}
            />
          )}
          {activeTab === "user-details" && (
            <UserDetailsTab users={users} referralCounts={referralCounts} />
          )}
          {activeTab === "announcements" && <AnnouncementsTab />}
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
  liveUsersToday,
}: {
  totalUsers: number;
  activeSubscriptions: number;
  totalCreditsUsed: number;
  monthlyRevenue: number;
  liveUsersToday: number;
}) => (
  <div>
    <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <StatCard icon={Users} label="Total Users" value={String(totalUsers)} />
      <StatCard icon={CreditCard} label="Active Subscriptions" value={String(activeSubscriptions)} />
      <StatCard icon={TrendingUp} label="Revenue (est.)" value={`₹${monthlyRevenue.toLocaleString()}`} />
      <StatCard icon={Zap} label="Total Credits Used" value={totalCreditsUsed.toLocaleString()} />
      <StatCard icon={Clock} label="Active Today" value={String(liveUsersToday)} trend="live" />
    </div>
  </div>
);

/* ─── Users Tab ─── */
const UsersTab = ({
  users,
  sessionCounts,
  referralCounts,
  toggleSubscription,
  updateField,
  deleteUser,
  loadSessionCounts,
}: {
  users: UserProfile[];
  sessionCounts: Record<string, number>;
  referralCounts: Record<string, number>;
  toggleSubscription: (id: string, current: boolean) => void;
  updateField: (id: string, field: string, value: any) => void;
  deleteUser: (id: string) => Promise<void>;
  loadSessionCounts: () => void;
}) => {
  const [search, setSearch] = useState("");

  const isProfileComplete = (u: UserProfile) => !!(u.name && u.mobile_number && u.city);
  const profileCompleteCount = users.filter(isProfileComplete).length;
  const profileIncompleteCount = users.length - profileCompleteCount;

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q) ||
      (u.mobile_number || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-4">User Management</h1>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg p-3 border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
          <div className="text-lg font-bold text-foreground">{users.length}</div>
          <div className="text-[10px] text-muted-foreground">Total Users</div>
        </div>
        <div className="rounded-lg p-3 border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
          <div className="text-lg font-bold text-foreground">{users.filter(u => u.subscription_active).length}</div>
          <div className="text-[10px] text-muted-foreground">Active Subs</div>
        </div>
        <div className="rounded-lg p-3 border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
          <div className="text-lg font-bold text-[#34d399]">{profileCompleteCount}</div>
          <div className="text-[10px] text-muted-foreground">Profile Complete</div>
        </div>
        <div className="rounded-lg p-3 border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
          <div className="text-lg font-bold text-[#fbbf24]">{profileIncompleteCount}</div>
          <div className="text-[10px] text-muted-foreground">Incomplete</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search by name, email, or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 bg-[#0a0a0a] border-[#1e1e1e] focus:border-accent text-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((u) => (
          <UserCard
            key={u.id}
            user={u}
            toggleSubscription={toggleSubscription}
            updateField={updateField}
            activeDevices={sessionCounts[u.id] || 0}
            onSessionRevoked={loadSessionCounts}
            onDeleteUser={deleteUser}
            referralCount={referralCounts[u.id] || 0}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8 text-sm">No users found</div>
        )}
      </div>
    </div>
  );
};

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

/* ─── User Card ─── */
const planColors: Record<string, { bg: string; text: string }> = {
  Basic: { bg: "#1a2332", text: "#38bdf8" },
  Pro: { bg: "#1a1a3e", text: "#818cf8" },
  Ultra: { bg: "#2d1a3e", text: "#c084fc" },
};

const UserCard = ({
  user,
  toggleSubscription,
  updateField,
  activeDevices,
  onSessionRevoked,
  onDeleteUser,
  referralCount,
}: {
  user: UserProfile;
  toggleSubscription: (id: string, current: boolean) => void;
  updateField: (id: string, field: string, value: any) => void;
  activeDevices: number;
  onSessionRevoked: () => void;
  onDeleteUser: (id: string) => Promise<void>;
  referralCount: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [plan, setPlan] = useState(user.plan);
  const [creditsTotal, setCreditsTotal] = useState(String(user.credits_total ?? 1000));
  const [dailyLimit, setDailyLimit] = useState(String(user.daily_credits_limit ?? 100));
  const [expiry, setExpiry] = useState(user.expiry_date || "");
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

  const initials = (user.name || user.email || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const pc = planColors[user.plan] || planColors.Basic;

  const loadSessions = async () => {
    setSessionsLoading(true);
    const { data, error } = await supabase
      .from("user_sessions")
      .select("id, device_id, device_info, device_name, device_type, login_count, ip_address, login_time, last_active_time, is_active")
      .eq("user_id", user.id)
      .order("last_active_time", { ascending: false });
    if (error) toast.error("Failed to load sessions");
    else setSessions(data || []);
    setSessionsLoading(false);
  };

  const revokeSession = async (sessionId: string) => {
    const { error } = await supabase.from("user_sessions").update({ is_active: false }).eq("id", sessionId);
    if (error) toast.error("Failed to revoke session");
    else {
      setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, is_active: false } : s));
      onSessionRevoked();
      toast.success("Session revoked");
    }
  };

  const saveCreds = async () => {
    let parsedCookies = null;
    if (cookiesJson.trim()) {
      try { parsedCookies = JSON.parse(cookiesJson); }
      catch { toast.error("Invalid JSON for cookies"); return; }
    }
    const { error } = await supabase.from("profiles").update({
      google_email: googleEmail || null, google_password: googlePassword || null, cookies_json: parsedCookies,
    }).eq("id", user.id);
    if (error) toast.error("Failed to save credentials");
    else { toast.success("Credentials saved"); setCredOpen(false); }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="rounded-xl border transition-all duration-300 cursor-pointer"
      style={{
        background: "#111111",
        borderColor: expanded ? "hsla(174, 72%, 46%, 0.3)" : "#1e1e1e",
        boxShadow: expanded ? "0 0 25px hsla(174, 72%, 46%, 0.08)" : "none",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, hsla(174, 72%, 46%, 0.2), hsla(150, 60%, 50%, 0.2))",
              color: "hsl(174 72% 56%)",
              border: "1px solid hsla(174, 72%, 46%, 0.3)",
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm text-foreground truncate">{user.name || "—"}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
            </div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            {user.mobile_number && (
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3" /> {user.mobile_number}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-3">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: pc.bg, color: pc.text }}>
            {user.plan || "—"}
          </span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${user.subscription_active ? "bg-[#0d3320] text-[#34d399]" : "bg-[#331111] text-[#f87171]"}`}>
            {user.subscription_active ? "Active" : "Inactive"}
          </span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            !!(user.name && user.mobile_number && user.city) ? "bg-[#0d3320] text-[#34d399]" : "bg-[#332200] text-[#fbbf24]"
          }`}>
            {!!(user.name && user.mobile_number && user.city) ? "✅ Profile" : "❌ Incomplete"}
          </span>
          {referralCount > 0 && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#1a1a3e] text-[#818cf8]">
              {referralCount} referral{referralCount > 1 ? "s" : ""}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground ml-auto flex items-center gap-1">
            <Monitor className="h-3 w-3" /> {activeDevices}
          </span>
        </div>

        {/* Credit Usage Progress */}
        {(() => {
          const used = user.credits_used ?? 0;
          const total = user.credits_total ?? 1;
          const pct = Math.min((used / total) * 100, 100);
          const barColor = pct < 50 ? "#34d399" : pct < 80 ? "#fbbf24" : "#f87171";
          return (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Credits Used</span>
                <span className="text-[10px] font-medium text-foreground">
                  {used.toLocaleString()} / {(user.credits_total ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1e1e1e" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: barColor }}
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pb-5 border-t" style={{ borderColor: "#1e1e1e" }}>
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
                <InfoItem label="Credits" value={`${user.credits_used ?? 0} / ${user.credits_total ?? 0}`} />
                <InfoItem label="Daily" value={`${user.credits_used_today ?? 0} / ${user.daily_credits_limit ?? 0}`} />
                <InfoItem label="Expiry" value={user.expiry_date || "—"} />
                <InfoItem label="Devices" value={`${activeDevices} connected`} />
                <InfoItem label="Location" value={[user.city, user.state, user.country].filter(Boolean).join(", ") || "—"} />
                <InfoItem label="Registered" value={user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"} />
                <InfoItem label="Referrals" value={`${referralCount} referred`} />
                <InfoItem label="Referred By" value={user.referred_by || "—"} />
              </div>

              {/* Action: Set Plan */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Select value={plan} onValueChange={async (value) => {
                    setPlan(value);
                    const { error } = await supabase.from("profiles").update({ plan: value, credits_total: 0, credits_used: 0, daily_credits_limit: 0 }).eq("id", user.id);
                    if (error) toast.error("Update failed");
                    else { setCreditsTotal("0"); setDailyLimit("0"); toast.success(`Plan → ${value}`); }
                  }}>
                    <SelectTrigger className="h-8 flex-1 text-xs bg-[#0a0a0a] border-[#1e1e1e]">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic — 2K</SelectItem>
                      <SelectItem value="Pro">Pro — 25K</SelectItem>
                      <SelectItem value="Ultra">Ultra — 45K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Credits + Daily Limit */}
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 flex-1">
                    <Input type="number" value={creditsTotal} onChange={(e) => setCreditsTotal(e.target.value)} className="h-8 text-xs bg-[#0a0a0a] border-[#1e1e1e]" placeholder="Credits" />
                    <button className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded bg-[#1a1a3e] text-[#818cf8] hover:bg-[#252560] transition-colors" onClick={() => updateField(user.id, "credits_total", parseInt(creditsTotal) || 0)}>
                      <Save className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <Input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} className="h-8 text-xs bg-[#0a0a0a] border-[#1e1e1e]" placeholder="Daily" />
                    <button className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded bg-[#332200] text-[#fb923c] hover:bg-[#4a3300] transition-colors" onClick={() => updateField(user.id, "daily_credits_limit", parseInt(dailyLimit) || 0)}>
                      <Save className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Expiry */}
                <div className="flex items-center gap-1">
                  <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="h-8 flex-1 text-xs bg-[#0a0a0a] border-[#1e1e1e]" />
                  <button className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded bg-[#0d3320] text-[#34d399] hover:bg-[#164e36] transition-colors" onClick={() => updateField(user.id, "expiry_date", expiry)}>
                    <Save className="h-3 w-3" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {/* Set Credentials */}
                  <Dialog open={credOpen} onOpenChange={setCredOpen}>
                    <DialogTrigger asChild>
                      <button className="h-7 px-2.5 rounded text-[11px] font-medium bg-[#0d2332] text-[#22d3ee] hover:bg-[#164050] transition-colors flex items-center gap-1">
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
                          <Textarea value={cookiesJson} onChange={(e) => setCookiesJson(e.target.value)} className="mt-1 bg-[#0a0a0a] border-[#1e1e1e] font-mono text-xs min-h-[120px] focus:border-accent" placeholder='[{"name":"...", "value":"..."}]' />
                        </div>
                        <Button className="w-full gradient-btn border-0 font-semibold" onClick={saveCreds}>
                          <Save className="h-4 w-4 mr-2" /> Save Credentials
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* View Devices */}
                  <Dialog open={sessionsOpen} onOpenChange={(open) => { setSessionsOpen(open); if (open) loadSessions(); }}>
                    <DialogTrigger asChild>
                      <button className="h-7 px-2.5 rounded text-[11px] font-medium bg-[#1e1e1e] text-[#999] hover:bg-[#2a2a2a] transition-colors flex items-center gap-1">
                        <Monitor className="h-3 w-3" /> Devices
                      </button>
                    </DialogTrigger>
                    <DialogContent className="border-[#1e1e1e] max-w-3xl max-h-[80vh] overflow-y-auto" style={{ background: "#111111" }}>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                          <Monitor className="h-4 w-4 text-accent" /> Device Sessions — {user.email}
                        </DialogTitle>
                      </DialogHeader>
                      <DeviceSessionsSection sessions={sessions} sessionsLoading={sessionsLoading} userPlan={user.plan} revokeSession={revokeSession} />
                    </DialogContent>
                  </Dialog>

                  {/* View Profile */}
                  <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                    <DialogTrigger asChild>
                      <button className="h-7 px-2.5 rounded text-[11px] font-medium bg-[#1e1e1e] text-foreground hover:bg-[#2a2a2a] transition-colors flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Profile
                      </button>
                    </DialogTrigger>
                    <DialogContent className="border-[#1e1e1e] max-w-lg max-h-[80vh] overflow-y-auto" style={{ background: "#111111" }}>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                          <Eye className="h-4 w-4 text-accent" /> {user.name || user.email}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <Section title="Basic Info">
                          <InfoRow label="Name" value={user.name} />
                          <InfoRow label="Email" value={user.email} />
                          <InfoRow label="WhatsApp" value={user.mobile_number} />
                          <InfoRow label="Plan" value={user.plan} />
                          <InfoRow label="Status" value={user.subscription_active ? "Active" : "Inactive"} isStatus active={user.subscription_active} />
                        </Section>
                        <Section title="Address">
                          <InfoRow label="Street" value={user.street_address} />
                          <InfoRow label="City" value={user.city} />
                          <InfoRow label="State" value={user.state} />
                          <InfoRow label="PIN" value={user.pin_code} />
                          <InfoRow label="Country" value={user.country} />
                        </Section>
                        <Section title="Account">
                          <InfoRow label="Credits" value={`${user.credits_used ?? 0} / ${user.credits_total ?? 0}`} />
                          <InfoRow label="Daily" value={`${user.credits_used_today ?? 0} / ${user.daily_credits_limit ?? 0}`} />
                          <InfoRow label="Expiry" value={user.expiry_date} />
                          <InfoRow label="Joined" value={user.created_at ? new Date(user.created_at).toLocaleDateString() : null} />
                        </Section>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Activate/Deactivate */}
                  <button
                    className={`h-7 px-2.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                      user.subscription_active ? "bg-[#331111] text-[#f87171] hover:bg-[#451a1a]" : "bg-[#0d3320] text-[#34d399] hover:bg-[#164e36]"
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
                        <AlertDialogDescription>Permanently delete account and all data. Cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-[#1e1e1e] border-[#2a2a2a] text-foreground hover:bg-[#2a2a2a]">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteUser(user.id)} className="bg-[#7f1d1d] text-[#fca5a5] hover:bg-[#991b1b]">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Device Sessions Section (shared) ─── */
const PLAN_DEVICE_LIMITS: Record<string, number> = { Basic: 1, Pro: 2, Ultra: 2 };

const getDeviceNick = (sessions: DeviceSession[]): Map<string, string> => {
  const sorted = [...sessions].sort((a, b) => new Date(a.login_time).getTime() - new Date(b.login_time).getTime());
  const nickMap = new Map<string, string>();
  const counters = { mobile: 0, laptop: 0, tablet: 0 };
  sorted.forEach((s) => {
    const info = (s.device_info || "").toLowerCase();
    const isMobile = /android|ios|iphone|ipad/i.test(info) || s.device_type === "Mobile" || s.device_type === "Tablet";
    const isTablet = /ipad|tablet/i.test(info) || s.device_type === "Tablet";
    let emoji: string, label: string;
    if (isTablet) { counters.tablet++; emoji = "📱"; label = `Tablet #${counters.tablet}`; }
    else if (isMobile) { counters.mobile++; emoji = "📱"; label = `Mobile #${counters.mobile}`; }
    else { counters.laptop++; emoji = "💻"; label = `Laptop #${counters.laptop}`; }
    nickMap.set(s.id, `${emoji} ${label}`);
  });
  return nickMap;
};

const formatSessionDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = d.getDate();
  const mon = d.toLocaleString("en", { month: "short" });
  const time = d.toLocaleString("en", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${day} ${mon}, ${time}`;
};

const DeviceSessionsSection = ({
  sessions,
  sessionsLoading,
  userPlan,
  revokeSession,
}: {
  sessions: DeviceSession[];
  sessionsLoading: boolean;
  userPlan: string;
  revokeSession?: (id: string) => void;
}) => {
  if (sessionsLoading) return <div className="text-center text-muted-foreground py-8">Loading...</div>;
  if (sessions.length === 0) return <div className="text-center text-muted-foreground py-8">No devices found</div>;

  const nickMap = getDeviceNick(sessions);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const deviceLimit = PLAN_DEVICE_LIMITS[userPlan] ?? 1;
  const activeThisWeek = sessions.filter(s => new Date(s.last_active_time) >= sevenDaysAgo).length;

  // Sort by login_time ascending so we can identify "over-limit" devices
  const sortedByFirst = [...sessions].sort((a, b) => new Date(a.login_time).getTime() - new Date(b.login_time).getTime());
  const overLimitIds = new Set(sortedByFirst.slice(deviceLimit).map(s => s.id));

  return (
    <div>
      {/* Summary line */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-3 px-1">
        <span>{sessions.length} device{sessions.length !== 1 ? "s" : ""} registered</span>
        <span>·</span>
        <span>{activeThisWeek} active this week</span>
        <span>·</span>
        <span>Plan allows <span className="font-semibold text-foreground">{deviceLimit}</span> device{deviceLimit !== 1 ? "s" : ""}</span>
        {sessions.length > deviceLimit && (
          <>
            <span>·</span>
            <span className="text-[#f87171] font-medium flex items-center gap-0.5"><AlertTriangle className="h-3 w-3" /> {sessions.length - deviceLimit} over limit</span>
          </>
        )}
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b" style={{ borderColor: "#1e1e1e" }}>
              <th className="px-3 py-2">Device ID</th>
              <th className="px-3 py-2">Browser / OS</th>
              <th className="px-3 py-2">Device Nick</th>
              <th className="px-3 py-2">First Login</th>
              <th className="px-3 py-2">Last Login</th>
              <th className="px-3 py-2 text-center">Count</th>
              <th className="px-3 py-2 text-center">Status</th>
              {revokeSession && <th className="px-3 py-2 text-right">Action</th>}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const isOverLimit = overLimitIds.has(s.id);
              const isActiveRecently = new Date(s.last_active_time) >= sevenDaysAgo;
              const isNew = new Date(s.login_time) >= twentyFourHoursAgo;
              const nick = nickMap.get(s.id) || "Unknown";
              const shortId = `dev_${s.device_id.slice(0, 6)}`;

              return (
                <tr
                  key={s.id}
                  className="border-b transition-colors"
                  style={{
                    borderColor: "#1a1a1a",
                    background: isOverLimit ? "rgba(239, 68, 68, 0.08)" : "transparent",
                  }}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {isOverLimit && <AlertTriangle className="h-3 w-3 text-[#f87171] flex-shrink-0" />}
                      <code className="text-[11px] text-muted-foreground font-mono">{shortId}</code>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-foreground">{s.device_info || "—"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-foreground">{nick}</span>
                      {isNew && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#332200] text-[#fbbf24] font-medium whitespace-nowrap">🆕 NEW</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">{formatSessionDate(s.login_time)}</td>
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">{formatSessionDate(s.last_active_time)}</td>
                  <td className="px-3 py-2.5 text-xs font-bold text-foreground text-center">{s.login_count ?? 1}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isActiveRecently ? "bg-[#0d3320] text-[#34d399]" : "bg-[#1e1e1e] text-muted-foreground"
                    }`}>
                      {isActiveRecently ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {revokeSession && (
                    <td className="px-3 py-2.5 text-right">
                      {s.is_active ? (
                        <button className="h-6 px-2 rounded text-[10px] font-medium bg-[#331111] text-[#f87171] hover:bg-[#451a1a] transition-colors" onClick={() => revokeSession(s.id)}>
                          Revoke
                        </button>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1e1e1e] text-muted-foreground">Revoked</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─── User Details Tab ─── */
const UserDetailsTab = ({
  users,
  referralCounts,
}: {
  users: UserProfile[];
  referralCounts: Record<string, number>;
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "complete" | "incomplete">("all");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [detailSessions, setDetailSessions] = useState<DeviceSession[]>([]);
  const [detailSessionsLoading, setDetailSessionsLoading] = useState(false);

  const loadDetailSessions = async (userId: string) => {
    setDetailSessionsLoading(true);
    const { data } = await supabase
      .from("user_sessions")
      .select("id, device_id, device_info, device_name, device_type, login_count, ip_address, login_time, last_active_time, is_active")
      .eq("user_id", userId)
      .order("last_active_time", { ascending: false });
    setDetailSessions(data || []);
    setDetailSessionsLoading(false);
  };

  const isComplete = (u: UserProfile) => !!(u.name && u.mobile_number && u.city);
  const completeCount = users.filter(isComplete).length;
  const incompleteCount = users.length - completeCount;

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || u.email.toLowerCase().includes(q) || (u.name || "").toLowerCase().includes(q) || (u.mobile_number || "").toLowerCase().includes(q);
    const matchesFilter = filter === "all" || (filter === "complete" && isComplete(u)) || (filter === "incomplete" && !isComplete(u));
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-4">User Details</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg p-3 border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
          <div className="text-lg font-bold text-foreground">{users.length}</div>
          <div className="text-[10px] text-muted-foreground">Total Users</div>
        </div>
        <div className="rounded-lg p-3 border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
          <div className="text-lg font-bold text-[#34d399]">{completeCount}</div>
          <div className="text-[10px] text-muted-foreground">Complete</div>
        </div>
        <div className="rounded-lg p-3 border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
          <div className="text-lg font-bold text-[#fbbf24]">{incompleteCount}</div>
          <div className="text-[10px] text-muted-foreground">Incomplete</div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 bg-[#0a0a0a] border-[#1e1e1e] focus:border-accent text-sm"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "complete", "incomplete"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? "bg-accent/10 text-accent border border-accent/30" : "bg-[#111] border border-[#1e1e1e] text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f === "complete" ? "✅ Complete" : "❌ Incomplete"}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((u) => {
          const complete = isComplete(u);
          const initials = (u.name || u.email || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
          const pc = planColors[u.plan] || planColors.Basic;
          return (
            <div
              key={u.id}
              onClick={() => { setSelectedUser(u); loadDetailSessions(u.id); }}
              className="rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:border-accent/30"
              style={{ background: "#111111", borderColor: "#1e1e1e" }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, hsla(174, 72%, 46%, 0.2), hsla(150, 60%, 50%, 0.2))",
                    color: "hsl(174 72% 56%)",
                    border: "1px solid hsla(174, 72%, 46%, 0.3)",
                  }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {u.name || <span className="text-[#f87171]">Not filled</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                  <div className="text-[11px] mt-0.5">
                    {u.mobile_number ? (
                      <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{u.mobile_number}</span>
                    ) : (
                      <span className="text-[#f87171]">Mobile not filled</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: pc.bg, color: pc.text }}>
                  {u.plan || "—"}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${u.subscription_active ? "bg-[#0d3320] text-[#34d399]" : "bg-[#331111] text-[#f87171]"}`}>
                  {u.subscription_active ? "Active" : "Inactive"}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${complete ? "bg-[#0d3320] text-[#34d399]" : "bg-[#331111] text-[#f87171]"}`}>
                  {complete ? "✅" : "❌"}
                </span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12 text-sm">No users found</div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) { setSelectedUser(null); setDetailSessions([]); } }}>
        <DialogContent className="border-[#1e1e1e] max-w-3xl max-h-[85vh] overflow-y-auto" style={{ background: "#111111" }}>
          {selectedUser && (() => {
            const u = selectedUser;
            const initials = (u.name || u.email || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-foreground">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        background: "linear-gradient(135deg, hsla(174, 72%, 46%, 0.2), hsla(150, 60%, 50%, 0.2))",
                        color: "hsl(174 72% 56%)",
                        border: "1px solid hsla(174, 72%, 46%, 0.3)",
                      }}
                    >
                      {initials}
                    </div>
                    {u.name || u.email}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <Section title="Personal Details">
                    <InfoRow label="Full Name" value={u.name} />
                    <InfoRow label="Email" value={u.email} />
                    <InfoRow label="WhatsApp" value={u.mobile_number} />
                    <InfoRow label="Street Address" value={u.street_address} />
                    <InfoRow label="City" value={u.city} />
                    <InfoRow label="State" value={u.state} />
                    <InfoRow label="PIN Code" value={u.pin_code} />
                    <InfoRow label="Country" value={u.country} />
                  </Section>
                  <Section title="Account Details">
                    <InfoRow label="Plan" value={u.plan} />
                    <InfoRow label="Status" value={u.subscription_active ? "Active" : "Inactive"} isStatus active={u.subscription_active} />
                    <InfoRow label="Credits" value={`${u.credits_used ?? 0} / ${u.credits_total ?? 0}`} />
                    <InfoRow label="Daily Limit" value={String(u.daily_credits_limit ?? 0)} />
                    <InfoRow label="Expiry" value={u.expiry_date} />
                    <InfoRow label="Registered" value={u.created_at ? new Date(u.created_at).toLocaleDateString() : null} />
                  </Section>
                  <Section title="Referral Details">
                    <InfoRow label="Referral Code" value={u.referral_code} />
                    <InfoRow label="Total Referrals" value={String(referralCounts[u.id] || 0)} />
                    <InfoRow label="Referred By" value={u.referred_by || "None"} />
                  </Section>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Announcements Tab ─── */
const AnnouncementsTab = () => {
  const [message, setMessage] = useState("");
  const [announcements, setAnnouncements] = useState<{ id: string; message: string; is_active: boolean; created_at: string }[]>([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
  };

  const publish = async () => {
    if (!message.trim()) { toast.error("Enter a message"); return; }
    setPublishing(true);
    // Deactivate all existing
    await supabase.from("announcements").update({ is_active: false } as any).eq("is_active", true);
    const { error } = await supabase.from("announcements").insert({ message: message.trim(), is_active: true } as any);
    setPublishing(false);
    if (error) toast.error("Failed to publish");
    else { toast.success("Announcement published!"); setMessage(""); loadAnnouncements(); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    if (!current) {
      // Deactivate all others first
      await supabase.from("announcements").update({ is_active: false } as any).eq("is_active", true);
    }
    await supabase.from("announcements").update({ is_active: !current } as any).eq("id", id);
    loadAnnouncements();
    toast.success("Updated");
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    loadAnnouncements();
    toast.success("Deleted");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Announcements</h1>

      {/* New Announcement */}
      <div className="rounded-xl border p-6 max-w-2xl mb-6" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">New Announcement</h3>
            <p className="text-xs text-muted-foreground">This will be shown as a banner on all user dashboards</p>
          </div>
        </div>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[100px] border-[#1e1e1e] bg-[#0a0a0a] focus:border-accent text-sm"
          placeholder="Type your announcement message..."
        />
        <Button
          className="mt-4 gradient-btn border-0 font-semibold"
          onClick={publish}
          disabled={publishing}
        >
          <Megaphone className="h-4 w-4 mr-2" /> {publishing ? "Publishing..." : "Publish Announcement"}
        </Button>
      </div>

      {/* Past Announcements */}
      <div className="max-w-2xl space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">History</h3>
        {announcements.map((a) => (
          <div key={a.id} className="rounded-xl border p-4 flex items-start justify-between gap-3" style={{ background: "#111111", borderColor: a.is_active ? "hsla(174, 72%, 46%, 0.3)" : "#1e1e1e" }}>
            <div className="flex-1">
              <p className="text-sm text-foreground">{a.message}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${a.is_active ? "bg-[#0d3320] text-[#34d399]" : "bg-[#1e1e1e] text-muted-foreground"}`}>
                  {a.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleActive(a.id, a.is_active)}
                className={`h-7 px-2.5 rounded text-[11px] font-medium transition-colors ${a.is_active ? "bg-[#332200] text-[#fbbf24] hover:bg-[#4a3300]" : "bg-[#0d3320] text-[#34d399] hover:bg-[#164e36]"}`}
              >
                {a.is_active ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => deleteAnnouncement(a.id)}
                className="h-7 px-2.5 rounded text-[11px] font-medium bg-[#331111] text-[#f87171] hover:bg-[#451a1a] transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No announcements yet</p>
        )}
      </div>
    </div>
  );
};

/* ─── Small helpers ─── */
const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg p-2.5" style={{ background: "#0a0a0a" }}>
    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    <div className="text-xs font-medium text-foreground mt-0.5 truncate">{value}</div>
  </div>
);

const InfoRow = ({ label, value, isStatus, active }: { label: string; value: string | null | undefined; isStatus?: boolean; active?: boolean }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    {isStatus ? (
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${active ? "bg-[#0d3320] text-[#34d399]" : "bg-[#331111] text-[#f87171]"}`}>{value || "—"}</span>
    ) : (
      <span className="text-xs font-medium text-foreground">{value || "—"}</span>
    )}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border-t pt-3" style={{ borderColor: "#1e1e1e" }}>
    <h4 className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-2">{title}</h4>
    <div className="space-y-1">{children}</div>
  </div>
);

export default Admin;
