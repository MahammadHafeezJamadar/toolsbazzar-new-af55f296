import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Monitor, Smartphone, Laptop, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ADMIN_EMAIL = "hafeezjamadar295@gmail.com";

interface DeviceSession {
  id: string;
  email: string;
  device_type: string;
  browser: string;
  os: string;
  user_agent: string;
  created_at: string;
  last_seen: string;
}

type GroupedSessions = Record<string, DeviceSession[]>;

const AdminDevices = () => {
  const [grouped, setGrouped] = useState<GroupedSessions>({});
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        navigate("/dashboard");
        return;
      }
      setAuthorized(true);

      const { data } = await supabase
        .from("device_sessions" as any)
        .select("*")
        .order("created_at", { ascending: false });

      const sessions = (data || []) as unknown as DeviceSession[];
      const map: GroupedSessions = {};
      for (const s of sessions) {
        if (!map[s.email]) map[s.email] = [];
        map[s.email].push(s);
      }
      setGrouped(map);
      setLoading(false);
    })();
  }, [navigate]);

  if (!authorized) return null;

  const DeviceIcon = ({ type }: { type: string }) => {
    if (type === "mobile") return <Smartphone className="h-4 w-4 text-primary" />;
    if (type === "desktop") return <Laptop className="h-4 w-4 text-primary" />;
    return <Monitor className="h-4 w-4 text-muted-foreground" />;
  };

  const fmt = (d: string) => new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-6xl mx-auto font-body">
      <button onClick={() => navigate("/admin")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Admin
      </button>

      <h1 className="text-2xl font-display font-bold gradient-text mb-6">Device Sessions</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-muted-foreground">No device sessions found.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([email, sessions]) => (
            <div key={email} className="glass rounded-xl p-5 border border-border/30">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-sm md:text-base truncate">{email}</h2>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                  {sessions.length} device{sessions.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-left border-b border-border/30">
                      <th className="pb-2 pr-4">Device</th>
                      <th className="pb-2 pr-4">Browser</th>
                      <th className="pb-2 pr-4">OS</th>
                      <th className="pb-2 pr-4">First Login</th>
                      <th className="pb-2">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className="border-b border-border/10 last:border-0">
                        <td className="py-2 pr-4 flex items-center gap-1.5">
                          <DeviceIcon type={s.device_type} />
                          <span className="capitalize">{s.device_type || "—"}</span>
                        </td>
                        <td className="py-2 pr-4">{s.browser || "—"}</td>
                        <td className="py-2 pr-4">{s.os || "—"}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{fmt(s.created_at)}</td>
                        <td className="py-2 text-muted-foreground">{fmt(s.last_seen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search User Login Details Section */}
      <SearchUserSessions DeviceIcon={DeviceIcon} fmt={fmt} />
    </div>
  );
};

interface UserSession {
  id: string;
  device_type: string;
  device_info: string;
  login_time: string;
  last_active_time: string;
  login_count: number;
  device_brand: string;
}

const SearchUserSessions = ({ DeviceIcon, fmt }: { DeviceIcon: React.FC<{ type: string }>; fmt: (d: string) => string }) => {
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<UserSession[]>([]);
  const [totalLogins, setTotalLogins] = useState(0);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearched(false);

    const { data } = await supabase
      .from("user_sessions")
      .select("id, device_type, device_info, login_time, last_active_time, login_count, device_brand")
      .eq("email", searchEmail.trim())
      .eq("login_source", "website")
      .order("last_active_time", { ascending: false });

    const sessions = data || [];
    setResults(sessions);
    setTotalLogins(sessions.reduce((sum, s) => sum + (s.login_count || 1), 0));
    setSearched(true);
    setSearching(false);
  };

  const parseBrowser = (info: string) => {
    const parts = info.split(" / ");
    return { browser: parts[0] || "—", os: parts[1] || "—" };
  };

  return (
    <div className="mt-12">
      <h2 className="text-xl font-display font-bold gradient-text mb-4">🔍 Search User Login Details</h2>
      <div className="glass rounded-xl p-5 border border-border/30">
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter user email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="bg-secondary/50 border-border/50"
          />
          <Button onClick={handleSearch} disabled={searching} className="gradient-btn border-0 text-primary-foreground font-semibold shrink-0">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1" /> Search</>}
          </Button>
        </div>

        {searched && results.length === 0 && (
          <p className="text-muted-foreground text-sm">No website sessions found for this email</p>
        )}

        {searched && results.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-muted-foreground">Email: <span className="text-foreground font-semibold">{searchEmail.trim()}</span></span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                {results.length} device{results.length !== 1 ? "s" : ""} · {totalLogins} total logins
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-left border-b border-border/30">
                    <th className="pb-2 pr-4">Device</th>
                    <th className="pb-2 pr-4">Browser</th>
                    <th className="pb-2 pr-4">OS</th>
                    <th className="pb-2 pr-4">First Login</th>
                    <th className="pb-2">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((s) => {
                    const { browser, os } = parseBrowser(s.device_info);
                    return (
                      <tr key={s.id} className="border-b border-border/10 last:border-0">
                        <td className="py-2 pr-4 flex items-center gap-1.5">
                          <DeviceIcon type={s.device_type} />
                          <span className="capitalize">{s.device_type || "—"}</span>
                        </td>
                        <td className="py-2 pr-4">{browser}</td>
                        <td className="py-2 pr-4">{os}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{fmt(s.login_time)}</td>
                        <td className="py-2 text-muted-foreground">{fmt(s.last_active_time)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDevices;
