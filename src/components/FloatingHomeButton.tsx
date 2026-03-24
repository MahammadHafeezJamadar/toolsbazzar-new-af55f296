import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const FloatingHomeButton = () => {
  const navigate = useNavigate();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => navigate("/")}
          className="fixed z-[9999] flex items-center justify-center rounded-full transition-transform hover:scale-110"
          style={{
            width: 45,
            height: 45,
            bottom: 80,
            left: 16,
            background: "#111",
            border: "2px solid #00d4ff",
            boxShadow: "0 0 10px #00d4ff",
            cursor: "pointer",
          }}
          aria-label="Go to Home"
        >
          <Home className="h-5 w-5" style={{ color: "#00d4ff" }} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">Go to Home</TooltipContent>
    </Tooltip>
  );
};

export default FloatingHomeButton;
