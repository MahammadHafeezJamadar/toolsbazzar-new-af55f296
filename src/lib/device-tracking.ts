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

/** Detect device type: Mobile / Tablet / Desktop */
export function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) return "Tablet";
  if (/Mobile|iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return "Mobile";
  return "Desktop";
}

/** Get a human-readable device name like "Samsung Mobile", "Windows Laptop" */
export function getDeviceName(): string {
  const ua = navigator.userAgent;
  const type = getDeviceType();

  // Try to detect specific mobile brands
  if (type === "Mobile" || type === "Tablet") {
    if (/iPhone/i.test(ua)) return `iPhone ${type}`;
    if (/iPad/i.test(ua)) return `iPad ${type}`;
    if (/SM-|Samsung/i.test(ua)) return `Samsung ${type}`;
    if (/Xiaomi|Redmi|POCO/i.test(ua)) return `Xiaomi ${type}`;
    if (/vivo/i.test(ua)) return `Vivo ${type}`;
    if (/OPPO/i.test(ua)) return `OPPO ${type}`;
    if (/OnePlus/i.test(ua)) return `OnePlus ${type}`;
    if (/Realme/i.test(ua)) return `Realme ${type}`;
    if (/Pixel/i.test(ua)) return `Google Pixel ${type}`;
    if (/Huawei/i.test(ua)) return `Huawei ${type}`;
    if (/Nokia/i.test(ua)) return `Nokia ${type}`;
    if (/Motorola|moto/i.test(ua)) return `Motorola ${type}`;
    if (/LG/i.test(ua)) return `LG ${type}`;
    if (/Android/i.test(ua)) return `Android ${type}`;
    return `${type} Device`;
  }

  // Desktop
  if (/Macintosh|Mac OS/i.test(ua)) return "Mac Desktop";
  if (/Windows/i.test(ua)) return "Windows Laptop";
  if (/Linux/i.test(ua)) return "Linux Desktop";
  if (/CrOS/i.test(ua)) return "Chromebook";
  return "Desktop";
}

/** Get browser name */
export function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera/")) return "Opera";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Safari/")) return "Safari";
  return "Unknown Browser";
}

/** Get OS name */
export function getOSName(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("CrOS")) return "Chrome OS";
  return "Unknown OS";
}

/** Get browser + OS info string */
export function getDeviceInfo(): string {
  return `${getBrowserName()} / ${getOSName()}`;
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
  const deviceName = getDeviceName();
  const deviceType = getDeviceType();
  const ipAddress = await getIpAddress();

  // Check if this device already exists for this user
  const { data: existing } = await supabase
    .from("user_sessions")
    .select("id, login_count")
    .eq("user_id", userId)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (existing) {
    // Update existing: increment login_count, update last_active_time
    const { error } = await supabase
      .from("user_sessions")
      .update({
        login_time: new Date().toISOString(),
        last_active_time: new Date().toISOString(),
        is_active: true,
        ip_address: ipAddress,
        device_info: deviceInfo,
        device_name: deviceName,
        device_type: deviceType,
        login_count: (existing.login_count ?? 0) + 1,
      })
      .eq("id", existing.id);

    if (error) console.error("Failed to update device session:", error);
  } else {
    // Create new device entry
    const { error } = await supabase
      .from("user_sessions")
      .insert({
        user_id: userId,
        email,
        device_id: deviceId,
        device_info: deviceInfo,
        device_name: deviceName,
        device_type: deviceType,
        ip_address: ipAddress,
        login_time: new Date().toISOString(),
        last_active_time: new Date().toISOString(),
        is_active: true,
        login_count: 1,
      });

    if (error) console.error("Failed to track device session:", error);
  }
}
