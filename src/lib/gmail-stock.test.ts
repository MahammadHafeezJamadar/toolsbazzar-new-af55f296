import { describe, expect, it } from "vitest";
import { gmailCounts, matchesGmailFilter, subscriptionCycle, type GmailAccount } from "./gmail-stock";

const account: GmailAccount = { id: "one", gmail: "one@gmail.com", password: "", subscription_start_date: "2026-06-20", credits_exhausted: false, enabled: true, user_id: null };
const resetDay = new Date(2026, 6, 20);
describe("Gmail stock rules", () => {
  it("counts reset dates today without clearing manually exhausted credits", () => {
    const exhausted = { ...account, credits_exhausted: true };
    expect(gmailCounts([exhausted], resetDay)["Reset Today"]).toBe(1);
    expect(gmailCounts([exhausted], resetDay)["Credits Exhausted"]).toBe(1);
    expect(exhausted.credits_exhausted).toBe(true);
  });
  it("only enabled unassigned non-exhausted accounts are available", () => {
    expect(gmailCounts([account, { ...account, id: "two", enabled: false }, { ...account, id: "three", user_id: "user" }, { ...account, id: "four", credits_exhausted: true }], resetDay).Available).toBe(1);
  });
  it("tracks disabled and exhausted independently", () => {
    const disabled = { ...account, enabled: false, credits_exhausted: true };
    expect(matchesGmailFilter(disabled, "Disabled")).toBe(true);
    expect(matchesGmailFilter(disabled, "Credits Exhausted")).toBe(true);
  });
  it("marks absent or invalid dates as missing rather than Running", () => {
    expect(subscriptionCycle(null)).toBeNull();
    expect(subscriptionCycle("2026-02-31")).toBeNull();
    expect(gmailCounts([{ ...account, subscription_start_date: null }])["Missing Dates"]).toBe(1);
  });
  it("clamps monthly resets to month end and retains remaining days", () => {
    const cycle = subscriptionCycle("2026-01-31", new Date(2026, 1, 27));
    expect(cycle?.daysLeft).toBe(1);
    expect(cycle?.nextReset.getDate()).toBe(28);
  });
  it("upcoming alerts include the next three days but not today or later dates", () => {
    expect(matchesGmailFilter(account, "Upcoming Resets", new Date(2026, 6, 17))).toBe(true);
    expect(matchesGmailFilter(account, "Upcoming Resets", new Date(2026, 6, 16))).toBe(false);
    expect(matchesGmailFilter(account, "Upcoming Resets", resetDay)).toBe(false);
  });
});