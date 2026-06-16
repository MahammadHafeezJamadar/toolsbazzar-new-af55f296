import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Lock, Smartphone, Monitor, MessageCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const WHATSAPP = "919448646624";

interface PlanInfo {
  active: boolean;
  plan: string | null;
  expiry: string | null;
}

const Downloads = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanInfo>({ active: false, plan: null, expiry: null });
  const [apkUrl, setApkUrl] = useState<string>("");
  const [winUrl, setWinUrl] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const [{ data: profile }, { data: settings }] = await Promise.all([
        supabase
          .from("profiles")
          .select("plan, subscription_active, expiry_date")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase
          .from("global_settings")
          .select("key, value")
          .in("key", ["flowx_apk_url", "flowx_windows_url"]),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = profile?.expiry_date ? new Date(profile.expiry_date) : null;
      const active = !!profile?.subscription_active && !!exp && exp >= today;

      setPlan({
        active,
        plan: profile?.plan ?? null,
        expiry: profile?.expiry_date ?? null,
      });

      const sanitize = (s: string) => s.trim().replace(/^["'`]+|["'`]+$/g, "").trim();
      const get = (k: string) => {
        const v = settings?.find((s: any) => s.key === k)?.value;
        if (typeof v === "string") return sanitize(v);
        if (v && typeof v === "object" && "url" in v) return sanitize(String((v as any).url ?? ""));
        return "";
      };
      setApkUrl(get("flowx_apk_url"));
      setWinUrl(get("flowx_windows_url"));
      setLoading(false);
    })();
  }, [navigate]);

  const triggerDownload = (url: string, label: string) => {
    if (!url) {
      toast.error(`${label} download link not configured yet. Please contact admin.`);
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = url.split("/").pop() || "";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${label} download started`);
  };

  const contactAdmin = () => {
    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hi, I need help with FlowX downloads.")}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-black/80 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-lg hover:bg-white/5 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1
              className="text-xl font-black tracking-tight"
              style={{
                background: "linear-gradient(135deg, #F5F5F5 0%, #9A9A9A 50%, #E8E8E8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              FlowX Downloads
            </h1>
            <p className="text-[11px] text-neutral-500 tracking-[0.2em] uppercase">
              App Download Center
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 pt-8">
        {!plan.active ? (
          /* ── Locked ── */
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: "#0D0D0D",
              border: "0.5px solid rgba(192,192,192,0.12)",
            }}
          >
            <div
              className="mx-auto w-[72px] h-[72px] rounded-full flex items-center justify-center mb-5"
              style={{
                background: "#1A1A1A",
                border: "0.5px solid rgba(192,192,192,0.1)",
              }}
            >
              <Lock className="w-8 h-8 text-neutral-500" />
            </div>
            <h2
              className="text-3xl font-extrabold mb-3"
              style={{
                background: "linear-gradient(135deg, #F5F5F5 0%, #9A9A9A 50%, #E8E8E8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Downloads Locked
            </h2>
            <p className="text-neutral-400 max-w-md mx-auto leading-relaxed">
              You need an active plan to download FlowX. Please activate a plan or
              contact admin if you've already purchased.
            </p>

            <div className="mt-6 inline-flex flex-col gap-1 text-sm text-neutral-500">
              <div>
                Plan:{" "}
                <span className="text-neutral-300">
                  {plan.plan ? plan.plan.toUpperCase() : "—"}
                </span>
              </div>
              {plan.expiry && (
                <div>
                  Expired/Expires:{" "}
                  <span className="text-neutral-300">{plan.expiry}</span>
                </div>
              )}
            </div>

            <Button
              onClick={contactAdmin}
              className="mt-7 h-12 px-6 font-bold"
              style={{
                background:
                  "linear-gradient(135deg, #F5F5F5 0%, #9A9A9A 50%, #E8E8E8 100%)",
                color: "#000",
                borderRadius: "12px",
              }}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact Admin on WhatsApp
            </Button>
          </div>
        ) : (
          /* ── Active: Download cards ── */
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Download FlowX</h2>
              <span
                className="text-[11px] font-bold tracking-[0.15em] px-3 py-1 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #F5F5F5 0%, #9A9A9A 50%, #E8E8E8 100%)",
                  color: "#000",
                }}
              >
                {(plan.plan || "ACTIVE").toUpperCase()}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Android Card */}
              <div
                className="rounded-2xl p-6 flex flex-col"
                style={{
                  background: "#0D0D0D",
                  border: "0.5px solid rgba(192,192,192,0.12)",
                }}
              >
                <Smartphone className="w-9 h-9 text-neutral-300 mb-3" />
                <h3 className="text-lg font-bold">FlowX for Mobile</h3>
                <p className="text-neutral-500 text-sm mt-1">
                  Android APK — for phones & tablets
                </p>
                <Button
                  onClick={() => triggerDownload(apkUrl, "Android")}
                  className="mt-6 h-12 font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, #F5F5F5 0%, #9A9A9A 50%, #E8E8E8 100%)",
                    color: "#000",
                    borderRadius: "12px",
                  }}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download APK
                </Button>
              </div>

              {/* Windows Card */}
              <div
                className="rounded-2xl p-6 flex flex-col"
                style={{
                  background: "#0D0D0D",
                  border: "0.5px solid rgba(192,192,192,0.12)",
                }}
              >
                <Monitor className="w-9 h-9 text-neutral-300 mb-3" />
                <h3 className="text-lg font-bold">FlowX for Windows</h3>
                <p className="text-neutral-500 text-sm mt-1">
                  Windows — for PC & laptop
                </p>
                <Button
                  onClick={() => triggerDownload(winUrl, "Windows")}
                  className="mt-6 h-12 font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, #F5F5F5 0%, #9A9A9A 50%, #E8E8E8 100%)",
                    color: "#000",
                    borderRadius: "12px",
                  }}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download for Windows
                </Button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-neutral-500 mb-3">
                Facing issues with downloads or installation?
              </p>
              <Button
                onClick={contactAdmin}
                variant="outline"
                className="border-white/15 text-neutral-300 hover:bg-white/5"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Admin
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Downloads;
