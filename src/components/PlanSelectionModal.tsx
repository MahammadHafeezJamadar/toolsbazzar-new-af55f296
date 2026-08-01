import { useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UpiPaymentModal from "@/components/UpiPaymentModal";

const plans = [
  {
    name: "Sub-Private — 10 Days",
    price: 299,
    features: [
      "10 Days Access",
      "Unlimited Generation",
      "4K Download",
      "Veo 3.1 - Lite, Veo 3.1 - Fast",
      "Nano Banana, Imagen 4",
    ],
    popular: false,
  },
  {
    name: "Sub-Private — 30 Days",
    price: 699,
    features: [
      "30 Days Access",
      "Unlimited Generation",
      "4K Download",
      "Veo 3.1 - Lite, Veo 3.1 - Fast",
      "Nano Banana, Imagen 4",
    ],
    popular: false,
  },
  {
    name: "Private — 30 Days",
    price: 999,
    features: [
      "300+ AI Video Generations",
      "Unlimited AI Image Generation",
      "Premium Models",
      "1K–4K Download",
      "30 Days Warranty",
    ],
    popular: true,
  },
  {
    name: "Private — 30 Days",
    price: 1599,
    features: [
      "500+ AI Video Generations",
      "Unlimited AI Image Generation",
      "All Premium Models",
      "1K–4K Download",
      "30 Days Warranty",
    ],
    popular: false,
  },
];

interface PlanSelectionModalProps {
  open: boolean;
  onClose: () => void;
  userEmail?: string;
}

const PlanSelectionModal = ({ open, onClose, userEmail }: PlanSelectionModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number } | null>(null);

  if (selectedPlan) {
    return (
      <UpiPaymentModal
        open={true}
        onClose={() => {
          setSelectedPlan(null);
          onClose();
        }}
        planName={selectedPlan.name}
        amount={selectedPlan.price}
        userEmail={userEmail}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="border-[#1e1e1e] max-w-3xl max-h-[90vh] overflow-y-auto p-0"
        style={{ background: "#111111" }}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-foreground text-xl font-bold text-center">
            Choose Your Plan
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Select a plan to get started
          </p>
          <p className="text-[11px] text-center mt-2" style={{ color: 'rgba(252,165,165,0.9)' }}>
            ⚠️ 🍎 All plans are available for Windows & Android only — macOS is not supported.
          </p>
        </DialogHeader>

        <div className="p-6 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((p) => (
            <div
              key={`${p.name}-${p.price}`}
              className="rounded-xl p-5 relative flex flex-col"
              style={{
                background: "#0a0a0a",
                border: p.popular
                  ? "1px solid hsl(174 72% 46%)"
                  : "1px solid #1e1e1e",
                boxShadow: p.popular ? "0 0 25px hsla(174, 72%, 46%, 0.15)" : "none",
              }}
            >
              {p.popular && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))",
                    color: "#0a0a0a",
                  }}
                >
                  Popular
                </span>
              )}

              <h3 className="text-base font-semibold text-foreground mb-1">{p.name}</h3>
              <div className="mb-4">
                <span className="text-2xl font-bold text-foreground">₹{p.price}</span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-2 mb-5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "hsl(174 72% 56%)" }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setSelectedPlan({ name: p.name, price: p.price })}
                className="w-full h-10 rounded-lg text-sm font-semibold transition-all"
                style={
                  p.popular
                    ? {
                        background: "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))",
                        color: "#0a0a0a",
                        boxShadow: "0 0 20px hsla(174, 72%, 46%, 0.2)",
                      }
                    : {
                        background: "transparent",
                        border: "1px solid #1e1e1e",
                        color: "#ccc",
                      }
                }
              >
                Select {p.name}
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanSelectionModal;
