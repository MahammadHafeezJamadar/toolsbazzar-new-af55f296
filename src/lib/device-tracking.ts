import { supabase } from "@/integrations/supabase/client";

// ─── STEP 1: Extract device brand ───
export function getDeviceBrand(): string {
  const ua = navigator.userAgent;
  if (/vivo/i.test(ua)) return "Vivo";
  if (/SM-|Samsung/i.test(ua)) return "Samsung";
  if (/OPPO|CPH/i.test(ua)) return "Oppo";
  if (/Redmi|Xiaomi/i.test(ua)) return "Redmi";
  if (/Realme|RMX/i.test(ua)) return "Realme";
  if (/OnePlus|OP\d/i.test(ua)) return "OnePlus";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS|Macintosh/i.test(ua)) return "MacBook";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
}

// ─── STEP 2: Extract device type ───
export function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad/i.test(ua)) return "mobile";
  if (/Windows|Mac OS|Macintosh|Linux/i.test(ua)) return "desktop";
  return "unknown";
}

// ─── STEP 3: Extract OS ───
export function getOSName(): string {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad/i.test(ua)) return "iOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS|Macintosh/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
}

// ─── STEP 4: Extract Browser ───
export function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes("OPR/") || ua.includes("Opera/")) return "Opera";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Safari/")) return "Safari";
  return "Unknown";
}

// ─── STEP 5: Build stable fingerprint ───
export function buildStableFingerprint(): string {
  const brand = getDeviceBrand();
  const os = getOSName();
  const browser = getBrowserName();
  const resolution = `${screen.width}x${screen.height}`;
  return `${brand}|${os}|${browser}|${resolution}`;
}

// ─── Device ID from localStorage ───
export function getDeviceId(): string {
  const key = "myflow_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// ─── Device info string ───
export function getDeviceInfo(): string {
  return `${getBrowserName()} / ${getOSName()}`;
}

// ─── Device name (human-readable) ───
export function getDeviceName(): string {
  const brand = getDeviceBrand();
  const type = getDeviceType();
  if (type === "mobile") return `${brand} Mobile`;
  if (type === "desktop") return `${brand} Desktop`;
  return `${brand} Device`;
}

// ─── Fetch IP ───
async function getIpAddress(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip || null;
  } catch {
    return null;
  }
}

export interface TrackResult {
  locked: boolean;
  reason?: string;
  deviceBrand?: string;
  deviceType?: string;
}

// ─── STEP 6 & 7: Smart matching + Security lockout ───
export async function trackDeviceSession(userId: string, email: string): Promise<TrackResult> {
  const deviceId = getDeviceId();
  const deviceInfo = getDeviceInfo();
  const deviceName = getDeviceName();
  const deviceType = getDeviceType();
  const deviceBrand = getDeviceBrand();
  const stableFingerprint = buildStableFingerprint();
  const ipAddress = await getIpAddress();

  // Fetch all existing WEBSITE sessions for this user (ignore extension)
  const { data: existingSessions } = await supabase
    .from("user_sessions")
    .select("id, device_id, device_type, device_brand, stable_fingerprint, login_count, device_number")
    .eq("user_id", userId)
    .eq("login_source", "website");

  const sessions = existingSessions || [];

  // A) Check if current UUID exists
  const existingDevice = sessions.find(s => s.device_id === deviceId);

  if (existingDevice) {
    // Same device, localStorage intact — just update
    await supabase
      .from("user_sessions")
      .upsert({
        id: existingDevice.id,
        user_id: userId,
        email,
        device_id: deviceId,
        last_active_time: new Date().toISOString(),
        login_time: new Date().toISOString(),
        is_active: true,
        ip_address: ipAddress,
        device_info: deviceInfo,
        device_name: deviceName,
        device_type: deviceType,
        device_brand: deviceBrand,
        stable_fingerprint: stableFingerprint,
        login_source: "website",
        login_count: (existingDevice.login_count ?? 0) + 1,
      } as any, { onConflict: 'id' });

    return { locked: false };
  }

  // B) UUID not found — check for browser/app data clear
  let lockoutDetected = false;
  let lockoutEvent = "";
  let oldUuid = "";

  if (deviceType === "mobile") {
    // For mobile: check if same brand exists (known brand)
    if (deviceBrand !== "Unknown") {
      const sameBrandDevice = sessions.find(
        s => (s.device_brand as string) === deviceBrand && s.device_type === "mobile"
      );
      if (sameBrandDevice) {
        lockoutDetected = true;
        lockoutEvent = "browser_clear_detected_mobile";
        oldUuid = sameBrandDevice.device_id;
      }
    }
  } else if (deviceType === "desktop") {
    // For desktop: check if same stable fingerprint exists
    const sameFingerprintDevice = sessions.find(
      s => (s.stable_fingerprint as string) === stableFingerprint
    );
    if (sameFingerprintDevice) {
      lockoutDetected = true;
      lockoutEvent = "browser_clear_detected_desktop";
      oldUuid = sameFingerprintDevice.device_id;
    }
  }

  if (lockoutDetected) {
    // SECURITY LOCKOUT
    // 1. Deactivate ALL sessions
    await supabase
      .from("user_sessions")
      .update({ is_active: false })
      .eq("user_id", userId);

    // 2. Deactivate subscription
    await supabase
      .from("profiles")
      .update({ subscription_active: false })
      .eq("id", userId);

    // 3. Insert security event
    await supabase
      .from("security_events" as any)
      .insert({
        user_id: userId,
        event: lockoutEvent,
        old_uuid: oldUuid,
        new_uuid: deviceId,
        device_info: deviceInfo,
        device_brand: deviceBrand,
      } as any);

    // 4. Insert new session with triggered_lockout
    const newDeviceNumber = sessions.length + 1;
    await supabase
      .from("user_sessions")
      .insert({
        user_id: userId,
        email,
        device_id: deviceId,
        device_info: deviceInfo,
        device_name: deviceName,
        device_type: deviceType,
        device_brand: deviceBrand,
        stable_fingerprint: stableFingerprint,
        ip_address: ipAddress,
        login_time: new Date().toISOString(),
        last_active_time: new Date().toISOString(),
        is_active: false,
        login_count: 1,
        device_number: newDeviceNumber,
        triggered_lockout: true,
        login_source: "website",
      } as any);

    return { locked: true, reason: lockoutEvent, deviceBrand, deviceType };
  }

  // Genuinely new device — insert normally
  const newDeviceNumber = sessions.length + 1;
  await supabase
    .from("user_sessions")
    .insert({
      user_id: userId,
      email,
      device_id: deviceId,
      device_info: deviceInfo,
      device_name: deviceName,
      device_type: deviceType,
      device_brand: deviceBrand,
      stable_fingerprint: stableFingerprint,
      ip_address: ipAddress,
      login_time: new Date().toISOString(),
      last_active_time: new Date().toISOString(),
      is_active: true,
      login_count: 1,
        device_number: newDeviceNumber,
        triggered_lockout: false,
        login_source: "website",
    } as any);

  return { locked: false };
}
