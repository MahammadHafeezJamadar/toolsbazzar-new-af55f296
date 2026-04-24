import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import AddTransactionDialog from "@/components/admin/AddTransactionDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  Transaction,
  computeTotals,
  formatINR,
  groupByDate,
  groupByMonth,
  isIncome,
  planColors,
} from "@/lib/finance";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts";

type Range = "daily" | "weekly" | "monthly";

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #111, #0d0d0d)",
  borderColor: "#1e1e1e",
};

const Metric = ({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
  accent: string;
  trend?: "up" | "down";
}) => (
  <div className="rounded-2xl border p-4 md:p-5" style={cardStyle}>
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: `${accent}1f`, border: `1px solid ${accent}40` }}
      >
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </div>
      {trend && (
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{
            color: trend === "up" ? "#22c55e" : "#ef4444",
            background: trend === "up" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          }}
        >
          {trend === "up" ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}
        </span>
      )}
    </div>
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="text-xl md:text-2xl font-bold text-foreground mt-1">{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
  </div>
);

const AdminDashboard = () => {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("daily");

  const load = async () => {
    const [{ data: txnData }, { count }] = await Promise.all([
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("subscription_active", true),
    ]);
    setTxns((txnData ?? []) as Transaction[]);
    setActiveUsers(count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-txns")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const totals = useMemo(() => computeTotals(txns), [txns]);

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7);
  const todayTotals = useMemo(() => computeTotals(txns.filter((t) => t.date === today)), [txns, today]);
  const monthTotals = useMemo(
    () => computeTotals(txns.filter((t) => t.date.startsWith(monthStart))),
    [txns, monthStart]
  );

  const chartData = useMemo(() => {
    if (range === "monthly") return groupByMonth(txns);
    const grouped = groupByDate(txns);
    if (range === "weekly") {
      // bucket by ISO week
      const map: Record<string, { date: string; revenue: number; expenses: number }> = {};
      grouped.forEach((g) => {
        const d = new Date(g.date);
        const yr = d.getUTCFullYear();
        const oneJan = new Date(Date.UTC(yr, 0, 1));
        const week = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getUTCDay() + 1) / 7);
        const k = `${yr}-W${String(week).padStart(2, "0")}`;
        if (!map[k]) map[k] = { date: k, revenue: 0, expenses: 0 };
        map[k].revenue += g.revenue;
        map[k].expenses += g.expenses;
      });
      return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    }
    return grouped;
  }, [txns, range]);

  const planBars = useMemo(
    () => [
      { plan: "Basic", value: totals.byPlan.BASIC, count: totals.countByPlan.BASIC, color: planColors.BASIC },
      { plan: "Pro", value: totals.byPlan.PRO, count: totals.countByPlan.PRO, color: planColors.PRO },
      { plan: "Ultra", value: totals.byPlan.ULTRA, count: totals.countByPlan.ULTRA, color: planColors.ULTRA },
    ],
    [totals]
  );

  const recent = txns.slice(0, 10);

  return (
    <AdminShell title="Dashboard" actions={<AddTransactionDialog onCreated={load} />}>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border animate-pulse" style={cardStyle} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Metric label="Total Revenue" value={formatINR(totals.revenue)} sub="All-time income" icon={TrendingUp} accent="#22c55e" trend="up" />
            <Metric label="Total Expenses" value={formatINR(totals.expenses)} sub="All-time spend" icon={TrendingDown} accent="#ef4444" trend="down" />
            <Metric label="Net Profit" value={formatINR(totals.profit)} sub={`ROI ${totals.roi.toFixed(0)}%`} icon={Wallet} accent="#fbbf24" trend={totals.profit >= 0 ? "up" : "down"} />
            <Metric label="Active Users" value={String(activeUsers)} sub="Subscriptions live" icon={Users} accent="hsl(174 72% 56%)" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <Metric label="Sales Today" value={String(todayTotals.salesCount)} sub={formatINR(todayTotals.revenue)} icon={ShoppingBag} accent="#38bdf8" />
            <Metric label="Sales This Month" value={String(monthTotals.salesCount)} sub={formatINR(monthTotals.revenue)} icon={ShoppingBag} accent="#a855f7" />
            <Metric label="Total Sales" value={String(totals.salesCount)} sub="All time" icon={ShoppingBag} accent="#fbbf24" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            <div className="lg:col-span-2 rounded-2xl border p-4 md:p-5" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Revenue vs Expenses</h3>
                <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "#0a0a0a" }}>
                  {(["daily", "weekly", "monthly"] as Range[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className="px-2.5 py-1 rounded-md text-[11px] capitalize transition-colors"
                      style={{
                        background: range === r ? "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))" : "transparent",
                        color: range === r ? "#0a0a0a" : "#999",
                        fontWeight: range === r ? 600 : 400,
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                    <XAxis dataKey="date" stroke="#666" fontSize={11} />
                    <YAxis stroke="#666" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 8 }}
                      labelStyle={{ color: "#f5f5f5" }}
                      formatter={(v: number) => formatINR(v)}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(174 72% 56%)" strokeWidth={2} dot={false} name="Revenue" />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} name="Expenses" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border p-4 md:p-5" style={cardStyle}>
              <h3 className="text-sm font-semibold text-foreground mb-4">Sales by Plan</h3>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={planBars}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                    <XAxis dataKey="plan" stroke="#666" fontSize={11} />
                    <YAxis stroke="#666" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 8 }}
                      formatter={(v: number) => formatINR(v)}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {planBars.map((b, i) => (
                        <cell key={i} fill={b.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {planBars.map((p) => (
                  <div key={p.plan} className="rounded-lg p-2 text-center" style={{ background: `${p.color}15`, border: `1px solid ${p.color}30` }}>
                    <div className="text-[10px] text-muted-foreground">{p.plan}</div>
                    <div className="text-sm font-bold" style={{ color: p.color }}>{p.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-4 md:p-5" style={cardStyle}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b" style={{ borderColor: "#1e1e1e" }}>
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 font-medium">Type</th>
                    <th className="py-2 font-medium">Label</th>
                    <th className="py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-[#1a1a1a]/40 transition-colors" style={{ borderColor: "#161616" }}>
                      <td className="py-2.5 text-foreground">{t.date}</td>
                      <td className="py-2.5">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: `${planColors[t.type]}20`, color: planColors[t.type], border: `1px solid ${planColors[t.type]}40` }}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{t.label || "—"}</td>
                      <td className="py-2.5 text-right font-semibold" style={{ color: isIncome(t.type) ? "#22c55e" : "#ef4444" }}>
                        {isIncome(t.type) ? "+" : "−"}{formatINR(Number(t.amount))}
                      </td>
                    </tr>
                  ))}
                  {recent.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No transactions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
};

export default AdminDashboard;
