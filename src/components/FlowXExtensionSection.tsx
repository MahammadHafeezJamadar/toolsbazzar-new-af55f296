import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Lock, Puzzle, Crown, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const PRIVATE_EXTENSION_URL =
  "https://github.com/MahammadHafeezJamadar/FlowX_/releases/download/Extensions/FlowX_Extension_Private.zip";
const SHARED_EXTENSION_URL =
  "https://github.com/MahammadHafeezJamadar/FlowX_/releases/download/Extensions/FlowX_Extension._.Shared.zip";

interface Props {
  plan?: string | null;
  subscriptionActive?: boolean | null;
  expiryDate?: string | null;
  name?: string | null;
  mobileNumber?: string | null;
  city?: string | null;
}

const FlowXExtensionSection = ({ plan, subscriptionActive, expiryDate, name, mobileNumber, city }: Props) => {
  const navigate = useNavigate();

  const planKey = (plan || "").trim().toLowerCase();
  const isPrivate = planKey === "private";
  const isShared = planKey === "shared";
  if (!isPrivate && !isShared) return null;

  if (!subscriptionActive) return null;
  if (expiryDate && new Date(expiryDate).getTime() < Date.now()) return null;

  const profileComplete = !!(name && mobileNumber && city);
  const asset = isPrivate ? privateAsset : sharedAsset;

  const accent = isPrivate ? "#c9a227" : "#c0c6cc";
  const accentSoft = isPrivate ? "rgba(201,162,39,0.14)" : "rgba(192,198,204,0.12)";

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = asset.url;
    a.download = asset.original_filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Extension download started!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border backdrop-blur-xl p-5 sm:p-7"
      style={{
        borderColor: "#1c1c1c",
        background:
          "radial-gradient(120% 100% at 0% 0%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 55%), #0b0b0b",
      }}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full blur-3xl"
        style={{ background: accentSoft }}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div
          className="h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center border"
          style={{
            borderColor: `${accent}40`,
            background: `linear-gradient(140deg, ${accentSoft}, rgba(255,255,255,0.02))`,
            color: accent,
          }}
        >
          <Puzzle className="h-7 w-7" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">FlowX Extension</h2>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase border"
              style={{ color: accent, borderColor: `${accent}55`, background: accentSoft }}
            >
              {isPrivate ? <Crown className="h-3 w-3" /> : <Users className="h-3 w-3" />}
              {isPrivate ? "Private" : "Shared"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
            {isPrivate
              ? "Your exclusive Private build, licensed to your account."
              : "Your Shared plan build, ready to install in Chrome."}
          </p>
        </div>
      </div>

      <div
        className="relative mt-5 rounded-xl border p-4"
        style={{ borderColor: "#1a1a1a", background: "rgba(255,255,255,0.02)" }}
      >
        {profileComplete ? (
          <>
            <div className="flex items-center gap-2 text-xs mb-3" style={{ color: "#8f9499" }}>
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: accent }} />
              <span className="truncate">{asset.original_filename}</span>
            </div>
            <button
              onClick={handleDownload}
              className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                background: isPrivate
                  ? "linear-gradient(135deg, #e8c75a, #b8902a)"
                  : "linear-gradient(135deg, #f2f4f6, #b9bfc5)",
                color: "#0a0a0a",
                boxShadow: `0 10px 30px ${accentSoft}`,
              }}
            >
              <Download className="h-4 w-4" /> Download Extension
            </button>
          </>
        ) : (
          <div className="text-center py-2">
            <div
              className="mx-auto h-11 w-11 rounded-full flex items-center justify-center border mb-3"
              style={{ borderColor: "#2a2a2a", background: "rgba(255,255,255,0.03)", color: "#8f9499" }}
            >
              <Lock className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Complete your profile to unlock the extension.</p>
            <button
              onClick={() => navigate("/profile")}
              className="mt-3 h-10 px-5 rounded-xl text-xs font-semibold border transition-colors hover:bg-[#161616]"
              style={{ borderColor: `${accent}55`, color: accent }}
            >
              Complete Profile
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FlowXExtensionSection;
