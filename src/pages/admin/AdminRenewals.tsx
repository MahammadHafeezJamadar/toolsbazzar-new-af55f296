import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertTriangle,
  Clock,
  CalendarX,
  CalendarCheck,
  MessageCircle,
  Send,
  Power,
  Plus,
  Search,
} from "lucide-react";

interface RenewalUser {
  id: string;
  name: string | null;
  email: string;
  plan: string | null;
  expiry_date: string | null;
  plan_start_date: string | null;
  subscription_active: boolean | null;
  reminder_sent: boolean | null;
  mobile_number: string | null;
}

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #111, #0d0d0d)",
  borderColor: "#1e1e1e",
};

const planBadge = (plan: string | null) => {
  const p = (plan || "Basic").toUpperCase();
  const colors: Record<string, string> = {
    BASIC: "#38bdf8",
    PRO: "#a855f7",
    ULTRA: "#fbbf24",
    STARTER: "#38bdf8",
  };
  const c = colors[p] || "#888";
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: `${c}20`, color: c, border: `1px solid ${c}40` }}
    >
      {p}
    </span>
  );
};

const daysBetween = (dateStr: string | null) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
};

const daysPill = (days: number | null) => {
  if (days === null) {
    return (
      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#22222a", color: "#888" }}>
        No expiry
      </span>
    );
  }
  let color = "#22c55e";
  let label = `${days}d left`;
  if (days < 0) {
    color = "#6b7280";
    label = `Expired ${Math.abs(days)}d ago`;
  } else if (days === 0) {
    color = "#ef4444";
    label = "Today";
  } else if (days <= 3) {
    color = "#ef4444";
  } else if (days <= 7) {
    color = "#f59e0b";
  }
  return (
    <span
      className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
      style={{ background: `${color}1f`, color, border: `1px solid ${color}40` }}
    >
      {label}
    </span>
  );
};

const statusBadge = (days: number | null, active: boolean | null) => {
  if (!active) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#6b728020", color: "#9ca3af", border: "1px solid #6b728040" }}>
        Inactive
      </span>
    );
  }
  if (days === null) return <span className="text-[10px] text-muted-foreground">—</span>;
  if (days < 0)
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440" }}>
        Expired
      </span>
    );
  if (days <= 7)
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b40" }}>
        Expiring Soon
      </span>
    );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#22c55e20", color: "#22c55e", border: "1px solid #22c55e40" }}>
      Active
    </span>
  );
};

type FilterKey = "all" | "today" | "week" | "month" | "expired";
type SortKey = "expiry" | "plan" | "name";

const AdminRenewals = () => {
  const [users, setUsers] = useState<RenewalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("expiry");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,email,plan,expiry_date,plan_start_date,subscription_active,reminder_sent,mobile_number")
      .order("expiry_date", { ascending: true, nullsFirst: false });
    if (error) toast.error(error.message);
    setUsers((data ?? []) as RenewalUser[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    let today = 0, in3 = 0, in7 = 0, expired = 0;
    users.forEach((u) => {
      const d = daysBetween(u.expiry_date);
      if (d === null) return;
      if (d === 0) today++;
      if (d > 0 && d <= 3) in3++;
      if (d > 0 && d <= 7) in7++;
      if (d < 0) expired++;
    });
    return { today, in3, in7, expired };
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users.filter((u) => {
      if (q && !(u.email.toLowerCase().includes(q) || (u.name || "").toLowerCase().includes(q))) return false;
      const d = daysBetween(u.expiry_date);
      switch (filter) {
        case "today": return d === 0;
        case "week": return d !== null && d >= 0 && d <= 7;
        case "month": return d !== null && d >= 0 && d <= 30;
        case "expired": return d !== null && d < 0;
        default: return true;
      }
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return (a.name || a.email).localeCompare(b.name || b.email);
      if (sort === "plan") return (a.plan || "").localeCompare(b.plan || "");
      const da = daysBetween(a.expiry_date);
      const db = daysBetween(b.expiry_date);
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
    return list;
  }, [users, filter, sort, search]);

  const extendDays = async (u: RenewalUser, days: number) => {
    const base = u.expiry_date ? new Date(u.expiry_date) : new Date();
    if (base < new Date()) base.setTime(Date.now());
    base.setDate(base.getDate() + days);
    const newDate = base.toISOString().slice(0, 10);
    const { error } = await supabase
      .from("profiles")
      .update({ expiry_date: newDate, subscription_active: true, reminder_sent: false })
      .eq("id", u.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Extended ${days} days → ${newDate}`);
      load();
    }
  };

  const extendCustom = async (u: RenewalUser) => {
    const v = prompt("Extend by how many days?", "30");
    const n = Number(v);
    if (!n || isNaN(n)) return;
    extendDays(u, n);
  };

  const sendReminder = async (u: RenewalUser) => {
    const days = daysBetween(u.expiry_date);
    const text = encodeURIComponent(
      `Hi ${u.name || "there"}! Your ${u.plan || "ToolsBazzar"} plan ${
        days !== null && days < 0 ? "has expired" : `expires in ${days} days`
      }. Renew now to continue uninterrupted access. — ToolsBazzar`
    );
    const phone = (u.mobile_number || "").replace(/\D/g, "") || "919448646624";
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
    await supabase.from("profiles").update({ reminder_sent: true }).eq("id", u.id);
    toast.success("Reminder marked as sent");
    load();
  };

  const deactivate = async (u: RenewalUser) => {
    if (!confirm(`Deactivate ${u.email}?`)) return;
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_active: false })
      .eq("id", u.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deactivated");
      load();
    }
  };

  const AlertCard = ({ label, count, color, icon: Icon }: any) => (
    <div className="rounded-2xl border p-4" style={{ ...cardStyle, borderColor: `${color}40` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}1f`, border: `1px solid ${color}40` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl md:text-3xl font-bold mt-1" style={{ color }}>{count}</div>
    </div>
  );

  return (
    <AdminShell title="Renewals">
      {/* Alert cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <AlertCard label="Expiring Today" count={counts.today} color="#ef4444" icon={AlertTriangle} />
        <AlertCard label="In 3 Days" count={counts.in3} color="#f59e0b" icon={Clock} />
        <AlertCard label="In 7 Days" count={counts.in7} color="#fbbf24" icon={CalendarCheck} />
        <AlertCard label="Expired" count={counts.expired} color="#6b7280" icon={CalendarX} />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center justify-between" style={cardStyle}>
        <div className="flex flex-wrap gap-1 p-0.5 rounded-lg" style={{ background: "#0a0a0a" }}>
          {([
            ["all", "All"],
            ["today", "Today"],
            ["week", "This Week"],
            ["month", "This Month"],
            ["expired", "Expired"],
          ] as [FilterKey, string][]).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className="px-3 py-1.5 rounded-md text-[11px] transition-colors"
              style={{
                background: filter === k ? "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))" : "transparent",
                color: filter === k ? "#0a0a0a" : "#999",
                fontWeight: filter === k ? 600 : 400,
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ background: "#0a0a0a", borderColor: "#1e1e1e" }}>
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name/email"
              className="bg-transparent text-xs text-foreground outline-none w-40"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-xs px-2 py-1.5 rounded-lg border bg-transparent text-foreground"
            style={{ background: "#0a0a0a", borderColor: "#1e1e1e" }}
          >
            <option value="expiry">Sort: Expiry</option>
            <option value="plan">Sort: Plan</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b" style={{ borderColor: "#1e1e1e", background: "#0a0a0a" }}>
                <th className="py-3 px-4 font-medium">User</th>
                <th className="py-3 px-2 font-medium">Plan</th>
                <th className="py-3 px-2 font-medium">Start</th>
                <th className="py-3 px-2 font-medium">Expiry</th>
                <th className="py-3 px-2 font-medium">Days Left</th>
                <th className="py-3 px-2 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Loading...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No users match the current filter</td></tr>
              )}
              {filtered.map((u) => {
                const d = daysBetween(u.expiry_date);
                return (
                  <tr key={u.id} className="border-b hover:bg-[#15151c]/60 transition-colors" style={{ borderColor: "#161616" }}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{u.name || "—"}</div>
                      <div className="text-[10px] text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="py-3 px-2">{planBadge(u.plan)}</td>
                    <td className="py-3 px-2 text-muted-foreground">{u.plan_start_date || "—"}</td>
                    <td className="py-3 px-2 text-foreground">{u.expiry_date || "—"}</td>
                    <td className="py-3 px-2">{daysPill(d)}</td>
                    <td className="py-3 px-2">{statusBadge(d, u.subscription_active)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => extendDays(u, 30)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all hover:opacity-90"
                          style={{ background: "#22c55e1f", color: "#22c55e", border: "1px solid #22c55e40" }}
                        >
                          <Plus className="h-3 w-3" /> 30d
                        </button>
                        <button
                          onClick={() => extendCustom(u)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all hover:opacity-90"
                          style={{ background: "#1a1a1a", color: "#e5e5e5", border: "1px solid #2a2a2a" }}
                        >
                          Custom
                        </button>
                        <button
                          onClick={() => sendReminder(u)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all hover:opacity-90"
                          style={{
                            background: u.reminder_sent ? "#38bdf81f" : "#fbbf241f",
                            color: u.reminder_sent ? "#38bdf8" : "#fbbf24",
                            border: `1px solid ${u.reminder_sent ? "#38bdf840" : "#fbbf2440"}`,
                          }}
                          title={u.reminder_sent ? "Reminder sent" : "Send reminder"}
                        >
                          {u.reminder_sent ? <Send className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
                          {u.reminder_sent ? "Sent" : "Remind"}
                        </button>
                        <button
                          onClick={() => deactivate(u)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all hover:opacity-90"
                          style={{ background: "#ef44441f", color: "#ef4444", border: "1px solid #ef444440" }}
                        >
                          <Power className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminRenewals;
