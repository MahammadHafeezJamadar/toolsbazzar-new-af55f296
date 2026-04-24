import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Transaction, computeTotals, formatINR, groupByMonth, planColors } from "@/lib/finance";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Crown, TrendingUp, Users, AlertTriangle } from "lucide-react";

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #111, #0d0d0d)",
  borderColor: "#1e1e1e",
};

interface ProfileRow {
  id: string;
  created_at: string | null;
  subscription_active: boolean | null;
  expiry_date: string | null;
  plan: string | null;
}

const AdminAnalytics = () => {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase.from("transactions").select("*").order("date", { ascending: true }),
        supabase.from("profiles").select("id, created_at, subscription_active, expiry_date, plan"),
      ]);
      setTxns((t ?? []) as Transaction[]);
      setProfiles((p ?? []) as ProfileRow[]);
      setLoading(false);
    })();
  }, []);

  const totals = useMemo(() => computeTotals(txns), [txns]);

  const pieData = useMemo(() => [
    { name: "Basic", value: totals.byPlan.BASIC, color: planColors.BASIC },
    { name: "Pro", value: totals.byPlan.PRO, color: planColors.PRO },
    { name: "Ultra", value: totals.byPlan.ULTRA, color: planColors.ULTRA },
  ].filter(d => d.value > 0), [totals]);

  const mrr = useMemo(() => groupByMonth(txns), [txns]);

  const newUsersPerDay = useMemo(() => {
    const map: Record<string, number> = {};
    profiles.forEach((p) => {
      if (!p.created_at) return;
      const k = p.created_at.slice(0, 10);
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }, [profiles]);

  const churnRate = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const expired = profiles.filter((p) => p.expiry_date && p.expiry_date < today).length;
    const total = profiles.length || 1;
    return (expired / total) * 100;
  }, [profiles]);

  const popularPlan = useMemo(() => {
    const counts = totals.countByPlan;
    let best = "—"; let max = -1;
    Object.entries(counts).forEach(([k, v]) => { if (v > max) { max = v; best = k; } });
    return max > 0 ? best : "—";
  }, [totals]);

  // Heatmap (last 12 weeks)
  const heatmap = useMemo(() => {
    const map: Record<string, number> = {};
    txns.forEach((t) => {
      if (t.type === "EXPENSE") return;
      map[t.date] = (map[t.date] || 0) + Number(t.amount);
    });
    const today = new Date();
    const days: { date: string; amount: number }[] = [];
    // start from 11 weeks back, snap to Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - 7 * 11 - today.getDay());
    for (let i = 0; i < 12 * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, amount: map[key] || 0 });
    }
    const max = Math.max(1, ...days.map((d) => d.amount));
    return { days, max };
  }, [txns]);

  return (
    <AdminShell title="Analytics">
      {loading ? (
        <div className="h-40 rounded-2xl border animate-pulse" style={cardStyle} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="rounded-2xl border p-4" style={cardStyle}>
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wide">
                <Crown className="h-3.5 w-3.5" /> Most Popular
              </div>
              <div className="text-xl font-bold text-foreground mt-1">{popularPlan}</div>
            </div>
            <div className="rounded-2xl border p-4" style={cardStyle}>
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wide">
                <TrendingUp className="h-3.5 w-3.5" /> Total Revenue
              </div>
              <div className="text-xl font-bold text-foreground mt-1">{formatINR(totals.revenue)}</div>
            </div>
            <div className="rounded-2xl border p-4" style={cardStyle}>
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wide">
                <Users className="h-3.5 w-3.5" /> Total Users
              </div>
              <div className="text-xl font-bold text-foreground mt-1">{profiles.length}</div>
            </div>
            <div className="rounded-2xl border p-4" style={cardStyle}>
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wide">
                <AlertTriangle className="h-3.5 w-3.5" /> Churn Rate
              </div>
              <div className="text-xl font-bold text-foreground mt-1">{churnRate.toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            <div className="rounded-2xl border p-5" style={cardStyle}>
              <h3 className="text-sm font-semibold text-foreground mb-4">Revenue by Plan</h3>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 8 }}
                      formatter={(v: number) => formatINR(v)}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border p-5" style={cardStyle}>
              <h3 className="text-sm font-semibold text-foreground mb-4">MRR Trend</h3>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={mrr}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                    <XAxis dataKey="date" stroke="#666" fontSize={11} />
                    <YAxis stroke="#666" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 8 }}
                      formatter={(v: number) => formatINR(v)}
                    />
                    <Bar dataKey="revenue" fill="hsl(174 72% 56%)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-5 mb-5" style={cardStyle}>
            <h3 className="text-sm font-semibold text-foreground mb-4">New Users Per Day</h3>
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={newUsersPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                  <XAxis dataKey="date" stroke="#666" fontSize={11} />
                  <YAxis stroke="#666" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {newUsersPerDay.length === 0 && (
              <div className="text-center text-muted-foreground text-xs py-6">No signup data yet</div>
            )}
          </div>

          {/* Revenue heatmap */}
          <div className="rounded-2xl border p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Calendar (last 12 weeks)</h3>
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {heatmap.days.map((d) => {
                const intensity = d.amount / heatmap.max;
                const bg = d.amount === 0
                  ? "#161616"
                  : `rgba(34,211,170,${0.15 + intensity * 0.7})`;
                return (
                  <div
                    key={d.date}
                    title={`${d.date}: ${formatINR(d.amount)}`}
                    className="w-3.5 h-3.5 rounded-sm"
                    style={{ background: bg }}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
              Less
              {[0.15, 0.35, 0.55, 0.75, 0.95].map((a) => (
                <div key={a} className="w-3 h-3 rounded-sm" style={{ background: `rgba(34,211,170,${a})` }} />
              ))}
              More
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
};

export default AdminAnalytics;
