import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Users, UserCheck, Inbox, MailCheck, TriangleAlert, RefreshCw, Ban, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGmailStock } from "@/hooks/use-gmail-stock";
import { gmailCounts, subscriptionCycle } from "@/lib/gmail-stock";

export default function AdminOverview({ totalUsers, activeSubscriptions, onUsers }: { totalUsers: number; activeSubscriptions: number; onUsers: (status?: string) => void }) {
  const navigate = useNavigate();
  const { accounts, isLoading, error } = useGmailStock();
  const counts = gmailCounts(accounts);
  const gmail = (filter: string) => navigate(`/admin/gmail?filter=${encodeURIComponent(filter)}`);
  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, tone: "gmail-highlight", action: () => onUsers() },
    { label: "Active Subscriptions", value: activeSubscriptions, icon: UserCheck, tone: "text-accent", action: () => onUsers("active") },
    { label: "Available Gmail Accounts", value: counts.Available, icon: Inbox, tone: "text-accent", action: () => gmail("Available") },
    { label: "Assigned Gmail Accounts", value: counts.Assigned, icon: MailCheck, tone: "gmail-highlight", action: () => gmail("Assigned") },
    { label: "Credits Exhausted", value: counts["Credits Exhausted"], icon: TriangleAlert, tone: "text-destructive", action: () => gmail("Credits Exhausted") },
    { label: "Gmail Resets Today", value: counts["Reset Today"], icon: RefreshCw, tone: "gmail-warning", action: () => gmail("Reset Today") },
  ];
  const upcoming = accounts.filter((a) => { const c = subscriptionCycle(a.subscription_start_date); return c && c.daysLeft > 0 && c.daysLeft <= 3; }).length;
  return <div className="admin-enter space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5"><div><div className="mb-2 text-xs gmail-highlight">ADMIN OVERVIEW</div><h1 className="text-3xl font-bold tracking-normal">Dashboard</h1></div><span className="flex items-center gap-2 rounded-md border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Live overview</span></header>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map(({ label, value, icon: Icon, tone, action }, index) => <Button key={label} variant="outline" onClick={action} className={`admin-stat h-auto min-h-40 w-full flex-col items-stretch justify-start gap-5 whitespace-normal p-5 text-left ${index === 0 || index === 3 ? "admin-stat-purple" : ""}`}>
        <span className="flex items-center justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ${tone}`}><Icon /></span><ArrowUpRight className="text-muted-foreground" /></span>
        <span><span className="block text-3xl font-bold tabular-nums">{index > 1 && (isLoading || error) ? "—" : value}</span><span className="mt-2 block text-sm text-muted-foreground">{label}</span></span>
      </Button>)}
    </div>
    <section className="border-y border-border py-4" aria-label="Important Gmail alerts"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Gmail attention center</h2><Button variant="ghost" size="sm" className="text-accent" onClick={() => gmail("All")}>View stock<ArrowUpRight /></Button></div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Button variant="ghost" onClick={() => gmail("Credits Exhausted")} className="h-auto justify-start whitespace-normal bg-secondary/50 p-3 text-left"><TriangleAlert className="text-destructive" /><span className="text-xs">{counts["Credits Exhausted"]} exhausted accounts</span></Button>
        <Button variant="ghost" onClick={() => gmail("Upcoming Resets")} className="h-auto justify-start whitespace-normal bg-secondary/50 p-3 text-left"><CalendarClock className="gmail-warning" /><span className="text-xs">{upcoming} resets in the next 3 days</span></Button>
        <Button variant="ghost" onClick={() => gmail("Disabled")} className="h-auto justify-start whitespace-normal bg-secondary/50 p-3 text-left"><Ban className="gmail-highlight" /><span className="text-xs">{counts.Disabled} disabled accounts</span></Button>
      </div><p className="mt-3 text-xs text-muted-foreground">Scheduled resets do not verify Google's credit availability.</p>
    </section>
  </div>;
}