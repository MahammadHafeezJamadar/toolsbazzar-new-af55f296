import { describe, it, expect } from "vitest";
import { gmailCycle, fmtYmd } from "./gmail-cycle";

describe("gmailCycle", () => {
  it("is running before the monthly reset", () => {
    const r = gmailCycle("2026-06-20", new Date(2026, 6, 19));
    expect(r.status).toBe("running");
    expect(fmtYmd(r.nextReset)).toBe("2026-07-20");
  });
  it("shows reset today on the reset date with next reset a month later", () => {
    const r = gmailCycle("2026-06-20", new Date(2026, 6, 20));
    expect(r.status).toBe("reset");
    expect(fmtYmd(r.nextReset)).toBe("2026-08-20");
  });
  it("is running on the start date itself", () => {
    expect(gmailCycle("2026-06-20", new Date(2026, 5, 20)).status).toBe("running");
  });
});
