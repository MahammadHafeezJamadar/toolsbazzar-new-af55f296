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
    </div>
  );
};

export default AdminDevices;
