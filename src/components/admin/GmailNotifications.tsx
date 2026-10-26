import { useNavigate } from "react-router-dom";
import { AlertCircle, Ban, Inbox, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGmailStock } from "@/hooks/use-gmail-stock";
import { gmailCounts, type GmailFilter } from "@/lib/gmail-stock";

const alerts = [
  { filter: "Reset Today", label: "Reset scheduled today", icon: RefreshCw, tone: "gmail-warning" },
  { filter: "Credits Exhausted", label: "Credits exhausted", icon: TriangleAlert, tone: "text-destructive" },
  { filter: "Available", label: "Available Gmail accounts", icon: Inbox, tone: "text-accent" },
  { filter: "Disabled", label: "Disabled accounts", icon: Ban, tone: "text-muted-foreground" },
  { filter: "Missing Dates", label: "Missing subscription dates", icon: AlertCircle, tone: "gmail-highlight" },
] as const;

export default function GmailNotifications({ onFilter }: { onFilter?: (filter: GmailFilter) => void }) {
  const navigate = useNavigate();
  const { accounts, isLoading, error, refresh } = useGmailStock();
  const counts = gmailCounts(accounts);
  return <section className="mb-5 space-y-3" aria-label="Gmail stock notifications">
    <h2 className="text-sm font-semibold">Google AI Pro Gmail</h2>
    {error ? <div className="flex items-center gap-2 text-sm text-destructive">Could not load Gmail alerts.<Button variant="outline" size="sm" onClick={() => refresh()}>Retry</Button></div> :
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {alerts.map(({ filter, label, icon: Icon, tone }) => <Button key={filter} variant="outline"
          className="gmail-panel h-auto min-h-24 items-start justify-start whitespace-normal p-4 text-left hover:border-accent hover:bg-secondary"
          onClick={() => onFilter ? onFilter(filter) : navigate(`/admin/gmail?filter=${encodeURIComponent(filter)}`)}>
          <Icon className={`mt-1 ${tone}`} />
          <span className="min-w-0"><span className={`block text-2xl font-semibold ${tone}`}>{isLoading ? "—" : counts[filter]}</span><span className="mt-1 block text-xs text-muted-foreground">{label}</span></span>
        </Button>)}
      </div>}
    <p className="text-xs text-muted-foreground">Scheduled dates do not verify that Google credits have refreshed.</p>
  </section>;
}