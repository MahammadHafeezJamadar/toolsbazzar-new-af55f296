import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Eye, Pencil, Plus, Search, ShieldCheck, UserCheck, UserX, Users, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  plan: string | null;
  subscription_active: boolean;
  video_remaining?: number | null;
  plan_start_date?: string | null;
  expiry_date: string | null;
  created_at: string | null;
}

type DisplayStatus = "active" | "expired" | "suspended";
type FormState = {
  name: string;
  email: string;
  password: string;
  plan: string;
  status: "active" | "suspended";
  videoRemaining: string;
  startDate: string;
  expiryDate: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  plan: "Shared",
  status: "active",
  videoRemaining: "0",
  startDate: new Date().toISOString().slice(0, 10),
  expiryDate: "",
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const getStatus = (user: ManagedUser): DisplayStatus => {
  if (!user.subscription_active) return "suspended";
  if (user.expiry_date && new Date(`${user.expiry_date}T23:59:59`).getTime() < startOfToday().getTime()) return "expired";
  return "active";
};

const getRemainingDays = (expiryDate: string | null) => {
  if (!expiryDate) return null;
  return Math.max(0, Math.ceil((new Date(`${expiryDate}T23:59:59`).getTime() - startOfToday().getTime()) / 86_400_000));
};

const statusClasses: Record<DisplayStatus, string> = {
  active: "border-accent/30 bg-accent/10 text-accent",
  expired: "border-destructive/30 bg-destructive/10 text-destructive",
  suspended: "border-border bg-muted text-muted-foreground",
};

const StatusBadge = ({ status }: { status: DisplayStatus }) => (
  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[status]}`}>
    {status}
  </span>
);

const MetricCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) => (
  <div className="glass rounded-lg border-border/70 p-4 transition-colors hover:border-accent/30">
    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md border border-accent/20 bg-accent/10 text-accent">
      <Icon className="h-4 w-4" />
    </div>
    <div className="text-2xl font-bold text-foreground">{value.toLocaleString()}</div>
    <div className="mt-1 text-xs text-muted-foreground">{label}</div>
  </div>
);

const UserFormFields = ({ form, setForm, creating }: { form: FormState; setForm: (value: FormState) => void; creating: boolean }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} required /></div>
    <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!creating} required /></div>
    {creating && <div className="space-y-1.5 sm:col-span-2"><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} autoComplete="new-password" required /></div>}
    <div className="space-y-1.5"><Label>Plan Type</Label><Select value={form.plan} onValueChange={(plan) => setForm({ ...form, plan })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Shared">Shared</SelectItem><SelectItem value="Private">Private</SelectItem></SelectContent></Select></div>
    <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(status: "active" | "suspended") => setForm({ ...form, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select></div>
    <div className="space-y-1.5"><Label>Videos Remaining</Label><Input type="number" min={0} step={1} value={form.videoRemaining} onChange={(e) => setForm({ ...form, videoRemaining: e.target.value })} required /></div>
    <div className="space-y-1.5"><Label>Plan Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
    <div className="space-y-1.5 sm:col-span-2"><Label>Plan Expiry Date</Label><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
  </div>
);

export default function UserManagement({ users, onRefresh }: { users: ManagedUser[]; onRefresh: () => Promise<void> }) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [viewing, setViewing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const channel = supabase.channel("admin-profile-changes").on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => { void onRefresh(); }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [onRefresh]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => getStatus(user) === "active").length,
    expired: users.filter((user) => getStatus(user) === "expired").length,
    suspended: users.filter((user) => getStatus(user) === "suspended").length,
    privateUsers: users.filter((user) => user.plan?.toLowerCase() === "private").length,
    sharedUsers: users.filter((user) => user.plan?.toLowerCase() === "shared").length,
    videos: users.reduce((sum, user) => sum + Math.max(0, user.video_remaining ?? 0), 0),
  }), [users]);

  const filtered = useMemo(() => users.filter((user) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || (user.name || "").toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    const matchesPlan = planFilter === "all" || user.plan?.toLowerCase() === planFilter;
    const matchesStatus = statusFilter === "all" || getStatus(user) === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  }), [users, search, planFilter, statusFilter]);

  const validate = () => {
    const videos = Number(form.videoRemaining);
    if (!form.name.trim() || !form.email.trim()) return "Name and email are required";
    if (!Number.isInteger(videos) || videos < 0) return "Videos remaining must be a non-negative whole number";
    if (form.startDate && form.expiryDate && form.expiryDate < form.startDate) return "Expiry date cannot be before the start date";
    if (!editing && form.password.length < 8) return "Password must be at least 8 characters";
    return null;
  };

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, startDate: new Date().toISOString().slice(0, 10) }); setCreateOpen(true); };
  const openEdit = (user: ManagedUser) => {
    setEditing(user);
    setForm({ name: user.name || "", email: user.email, password: "", plan: user.plan === "Private" ? "Private" : "Shared", status: user.subscription_active ? "active" : "suspended", videoRemaining: String(user.video_remaining ?? 0), startDate: user.plan_start_date || "", expiryDate: user.expiry_date || "" });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) { toast.error(validationError); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), plan: form.plan, subscription_active: form.status === "active", video_remaining: Number(form.videoRemaining), plan_start_date: form.startDate || null, expiry_date: form.expiryDate || null };
    if (editing) {
      const { error } = await supabase.from("profiles").update(payload as never).eq("id", editing.id);
      if (error) toast.error(error.message || "Failed to update user");
      else { toast.success("User updated"); setEditing(null); await onRefresh(); }
    } else {
      const { data, error } = await supabase.functions.invoke("create-user", { body: { ...payload, email: form.email.trim().toLowerCase(), password: form.password } });
      if (error || data?.error) toast.error(data?.error || error?.message || "Failed to create user");
      else { toast.success("User created"); setCreateOpen(false); setForm(emptyForm); await onRefresh(); }
    }
    setSaving(false);
  };

  const toggleSuspension = async (user: ManagedUser) => {
    const { error } = await supabase.from("profiles").update({ subscription_active: !user.subscription_active }).eq("id", user.id);
    if (error) toast.error("Status update failed");
    else { toast.success(user.subscription_active ? "User suspended" : "User activated"); await onRefresh(); }
  };

  const UserActions = ({ user }: { user: ManagedUser }) => (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewing(user)} title="View user"><Eye className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)} title="Edit user"><Pencil className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => void toggleSuspension(user)} title={user.subscription_active ? "Suspend user" : "Activate user"}>{user.subscription_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase text-accent">FlowX Control Center</p><h1 className="mt-1 text-2xl font-bold text-foreground">User Management</h1><p className="mt-1 text-sm text-muted-foreground">Manage access, plans, expiry dates, and video balances.</p></div>
        <Button onClick={openCreate} className="gradient-btn w-full font-semibold sm:w-auto"><Plus className="h-4 w-4" /> Add User</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <MetricCard icon={Users} label="Total Users" value={stats.total} /><MetricCard icon={UserCheck} label="Active Users" value={stats.active} /><MetricCard icon={CalendarDays} label="Expired Users" value={stats.expired} /><MetricCard icon={UserX} label="Suspended Users" value={stats.suspended} /><MetricCard icon={ShieldCheck} label="Private Users" value={stats.privateUsers} /><MetricCard icon={Users} label="Shared Users" value={stats.sharedUsers} /><MetricCard icon={Video} label="Videos Remaining" value={stats.videos} />
      </div>

      <div className="glass rounded-lg border-border/70">
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[1fr_180px_180px]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search users by name or email" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={planFilter} onValueChange={setPlanFilter}><SelectTrigger><SelectValue placeholder="Plan" /></SelectTrigger><SelectContent><SelectItem value="all">All plans</SelectItem><SelectItem value="private">Private</SelectItem><SelectItem value="shared">Shared</SelectItem></SelectContent></Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="expired">Expired</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[920px] text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase text-muted-foreground"><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Videos</th><th className="px-4 py-3">Expiry</th><th className="px-4 py-3">Remaining</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody>{filtered.map((user) => { const remaining = getRemainingDays(user.expiry_date); return <tr key={user.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"><td className="px-4 py-4 font-semibold text-foreground">{user.name || "Unnamed"}</td><td className="px-4 py-4 text-muted-foreground">{user.email}</td><td className="px-4 py-4"><span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs">{user.plan || "—"}</span></td><td className="px-4 py-4"><StatusBadge status={getStatus(user)} /></td><td className="px-4 py-4 font-semibold">{Math.max(0, user.video_remaining ?? 0)}</td><td className="px-4 py-4 text-muted-foreground">{user.expiry_date || "No expiry"}</td><td className="px-4 py-4">{remaining === null ? "—" : `${remaining} days`}</td><td className="px-4 py-4"><div className="flex justify-end"><UserActions user={user} /></div></td></tr>; })}</tbody></table>
        </div>

        <div className="divide-y divide-border md:hidden">{filtered.map((user) => { const remaining = getRemainingDays(user.expiry_date); return <div key={user.id} className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-foreground">{user.name || "Unnamed"}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div><StatusBadge status={getStatus(user)} /></div><div className="grid grid-cols-2 gap-2 text-xs"><div><span className="text-muted-foreground">Plan</span><p className="mt-1 font-medium">{user.plan || "—"}</p></div><div><span className="text-muted-foreground">Videos</span><p className="mt-1 font-medium">{Math.max(0, user.video_remaining ?? 0)}</p></div><div><span className="text-muted-foreground">Expiry</span><p className="mt-1 font-medium">{user.expiry_date || "No expiry"}</p></div><div><span className="text-muted-foreground">Remaining</span><p className="mt-1 font-medium">{remaining === null ? "—" : `${remaining} days`}</p></div></div><UserActions user={user} /></div>; })}</div>
        {filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No users match these filters.</div>}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-5"><UserFormFields form={form} setForm={setForm} creating /><Button type="submit" disabled={saving} className="gradient-btn w-full">{saving ? "Creating..." : "Create User"}</Button></form></DialogContent></Dialog>
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-5"><UserFormFields form={form} setForm={setForm} creating={false} /><Button type="submit" disabled={saving} className="gradient-btn w-full">{saving ? "Saving..." : "Save Changes"}</Button></form></DialogContent></Dialog>
      <Dialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{viewing?.name || "User Details"}</DialogTitle></DialogHeader>{viewing && <div className="grid grid-cols-2 gap-3 text-sm"><div className="col-span-2 rounded-md bg-muted p-3"><span className="text-xs text-muted-foreground">Email</span><p className="mt-1 break-all">{viewing.email}</p></div><div className="rounded-md bg-muted p-3"><span className="text-xs text-muted-foreground">Plan</span><p className="mt-1 font-semibold">{viewing.plan || "—"}</p></div><div className="rounded-md bg-muted p-3"><span className="text-xs text-muted-foreground">Status</span><div className="mt-1"><StatusBadge status={getStatus(viewing)} /></div></div><div className="rounded-md bg-muted p-3"><span className="text-xs text-muted-foreground">Videos Remaining</span><p className="mt-1 font-semibold">{Math.max(0, viewing.video_remaining ?? 0)}</p></div><div className="rounded-md bg-muted p-3"><span className="text-xs text-muted-foreground">Remaining Days</span><p className="mt-1 font-semibold">{getRemainingDays(viewing.expiry_date) ?? "—"}</p></div><div className="rounded-md bg-muted p-3"><span className="text-xs text-muted-foreground">Plan Start</span><p className="mt-1">{viewing.plan_start_date || "—"}</p></div><div className="rounded-md bg-muted p-3"><span className="text-xs text-muted-foreground">Plan Expiry</span><p className="mt-1">{viewing.expiry_date || "—"}</p></div></div>}</DialogContent></Dialog>
    </div>
  );
}