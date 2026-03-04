import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Basic",
    price: "₹299",
    features: ["10 videos/month", "720p resolution", "Basic templates", "Email support", "5GB storage"],
    popular: false,
  },
  {
    name: "Pro",
    price: "₹599",
    features: ["50 videos/month", "1080p resolution", "Premium templates", "Priority support", "25GB storage", "API access"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "₹999",
    features: ["Unlimited videos", "4K resolution", "Custom templates", "24/7 dedicated support", "100GB storage", "API access", "Team collaboration"],
    popular: false,
  },
];

const PricingSection = () => (
  <section id="pricing" className="py-24">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple <span className="gradient-text">Pricing</span></h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Choose the plan that fits your creative needs.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className={`glass rounded-xl p-8 relative ${p.popular ? "border-primary/50 ring-1 ring-primary/20" : ""}`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold gradient-btn text-primary-foreground">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-bold mb-2">{p.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-extrabold gradient-text">{p.price}</span>
              <span className="text-muted-foreground text-sm">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className={`w-full font-semibold ${p.popular ? "gradient-btn border-0 text-primary-foreground" : "border-border/50"}`}
              variant={p.popular ? "default" : "outline"}
              asChild
            >
              <Link to="/register">Get Started</Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PricingSection;
