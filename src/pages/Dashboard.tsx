import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import jsPDF from "jspdf";
import UpiPaymentModal from "@/components/UpiPaymentModal";
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
  LogOut, Shield, KeyRound, Trash2, ExternalLink, Download, Gift,
  Zap, CalendarClock, CreditCard, Clock, Copy, Users, ChevronRight, User, X, FileText,
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
  credits_total: number;
  credits_used: number;
  daily_credits_limit: number;
  credits_used_today: number;
  last_reset_date: string | null;
  referral_code: string | null;
  mobile_number: string | null;
  city: string | null;
  created_at: string | null;
}

/* ─── Circular Progress ─── */
const CircularProgress = ({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - pct * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e1e1e"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(174 72% 46%)" />
            <stop offset="100%" stopColor="hsl(150 60% 50%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xl font-bold text-foreground">{label}</span>
        {sublabel && <span className="text-[10px] text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  );
};

/* ─── Dashboard ─── */
const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [referralCredits, setReferralCredits] = useState(0);
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
        .select("id, email, name, plan, subscription_active, expiry_date, is_admin, credits_total, credits_used, daily_credits_limit, credits_used_today, last_reset_date, referral_code, mobile_number, city, created_at")
        .eq("id", session.user.id)
        .single();

      if (error) toast.error("Failed to load profile");
      else setProfile(data);

      // Load referral stats
      const { data: refs } = await supabase
        .from("referrals")
        .select("id, credits_awarded")
        .eq("referrer_id", session.user.id);

      if (refs) {
        setReferralCount(refs.length);
        setReferralCredits(refs.reduce((s, r) => s + (r.credits_awarded ?? 0), 0));
      }

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const EXTENSION_ID = "nkjkofpphngekmnjkdfjhakaegmgcddi";

  const handleOpenGoogleFlow = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in first"); return; }

      const accessToken = session.access_token;
      try {
        (window as any).chrome.runtime.sendMessage(
          EXTENSION_ID,
          { action: "openGoogleFlow", access_token: accessToken },
          (response: any) => {
            const lastErr = (window as any).chrome?.runtime?.lastError;
            if (lastErr) toast.error("Extension not found. Please install the ToolzBazzar extension.");
          }
        );
      } catch {
        toast.error("Chrome extension not detected. Please use Chrome and install the extension.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

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

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("Referral code copied!");
    }
  };

  const handleDownloadInvoice = () => {
    if (!profile) return;
    const planPrices: Record<string, number> = { Basic: 299, Pro: 499, Ultra: 799 };
    const amount = planPrices[profile.plan] || 0;
    const invoiceNo = `TB-${Date.now().toString(36).toUpperCase()}`;
    const activationDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN");
    const expiryDate = profile.expiry_date || "N/A";

    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();

    // Header gradient bar
    doc.setFillColor(0, 180, 160);
    doc.rect(0, 0, w, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("ToolzBazzar", 20, 26);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("AI Video Platform", 20, 34);

    // Invoice title
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", w - 20, 60, { align: "right" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice No: ${invoiceNo}`, w - 20, 68, { align: "right" });
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, w - 20, 74, { align: "right" });

    // Customer info
    let y = 90;
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(profile.name || "User", 20, y); y += 6;
    doc.text(profile.email, 20, y); y += 12;

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y, w - 40, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("Description", 25, y + 7);
    doc.text("Amount", w - 25, y + 7, { align: "right" });
    y += 14;

    // Table row
    doc.setFont("helvetica", "normal");
    doc.text(`${profile.plan} Plan Subscription`, 25, y + 5);
    doc.text(`₹${amount}`, w - 25, y + 5, { align: "right" });
    y += 10;
    doc.setDrawColor(220, 220, 220);
    doc.line(20, y, w - 20, y);
    y += 8;

    // Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total:", w - 70, y + 5);
    doc.text(`₹${amount}`, w - 25, y + 5, { align: "right" });
    y += 20;

    // Details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Plan: ${profile.plan}`, 20, y); y += 6;
    doc.text(`Activation Date: ${activationDate}`, 20, y); y += 6;
    doc.text(`Expiry Date: ${expiryDate}`, 20, y); y += 16;

    // Thank you
    doc.setFontSize(14);
    doc.setTextColor(0, 180, 160);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for your purchase!", w / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("ToolzBazzar — India's #1 Affordable AI Video Platform", w / 2, y, { align: "center" });

    doc.save(`ToolzBazzar-Invoice-${invoiceNo}.pdf`);
    toast.success("Invoice downloaded!");
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Derived values
  const creditsRemaining = (profile?.credits_total ?? 0) - (profile?.credits_used ?? 0);
  const creditsTotal = profile?.credits_total ?? 0;
  const isFinished = creditsRemaining <= 0;

  const today = new Date().toISOString().split("T")[0];
  const isToday = profile?.last_reset_date === today;
  const usedToday = isToday ? (profile?.credits_used_today ?? 0) : 0;
  const dailyLimit = profile?.daily_credits_limit ?? 100;
  const dailyLimitReached = usedToday >= dailyLimit;

  const daysLeft = profile?.expiry_date
    ? Math.max(0, Math.ceil((new Date(profile.expiry_date).getTime() - Date.now()) / 86400000))
    : 0;

  const disabled = dailyLimitReached || isFinished;
  const initials = (profile?.name || profile?.email || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen pb-16 md:pb-0" style={{ background: "#0a0a0a" }}>
      {/* Desktop Nav */}
      <nav className="sticky top-0 z-50 border-b hidden md:block" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <button onClick={() => navigate("/")} className="text-lg font-bold text-foreground bg-transparent border-0 cursor-pointer">ToolzBazzar</button>
          <div className="flex items-center gap-2">
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
      <nav className="sticky top-0 z-50 border-b md:hidden" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => navigate("/")} className="text-lg font-bold text-foreground bg-transparent border-0 cursor-pointer">ToolzBazzar</button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden flex items-center justify-around h-14" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
        <button onClick={() => navigate("/dashboard")} className="flex flex-col items-center gap-0.5 text-accent bg-transparent border-0 cursor-pointer">
          <Zap className="h-5 w-5" />
          <span className="text-[10px]">Home</span>
        </button>
        <button onClick={() => navigate("/profile")} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer">
          <User className="h-5 w-5" />
          <span className="text-[10px]">Profile</span>
        </button>
        <button onClick={() => navigate("/refer")} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer">
          <Gift className="h-5 w-5" />
          <span className="text-[10px]">Refer</span>
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
            style={{
              background: "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))",
              color: "#0a0a0a",
            }}
          >
            <div className="flex items-center gap-2 font-medium text-sm">
              <span>📢</span> {announcement}
            </div>
            <button onClick={() => setAnnouncementDismissed(true)} className="ml-3 flex-shrink-0 hover:opacity-70 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome back, <span className="gradient-text">{profile?.name || "User"}</span>!
          </h1>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border"
              style={{
                background: "linear-gradient(135deg, hsla(174, 72%, 46%, 0.15), hsla(150, 60%, 50%, 0.15))",
                borderColor: "hsla(174, 72%, 46%, 0.3)",
                color: "hsl(174 72% 56%)",
                boxShadow: "0 0 20px hsla(174, 72%, 46%, 0.1)",
              }}
            >
              {profile?.plan || "Free"} Plan
            </span>
            {profile?.expiry_date && (
              <span className="text-xs text-muted-foreground">
                Expires in <span className="text-foreground font-medium">{daysLeft} days</span>
              </span>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <StatCard icon={Zap} label="Credits Left" value={creditsRemaining.toLocaleString()} sub={`of ${creditsTotal.toLocaleString()}`} color="accent" />
          <StatCard icon={CalendarClock} label="Daily Used" value={`${usedToday}`} sub={`of ${dailyLimit} limit`} color="accent" />
          <StatCard
            icon={CreditCard}
            label="Status"
            value={profile?.subscription_active ? "Active" : "Inactive"}
            sub={profile?.plan || "—"}
            color={profile?.subscription_active ? "green" : "red"}
          />
          <StatCard icon={Clock} label="Days Left" value={String(daysLeft)} sub="in current plan" color="accent" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl p-6 border"
              style={{ background: "#111111", borderColor: "#1e1e1e" }}
            >
              <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
              {profile?.subscription_active ? (
                <div className="space-y-3">
                  <button
                    onClick={handleOpenGoogleFlow}
                    disabled={disabled}
                    className="w-full h-12 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: disabled ? "#1e1e1e" : "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))",
                      color: disabled ? "#666" : "#0a0a0a",
                      boxShadow: disabled ? "none" : "0 0 30px hsla(174, 72%, 46%, 0.2)",
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {dailyLimitReached ? "Daily Limit Reached" : isFinished ? "No Credits" : "Open Google Flow"}
                  </button>

                  {(() => {
                    const profileComplete = !!(profile?.name && profile?.mobile_number && profile?.city);
                    if (!profileComplete) {
                      return (
                        <div className="rounded-lg border p-4" style={{ background: "#1a1a00", borderColor: "#3d3d00" }}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">⚠️</span>
                            <span className="text-sm font-semibold" style={{ color: "#fbbf24" }}>Please complete your profile first!</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">Fill in your Full Name, Mobile Number, and City to download the extension.</p>
                          <button
                            onClick={() => navigate("/profile")}
                            className="w-full h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                            style={{ background: "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))", color: "#0a0a0a" }}
                          >
                            Complete Profile
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            const plan = profile?.plan?.toLowerCase();
                            const url = plan === "ultra"
                              ? "https://github.com/MahammadHafeezJamadar/toolsbazzar/raw/main/ToolzBazzar-Ultra-FINAL.zip"
                              : plan === "pro"
                              ? "https://github.com/MahammadHafeezJamadar/toolsbazzar/raw/main/ToolzBazzar-Pro-FINAL.zip"
                              : "https://github.com/MahammadHafeezJamadar/toolsbazzar/raw/main/ToolzBazzar-Basic-FINAL.zip";
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "";
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            toast.success("Download started!");
                          }}
                          className="h-10 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#1a1a1a] transition-colors"
                          style={{ borderColor: "#1e1e1e", color: "#999" }}
                        >
                          <Download className="h-3.5 w-3.5" /> {profile?.plan?.toLowerCase() === "ultra" ? "Ultra" : profile?.plan?.toLowerCase() === "pro" ? "Pro" : "Basic"} Extension
                        </button>
                        <button
                          onClick={() => navigate("/refer")}
                          className="h-10 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#1a1a1a] transition-colors"
                          style={{ borderColor: "#1e1e1e", color: "#999" }}
                        >
                          <Gift className="h-3.5 w-3.5" /> Refer & Earn
                        </button>
                        <button
                          onClick={handleDownloadInvoice}
                          className="h-10 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#1a1a1a] transition-colors col-span-2"
                          style={{ borderColor: "#1e1e1e", color: "#999" }}
                        >
                          <FileText className="h-3.5 w-3.5" /> Download Invoice
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your subscription is inactive. Contact us to activate your plan.
                  </p>
                  <button
                    onClick={() => window.open("https://wa.me/919448646624", "_blank", "noopener,noreferrer")}
                    className="w-full h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                    style={{ background: "hsl(142 70% 45%)", color: "#fff" }}
                  >
                    Contact on WhatsApp
                  </button>
                </div>
              )}
            </motion.div>

            {/* Credits Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl p-6 border"
              style={{ background: "#111111", borderColor: "#1e1e1e" }}
            >
              <h2 className="text-lg font-semibold text-foreground mb-6">Credits Overview</h2>
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative">
                  <CircularProgress
                    value={creditsRemaining}
                    max={creditsTotal}
                    size={140}
                    strokeWidth={10}
                    label={creditsRemaining.toLocaleString()}
                    sublabel="remaining"
                  />
                </div>
                <div className="flex-1 w-full space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">Total Credits</span>
                      <span className="text-xs font-medium text-foreground">{(profile?.credits_used ?? 0).toLocaleString()} / {creditsTotal.toLocaleString()}</span>
                    </div>
                    <Progress value={creditsTotal > 0 ? ((profile?.credits_used ?? 0) / creditsTotal) * 100 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">Daily Usage</span>
                      <span className="text-xs font-medium text-foreground">{usedToday} / {dailyLimit}</span>
                    </div>
                    <Progress value={dailyLimit > 0 ? (usedToday / dailyLimit) * 100 : 0} className="h-2" />
                    <p className="text-[10px] text-muted-foreground mt-1">Resets at midnight</p>
                  </div>
                  {isFinished && (
                    <div className="rounded-lg p-3 border" style={{ background: "#1a0a0a", borderColor: "#331111" }}>
                      <p className="text-xs text-[#f87171] font-medium">Credits finished — contact admin for more.</p>
                    </div>
                  )}
                  {dailyLimitReached && !isFinished && (
                    <div className="rounded-lg p-3 border" style={{ background: "#1a1500", borderColor: "#332200" }}>
                      <p className="text-xs text-[#fbbf24] font-medium">Daily limit reached — come back tomorrow!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-xl p-6 border"
              style={{ background: "#111111", borderColor: "#1e1e1e" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border"
                  style={{
                    background: "linear-gradient(135deg, hsla(174, 72%, 46%, 0.15), hsla(150, 60%, 50%, 0.15))",
                    borderColor: "hsla(174, 72%, 46%, 0.3)",
                    color: "hsl(174 72% 56%)",
                  }}
                >
                  {initials}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{profile?.name || "User"}</div>
                  <div className="text-xs text-muted-foreground">{profile?.email}</div>
                </div>
              </div>

              <div className="space-y-2.5 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium text-foreground">{profile?.plan || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    profile?.subscription_active
                      ? "bg-[#0d3320] text-[#34d399]"
                      : "bg-[#331111] text-[#f87171]"
                  }`}>
                    {profile?.subscription_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expiry</span>
                  <span className="font-medium text-foreground">{profile?.expiry_date || "N/A"}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2" style={{ borderColor: "#1e1e1e" }}>
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="w-full h-9 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#1a1a1a] transition-colors"
                  style={{ borderColor: "#1e1e1e", color: "#999" }}
                >
                  <KeyRound className="h-3.5 w-3.5" /> Change Password
                </button>

                {showChangePassword && (
                  <div className="space-y-2.5 p-3 rounded-lg" style={{ background: "#0a0a0a" }}>
                    <div>
                      <Label htmlFor="current-password" className="text-[10px] text-muted-foreground">Current Password</Label>
                      <Input id="current-password" type="password" value={passwordForm.current} onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} maxLength={128} className="h-8 text-xs bg-[#111] border-[#1e1e1e]" />
                    </div>
                    <div>
                      <Label htmlFor="new-password" className="text-[10px] text-muted-foreground">New Password</Label>
                      <Input id="new-password" type="password" value={passwordForm.new} onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))} maxLength={128} className="h-8 text-xs bg-[#111] border-[#1e1e1e]" />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password" className="text-[10px] text-muted-foreground">Confirm Password</Label>
                      <Input id="confirm-password" type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} maxLength={128} className="h-8 text-xs bg-[#111] border-[#1e1e1e]" />
                    </div>
                    <button
                      className="w-full h-8 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))", color: "#0a0a0a" }}
                      onClick={handleChangePassword}
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? "Saving..." : "Save Password"}
                    </button>
                  </div>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="w-full h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors bg-[#1a0a0a] text-[#f87171] hover:bg-[#2a1111] border border-[#331111]">
                      <Trash2 className="h-3.5 w-3.5" /> Delete Account
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-[#1e1e1e]" style={{ background: "#111111" }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone. Your account and all data will be permanently deleted.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-[#1e1e1e] border-[#2a2a2a] text-foreground hover:bg-[#2a2a2a]">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} disabled={deleteLoading} className="bg-[#7f1d1d] text-[#fca5a5] hover:bg-[#991b1b]">
                        {deleteLoading ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>

            {/* Refer & Earn Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-xl p-6 border relative overflow-hidden"
              style={{
                background: "#111111",
                borderColor: "hsla(174, 72%, 46%, 0.2)",
                boxShadow: "0 0 40px hsla(174, 72%, 46%, 0.05)",
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle, hsl(174 72% 46%), transparent)" }} />
              <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                <Gift className="h-4 w-4 text-accent" /> Refer & Earn
              </h3>
              <p className="text-[11px] text-muted-foreground mb-4">Earn 200 credits for every friend who joins</p>

              {profile?.referral_code && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 h-9 rounded-lg px-3 flex items-center text-xs font-mono text-foreground border" style={{ background: "#0a0a0a", borderColor: "#1e1e1e" }}>
                    {profile.referral_code}
                  </div>
                  <button
                    onClick={copyReferralCode}
                    className="h-9 w-9 rounded-lg flex items-center justify-center border hover:bg-[#1a1a1a] transition-colors"
                    style={{ borderColor: "#1e1e1e", color: "#999" }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3 text-center" style={{ background: "#0a0a0a" }}>
                  <div className="text-lg font-bold text-foreground">{referralCount}</div>
                  <div className="text-[10px] text-muted-foreground">Friends Referred</div>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ background: "#0a0a0a" }}>
                  <div className="text-lg font-bold gradient-text">{referralCredits}</div>
                  <div className="text-[10px] text-muted-foreground">Credits Earned</div>
                </div>
              </div>

              <button
                onClick={() => navigate("/refer")}
                className="mt-4 w-full h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border hover:bg-[#1a1a1a] transition-colors"
                style={{ borderColor: "hsla(174, 72%, 46%, 0.3)", color: "hsl(174 72% 56%)" }}
              >
                View Referral Page <ChevronRight className="h-3 w-3" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: string;
}) => {
  const colorMap: Record<string, string> = {
    accent: "hsl(174 72% 46%)",
    green: "#34d399",
    red: "#f87171",
  };
  const c = colorMap[color] || colorMap.accent;

  return (
    <div className="rounded-xl p-4 border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${c}15` }}>
          <Icon className="h-3.5 w-3.5" style={{ color: c }} />
        </div>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
};

export default Dashboard;
