import videoAsset from "@/assets/how-to-use.mp4.asset.json";

const HowItWorksSection = () => (
  <section className="py-20 md:py-28 relative" style={{ background: "#0a0a0a" }}>
    <div
      className="absolute top-0 left-0 right-0 h-px"
      style={{ background: "linear-gradient(90deg, transparent, hsl(174 72% 46% / 0.3), transparent)" }}
    />
    <div className="container mx-auto px-4">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 gradient-text">How To Use</h2>
        <p className="text-sm md:text-base" style={{ color: "rgba(255,255,255,0.6)" }}>
          Watch this quick video to get started
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-2xl overflow-hidden border border-border/40"
          style={{
            background: "#111111",
            boxShadow: "0 0 60px -20px hsla(174, 72%, 46%, 0.25)",
          }}
        >
          <video
            src={videoAsset.url}
            controls
            playsInline
            preload="metadata"
            className="w-full h-auto block"
          />
        </div>
      </div>
    </div>
    <div
      className="absolute bottom-0 left-0 right-0 h-px"
      style={{ background: "linear-gradient(90deg, transparent, hsl(174 72% 46% / 0.3), transparent)" }}
    />
  </section>
);

export default HowItWorksSection;
