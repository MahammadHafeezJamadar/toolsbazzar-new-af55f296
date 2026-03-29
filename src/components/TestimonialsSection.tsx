const testimonials = [
  { name: "Arjun Mehta", role: "Content Creator", text: "ToolsBazzar completely transformed my video workflow. What used to take hours now takes minutes. The AI quality is unreal!", initials: "AM" },
  { name: "Priya Sharma", role: "Marketing Lead", text: "We use ToolsBazzar for all our social media video content. The ROI has been incredible — 3x engagement since switching.", initials: "PS" },
  { name: "Rahul Verma", role: "Freelance Editor", text: "The pricing is unbeatable for the quality you get. I've tried every AI video tool out there, and ToolsBazzar is the best.", initials: "RV" },
];

const TestimonialsSection = () => (
  <section id="testimonials" className="py-16 md:py-28">
    <div className="container mx-auto px-4">
      <div className="text-center mb-10 md:mb-16">
        <h2 className="font-display text-2xl md:text-3xl lg:text-5xl font-bold mb-4 gradient-text" style={{ letterSpacing: '-0.02em' }}>
          Trusted by Indian Creators
        </h2>
        <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Join thousands of creators already using ToolsBazzar
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="bg-card border border-border rounded-xl p-5 md:p-6 cursor-default"
          >
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>"{t.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-border flex items-center justify-center text-sm font-semibold text-accent font-display">
                {t.initials}
              </div>
              <div>
                <div className="font-medium text-sm text-foreground">{t.name}</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
