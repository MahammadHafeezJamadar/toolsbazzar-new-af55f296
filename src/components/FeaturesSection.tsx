import { motion } from "framer-motion";
import { Video, Zap, IndianRupee, HeadphonesIcon } from "lucide-react";

const features = [
  {
    icon: Video,
    title: "AI Video Generation",
    desc: "Create Hollywood-quality videos in seconds using Google's latest Veo 3.1 AI model",
    points: ["Text-to-video in seconds", "HD video downloads", "Multiple output formats"],
  },
  {
    icon: Zap,
    title: "Instant Access",
    desc: "Get started in minutes with our simple Chrome extension. No technical skills required",
    points: ["One-click Chrome extension", "Easy setup wizard", "No coding needed"],
  },
  {
    icon: IndianRupee,
    title: "Affordable Plans",
    desc: "Premium AI access at Indian prices. Plans starting at just ₹299 per month",
    points: ["Starting at ₹299/mo", "Flexible credit system", "Cancel anytime"],
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    desc: "Dedicated WhatsApp support for all your queries. We are always here to help",
    points: ["WhatsApp support", "Quick response time", "Dedicated assistance"],
  },
];

const FeaturesSection = () => (
  <section id="features" className="py-16 md:py-28">
    <div className="container mx-auto px-4">
      <div className="text-center mb-10 md:mb-16">
        <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4 tracking-tight">
          Why Creators Choose ToolsBazzar
        </h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
          Everything you need to unleash your creativity
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-xl p-5 md:p-6 hover-lift hover-glow group cursor-default"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors duration-300">
              <f.icon className="h-5 w-5 text-accent hover-icon-pop" />
            </div>
            <h3 className="font-semibold text-base md:text-lg mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{f.desc}</p>
            <ul className="space-y-1.5">
              {f.points.map((p) => (
                <li key={p} className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
