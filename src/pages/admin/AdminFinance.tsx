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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Trash2, TrendingDown, TrendingUp, Wallet, Percent, Plus, History, Loader2, ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";

interface FinancePeriod {
  id: string;
  start_date: string | null;
  end_date: string | null;
  total_income: number;
  total_expenses: number;
  final_balance: number;
  total_transactions: number;
  archived_at: string;
}

interface ArchivedTxn {
  id: string;
  period_id: string;
  date: string;
  type: TxnType;
  label: string | null;
  amount: number;
}

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

  const [archiving, setArchiving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [periods, setPeriods] = useState<FinancePeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<FinancePeriod | null>(null);
  const [periodTxns, setPeriodTxns] = useState<ArchivedTxn[]>([]);
  const [periodTxnsLoading, setPeriodTxnsLoading] = useState(false);

  const loadPeriods = async () => {
    setPeriodsLoading(true);
    const { data, error } = await (supabase as any)
      .from("finance_periods")
      .select("*")
      .order("archived_at", { ascending: false });
    if (error) toast.error(error.message);
    setPeriods((data ?? []) as FinancePeriod[]);
    setPeriodsLoading(false);
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setSelectedPeriod(null);
    await loadPeriods();
  };

  const viewPeriod = async (p: FinancePeriod) => {
    setSelectedPeriod(p);
    setPeriodTxnsLoading(true);
    const { data, error } = await (supabase as any)
      .from("finance_period_transactions")
      .select("*")
      .eq("period_id", p.id)
      .order("date", { ascending: false });
    if (error) toast.error(error.message);
    setPeriodTxns((data ?? []) as ArchivedTxn[]);
    setPeriodTxnsLoading(false);
  };

  const handleStartNewPeriod = async () => {
    setArchiving(true);
    const { error } = await (supabase as any).rpc("archive_finance_period");
    setArchiving(false);
    if (error) {
      toast.error(error.message || "Failed to archive period");
      return;
    }
    toast.success("New finance period started — previous data archived");
    load();
  };

  return (
    <AdminShell
      title="Finance — P&L"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
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
      {/* Period actions */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={archiving}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-60"
            >
              {archiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Start New Finance
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent style={{ background: "#111", borderColor: "#1e1e1e" }}>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Start a new finance period?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to start a new finance period? Current data will be archived and a fresh dashboard will be created.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleStartNewPeriod}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Yes, archive & reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <button
          onClick={openHistory}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20 transition-all"
        >
          <History className="h-4 w-4" />
          Previous Finance Records
        </button>
      </div>


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

      {/* Previous Finance Records dialog */}
      <Dialog open={historyOpen} onOpenChange={(o) => { setHistoryOpen(o); if (!o) setSelectedPeriod(null); }}>
        <DialogContent
          className="max-w-4xl max-h-[85vh] overflow-y-auto"
          style={{ background: "#0d0d0d", borderColor: "#1e1e1e" }}
        >
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              {selectedPeriod ? (
                <>
                  <button
                    onClick={() => setSelectedPeriod(null)}
                    className="p-1 rounded hover:bg-[#1a1a1a]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  Period details
                </>
              ) : (
                <>
                  <History className="h-4 w-4" />
                  Previous Finance Records
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {!selectedPeriod && (
            <div className="space-y-3">
              {periodsLoading && (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!periodsLoading && periods.length === 0 && (
                <div className="rounded-xl border p-8 text-center text-muted-foreground" style={cardStyle}>
                  No archived periods yet.
                </div>
              )}
              {!periodsLoading && periods.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border p-4 hover:border-blue-500/40 transition-colors"
                  style={cardStyle}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">
                        {p.start_date ?? "—"} → {p.end_date ?? "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Archived {new Date(p.archived_at).toLocaleString()}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs">
                        <span className="text-muted-foreground">Income: <span className="text-[#22c55e] font-semibold">{formatINR(Number(p.total_income))}</span></span>
                        <span className="text-muted-foreground">Expenses: <span className="text-[#ef4444] font-semibold">{formatINR(Number(p.total_expenses))}</span></span>
                        <span className="text-muted-foreground">Balance: <span className="font-semibold" style={{ color: Number(p.final_balance) >= 0 ? "#fbbf24" : "#ef4444" }}>{formatINR(Number(p.final_balance))}</span></span>
                        <span className="text-muted-foreground">Txns: <span className="text-foreground font-semibold">{p.total_transactions}</span></span>
                      </div>
                    </div>
                    <button
                      onClick={() => viewPeriod(p)}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="h-3.5 w-3.5" /> View details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedPeriod && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border p-3" style={cardStyle}>
                  <div className="text-[10px] uppercase text-muted-foreground">Income</div>
                  <div className="text-sm font-bold text-[#22c55e]">{formatINR(Number(selectedPeriod.total_income))}</div>
                </div>
                <div className="rounded-lg border p-3" style={cardStyle}>
                  <div className="text-[10px] uppercase text-muted-foreground">Expenses</div>
                  <div className="text-sm font-bold text-[#ef4444]">{formatINR(Number(selectedPeriod.total_expenses))}</div>
                </div>
                <div className="rounded-lg border p-3" style={cardStyle}>
                  <div className="text-[10px] uppercase text-muted-foreground">Balance</div>
                  <div className="text-sm font-bold" style={{ color: Number(selectedPeriod.final_balance) >= 0 ? "#fbbf24" : "#ef4444" }}>{formatINR(Number(selectedPeriod.final_balance))}</div>
                </div>
                <div className="rounded-lg border p-3" style={cardStyle}>
                  <div className="text-[10px] uppercase text-muted-foreground">Transactions</div>
                  <div className="text-sm font-bold text-foreground">{selectedPeriod.total_transactions}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedPeriod.start_date ?? "—"} → {selectedPeriod.end_date ?? "—"}
              </div>

              {periodTxnsLoading && (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!periodTxnsLoading && (
                <div className="rounded-xl border overflow-hidden" style={cardStyle}>
                  {periodTxns.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">No transactions in this period.</div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-left" style={{ borderColor: "#1e1e1e", background: "#0d0d0d" }}>
                          <th className="py-2 px-3 text-muted-foreground font-medium">Date</th>
                          <th className="py-2 px-3 text-muted-foreground font-medium">Type</th>
                          <th className="py-2 px-3 text-muted-foreground font-medium">Label</th>
                          <th className="py-2 px-3 text-muted-foreground font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodTxns.map((t) => (
                          <tr key={t.id} className="border-b last:border-0" style={{ borderColor: "#161616" }}>
                            <td className="py-2 px-3 text-muted-foreground">{t.date}</td>
                            <td className="py-2 px-3">
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                style={{
                                  background: `${planColors[t.type] ?? "#666"}20`,
                                  color: planColors[t.type] ?? "#ccc",
                                  border: `1px solid ${planColors[t.type] ?? "#666"}40`,
                                }}
                              >
                                {t.type}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-muted-foreground">{t.label || "—"}</td>
                            <td className="py-2 px-3 text-right font-semibold" style={{ color: isIncome(t.type) ? "#22c55e" : "#ef4444" }}>
                              {isIncome(t.type) ? "+" : "−"}{formatINR(Number(t.amount))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

export default AdminFinance;
