import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SecurityLockoutOverlayProps {
  deviceBrand?: string;
  deviceType?: string;
  reason?: string;
}

const SecurityLockoutOverlay = ({ deviceBrand, deviceType, reason }: SecurityLockoutOverlayProps) => {
  const navigate = useNavigate();
  const isMobile = reason === "browser_clear_detected_mobile";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.95)" }}>
      <div className="max-w-md w-full rounded-2xl border p-8 text-center" style={{ background: "#111111", borderColor: "#ef4444" }}>
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
          <Shield className="h-8 w-8 text-[#ef4444]" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">🔐 Security Alert</h2>
        <p className="text-sm text-foreground mb-4">Your account has been logged out from all devices.</p>
        <p className="text-sm text-muted-foreground mb-6">
          {isMobile
            ? `We detected that your ${deviceBrand || "phone"}'s app data was cleared. This is a security measure to protect your account.`
            : `We detected that browser data was cleared on your ${deviceBrand || "computer"}. This is a security measure to protect your account.`
          }
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Please login again. If this wasn't you, contact admin immediately.
        </p>
        <Button
          onClick={() => navigate("/login")}
          className="w-full gradient-btn border-0 text-primary-foreground font-semibold"
        >
          Login Again
        </Button>
      </div>
    </div>
  );
};

export default SecurityLockoutOverlay;
