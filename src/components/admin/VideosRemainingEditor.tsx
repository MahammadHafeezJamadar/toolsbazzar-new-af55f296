import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Film, Save } from "lucide-react";

interface Props {
  userId: string;
  initial: number | null | undefined;
  updatedAt: string | null | undefined;
  onSaved?: (count: number, updatedAt: string | null) => void;
}

const VideosRemainingEditor = ({ userId, initial, updatedAt, onSaved }: Props) => {
  const [value, setValue] = useState(String(initial ?? 0));
  const [stamp, setStamp] = useState(updatedAt ?? null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) {
      toast({ title: "Enter a whole number of 0 or more", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("profiles")
      .update({ video_remaining: n })
      .eq("id", userId)
      .select("video_remaining, video_updated_at")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    setStamp(data.video_updated_at);
    onSaved?.(data.video_remaining, data.video_updated_at);
    toast({ title: "Videos remaining updated" });
  };

  return (
    <div className="rounded-xl border p-3" style={{ background: "rgba(33,199,183,0.05)", borderColor: "rgba(33,199,183,0.25)" }}>
      <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-wide" style={{ color: "#21C7B7" }}>
        <Film className="h-3.5 w-3.5" /> Videos Remaining
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 min-w-0 h-10 rounded-lg px-3 text-sm text-foreground bg-background border border-border"
        />
        <button
          onClick={save}
          disabled={saving}
          className="h-10 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #21C7B7, #17a08f)", color: "#050505" }}
        >
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving" : "Save"}
        </button>
      </div>
      <div className="text-[10px] text-muted-foreground mt-2">
        Last updated: {stamp ? new Date(stamp).toLocaleString() : "Never"}
      </div>
    </div>
  );
};

export default VideosRemainingEditor;
