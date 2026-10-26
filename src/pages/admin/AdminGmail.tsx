import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { GmailRow, inputCls, tealBtn, today, type Account } from "@/components/admin/GmailAccountsManager";

type StockAccount = Account & { user_id: string | null };

const statusOf = (a: StockAccount) =>
  !a.enabled ? "Disabled" : a.credits_exhausted ? "Credits Exhausted" : a.user_id ? "Assigned" : "Available";

const statusStyle: Record<string, { background: string; color: string }> = {
  Available: { background: "rgba(34,197,94,0.12)", color: "#22c55e" },
  Assigned: { background: "rgba(33,199,183,0.12)", color: "#21C7B7" },
  Disabled: { background: "rgba(148,163,184,0.15)", color: "#94a3b8" },
  "Credits Exhausted": { background: "rgba(239,68,68,0.15)", color: "#ef4444" },
};

const AdminGmail = () => {
  const [list, setList] = useState<StockAccount[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [n, setN] = useState({ gmail: "", password: "", start_date: today() });

  const load = async () => {
    const { data } = await supabase.from("google_ai_accounts")
      .select("id, gmail, password, start_date, credits_exhausted, enabled, user_id").order("created_at");
    const rows = (data as StockAccount[]) || [];
    setList(rows);
    const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id, name, email").in("id", ids);
      setNames(Object.fromEntries((p || []).map((x) => [x.id, x.name || x.email])));
    }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!/^\S+@\S+\.\S+$/.test(n.gmail.trim())) return toast({ title: "Enter a valid Gmail", variant: "destructive" });
    const { error } = await supabase.from("google_ai_accounts")
      .insert({ gmail: n.gmail.trim(), password: n.password, start_date: n.start_date });
    if (error) return toast({
      title: "Could not add", variant: "destructive",
      description: error.code === "23505" ? "This Gmail is already in stock." : error.message,
    });
    setN({ gmail: "", password: "", start_date: today() }); load();
  };

  const shown = useMemo(() => list.filter((a) =>
    a.gmail.toLowerCase().includes(q.toLowerCase()) && (filter === "All" || statusOf(a) === filter)), [list, q, filter]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: list.length, Available: 0, Assigned: 0, Disabled: 0, "Credits Exhausted": 0 };
    list.forEach((a) => c[statusOf(a)]++);
    return c;
  }, [list]);

  return (
    <AdminShell title="Gmail Management">
      <div className="space-y-4 max-w-5xl">
        <div className="rounded-xl border p-4 space-y-2" style={{ background: "rgba(168,85,247,0.05)", borderColor: "rgba(168,85,247,0.3)" }}>
          <div className="text-[11px] uppercase tracking-wide" style={{ color: "#c084fc" }}>Add Gmail to Stock</div>
          <div className="grid gap-2 sm:grid-cols-4">
            <input className={inputCls} placeholder="Gmail address" value={n.gmail} onChange={(e) => setN({ ...n, gmail: e.target.value })} />
            <input className={inputCls} placeholder="Password" value={n.password} onChange={(e) => setN({ ...n, password: e.target.value })} />
            <input type="date" className={inputCls} value={n.start_date} onChange={(e) => setN({ ...n, start_date: e.target.value })} aria-label="Subscription start date" />
            <button onClick={add} className="h-10 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={tealBtn}>
              <Plus className="h-3.5 w-3.5" /> Add Gmail
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input className={inputCls + " pl-9"} placeholder="Search Gmail" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(counts).map((k) => (
              <button key={k} onClick={() => setFilter(k)}
                className="h-10 px-3 rounded-lg text-xs border"
                style={filter === k ? { borderColor: "#21C7B7", color: "#21C7B7" } : { borderColor: "hsl(var(--border))" }}>
                {k} ({counts[k]})
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {shown.map((a) => {
            const st = statusOf(a);
            return (
              <GmailRow key={a.id + a.start_date + a.gmail + a.password + a.credits_exhausted + a.enabled + a.user_id}
                a={a} mode="stock" onChanged={load}
                extra={
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="font-semibold px-2 py-0.5 rounded-full" style={statusStyle[st]}>{st}</span>
                    {a.user_id && <span className="text-muted-foreground truncate">→ {names[a.user_id] || "User"}</span>}
                  </div>
                } />
            );
          })}
          {shown.length === 0 && <p className="text-sm text-muted-foreground">No Gmail accounts found.</p>}
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminGmail;
