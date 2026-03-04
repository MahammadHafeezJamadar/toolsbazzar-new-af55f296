import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
   { name: "Arjun Mehta", role: "Content Creator", text: "ToolzBazzar completely transformed my video workflow. What used to take hours now takes minutes. The AI quality is unreal!", rating: 5 },
   { name: "Priya Sharma", role: "Marketing Lead", text: "We use ToolzBazzar for all our social media video content. The ROI has been incredible — 3x engagement since switching.", rating: 5 },
   { name: "Rahul Verma", role: "Freelance Editor", text: "The pricing is unbeatable for the quality you get. I've tried every AI video tool out there, and ToolzBazzar is the best.", rating: 5 },
];

const TestimonialsSection = () => (
  <section id="testimonials" className="py-24">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our <span className="gradient-text">Users Say</span></h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Trusted by creators and businesses worldwide.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="glass glass-hover rounded-xl p-6"
          >
            <div className="flex gap-1 mb-4">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">"{t.text}"</p>
            <div>
              <div className="font-semibold text-sm">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.role}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
