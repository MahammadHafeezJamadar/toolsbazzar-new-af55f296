import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackDeviceSession } from "@/lib/device-tracking";
import { saveDeviceSession } from "@/lib/device-session";
import SecurityLockoutOverlay from "@/components/SecurityLockoutOverlay";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lockout, setLockout] = useState<{ locked: boolean; reason?: string; deviceBrand?: string; deviceType?: string } | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message === "Failed to fetch" || error.message.includes("fetch")) {
          setAuthError("Server is busy, please try again in 2 minutes");
        } else {
          toast.error(error.message);
        }
      } else if (data.user) {
        try {
          const result = await trackDeviceSession(data.user.id, data.user.email || email);
          if (result.locked) {
            await supabase.auth.signOut();
            setLockout(result);
            setLoading(false);
            return;
          }
        } catch {
          // Session tracking failed (e.g. 409 conflict) — proceed with login anyway
        }
        try {
          await saveDeviceSession(data.user.id, data.user.email || email);
        } catch {
          // Non-critical, ignore
        }
        navigate("/dashboard");
      }
    } catch {
      setAuthError("Server is busy, please try again in 2 minutes");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) { toast.error("Please enter your email"); return; }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setResetSent(true);
    }
  };

  if (lockout?.locked) {
    return <SecurityLockoutOverlay deviceBrand={lockout.deviceBrand} deviceType={lockout.deviceType} reason={lockout.reason} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="w-full max-w-md glass rounded-2xl p-8 relative z-10">
        {forgotMode ? (
          <>
            <button
              onClick={() => { setForgotMode(false); setResetSent(false); setResetEmail(""); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </button>
            <div className="text-center mb-6">
              <Link to="/" className="text-2xl font-bold gradient-text">ToolsBazzar</Link>
              <h1 className="text-xl font-semibold mt-4">Reset your password</h1>
              <p className="text-sm text-muted-foreground mt-1">Enter your registered email. We'll send you a reset link.</p>
            </div>
            {resetSent ? (
              <div className="text-center space-y-4">
                <div className="rounded-lg p-4 bg-[#0d3320] border border-[#34d399]/30">
                  <p className="text-sm text-[#34d399]">✅ Reset link sent! Check your email inbox (also check spam folder).</p>
                </div>
                <button
                  onClick={() => { setForgotMode(false); setResetSent(false); setResetEmail(""); }}
                  className="text-sm text-primary hover:underline"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Label htmlFor="resetEmail">Email</Label>
                  <Input id="resetEmail" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required className="mt-1 bg-secondary/50 border-border/50" placeholder="Enter your email" />
                </div>
                <Button type="submit" disabled={resetLoading} className="w-full gradient-btn border-0 text-primary-foreground font-semibold">
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            )}
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <Link to="/" className="text-2xl font-bold gradient-text">ToolsBazzar</Link>
              <h1 className="text-xl font-semibold mt-4">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
            </div>
            {authError && (
              <div className="rounded-lg p-3 bg-destructive/10 border border-destructive/30 flex items-center justify-between gap-2">
                <p className="text-sm text-destructive">{authError}</p>
                <button type="button" onClick={() => handleLogin()} className="flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap">
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 bg-secondary/50 border-border/50" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-secondary/50 border-border/50 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button type="button" onClick={() => { setForgotMode(true); setResetEmail(email); }} className="text-xs text-primary hover:underline mt-1.5 block ml-auto">
                  Forgot Password?
                </button>
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-btn border-0 text-primary-foreground font-semibold">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : "Sign In"}
              </Button>
            </form>
            <p className="text-sm text-center text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">Sign up</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
