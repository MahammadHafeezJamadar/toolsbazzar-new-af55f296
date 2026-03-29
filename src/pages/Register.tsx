import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { saveDeviceSession } from "@/lib/device-session";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) {
        if (error.message === "Failed to fetch" || error.message.includes("fetch")) {
          setAuthError("Server is busy, please try again in 2 minutes");
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Process referral if code provided
      if (referralCode.trim() && data.user) {
        const { error: refError } = await supabase.rpc("process_referral", {
          referral_code_input: referralCode.trim().toUpperCase(),
          new_user_id: data.user.id,
        });
        if (refError) {
          console.warn("Referral processing failed:", refError.message);
        } else {
          toast.success("🎉 You received 100 bonus credits from referral!");
        }
      }

      if (data.user) {
        await saveDeviceSession(data.user.id, data.user.email || email);
      }
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch {
      setAuthError("Server is busy, please try again in 2 minutes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
      <div className="w-full max-w-md glass rounded-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold gradient-text">ToolsBazzar</Link>
          <h1 className="text-xl font-semibold mt-4">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start creating AI videos today</p>
        </div>
        {authError && (
          <div className="rounded-lg p-3 bg-destructive/10 border border-destructive/30 flex items-center justify-between gap-2 mb-4">
            <p className="text-sm text-destructive">{authError}</p>
            <button type="button" onClick={() => handleRegister()} className="flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 bg-secondary/50 border-border/50" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 bg-secondary/50 border-border/50" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-secondary/50 border-border/50 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative mt-1">
              <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="bg-secondary/50 border-border/50 pr-10" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="referralCode">Referral Code (optional)</Label>
            <Input id="referralCode" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Enter referral code" className="mt-1 bg-secondary/50 border-border/50 font-mono uppercase" />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-btn border-0 text-primary-foreground font-semibold">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : "Create Account"}
          </Button>
        </form>
        <p className="text-sm text-center text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
