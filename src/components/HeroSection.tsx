import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center pt-16">
    <div className="container mx-auto px-4 text-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <span className="inline-block px-4 py-1.5 mb-6 md:mb-8 rounded-full text-xs font-medium tracking-wider uppercase border border-border text-muted-foreground">
          AI-Powered Video Generation
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black leading-[0.95] mb-6 md:mb-8 tracking-tight">
          Where AI
          <br />
          Creativity
          <br />
          <span className="gradient-text">Begins</span>
        </h1>
        <p className="max-w-xl mx-auto text-sm md:text-base text-muted-foreground mb-8 md:mb-12 leading-relaxed px-2">
          Transform your ideas into stunning AI-generated videos in seconds.
          Plans starting at just ₹299/month with 2,000 credits.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 md:mb-20 px-4 sm:px-0">
          <Button size="lg" className="gradient-btn border-0 font-semibold px-8 h-12 rounded-lg w-full sm:w-auto" asChild>
            <Link to="/register">
              Create with Flow <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="border-border hover:bg-secondary font-semibold h-12 rounded-lg w-full sm:w-auto" asChild>
            <a href="#features">
              <Play className="mr-2 h-4 w-4" /> Learn More
            </a>
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="flex items-center justify-center gap-8 sm:gap-12 md:gap-20 border-t border-border pt-8 md:pt-10"
      >
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{s.value}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 md:mt-1.5 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
