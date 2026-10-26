const toDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Anniversary of start date `k` months later, clamped to month length.
const addMonths = (start: Date, k: number) => {
  const y = start.getFullYear();
  const m = start.getMonth() + k;
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(start.getDate(), last));
};

export const fmtYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function gmailCycle(startDate: string, today: Date = new Date()) {
  const start = toDate(startDate);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let k = 0;
  while (addMonths(start, k + 1) <= t) k++;
  const current = addMonths(start, k);
  const resetToday = k > 0 && current.getTime() === t.getTime();
  const next = addMonths(start, k + 1);
  return { status: resetToday ? ("reset" as const) : ("running" as const), nextReset: next, cycleStart: current };
}
