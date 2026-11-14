import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminShell from "./AdminShell";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getSession: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate, useLocation: () => ({ pathname: "/admin/gmail" }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: mocks.getSession }, rpc: mocks.rpc } }));
vi.mock("./AdminNavigation", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("transferred admin access", () => {
  it("allows gamerhafeez5@gmail.com when the server grants admin", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "9ef81d76-b68c-4695-bc69-c6aa26b132f1", email: "gamerhafeez5@gmail.com" } } } });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    render(<AdminShell title="Gmail Management"><div>Protected content</div></AdminShell>);
    expect(await screen.findByText("Protected content")).toBeInTheDocument();
    expect(mocks.rpc).toHaveBeenCalledWith("is_admin", { _user_id: "9ef81d76-b68c-4695-bc69-c6aa26b132f1" });
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it("denies hafeezjamadar295@gmail.com after server revocation", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "05d20310-beda-480b-881d-8d4cc1a6ebd6", email: "hafeezjamadar295@gmail.com" } } } });
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    render(<AdminShell title="Gmail Management"><div>Protected content</div></AdminShell>);
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});