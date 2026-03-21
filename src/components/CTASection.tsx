import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTASection = () => (
  <section className="py-28">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-card border border-border rounded-2xl p-12 md:p-16 text-center"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
          Ready to Get Started?
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-8">
          Join thousands of creators who are already using ToolzBazzar to produce amazing AI-generated videos.
        </p>
        <Button size="lg" className="gradient-btn border-0 font-semibold px-8 h-12 rounded-lg" asChild>
          <Link to="/register">
            Start Creating <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
