import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return jsonResponse({ status: "ok" });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ status: "error", message: "Not authenticated" }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ status: "error", message: "Not authenticated" }, 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("google_email, google_password, subscription_active, cookies_json")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return jsonResponse({ status: "error", message: "Profile not found" }, 404);
    }

    let parsedCookies: unknown[] = [];
    try {
      const rawCookies = profile.cookies_json ?? "[]";
      const parsed = typeof rawCookies === "string" ? JSON.parse(rawCookies) : rawCookies;
      parsedCookies = Array.isArray(parsed) ? parsed : [];
    } catch {
      parsedCookies = [];
    }

    return jsonResponse({
      status: "success",
      google_flow: {
        email: profile.google_email,
        password: profile.google_password,
      },
      cookies: {
        cookies: parsedCookies,
      },
      subscription: {
        status: profile.subscription_active ? "active" : "inactive",
      },
    });
  } catch (error) {
    return jsonResponse(
      { status: "error", message: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
