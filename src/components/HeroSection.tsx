import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

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
          Create Cinematic
          <br />
          Videos with
          <br />
          <span className="gradient-text">AI</span>
        </h1>
        <p className="max-w-xl mx-auto text-sm md:text-base text-muted-foreground mb-8 md:mb-12 leading-relaxed px-2">
          India's most affordable Google Flow access. Generate stunning AI videos with Veo 3.1 technology. Starting at just ₹299/month.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
          <Button size="lg" className="gradient-btn border-0 font-semibold px-8 h-12 rounded-lg w-full sm:w-auto" asChild>
            <Link to="/register">
              Start Creating Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="border-border hover:bg-secondary font-semibold h-12 rounded-lg w-full sm:w-auto" asChild>
            <a href="#pricing">
              <Play className="mr-2 h-4 w-4" /> View Plans
            </a>
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
