import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GmailAccount } from "@/lib/gmail-stock";

export function useGmailStock() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-gmail-stock"],
    queryFn: async () => {
      const { data, error } = await supabase.from("google_ai_accounts")
        .select("id,gmail,password,subscription_start_date,credits_exhausted,enabled,user_id").order("created_at");
      if (error) throw error;
      return (data || []) as GmailAccount[];
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    const clear = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") client.removeQueries({ queryKey: ["admin-gmail-stock"] });
    });
    return () => clear.data.subscription.unsubscribe();
  }, [client]);
  return { ...query, accounts: query.data || [], refresh: () => client.invalidateQueries({ queryKey: ["admin-gmail-stock"] }) };
}