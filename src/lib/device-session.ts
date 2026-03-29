import { supabase } from "@/integrations/supabase/client";

function parseUserAgent() {
  const ua = navigator.userAgent;

  // Browser
  let browser = "Unknown";
  if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/")) browser = "Safari";

  // OS
  let os = "Unknown";
  if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS|Macintosh/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Device type
  let deviceType = "unknown";
  if (/Android|iPhone|iPad/i.test(ua)) deviceType = "mobile";
  else if (/Windows|Mac OS|Macintosh|Linux/i.test(ua)) deviceType = "desktop";

  return { browser, os, deviceType, userAgent: ua };
}

export async function saveDeviceSession(userId: string, email: string) {
  const { browser, os, deviceType, userAgent } = parseUserAgent();

  // Check if a matching session already exists
  const { data: existing } = await supabase
    .from("device_sessions" as any)
    .select("id")
    .eq("user_id", userId)
    .eq("browser", browser)
    .eq("os", os)
    .eq("device_type", deviceType)
    .limit(1);

  const now = new Date().toISOString();

  if (existing && existing.length > 0) {
    // Update last_seen
    await supabase
      .from("device_sessions" as any)
      .update({ last_seen: now } as any)
      .eq("id", (existing[0] as any).id);
  } else {
    // Insert new row
    await supabase
      .from("device_sessions" as any)
      .insert({
        user_id: userId,
        email,
        device_type: deviceType,
        browser,
        os,
        user_agent: userAgent,
      } as any);
  }
}
