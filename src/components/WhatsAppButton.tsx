import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => (
  <a
    href="https://wa.me/919448646624"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed z-40 w-14 h-14 rounded-full bg-whatsapp flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-pulse-glow bottom-[80px] right-4 md:bottom-6 md:right-6"
    aria-label="Chat on WhatsApp"
  >
    <MessageCircle className="h-7 w-7 text-primary-foreground" />
  </a>
);

export default WhatsAppButton;
