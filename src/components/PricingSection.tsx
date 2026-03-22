import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import UpiPaymentModal from "@/components/UpiPaymentModal";

const plans = [
  {
    name: "Basic",
    monthly: 299,
    yearly: 2990,
    features: ["2,000 credits/month", "1 device only", "Veo 3.1 Fast only", "Lower Priority generation", "WhatsApp support"],
    popular: false,
  },
  {
    name: "Pro",
    monthly: 499,
    yearly: 4990,
    features: ["25,000 credits/month", "2 devices", "Veo 3.1 Fast + Quality", "Normal Priority generation", "HD video download", "WhatsApp support"],
    popular: true,
  },
  {
    name: "Ultra",
    monthly: 799,
    yearly: 7990,
    features: ["45,000 credits/month", "2 devices", "Veo 3.1 Fast + Quality", "High Priority generation", "HD video download", "24/7 WhatsApp support", "Dedicated support"],
    popular: false,
  },
];

const PricingSection = () => {
  const [yearly, setYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; amount: number } | null>(null);

  return (
    <section id="pricing" className="py-16 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4 tracking-tight">Simple, Transparent Pricing</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-8">
            No hidden charges. Cancel anytime.
          </p>
          <div className="inline-flex items-center bg-card border border-border rounded-lg p-1">
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                !yearly ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                yearly ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`bg-card border rounded-xl p-6 md:p-8 relative ${
                p.popular ? "border-accent ring-1 ring-accent/20" : "border-border"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold mb-1">{p.name}</h3>
              <div className="mb-6">
                <span className="text-3xl md:text-4xl font-bold text-foreground">
                  ₹{yearly ? p.yearly : p.monthly}
                </span>
                <span className="text-muted-foreground text-sm">/{yearly ? "yr" : "mo"}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-accent flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full font-semibold h-11 ${
                  p.popular ? "gradient-btn border-0" : "border-border"
                }`}
                variant={p.popular ? "default" : "outline"}
                onClick={() => setSelectedPlan({ name: p.name, amount: yearly ? p.yearly : p.monthly })}
              >
                Buy Now
              </Button>
            </motion.div>
          ))}
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
