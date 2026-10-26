import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, Copy, Eye, EyeOff, Mail, Pencil, Plus, Save, Trash2, X, Repeat2 } from "lucide-react";
import { fmtYmd } from "@/lib/gmail-cycle";
import { subscriptionCycle, matchesGmailFilter, type GmailAccount } from "@/lib/gmail-stock";
import { useGmailStock } from "@/hooks/use-gmail-stock";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export type Account = GmailAccount;
export const today = () => fmtYmd(new Date());
export const inputCls = "w-full min-w-0 h-10 rounded-lg px-3 text-sm text-foreground bg-background border border-border";
const copy = async (value: string, what: string) => {
  try { await navigator.clipboard.writeText(value); toast({ title: `${what} copied` }); }
  catch { toast({ title: "Could not copy", variant: "destructive" }); }
};

export const GmailRow = ({ a, onChanged, mode = "user", extra, onReplace }: {
  a: Account; onChanged: () => void; mode?: "user" | "stock"; extra?: React.ReactNode; onReplace?: () => void;
}) => {
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState(a);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setF(a); }, [a]);
  const cycle = subscriptionCycle(a.subscription_start_date);
  const update = async (values: Partial<Account>) => {
    setBusy(true);
    const { error } = await supabase.from("google_ai_accounts").update(values).eq("id", a.id).select("id").single();
    setBusy(false);
    if (error) { toast({ title: "Could not update Gmail", description: error.message, variant: "destructive" }); return false; }
    onChanged(); return true;
  };
  const save = async () => {
    if (!/^\S+@\S+\.\S+$/.test(f.gmail.trim())) return toast({ title: "Enter a valid Gmail", variant: "destructive" });
    if (f.subscription_start_date && !subscriptionCycle(f.subscription_start_date)) return toast({ title: "Enter a valid subscription date", variant: "destructive" });
    if (await update({ gmail: f.gmail.trim(), password: f.password, subscription_start_date: f.subscription_start_date || null })) setEdit(false);
  };
  const remove = async () => {
    if (mode === "user") {
      if (confirm(`Remove ${a.gmail} from this user? Its saved details will stay in stock.`)) await update({ user_id: null });
      return;
    }
    if (!confirm(`Permanently delete ${a.gmail} from stock?`)) return;
    setBusy(true);
    const { error } = await supabase.from("google_ai_accounts").delete().eq("id", a.id);
    setBusy(false);
    if (error) toast({ title: "Could not remove", description: error.message, variant: "destructive" });
    else onChanged();
  };
  if (edit) return <div className="gmail-panel rounded-lg p-3 space-y-2">
    <label className="block text-xs">Gmail<input className={inputCls} value={f.gmail} onChange={(e) => setF({ ...f, gmail: e.target.value })} /></label>
    <label className="block text-xs">Password<input type={show ? "text" : "password"} className={inputCls} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
    <label className="block text-xs">Subscription start date<input type="date" className={inputCls} value={f.subscription_start_date || ""} onChange={(e) => setF({ ...f, subscription_start_date: e.target.value || null })} /></label>
    <div className="flex gap-2"><Button disabled={busy} onClick={save} className="bg-accent text-accent-foreground hover:bg-accent/90"><Save />Save</Button><Button variant="outline" onClick={() => { setF(a); setEdit(false); }} aria-label="Cancel edit"><X /></Button></div>
  </div>;
  return <article className="gmail-panel rounded-lg p-3 space-y-3 min-w-0" aria-label={`Gmail account ${a.gmail}`}>
    <div className="text-sm font-medium break-all">{a.gmail}</div>
    {extra}
    <div className="flex flex-wrap gap-2 text-xs">
      <span className={a.credits_exhausted ? "text-destructive" : cycle?.status === "reset" ? "gmail-warning" : "text-accent"}>
        {a.credits_exhausted ? "🔴 Credits Exhausted" : !cycle ? "❗ Missing subscription date" : cycle.pending ? "Subscription scheduled" : cycle.status === "reset" ? "🔄 Reset Today" : "🟢 Running"}
      </span>
      <span className={a.enabled ? "text-accent" : "text-destructive"}>{a.enabled ? "🟢 Enabled" : "🔴 Disabled"}</span>
    </div>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {([['credits_exhausted', 'Credits Exhausted'], ['enabled', 'Account Enabled']] as const).map(([field, label]) => <label key={field} className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-xs"><span>{label} <span className="text-muted-foreground">{a[field] ? "ON" : "OFF"}</span></span><Switch aria-label={label} checked={a[field]} disabled={busy} onCheckedChange={(value) => update({ [field]: value })} /></label>)}
    </div>
    <div className="flex items-center gap-2"><span className="flex-1 min-w-0 break-all text-xs font-mono text-muted-foreground">{show ? a.password || "—" : "••••••••"}</span><Button size="icon" variant="outline" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} title={show ? "Hide password" : "Show password"}>{show ? <EyeOff /> : <Eye />}</Button></div>
    <dl className="grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2"><div><dt>Subscription start</dt><dd>{a.subscription_start_date ? new Date(a.subscription_start_date + "T00:00:00").toLocaleDateString() : "Not set"}</dd></div><div><dt>Next scheduled reset</dt><dd>{cycle?.nextReset.toLocaleDateString() || "Not available"}</dd></div><div className="sm:col-span-2">{cycle ? `${cycle.daysLeft} days until next reset` : "Remaining days unavailable"}</div>{a.credits_exhausted && cycle?.status === "reset" && <div className="gmail-warning sm:col-span-2">Reset scheduled today · credits unverified</div>}</dl>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => copy(a.gmail, "Gmail")} className="bg-accent text-accent-foreground hover:bg-accent/90"><Copy />Copy Gmail</Button>
      <Button size="sm" onClick={() => copy(a.password, "Password")} className="bg-accent text-accent-foreground hover:bg-accent/90"><Copy />Copy Password</Button>
      <Button size="icon" variant="outline" onClick={() => setEdit(true)} aria-label="Edit Gmail" title="Edit Gmail"><Pencil /></Button>
      {onReplace && <Button size="icon" variant="outline" onClick={onReplace} aria-label="Replace Gmail" title="Replace Gmail"><Repeat2 /></Button>}
      <Button size="icon" variant="outline" disabled={busy} onClick={remove} className="text-destructive" aria-label="Remove Gmail" title={mode === "user" ? "Return to stock" : "Delete Gmail"}><Trash2 /></Button>
    </div>
  </article>;
};

export default function GmailAccountsManager({ userId }: { userId: string }) {
  const { accounts, refresh, error } = useGmailStock();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState("");
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const list = accounts.filter((a) => a.user_id === userId);
  const stock = accounts.filter((a) => matchesGmailFilter(a, "Available"));
  const assign = async () => {
    if (!pick) return;
    setBusy(true);
    const result = replaceId ? await supabase.rpc("replace_user_gmail", { p_user_id: userId, p_old_id: replaceId, p_new_id: pick }) : await supabase.from("google_ai_accounts").update({ user_id: userId, assigned_at: new Date().toISOString() }).eq("id", pick).is("user_id", null).eq("enabled", true).eq("credits_exhausted", false).select("id").single();
    setBusy(false);
    if (result.error) toast({ title: "Could not assign Gmail", description: result.error.message, variant: "destructive" });
    else { setPick(""); setReplaceId(null); toast({ title: "Gmail assignment saved" }); }
    refresh();
  };
  return <div className="gmail-panel rounded-lg p-3">
    <Button variant="ghost" className="w-full justify-start whitespace-normal px-0 gmail-highlight hover:bg-transparent" onClick={() => setOpen(!open)} aria-expanded={open}><Mail /><span>Google AI Pro Gmail</span><span className="rounded-md bg-secondary px-2">{list.length}</span><ChevronDown className={`ml-auto ${open ? "rotate-180" : ""}`} /></Button>
    {open && <div className="mt-3 space-y-3">
      {error && <p className="text-xs text-destructive">Could not load Gmail accounts.</p>}
      {list.map((a) => <GmailRow key={a.id} a={a} onChanged={refresh} onReplace={() => { setReplaceId(a.id); setPick(""); }} />)}
      {!list.length && !error && <p className="text-xs text-muted-foreground">No Gmail accounts assigned.</p>}
      {replaceId && <div className="flex items-center gap-2 text-xs gmail-highlight">Replacing {list.find((a) => a.id === replaceId)?.gmail}<Button size="icon" variant="ghost" onClick={() => setReplaceId(null)} aria-label="Cancel replacement"><X /></Button></div>}
      <div className="flex flex-col gap-2 sm:flex-row"><select aria-label="Select Gmail from stock" value={pick} onChange={(e) => setPick(e.target.value)} className={inputCls}><option value="">Select Gmail from Stock ({stock.length} available)</option>{stock.map((a) => <option key={a.id} value={a.id}>{a.gmail}</option>)}</select><Button disabled={!pick || busy} onClick={assign} className="bg-accent text-accent-foreground hover:bg-accent/90">{replaceId ? <Repeat2 /> : <Plus />}{replaceId ? "Replace" : "Assign"}</Button></div>
      <p className="text-xs text-muted-foreground">Scheduled reset dates do not confirm Google credits have refreshed.</p>
    </div>}
  </div>;
}
