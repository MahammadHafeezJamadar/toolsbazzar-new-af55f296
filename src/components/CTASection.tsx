import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTASection = () => (
  <section className="py-16 md:py-28">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-card border border-border rounded-2xl p-8 md:p-12 lg:p-16 text-center"
      >
        <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4 tracking-tight">
          Ready to Create Amazing Videos?
        </h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto mb-8">
          Join ToolsBazzar today and get access to Google Flow AI
        </p>
        <Button size="lg" className="gradient-btn border-0 font-semibold px-8 h-12 rounded-lg w-full sm:w-auto" asChild>
          <Link to="/register">
            Get Started for ₹299 <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
