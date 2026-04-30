import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Target, Globe, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import UpiPaymentModal from "@/components/UpiPaymentModal";

const plans = [
  {
    name: "Starter",
    monthly: 299,
    yearly: 299,
    subtitle: "10 Days Access",
    badge: null,
    features: [
      "Unlimited Video Generation",
      "Unlimited Credits ✅🚀",
      "No Account Suspend Issue 🤩",
      "HD Video",
      "WhatsApp Support",
    ],
    buttonText: "Get Started",
    buttonStyle: "outline" as const,
    glowColor: "from-gray-400/40 to-gray-500/20",
    borderClass: "border-gray-500/30",
    buttonClass: "",
  },
  {
    name: "Ultra",
    monthly: 799,
    yearly: 799,
    subtitle: "28 Days Access",
    badge: "Best Value",
    badgeClass: "bg-gradient-to-r from-yellow-500 to-amber-500 text-black",
    features: [
      "Unlimited Video Generation",
      "Unlimited Credits ✅🚀",
      "No Account Suspend Issue 🤩",
      "4K Quality",
      "Priority Support",
    ],
    buttonText: "Go Ultra",
    buttonStyle: "default" as const,
    glowColor: "from-yellow-500/30 to-amber-500/10",
    borderClass: "border-yellow-500/30",
    buttonClass: "bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400 border-0",
    popular: true,
  },
];


const PricingSection = () => {
  
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; amount: number } | null>(null);

  return (
    <section id="pricing" className="py-16 md:py-28">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl md:text-3xl lg:text-5xl font-bold mb-4 gradient-text heading-glow" style={{ letterSpacing: '-0.02em' }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-sm md:text-base max-w-xl mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
            No hidden charges.
          </p>
        </div>



        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className={`relative rounded-2xl p-[1px] bg-gradient-to-b ${p.glowColor} ${
                (p as any).popular ? "scale-[1.02] md:scale-105 z-10" : ""
              }`}
            >
              <div className="h-full rounded-2xl bg-card/80 backdrop-blur-xl p-6 md:p-8 border border-border">
                {p.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${p.badgeClass}`}>
                    {p.badge}
                  </span>
                )}
                <h3 className="font-display text-sm font-semibold mb-1 uppercase" style={{ letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)' }}>{p.name}</h3>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>{p.subtitle}</p>
                <div className="mb-6">
                  <span className="text-3xl md:text-4xl font-bold gradient-text font-display">
                    ₹{p.monthly}
                  </span>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}> one-time</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <Check className="h-4 w-4 text-accent flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full font-semibold h-11 uppercase ${p.buttonClass}`}
                  style={{ letterSpacing: '0.05em', fontWeight: 600 }}
                  variant={p.buttonStyle}
                  onClick={() => setSelectedPlan({ name: p.name, amount: p.monthly })}
                >
                  {p.buttonText}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Icon Badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-12">
          {[
            { icon: Target, label: "15 Min Free Demo" },
            { icon: Globe, label: "Order Via Website" },
            { icon: MessageCircle, label: "Book on WhatsApp" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm cursor-default" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <Icon className="h-4 w-4 text-accent" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Footer Line */}
        <p className="text-center text-xs mt-6 uppercase font-medium" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', fontVariant: 'small-caps' }}>
          Powered by Google Veo 3 AI · No Hidden Charges · Instant Delivery
        </p>
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
