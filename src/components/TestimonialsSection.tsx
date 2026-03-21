import { motion } from "framer-motion";

const testimonials = [
  { name: "Arjun Mehta", role: "Content Creator", text: "ToolsBazzar completely transformed my video workflow. What used to take hours now takes minutes. The AI quality is unreal!", initials: "AM" },
  { name: "Priya Sharma", role: "Marketing Lead", text: "We use ToolsBazzar for all our social media video content. The ROI has been incredible — 3x engagement since switching.", initials: "PS" },
  { name: "Rahul Verma", role: "Freelance Editor", text: "The pricing is unbeatable for the quality you get. I've tried every AI video tool out there, and ToolsBazzar is the best.", initials: "RV" },
];

const TestimonialsSection = () => (
  <section id="testimonials" className="py-16 md:py-28">
    <div className="container mx-auto px-4">
      <div className="text-center mb-10 md:mb-16">
        <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-4 tracking-tight">Trusted by Indian Creators</h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">Join thousands of creators already using ToolzBazzar</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-xl p-5 md:p-6 hover:border-accent/30 transition-colors"
          >
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-border flex items-center justify-center text-sm font-semibold text-accent">
                {t.initials}
              </div>
              <div>
                <div className="font-medium text-sm text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
