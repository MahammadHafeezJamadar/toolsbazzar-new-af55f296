import { motion } from "framer-motion";
import { Zap, Video, ShieldCheck, Bolt } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "v3.1 Access",
    desc: "Get exclusive access to the latest AI model versions for superior output quality.",
    points: ["Veo 3.1 Fast & Quality modes", "Priority queue access", "Latest model updates"],
  },
  {
    icon: Video,
    title: "AI Video Generation",
    desc: "Create stunning videos from text prompts with our state-of-the-art AI pipeline.",
    points: ["Text-to-video in seconds", "HD video downloads", "Multiple output formats"],
  },
  {
    icon: Bolt,
    title: "Lightning Fast",
    desc: "Generate videos in seconds, not minutes. Optimized infrastructure for speed.",
    points: ["Sub-minute generation", "Parallel processing", "Global CDN delivery"],
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    desc: "Enterprise-grade security with 99.9% uptime guarantee and encrypted storage.",
    points: ["End-to-end encryption", "99.9% uptime SLA", "24/7 monitoring"],
  },
];

const FeaturesSection = () => (
  <section id="features" className="py-28">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
          Powerful Features
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Everything you need to create professional AI-generated videos.
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
            className="bg-card border border-border rounded-xl p-6 hover:border-accent/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <f.icon className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
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
