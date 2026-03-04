import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => (
  <a
    href="https://wa.me/91XXXXXXXXXX"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-whatsapp flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-pulse-glow"
    aria-label="Chat on WhatsApp"
  >
    <MessageCircle className="h-7 w-7 text-primary-foreground" />
  </a>
);

export default WhatsAppButton;
