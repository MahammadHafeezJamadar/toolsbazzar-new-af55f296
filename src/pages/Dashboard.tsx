import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PlanSelectionModal from "@/components/PlanSelectionModal";
import FlowXExtensionSection from "@/components/FlowXExtensionSection";
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
  LogOut, Shield, KeyRound, Trash2, CreditCard, User, X,
  Home, Crown, Users, CalendarClock, Timer,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Profile {
  id: string;
  email: string;
  name: string;
  plan: string;
  subscription_active: boolean;
  expiry_date: string | null;
  is_admin: boolean | null;
  referral_code: string | null;
  mobile_number: string | null;
  city: string | null;
  created_at: string | null;
}

const TEAL = "#21C7B7";
const TEAL_SOFT = "rgba(33,199,183,0.12)";
const CARD_BG = "#121212";
const CARD_BORDER = "#1c2422";
const FONT_HEAD = "'Sora', sans-serif";
const FONT_BODY = "'Manrope', sans-serif";

/* ─── Dashboard ─── */
const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name, plan, subscription_active, expiry_date, is_admin, referral_code, mobile_number, city, created_at")
        .eq("id", session.user.id)
        .single();

      if (error) toast.error("Failed to load profile");
      else setProfile(data);

      // Load announcement
      const { data: annData } = await supabase
        .from("announcements")
        .select("message")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      if (annData && annData.length > 0) setAnnouncement((annData[0] as any).message);

      setLoading(false);
    };
    getProfile();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });

    // Realtime profile updates
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) return;
      profileChannel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${s.user.id}` },
          (payload) => {
            setProfile((prev) => prev ? { ...prev, ...payload.new } as Profile : prev);
          }
        )
        .subscribe();
    });

    return () => {
      authSub.unsubscribe();
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleChangePassword = async () => {
    const newPass = passwordForm.new.trim();
    const confirmPass = passwordForm.confirm.trim();
    const currentPass = passwordForm.current.trim();

    if (!currentPass || !newPass || !confirmPass) { toast.error("Please fill in all fields"); return; }
    if (newPass.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (newPass !== confirmPass) { toast.error("New passwords do not match"); return; }

    setPasswordLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) { toast.error("Session expired"); setPasswordLoading(false); return; }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: session.user.email, password: currentPass });
    if (signInError) { toast.error("Current password is incorrect"); setPasswordLoading(false); return; }

    const { error } = await supabase.auth.updateUser({ password: newPass });
    setPasswordLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated successfully");
      setPasswordForm({ current: "", new: "", confirm: "" });
      setShowChangePassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Session expired"); setDeleteLoading(false); return; }

    const { error: profileError } = await supabase.from("profiles").delete().eq("id", session.user.id);
    if (profileError) { toast.error("Failed to delete account data"); setDeleteLoading(false); return; }

    await supabase.auth.signOut();
    setDeleteLoading(false);
    toast.success("Account deleted successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050505" }}>
        <div className="h-8 w-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(33,199,183,0.2)", borderTopColor: TEAL }} />
      </div>
    );
  }

  // Derived values
  const hasExpiry = !!profile?.expiry_date;
  const expiryMs = hasExpiry ? new Date(profile!.expiry_date as string).getTime() : 0;
  const rawDaysLeft = hasExpiry ? Math.ceil((expiryMs - Date.now()) / 86400000) : 0;
  const daysLeft = Math.max(0, rawDaysLeft);
  const isExpired = hasExpiry && rawDaysLeft <= 0;
  const isActive = !!profile?.subscription_active && !isExpired;

  const expirySeverity: "green" | "orange" | "red" | "none" = !hasExpiry
    ? "none"
    : isExpired
      ? "red"
      : daysLeft > 10
        ? "green"
        : daysLeft >= 4
          ? "orange"
          : "red";

  const expiryColors = {
    green: { text: TEAL, bg: TEAL_SOFT, border: "rgba(33,199,183,0.35)" },
    orange: { text: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.3)" },
    red: { text: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.4)" },
    none: { text: "#8fa39f", bg: "#0d1211", border: "#1c2422" },
  }[expirySeverity];

  const formattedExpiry = hasExpiry
    ? new Date(profile!.expiry_date as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const showRenewalBanner = hasExpiry && (isExpired || daysLeft < 10);

  const planKey = (profile?.plan || "").trim().toLowerCase();
  const isPrivate = planKey === "private";
  const isShared = planKey === "shared";
  const initials = (profile?.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen pb-16 md:pb-0" style={{ background: "#050505", fontFamily: FONT_BODY }}>
      {/* Desktop Nav */}
      <nav className="sticky top-0 z-50 border-b hidden md:block backdrop-blur-xl" style={{ background: "rgba(5,5,5,0.85)", borderColor: CARD_BORDER }}>
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <button onClick={() => navigate("/")} className="text-lg font-bold bg-transparent border-0 cursor-pointer" style={{ fontFamily: FONT_HEAD, color: "#E8F4F2" }}>
            ToolsBazzar
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Home className="h-4 w-4" /> Home
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <User className="h-4 w-4" /> My Profile
            </Button>
            {profile?.is_admin && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="flex items-center gap-1 text-accent">
                <Shield className="h-4 w-4" /> Admin
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <nav className="sticky top-0 z-50 border-b md:hidden backdrop-blur-xl" style={{ background: "rgba(5,5,5,0.85)", borderColor: CARD_BORDER }}>
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => navigate("/")} className="text-lg font-bold bg-transparent border-0 cursor-pointer" style={{ fontFamily: FONT_HEAD, color: "#E8F4F2" }}>
            ToolsBazzar
          </button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden flex items-center justify-around h-14" style={{ background: "#0a0d0c", borderColor: CARD_BORDER }}>
        <button onClick={() => navigate("/dashboard")} className="flex flex-col items-center gap-0.5 bg-transparent border-0 cursor-pointer" style={{ color: TEAL }}>
          <Home className="h-5 w-5" />
          <span className="text-[10px]">Home</span>
        </button>
        <button onClick={() => navigate("/profile")} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer">
          <User className="h-5 w-5" />
          <span className="text-[10px]">Profile</span>
        </button>
        {profile?.is_admin && (
          <button onClick={() => navigate("/admin")} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer">
            <Shield className="h-5 w-5" />
            <span className="text-[10px]">Admin</span>
          </button>
        )}
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Announcement Banner */}
        {announcement && !announcementDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl p-4 flex items-center justify-between"
            style={{ background: `linear-gradient(135deg, ${TEAL}, #17a08f)`, color: "#04140f" }}
          >
            <div className="flex items-center gap-2 font-medium text-sm">
              <span>📢</span> {announcement}
            </div>
            <button onClick={() => setAnnouncementDismissed(true)} className="ml-3 flex-shrink-0 hover:opacity-70 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Renewal Reminder Banner */}
        {showRenewalBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            style={{
              background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(251,146,60,0.08))",
              borderColor: "rgba(239,68,68,0.4)",
              boxShadow: "0 0 30px rgba(239,68,68,0.1)",
            }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: "#fca5a5" }}>
                {isExpired
                  ? "❌ Your plan has expired!"
                  : `⚠️ Your plan expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}!`}
              </p>
              <p className="text-xs mt-0.5 text-muted-foreground">Contact admin to renew and keep enjoying FlowX.</p>
            </div>
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-xs font-semibold whitespace-nowrap transition-transform hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${TEAL}, #17a08f)`, color: "#04140f" }}
            >
              <CreditCard className="h-4 w-4" /> Renew Plan
            </button>
          </motion.div>
        )}

        {/* Split layout: Profile card + Details */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left — Identity card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 relative overflow-hidden rounded-3xl border p-6 md:p-8"
            style={{
              background: `radial-gradient(140% 100% at 0% 0%, ${TEAL_SOFT} 0%, rgba(33,199,183,0) 55%), ${CARD_BG}`,
              borderColor: CARD_BORDER,
            }}
          >
            <div
              className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full blur-3xl"
              style={{ background: "rgba(33,199,183,0.15)" }}
            />

            <div className="relative flex flex-col items-center text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-2 mb-4"
                style={{
                  fontFamily: FONT_HEAD,
                  background: TEAL_SOFT,
                  borderColor: "rgba(33,199,183,0.4)",
                  color: TEAL,
                  boxShadow: "0 0 40px rgba(33,199,183,0.15)",
                }}
              >
                {initials}
              </div>

              <h1 className="text-xl md:text-2xl font-bold mb-3" style={{ fontFamily: FONT_HEAD, color: "#E8F4F2" }}>
                {profile?.name || "User"}
              </h1>

              <div className="flex items-center gap-2 flex-wrap justify-center mb-6">
                {/* Plan badge */}
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                  style={
                    isPrivate
                      ? { background: TEAL_SOFT, borderColor: "rgba(33,199,183,0.4)", color: TEAL }
                      : isShared
                        ? { background: "rgba(232,244,242,0.06)", borderColor: "rgba(232,244,242,0.2)", color: "#c7d6d3" }
                        : { background: "#0d1211", borderColor: CARD_BORDER, color: "#8fa39f" }
                  }
                >
                  {isPrivate ? <Crown className="h-3 w-3" /> : isShared ? <Users className="h-3 w-3" /> : null}
                  {profile?.plan ? `${profile.plan} Plan` : "No Plan"}
                </span>

                {/* Status badge */}
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                  style={
                    isActive
                      ? { background: TEAL_SOFT, borderColor: "rgba(33,199,183,0.4)", color: TEAL }
                      : { background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.35)", color: "#f87171" }
                  }
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: isActive ? TEAL : "#f87171", boxShadow: isActive ? `0 0 8px ${TEAL}` : "none" }}
                  />
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Account actions */}
              <div className="w-full border-t pt-5 space-y-2" style={{ borderColor: CARD_BORDER }}>
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="w-full h-10 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors hover:bg-[#161d1b]"
                  style={{ borderColor: CARD_BORDER, color: "#9fb3b0" }}
                >
                  <KeyRound className="h-3.5 w-3.5" /> Change Password
                </button>

                {showChangePassword && (
                  <div className="space-y-2.5 p-3 rounded-xl" style={{ background: "#0a0d0c" }}>
                    <div className="text-left">
                      <Label htmlFor="current-password" className="text-[10px] text-muted-foreground">Current Password</Label>
                      <Input id="current-password" type="password" value={passwordForm.current} onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} maxLength={128} className="h-8 text-xs bg-[#101614] border-[#1c2422]" />
                    </div>
                    <div className="text-left">
                      <Label htmlFor="new-password" className="text-[10px] text-muted-foreground">New Password</Label>
                      <Input id="new-password" type="password" value={passwordForm.new} onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))} maxLength={128} className="h-8 text-xs bg-[#101614] border-[#1c2422]" />
                    </div>
                    <div className="text-left">
                      <Label htmlFor="confirm-password" className="text-[10px] text-muted-foreground">Confirm Password</Label>
                      <Input id="confirm-password" type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} maxLength={128} className="h-8 text-xs bg-[#101614] border-[#1c2422]" />
                    </div>
                    <button
                      className="w-full h-9 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: `linear-gradient(135deg, ${TEAL}, #17a08f)`, color: "#04140f" }}
                      onClick={handleChangePassword}
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? "Saving..." : "Save Password"}
                    </button>
                  </div>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="w-full h-10 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors bg-[#160b0b] text-[#f87171] hover:bg-[#1f0f0f] border border-[#2a1414]">
                      <Trash2 className="h-3.5 w-3.5" /> Delete Account
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-[#1c2422]" style={{ background: CARD_BG }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone. Your account and all data will be permanently deleted.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-[#161d1b] border-[#243029] text-foreground hover:bg-[#1c2422]">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} disabled={deleteLoading} className="bg-[#7f1d1d] text-[#fca5a5] hover:bg-[#991b1b]">
                        {deleteLoading ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>

          {/* Right — Plan details + stats */}
          <div className="lg:col-span-3 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-3xl border p-6 md:p-8"
              style={{
                background: CARD_BG,
                borderColor: CARD_BORDER,
                boxShadow: `0 0 40px ${expiryColors.bg}`,
              }}
            >
              <h2 className="text-base font-semibold mb-5 flex items-center gap-2" style={{ fontFamily: FONT_HEAD, color: "#E8F4F2" }}>
                <CalendarClock className="h-4 w-4" style={{ color: TEAL }} /> Plan Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Expiry date */}
                <div className="rounded-2xl border p-4" style={{ background: "#0b0f0e", borderColor: CARD_BORDER }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarClock className="h-3.5 w-3.5" style={{ color: "#6f8580" }} />
                    <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "#6f8580" }}>Expiry Date</span>
                  </div>
                  <div className="text-lg font-bold" style={{ fontFamily: FONT_HEAD, color: "#E8F4F2" }}>{formattedExpiry}</div>
                </div>

                {/* Days remaining */}
                <div className="rounded-2xl border p-4" style={{ background: expiryColors.bg, borderColor: expiryColors.border }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="h-3.5 w-3.5" style={{ color: expiryColors.text }} />
                    <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: expiryColors.text }}>Days Remaining</span>
                  </div>
                  <div className="text-lg font-bold" style={{ fontFamily: FONT_HEAD, color: expiryColors.text }}>
                    {!hasExpiry ? "—" : isExpired ? "Expired" : `${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
                  </div>
                </div>

                {/* Plan type */}
                <div className="rounded-2xl border p-4" style={{ background: "#0b0f0e", borderColor: CARD_BORDER }}>
                  <div className="flex items-center gap-2 mb-2">
                    {isPrivate
                      ? <Crown className="h-3.5 w-3.5" style={{ color: TEAL }} />
                      : <Users className="h-3.5 w-3.5" style={{ color: "#6f8580" }} />}
                    <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "#6f8580" }}>Plan</span>
                  </div>
                  <div className="text-lg font-bold" style={{ fontFamily: FONT_HEAD, color: isPrivate ? TEAL : "#E8F4F2" }}>
                    {profile?.plan || "—"}
                  </div>
                </div>

                {/* Status */}
                <div className="rounded-2xl border p-4" style={{ background: "#0b0f0e", borderColor: CARD_BORDER }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: isActive ? TEAL : "#f87171", boxShadow: isActive ? `0 0 8px ${TEAL}` : "none" }}
                    />
                    <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "#6f8580" }}>Status</span>
                  </div>
                  <div className="text-lg font-bold" style={{ fontFamily: FONT_HEAD, color: isActive ? TEAL : "#f87171" }}>
                    {isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>

              {!isActive && (
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="mt-5 w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
                  style={{
                    background: `linear-gradient(135deg, ${TEAL}, #17a08f)`,
                    color: "#04140f",
                    boxShadow: "0 10px 30px rgba(33,199,183,0.2)",
                  }}
                >
                  <CreditCard className="h-4 w-4" /> {isExpired ? "Renew Plan" : "Activate a Plan"}
                </button>
              )}
            </motion.div>

            {/* FlowX Extension */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <FlowXExtensionSection
                plan={profile?.plan}
                subscriptionActive={profile?.subscription_active}
                expiryDate={profile?.expiry_date}
                name={profile?.name}
                mobileNumber={profile?.mobile_number}
                city={profile?.city}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        userEmail={profile?.email}
      />
    </div>
  );
};

export default Dashboard;
