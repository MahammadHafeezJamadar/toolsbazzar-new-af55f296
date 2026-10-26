import { gmailCycle } from "./gmail-cycle";

export interface GmailAccount {
  id: string;
  gmail: string;
  password: string;
  subscription_start_date: string | null;
  credits_exhausted: boolean;
  enabled: boolean;
  user_id: string | null;
}

export const gmailFilters = ["All", "Reset Today", "Credits Exhausted", "Available", "Disabled", "Missing Dates", "Assigned"] as const;
export type GmailFilter = typeof gmailFilters[number];

export function subscriptionCycle(start: string | null, now = new Date()) {
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;
  const parsed = new Date(`${start}T00:00:00`);
  if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== Number(start.slice(0, 4)) || parsed.getMonth() + 1 !== Number(start.slice(5, 7)) || parsed.getDate() !== Number(start.slice(8))) return null;
  const cycle = gmailCycle(start, now);
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { ...cycle, pending: parsed > midnight, daysLeft: Math.round((cycle.nextReset.getTime() - midnight.getTime()) / 86400000) };
}

export function matchesGmailFilter(account: GmailAccount, filter: GmailFilter, now = new Date()) {
  switch (filter) {
    case "Reset Today": return subscriptionCycle(account.subscription_start_date, now)?.status === "reset";
    case "Credits Exhausted": return account.credits_exhausted;
    case "Disabled": return !account.enabled;
    case "Available": return !account.user_id && account.enabled && !account.credits_exhausted;
    case "Missing Dates": return !subscriptionCycle(account.subscription_start_date, now);
    case "Assigned": return Boolean(account.user_id);
    default: return true;
  }
}

export function gmailCounts(accounts: GmailAccount[], now = new Date()) {
  return Object.fromEntries(gmailFilters.map((filter) => [filter, accounts.filter((a) => matchesGmailFilter(a, filter, now)).length])) as Record<GmailFilter, number>;
}