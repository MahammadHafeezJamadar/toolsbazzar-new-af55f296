import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UpiPaymentModalProps {
  open: boolean;
  onClose: () => void;
  planName: string;
  amount: number;
  userEmail?: string;
}

const UpiPaymentModal = ({ open, onClose, planName, amount, userEmail }: UpiPaymentModalProps) => {
  const sendProof = () => {
    const msg = encodeURIComponent(
      `Hi! I have made payment for ${planName} plan - ₹${amount}. Please activate my account. Email: ${userEmail || "N/A"}`
    );
    window.open(`https://wa.me/919448646624?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="border-[#1e1e1e] max-w-md max-h-[90vh] overflow-y-auto p-0"
        style={{ background: "#111111" }}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-foreground text-lg font-bold">
            Complete Payment
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-5">
          {/* Plan Info */}
          <div className="rounded-xl p-4 text-center" style={{ background: "#0a0a0a", border: "1px solid #1e1e1e" }}>
            <div className="text-sm text-muted-foreground mb-1">Plan</div>
            <div className="text-xl font-bold text-foreground">{planName}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: "hsl(174 72% 56%)" }}>₹{amount}</div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">How to pay</div>
            <div className="space-y-1.5">
              {[
                "1. Message us on WhatsApp to get payment details",
                "2. Complete the payment and take a screenshot",
                "3. Send the screenshot on WhatsApp",
                "4. Your plan will be activated within 30 minutes",
              ].map((step) => (
                <div key={step} className="text-sm text-muted-foreground">{step}</div>
              ))}
            </div>
          </div>


          {/* WhatsApp Button */}
          <button
            onClick={sendProof}
            className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))",
              color: "#0a0a0a",
              boxShadow: "0 0 30px hsla(174, 72%, 46%, 0.2)",
            }}
          >
            Send Payment Proof on WhatsApp
          </button>

          {/* Note */}
          <div className="rounded-xl p-3 text-center" style={{ background: "#1a1a00", border: "1px solid #3d3d00" }}>
            <span className="text-xs font-medium" style={{ color: "#fbbf24" }}>
              ⚡ Plans activated within 30 minutes after payment verification
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpiPaymentModal;
