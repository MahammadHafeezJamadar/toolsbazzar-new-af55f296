import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { TxnType } from "@/lib/finance";

interface Props {
  trigger?: React.ReactNode;
  onCreated?: () => void;
}

const AddTransactionDialog = ({ trigger, onCreated }: Props) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<TxnType>("BASIC");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setType("BASIC");
    setLabel("");
    setAmount("");
  };

  const submit = async () => {
    const amt = Number(amount);
    if (!date || !type || !amt || isNaN(amt) || amt <= 0) {
      toast.error("Please fill date, type and a positive amount");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("transactions").insert({
      date,
      type,
      label: label.trim() || null,
      amount: amt,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Transaction added");
    setOpen(false);
    reset();
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-semibold transition-transform hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))",
              color: "#0a0a0a",
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Add Transaction
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md" style={{ background: "#111", borderColor: "#1e1e1e" }}>
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 bg-[#0d0d0d] border-[#1e1e1e]"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as TxnType)}>
              <SelectTrigger className="mt-1 bg-[#0d0d0d] border-[#1e1e1e]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASIC">BASIC (Income)</SelectItem>
                <SelectItem value="PRO">PRO (Income)</SelectItem>
                <SelectItem value="ULTRA">ULTRA (Income)</SelectItem>
                <SelectItem value="EXPENSE">EXPENSE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Label / Description</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Ad spend, Customer name"
              className="mt-1 bg-[#0d0d0d] border-[#1e1e1e]"
              maxLength={120}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Amount (₹)</Label>
            <Input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="299"
              className="mt-1 bg-[#0d0d0d] border-[#1e1e1e]"
            />
          </div>
          <button
            onClick={submit}
            disabled={saving}
            className="w-full h-10 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, hsl(174 72% 46%), hsl(150 60% 45%))",
              color: "#0a0a0a",
            }}
          >
            {saving ? "Saving..." : "Save Transaction"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
