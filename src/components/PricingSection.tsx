import { useState } from "react";
import { motion } from "framer-motion";
import { Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import UpiPaymentModal from "@/components/UpiPaymentModal";

type Plan = {
  name: string;
  displayName: string;
  price: number;
  duration: string;
  features: string[];
  badge?: string;
  accent: string; // tailwind gradient stops
  ring: string;
  glow: string;
  badgeClass?: string;
};

const sharedPlans: Plan[] = [
  {
    name: "Sub-Private",
    displayName: "Sub-Private",
    price: 299,
    duration: "10 Days",
    features: [
      "Unlimited Generation",
      "4K Download",
      "Veo 3.1 - Lite",
      "Veo 3.1 - Fast",
      "Nano Banana",
      "Imagen 4",
    ],
    accent: "from-sky-500/40 to-blue-600/10",
    ring: "border-sky-500/30",
    glow: "shadow-[0_0_40px_-10px_rgba(56,189,248,0.35)]",
  },
  {
    name: "Sub-Private",
    displayName: "Sub-Private",
    price: 699,
    duration: "30 Days",
    badge: "Popular",
    badgeClass: "bg-gradient-to-r from-amber-400 to-yellow-500 text-black",
    features: [
      "Unlimited Generation",
      "4K Download",
      "Veo 3.1 - Lite",
      "Veo 3.1 - Fast",
      "Nano Banana",
      "Imagen 4",
    ],
    accent: "from-amber-400/40 to-yellow-500/10",
    ring: "border-amber-400/40",
    glow: "shadow-[0_0_40px_-10px_rgba(251,191,36,0.4)]",
  },
];

const privatePlans: Plan[] = [
  {
    name: "Private",
    displayName: "Private",
    price: 999,
    duration: "30 Days Warranty",
    features: [
      "300+ AI Video Generations",
      "Unlimited AI Image Generation",
      "Premium Models",
      "1K–4K Download",
      "Omni Flash",
      "Quality",
      "Fast",
      "30 Days Warranty",
    ],
    accent: "from-purple-500/40 to-fuchsia-600/10",
    ring: "border-purple-500/40",
    glow: "shadow-[0_0_40px_-10px_rgba(168,85,247,0.4)]",
  },
  {
    name: "Private",
    displayName: "Private",
    price: 1599,
    duration: "30 Days Warranty",
    badge: "Best Value",
    badgeClass: "bg-gradient-to-r from-amber-400 to-yellow-500 text-black",
    features: [
      "500+ AI Video Generations",
      "Unlimited AI Image Generation",
      "All Premium Models",
      "1K–4K Download",
      "Omni Flash",
      "Quality",
      "Fast",
      "30 Days Warranty",
    ],
    accent: "from-amber-400/50 to-yellow-500/10",
    ring: "border-amber-400/50",
    glow: "shadow-[0_0_50px_-10px_rgba(251,191,36,0.45)]",
  },
];

const PlanCard = ({
  plan,
  index,
  onSelect,
}: {
  plan: Plan;
  index: number;
  onSelect: (p: Plan) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    className={`relative rounded-2xl p-[1px] bg-gradient-to-b ${plan.accent} ${plan.glow}`}
  >
    <div className={`h-full rounded-2xl bg-card/70 backdrop-blur-xl p-6 md:p-7 border ${plan.ring} flex flex-col`}>
      {plan.badge && (
        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${plan.badgeClass}`}>
          {plan.badge}
        </span>
      )}
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-display text-lg font-bold text-foreground">{plan.displayName}</h3>
        <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {plan.duration}
        </span>
      </div>
      <div className="mb-5 mt-2">
        <span className="text-4xl md:text-5xl font-bold gradient-text font-display">₹{plan.price}</span>
        <span className="text-sm ml-1" style={{ color: 'rgba(255,255,255,0.5)' }}>one-time</span>
      </div>
      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
            <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={() => onSelect(plan)}
        className="w-full h-12 text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-accent to-emerald-500 text-black hover:opacity-90 border-0"
      >
        🚀 Get Started
      </Button>
    </div>
  </motion.div>
);

const PricingSection = () => {
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; amount: number } | null>(null);

  const handleSelect = (plan: Plan) => {
    setSelectedPlan({ name: `${plan.displayName} — ${plan.duration}`, amount: plan.price });
  };

  return (
    <section id="pricing" className="py-16 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl lg:text-5xl font-bold mb-4 gradient-text" style={{ letterSpacing: '-0.02em' }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Choose the plan that fits you. No hidden charges.
          </p>
        </div>

        {/* Shared Plans */}
        <div className="mb-14">
          <div className="text-center mb-6">
            <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-1">Shared Plans</h3>
            <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Sub-Private Access</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {sharedPlans.map((p, i) => (
              <PlanCard key={`shared-${i}`} plan={p} index={i} onSelect={handleSelect} />
            ))}
          </div>
          <div className="max-w-3xl mx-auto mt-5">
            <div className="flex items-start gap-2.5 rounded-xl p-3.5 border border-yellow-500/20 bg-yellow-500/5">
              <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm" style={{ color: 'rgba(253,224,71,0.9)' }}>
                In Sub-Private plans, image or video generation may occasionally fail because the account is shared.
              </p>
            </div>
          </div>
        </div>

        {/* Private Plans */}
        <div>
          <div className="text-center mb-6">
            <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-1">Private Plans</h3>
            <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Dedicated Premium Access</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {privatePlans.map((p, i) => (
              <PlanCard key={`private-${i}`} plan={p} index={i} onSelect={handleSelect} />
            ))}
          </div>
        </div>

        <p className="text-center text-xs mt-10 uppercase font-medium" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>
          Powered by Google Veo 3 AI · No Hidden Charges · Instant Delivery
        </p>

        <div className="max-w-3xl mx-auto mt-6">
          <div className="flex items-start gap-2.5 rounded-xl p-3.5 border border-red-500/20 bg-red-500/5">
            <span className="text-sm flex-shrink-0">⚠️</span>
            <p className="text-xs md:text-sm" style={{ color: 'rgba(252,165,165,0.9)' }}>
              🍎 <strong>Important Notice:</strong> All plans listed above are currently available for Windows and Android platforms only. macOS is not supported at this time.
            </p>
          </div>
        </div>
      </div>

      <UpiPaymentModal
        open={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        planName={selectedPlan?.name || ""}
        amount={selectedPlan?.amount || 0}
      />
    </section>
  );
};

export default PricingSection;
