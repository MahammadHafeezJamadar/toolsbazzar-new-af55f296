import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Gift, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ReferAndEarn = () => {
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const [profileRes, referralsRes] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", session.user.id).single(),
        supabase.from("referrals").select("credits_awarded").eq("referrer_id", session.user.id),
      ]);

      if (profileRes.data?.referral_code) setReferralCode(profileRes.data.referral_code);
      if (referralsRes.data) {
        setReferralCount(referralsRes.data.length);
        setTotalEarned(referralsRes.data.reduce((sum, r) => sum + (r.credits_awarded || 0), 0));
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="glass border-b border-border/30 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-xl font-bold gradient-text">ToolzBazzar</Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" /> Dashboard</Link>
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <Gift className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Refer & Earn</h1>
          <p className="text-muted-foreground text-lg">
            Earn <span className="text-primary font-semibold">200 credits</span> for every friend who joins!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Your friend also gets <span className="font-semibold">100 bonus credits</span> as a welcome gift.
          </p>
        </div>

        {/* Referral Link */}
        <div className="glass rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-3 text-lg">Your Referral Link</h2>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="bg-secondary/50 border-border/50 font-mono text-sm" />
            <Button onClick={handleCopy} variant="outline" className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Your code: <Badge variant="secondary" className="font-mono">{referralCode}</Badge>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-6 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{referralCount}</div>
            <div className="text-sm text-muted-foreground">Friends Referred</div>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <Gift className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{totalEarned}</div>
            <div className="text-sm text-muted-foreground">Credits Earned</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferAndEarn;
