export type TxnType = "BASIC" | "PRO" | "ULTRA" | "EXPENSE";

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TxnType;
  label: string | null;
  amount: number;
  created_at: string;
}

export const planColors: Record<TxnType, string> = {
  BASIC: "#38bdf8",
  PRO: "#a855f7",
  ULTRA: "#fbbf24",
  EXPENSE: "#ef4444",
};

export const planBgs: Record<TxnType, string> = {
  BASIC: "rgba(56,189,248,0.12)",
  PRO: "rgba(168,85,247,0.12)",
  ULTRA: "rgba(251,191,36,0.12)",
  EXPENSE: "rgba(239,68,68,0.12)",
};

export const formatINR = (n: number) =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;

export const isIncome = (t: TxnType) => t !== "EXPENSE";

export const computeTotals = (txns: Transaction[]) => {
  let revenue = 0;
  let expenses = 0;
  const byPlan: Record<string, number> = { BASIC: 0, PRO: 0, ULTRA: 0 };
  const countByPlan: Record<string, number> = { BASIC: 0, PRO: 0, ULTRA: 0 };
  txns.forEach((t) => {
    const amt = Number(t.amount) || 0;
    if (isIncome(t.type)) {
      revenue += amt;
      byPlan[t.type] = (byPlan[t.type] || 0) + amt;
      countByPlan[t.type] = (countByPlan[t.type] || 0) + 1;
    } else {
      expenses += amt;
    }
  });
  return {
    revenue,
    expenses,
    profit: revenue - expenses,
    byPlan,
    countByPlan,
    salesCount: countByPlan.BASIC + countByPlan.PRO + countByPlan.ULTRA,
    roi: expenses > 0 ? ((revenue - expenses) / expenses) * 100 : 0,
  };
};

export const groupByDate = (txns: Transaction[]) => {
  const map: Record<string, { date: string; revenue: number; expenses: number }> = {};
  txns.forEach((t) => {
    const k = t.date;
    if (!map[k]) map[k] = { date: k, revenue: 0, expenses: 0 };
    if (isIncome(t.type)) map[k].revenue += Number(t.amount);
    else map[k].expenses += Number(t.amount);
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
};

export const groupByMonth = (txns: Transaction[]) => {
  const map: Record<string, { date: string; revenue: number; expenses: number }> = {};
  txns.forEach((t) => {
    const k = t.date.slice(0, 7); // YYYY-MM
    if (!map[k]) map[k] = { date: k, revenue: 0, expenses: 0 };
    if (isIncome(t.type)) map[k].revenue += Number(t.amount);
    else map[k].expenses += Number(t.amount);
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
};

export const exportCsv = (txns: Transaction[], filename = "transactions.csv") => {
  const header = ["Date", "Type", "Label", "Amount (INR)", "Direction"];
  const rows = txns.map((t) => [
    t.date,
    t.type,
    (t.label ?? "").replace(/"/g, '""'),
    String(t.amount),
    isIncome(t.type) ? "Income" : "Expense",
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
