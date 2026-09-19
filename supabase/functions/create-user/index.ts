import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const AUTHORIZED_ADMIN_EMAIL = "hafeezjamadar295@gmail.com";

const BodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  plan: z.enum(["Private", "Shared"]),
  subscription_active: z.boolean(),
  video_remaining: z.number().int().min(0).max(1_000_000),
  plan_start_date: z.string().date().nullable(),
  expiry_date: z.string().date().nullable(),
}).refine((data) => !data.plan_start_date || !data.expiry_date || data.expiry_date >= data.plan_start_date, {
  message: "Expiry date cannot be before the start date",
  path: ["expiry_date"],
});

const json = (body: unknown, status: number) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Server configuration error" }, 500);

    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller || caller.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL) return json({ error: "Forbidden" }, 403);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerProfile } = await adminClient.from("profiles").select("is_admin").eq("id", caller.id).single();
    if (!callerProfile?.is_admin) return json({ error: "Forbidden" }, 403);

    const body = BodySchema.safeParse(await req.json());
    if (!body.success) return json({ error: body.error.issues[0]?.message || "Invalid user details" }, 400);

    const { name, email, password, plan, subscription_active, video_remaining, plan_start_date, expiry_date } = body.data;
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
    if (createError || !created.user) return json({ error: createError?.message || "Account creation failed" }, 400);

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: created.user.id,
      email,
      name,
      plan,
      subscription_active,
      video_remaining,
      plan_start_date,
      expiry_date,
    }, { onConflict: "id" });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: "Profile creation failed" }, 500);
    }

    return json({ success: true, user_id: created.user.id }, 201);
  } catch {
    return json({ error: "Unable to create user" }, 500);
  }
});