import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { GmailRow, inputCls, today } from "@/components/admin/GmailAccountsManager";
import GmailNotifications from "@/components/admin/GmailNotifications";
import { useGmailStock } from "@/hooks/use-gmail-stock";
import { gmailFilters, gmailCounts, matchesGmailFilter, type GmailFilter } from "@/lib/gmail-stock";
import { Button } from "@/components/ui/button";

export default function AdminGmail() {
  const { accounts, refresh, error, isLoading } = useGmailStock();
  const [names, setNames] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [params, setParams] = useSearchParams();
  const requested = params.get("filter");
  const filter: GmailFilter = gmailFilters.find((f) => f === requested) || "All";
  const [n, setN] = useState({ gmail: "", password: "", start_date: today() });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const ids = [...new Set(accounts.flatMap((a) => a.user_id ? [a.user_id] : []))];
    if (!ids.length) { setNames({}); return; }
    supabase.from("profiles").select("id,name,email").in("id", ids).then(({ data }) => setNames(Object.fromEntries((data || []).map((a) => [a.id, a.name || a.email]))));
  }, [accounts]);
  const add = async () => {
    if (!/^\S+@\S+\.\S+$/.test(n.gmail.trim())) return toast({ title: "Enter a valid Gmail", variant: "destructive" });
    if (accounts.some((a) => a.gmail.toLowerCase() === n.gmail.trim().toLowerCase())) return toast({ title: "This Gmail is already in stock", variant: "destructive" });
    setBusy(true);
    const { error } = await supabase.from("google_ai_accounts").insert({ gmail: n.gmail.trim(), password: n.password, subscription_start_date: n.start_date || null });
    setBusy(false);
    if (error) return toast({ title: "Could not add Gmail", description: error.message, variant: "destructive" });
    setN({ gmail: "", password: "", start_date: today() }); refresh();
  };
  const shown = accounts.filter((a) => (a.gmail + " " + (a.user_id ? names[a.user_id] || "" : "")).toLowerCase().includes(q.toLowerCase()) && matchesGmailFilter(a, filter));
  const counts = gmailCounts(accounts);
  return <AdminShell title="Gmail Management"><div className="max-w-6xl space-y-5">
    <GmailNotifications onFilter={(f) => setParams({ filter: f })} />
    <section className="space-y-3 border-y border-border py-4"><h2 className="text-sm gmail-highlight">Add Gmail to Stock</h2><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <input aria-label="Gmail address" className={inputCls} placeholder="Gmail address" value={n.gmail} onChange={(e) => setN({ ...n, gmail: e.target.value })} />
      <input type="password" aria-label="Password" className={inputCls} placeholder="Password" value={n.password} onChange={(e) => setN({ ...n, password: e.target.value })} />
      <input type="date" aria-label="Subscription start date" className={inputCls} value={n.start_date} onChange={(e) => setN({ ...n, start_date: e.target.value })} />
      <Button disabled={busy} onClick={add} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus />Add Gmail</Button>
    </div></section>
    <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input className={inputCls + " pl-9"} aria-label="Search Gmail or user" placeholder="Search Gmail or user" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <div className="flex flex-wrap gap-2">{gmailFilters.map((f) => <Button size="sm" variant="outline" key={f} aria-pressed={filter === f} onClick={() => setParams({ filter: f })} className={filter === f ? "border-accent text-accent" : ""}>{f} ({counts[f]})</Button>)}</div>
    {error && <p className="text-sm text-destructive">Could not load Gmail stock.</p>}
    {isLoading && <p className="text-sm text-muted-foreground">Loading Gmail accounts…</p>}
    <div className="grid gap-3 lg:grid-cols-2">{shown.map((a) => <GmailRow key={a.id} a={a} mode="stock" onChanged={refresh} extra={<div className="text-xs text-muted-foreground">{a.user_id ? `Assigned to ${names[a.user_id] || "User"}` : "Unassigned"}</div>} />)}</div>
    {!isLoading && !error && !shown.length && <p className="text-sm text-muted-foreground">No Gmail accounts found.</p>}
  </div></AdminShell>;
}
