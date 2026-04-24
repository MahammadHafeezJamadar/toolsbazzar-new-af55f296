import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import AddTransactionDialog from "@/components/admin/AddTransactionDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  Transaction,
  TxnType,
  computeTotals,
  exportCsv,
  formatINR,
  isIncome,
  planColors,
} from "@/lib/finance";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Download, Trash2, TrendingDown, TrendingUp, Wallet, Percent } from "lucide-react";
import { toast } from "sonner";

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #111, #0d0d0d)",
  borderColor: "#1e1e1e",
};

const SummaryCard = ({
  label,
  value,
  icon: Icon,
  accent,
}: { label: string; value: string; icon: any; accent: string }) => (
  <div className="rounded-2xl border p-4" style={cardStyle}>
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: `${accent}1f`, border: `1px solid ${accent}40` }}
      >
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-lg font-bold text-foreground">{value}</div>
      </div>
    </div>
  </div>
);

const AdminFinance = () => {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    const { data } = await supabase.from("transactions").select("*").order("date", { ascending: false });
    setTxns((data ?? []) as Transaction[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-finance-txns")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(
    () =>
      txns.filter((t) => {
        if (filterType !== "ALL" && t.type !== filterType) return false;
        if (from && t.date < from) return false;
        if (to && t.date > to) return false;
        return true;
      }),
    [txns, filterType, from, to]
  );

  const totals = useMemo(() => computeTotals(filtered), [filtered]);

  const grouped = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filtered.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Transaction deleted");
  };

  return (
    <AdminShell
      title="Finance — P&L"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv(filtered, `txns-${new Date().toISOString().slice(0, 10)}.csv`)}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border hover:bg-[#1a1a1a]"
            style={{ borderColor: "#1e1e1e", color: "#ccc" }}
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <AddTransactionDialog onCreated={load} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <SummaryCard label="Total Earned" value={formatINR(totals.revenue)} icon={TrendingUp} accent="#22c55e" />
        <SummaryCard label="Total Invested" value={formatINR(totals.expenses)} icon={TrendingDown} accent="#ef4444" />
        <SummaryCard label={totals.profit >= 0 ? "Net Profit" : "Net Loss"} value={formatINR(Math.abs(totals.profit))} icon={Wallet} accent="#fbbf24" />
        <SummaryCard label="ROI" value={`${totals.roi.toFixed(0)}%`} icon={Percent} accent="hsl(174 72% 56%)" />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border p-3 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-2" style={cardStyle}>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-[#0d0d0d] border-[#1e1e1e] mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-[#0d0d0d] border-[#1e1e1e] mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Type</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-[#0d0d0d] border-[#1e1e1e] mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="BASIC">Basic</SelectItem>
              <SelectItem value="PRO">Pro</SelectItem>
              <SelectItem value="ULTRA">Ultra</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => { setFilterType("ALL"); setFrom(""); setTo(""); }}
            className="w-full h-10 rounded-lg text-xs font-medium border hover:bg-[#1a1a1a]"
            style={{ borderColor: "#1e1e1e", color: "#ccc" }}
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Grouped table */}
      <div className="space-y-3">
        {loading && <div className="h-40 rounded-2xl border animate-pulse" style={cardStyle} />}
        {!loading && grouped.length === 0 && (
          <div className="rounded-2xl border p-8 text-center text-muted-foreground" style={cardStyle}>
            No transactions match your filters.
          </div>
        )}
        {grouped.map(([date, items]) => {
          const dayTotals = computeTotals(items);
          return (
            <div key={date} className="rounded-2xl border overflow-hidden" style={cardStyle}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "#1e1e1e", background: "#0d0d0d" }}>
                <div className="text-sm font-semibold text-foreground">{date}</div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-muted-foreground">In: <span className="text-[#22c55e] font-semibold">{formatINR(dayTotals.revenue)}</span></span>
                  <span className="text-muted-foreground">Out: <span className="text-[#ef4444] font-semibold">{formatINR(dayTotals.expenses)}</span></span>
                  <span className="text-muted-foreground">Net: <span className="font-semibold" style={{ color: dayTotals.profit >= 0 ? "#fbbf24" : "#ef4444" }}>{formatINR(dayTotals.profit)}</span></span>
                </div>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {items.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-[#1a1a1a]/40 transition-colors" style={{ borderColor: "#161616" }}>
                      <td className="py-2.5 px-4 w-32">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            background: `${planColors[t.type]}20`,
                            color: planColors[t.type],
                            border: `1px solid ${planColors[t.type]}40`,
                          }}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground">{t.label || "—"}</td>
                      <td className="py-2.5 px-2 text-right font-semibold w-32" style={{ color: isIncome(t.type) ? "#22c55e" : "#ef4444" }}>
                        {isIncome(t.type) ? "+" : "−"}{formatINR(Number(t.amount))}
                      </td>
                      <td className="py-2.5 px-3 w-10 text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-muted-foreground hover:text-[#ef4444] p-1 rounded">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent style={{ background: "#111", borderColor: "#1e1e1e" }}>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-foreground">Delete transaction?</AlertDialogTitle>
                              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-[#ef4444] hover:bg-[#dc2626]">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* Mobile export */}
      <div className="sm:hidden mt-4">
        <button
          onClick={() => exportCsv(filtered, `txns-${new Date().toISOString().slice(0, 10)}.csv`)}
          className="w-full h-10 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium border hover:bg-[#1a1a1a]"
          style={{ borderColor: "#1e1e1e", color: "#ccc" }}
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>
    </AdminShell>
  );
};

export default AdminFinance;
