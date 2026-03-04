import { motion } from "framer-motion";
import { Zap, Video, BadgeDollarSign, Bolt, ShieldCheck, Headset } from "lucide-react";

const features = [
  { icon: Zap, title: "v3.1 Access", desc: "Get exclusive access to the latest AI model versions for superior output quality." },
  { icon: Video, title: "AI Video Generation", desc: "Create stunning videos from text prompts with our state-of-the-art AI pipeline." },
  { icon: BadgeDollarSign, title: "Best Price Guarantee", desc: "Premium AI tools at unbeatable prices. No hidden fees, no surprises." },
  { icon: Bolt, title: "Lightning Fast", desc: "Generate videos in seconds, not minutes. Optimized infrastructure for speed." },
  { icon: ShieldCheck, title: "Secure & Private", desc: "Your data never leaves our encrypted servers. Enterprise-grade security." },
  { icon: Headset, title: "24/7 Support", desc: "Round-the-clock dedicated support to help you with any issue." },
];

const FeaturesSection = () => (
  <section id="features" className="py-24">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful <span className="gradient-text">Features</span></h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to create professional AI-generated videos.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass glass-hover rounded-xl p-6 group cursor-default"
          >
            <div className="w-12 h-12 rounded-lg gradient-btn flex items-center justify-center mb-4 group-hover:animate-pulse-glow">
              <f.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
