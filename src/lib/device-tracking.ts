import { supabase } from "@/integrations/supabase/client";

/** Generate or retrieve a stable device fingerprint from localStorage */
export function getDeviceId(): string {
  const key = "myflow_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/** Get browser + OS info string */
export function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  // Detect browser
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/")) browser = "Safari";

  // Detect OS
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  return `${browser} / ${os}`;
}

/** Fetch approximate IP address */
async function getIpAddress(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip || null;
  } catch {
    return null;
  }
}

/** Track the current device session after login */
export async function trackDeviceSession(userId: string, email: string) {
  const deviceId = getDeviceId();
  const deviceInfo = getDeviceInfo();
  const ipAddress = await getIpAddress();

  // Upsert: if same user+device, update login_time & reactivate
  const { error } = await supabase
    .from("user_sessions")
    .upsert(
      {
        user_id: userId,
        email,
        device_id: deviceId,
        device_info: deviceInfo,
        ip_address: ipAddress,
        login_time: new Date().toISOString(),
        last_active_time: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: "user_id,device_id" }
    );

  if (error) {
    console.error("Failed to track device session:", error);
  }
}
