import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, Copy, Eye, EyeOff, Mail, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { gmailCycle, fmtYmd } from "@/lib/gmail-cycle";

interface Account { id: string; gmail: string; password: string; start_date: string; credits_exhausted: boolean; enabled: boolean }

const today = () => fmtYmd(new Date());
const inputCls = "w-full min-w-0 h-10 rounded-lg px-3 text-sm text-foreground bg-background border border-border";
const tealBtn = { background: "linear-gradient(135deg, #21C7B7, #17a08f)", color: "#050505" };

const copy = async (v: string, what: string) => {
  try { await navigator.clipboard.writeText(v); toast({ title: `${what} copied` }); }
  catch { toast({ title: "Could not copy", variant: "destructive" }); }
};

const Toggle = ({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!on)} role="switch" aria-checked={on}
    className="h-9 px-2 rounded-md border border-border flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
    <span className="truncate">{label}</span>
    <span className="flex items-center gap-1 shrink-0 font-semibold" style={{ color: on ? "#21C7B7" : undefined }}>
      {on ? "ON" : "OFF"}
      <span className="relative h-4 w-7 rounded-full transition-colors" style={{ background: on ? "#21C7B7" : "rgba(255,255,255,0.15)" }}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-background transition-all ${on ? "left-3.5" : "left-0.5"}`} />
      </span>
    </span>
  </button>
);

const Row = ({ a, onChanged }: { a: Account; onChanged: () => void }) => {
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState(a);
  const c = gmailCycle(a.start_date);
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((c.nextReset.getTime() - t0.getTime()) / 86400000);
  const toggle = async (field: "credits_exhausted" | "enabled", value: boolean) => {
    const { error } = await supabase.from("google_ai_accounts").update({ [field]: value }).eq("id", a.id);
    if (error) return toast({ title: "Could not update", description: error.message, variant: "destructive" });
    onChanged();
  };

  const save = async () => {
    if (!/^\S+@\S+\.\S+$/.test(f.gmail.trim())) return toast({ title: "Enter a valid Gmail", variant: "destructive" });
    const { error } = await supabase.from("google_ai_accounts")
      .update({ gmail: f.gmail.trim(), password: f.password, start_date: f.start_date }).eq("id", a.id);
    if (error) return toast({ title: "Could not save", description: error.message, variant: "destructive" });
    setEdit(false); onChanged();
  };
  const remove = async () => {
    if (!confirm(`Remove ${a.gmail}?`)) return;
    const { error } = await supabase.from("google_ai_accounts").delete().eq("id", a.id);
    if (error) return toast({ title: "Could not remove", description: error.message, variant: "destructive" });
    onChanged();
  };

  if (edit) return (
    <div className="rounded-lg border border-border p-2 space-y-2 bg-background/40">
      <input className={inputCls} value={f.gmail} onChange={(e) => setF({ ...f, gmail: e.target.value })} placeholder="Gmail" />
      <input className={inputCls} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="Password" />
      <input type="date" className={inputCls} value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} />
      <div className="flex gap-2">
        <button onClick={save} className="flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={tealBtn}><Save className="h-3.5 w-3.5" />Save</button>
        <button onClick={() => { setF(a); setEdit(false); }} className="h-9 px-3 rounded-lg text-xs border border-border"><X className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );

  return (
    <div className={`rounded-lg border border-border p-2.5 space-y-2 bg-background/40 ${a.enabled ? "" : "opacity-70"}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-1 min-w-0 truncate text-sm text-foreground">{a.gmail}</span>
        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={c.status === "reset"
            ? { background: "rgba(251,191,36,0.12)", color: "#fbbf24" }
            : { background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
          {c.status === "reset" ? "🔄 Reset Today" : "🟢 Running"}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {a.credits_exhausted && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>🔴 Credits Exhausted</span>}
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={a.enabled ? { background: "rgba(34,197,94,0.12)", color: "#22c55e" } : { background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
          {a.enabled ? "🟢 Enabled" : "🔴 Disabled"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Toggle label="Credits Exhausted" on={a.credits_exhausted} onChange={(v) => toggle("credits_exhausted", v)} />
        <Toggle label="Account Enabled" on={a.enabled} onChange={(v) => toggle("enabled", v)} />
      </div>
      <div className="flex items-center gap-2">
        <span className="flex-1 min-w-0 truncate text-xs font-mono text-muted-foreground">{show ? a.password || "—" : "••••••••"}</span>
        <button onClick={() => setShow(!show)} className="h-8 w-8 rounded-md border border-border flex items-center justify-center" aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
        <span>Start: {new Date(a.start_date + "T00:00:00").toLocaleDateString()}</span>
        <span>Next reset: {c.nextReset.toLocaleDateString()}</span>
        <span className="col-span-2">{daysLeft} day{daysLeft === 1 ? "" : "s"} until next reset</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => copy(a.gmail, "Gmail")} className="h-8 px-2.5 rounded-md text-[11px] font-semibold flex items-center gap-1" style={tealBtn}><Copy className="h-3 w-3" />Copy Gmail</button>
        <button onClick={() => copy(a.password, "Password")} className="h-8 px-2.5 rounded-md text-[11px] font-semibold flex items-center gap-1" style={tealBtn}><Copy className="h-3 w-3" />Copy Password</button>
        <button onClick={() => setEdit(true)} className="h-8 w-8 rounded-md border border-border flex items-center justify-center" aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
        <button onClick={remove} className="h-8 w-8 rounded-md border border-destructive/40 text-destructive flex items-center justify-center" aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
};

const GmailAccountsManager = ({ userId }: { userId: string }) => {
  const [list, setList] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [n, setN] = useState({ gmail: "", password: "", start_date: today() });

  const load = async () => {
    const { data } = await supabase.from("google_ai_accounts")
      .select("id, gmail, password, start_date, credits_exhausted, enabled").eq("user_id", userId).order("created_at");
    setList((data as Account[]) || []);
  };
  useEffect(() => { load(); }, [userId]);

  const add = async () => {
    if (!/^\S+@\S+\.\S+$/.test(n.gmail.trim())) return toast({ title: "Enter a valid Gmail", variant: "destructive" });
    const { error } = await supabase.from("google_ai_accounts")
      .insert({ user_id: userId, gmail: n.gmail.trim(), password: n.password, start_date: n.start_date });
    if (error) return toast({ title: "Could not add", description: error.message, variant: "destructive" });
    setN({ gmail: "", password: "", start_date: today() }); setAdding(false); load();
  };

  return (
    <div className="rounded-xl border p-3" style={{ background: "rgba(168,85,247,0.05)", borderColor: "rgba(168,85,247,0.3)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 text-[11px] uppercase tracking-wide" style={{ color: "#c084fc" }}>
        <Mail className="h-3.5 w-3.5" /> Google AI Pro Gmail
        <span className="ml-1 px-1.5 rounded-full text-[10px]" style={{ background: "rgba(168,85,247,0.2)" }}>{list.length}</span>
        <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {list.map((a) => <Row key={a.id + a.start_date + a.gmail + a.password + a.credits_exhausted + a.enabled} a={a} onChanged={load} />)}
          {list.length === 0 && !adding && <p className="text-xs text-muted-foreground">No Gmail accounts yet.</p>}
          {adding ? (
            <div className="rounded-lg border border-border p-2 space-y-2">
              <input className={inputCls} placeholder="Gmail address" value={n.gmail} onChange={(e) => setN({ ...n, gmail: e.target.value })} />
              <input className={inputCls} placeholder="Password" value={n.password} onChange={(e) => setN({ ...n, password: e.target.value })} />
              <label className="block text-[10px] text-muted-foreground">Subscription start date
                <input type="date" className={inputCls + " mt-1"} value={n.start_date} onChange={(e) => setN({ ...n, start_date: e.target.value })} />
              </label>
              <div className="flex gap-2">
                <button onClick={add} className="flex-1 h-9 rounded-lg text-xs font-semibold" style={tealBtn}>Save Gmail</button>
                <button onClick={() => setAdding(false)} className="h-9 px-3 rounded-lg text-xs border border-border">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="w-full h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={tealBtn}>
              <Plus className="h-3.5 w-3.5" /> Add Gmail
            </button>
          )}
          <p className="text-[10px] text-muted-foreground">Reset dates are tracked from the start date only; they don't confirm Google's credits have actually reset.</p>
        </div>
      )}
    </div>
  );
};

export default GmailAccountsManager;
