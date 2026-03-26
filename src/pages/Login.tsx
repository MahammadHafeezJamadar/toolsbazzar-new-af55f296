import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackDeviceSession } from "@/lib/device-tracking";
import SecurityLockoutOverlay from "@/components/SecurityLockoutOverlay";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockout, setLockout] = useState<{ locked: boolean; reason?: string; deviceBrand?: string; deviceType?: string } | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      // Track device session and check for lockout
      const result = await trackDeviceSession(data.user.id, data.user.email || email);
      if (result.locked) {
        // Sign out immediately
        await supabase.auth.signOut();
        setLockout(result);
      } else {
        navigate("/dashboard");
      }
    }
  };

  if (lockout?.locked) {
    return <SecurityLockoutOverlay deviceBrand={lockout.deviceBrand} deviceType={lockout.deviceType} reason={lockout.reason} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="w-full max-w-md glass rounded-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold gradient-text">ToolsBazzar</Link>
          <h1 className="text-xl font-semibold mt-4">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 bg-secondary/50 border-border/50" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 bg-secondary/50 border-border/50" />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-btn border-0 text-primary-foreground font-semibold">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <p className="text-sm text-center text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
