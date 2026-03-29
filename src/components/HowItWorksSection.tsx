import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: 1,
    emoji: "🎯",
    title: "Choose Your Plan",
    description:
      "Select Basic, Pro, or Ultra plan.\nPay via UPI and get activated within 30 minutes.",
  },
  {
    number: 2,
    emoji: "⚡",
    title: "Install Extension",
    description:
      "Download ToolsBazzar Chrome extension,\nlogin with your account and connect instantly.",
  },
  {
    number: 3,
    emoji: "🎬",
    title: "Create & Download",
    description:
      "Open Google Flow, describe your video idea\nand download cinematic AI videos in minutes!",
  },
];

const HowItWorksSection = () => (
  <section className="py-20 md:py-28 relative" style={{ background: "#0a0a0a" }}>
    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(174 72% 46% / 0.3), transparent)" }} />

    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 gradient-text heading-glow">
          How It Works
        </h2>
        <p className="text-sm md:text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Get started in 3 simple steps
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 max-w-5xl mx-auto items-stretch">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center gap-0">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="flex-1 rounded-2xl p-6 md:p-8 border transition-all duration-300 hover:-translate-y-1 group relative"
              style={{
                background: "#111111",
                borderColor: "transparent",
                backgroundClip: "padding-box",
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl -z-10 opacity-40 group-hover:opacity-70 transition-opacity duration-300"
                style={{
                  padding: "1px",
                  background: "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 50%))",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  borderRadius: "1rem",
                }}
              />

              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-5 text-xl font-bold mx-auto font-display"
                style={{
                  background: "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 50%))",
                  color: "#0a0a0a",
                }}
              >
                {step.number}
              </div>

              <h3 className="font-display text-lg font-semibold text-foreground text-center mb-3">
                {step.emoji} {step.title}
              </h3>

              <p className="text-sm text-center leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {step.description}
              </p>
            </motion.div>

            {i < steps.length - 1 && (
              <div className="hidden md:flex items-center justify-center w-8 flex-shrink-0">
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-40" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(174 72% 46% / 0.3), transparent)" }} />
  </section>
);

export default HowItWorksSection;
