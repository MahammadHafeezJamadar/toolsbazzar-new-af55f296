import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut, User, Shield, KeyRound, Trash2, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  name: string;
  plan: string;
  subscription_active: boolean;
  expiry_date: string | null;
  is_admin: boolean | null;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name, plan, subscription_active, expiry_date, is_admin")
        .eq("id", session.user.id)
        .single();

      if (error) {
        toast.error("Failed to load profile");
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    getProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const EXTENSION_ID = "nokohfcfdgeimgcibhnofaigmnflfjpi";

  const handleOpenGoogleFlow = () => {
    try {
      if (!(window as any).chrome?.runtime?.sendMessage) {
        toast.error("Please install the ToolzBazzar extension first", {
          action: {
            label: "Download",
            onClick: () => {
              window.open(
                `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/extensions/ToolzBazzar-Extension.zip`,
                "_blank"
              );
            },
          },
        });
        return;
      }
      (window as any).chrome.runtime.sendMessage(EXTENSION_ID, { action: "openGoogleFlow" }, (response: any) => {
        if ((window as any).chrome.runtime.lastError) {
          toast.error("Please install the ToolzBazzar extension first", {
            action: {
              label: "Download",
              onClick: () => {
                window.open(
                  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/extensions/ToolzBazzar-Extension.zip`,
                  "_blank"
                );
              },
            },
          });
          return;
        }
        if (response?.status === "ok") {
          toast.success("Google Flow opened!");
        }
      });
    } catch {
      toast.error("Please install the ToolzBazzar extension first", {
        action: {
          label: "Download",
          onClick: () => {
            window.open(
              `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/extensions/ToolzBazzar-Extension.zip`,
              "_blank"
            );
          },
        },
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleChangePassword = async () => {
    const newPass = passwordForm.new.trim();
    const confirmPass = passwordForm.confirm.trim();
    const currentPass = passwordForm.current.trim();

    if (!currentPass || !newPass || !confirmPass) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPass.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("New passwords do not match");
      return;
    }

    setPasswordLoading(true);

    // Verify current password by re-signing in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      toast.error("Session expired. Please log in again.");
      setPasswordLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPass,
    });

    if (signInError) {
      toast.error("Current password is incorrect");
      setPasswordLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPass });
    setPasswordLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setPasswordForm({ current: "", new: "", confirm: "" });
      setShowChangePassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Session expired");
      setDeleteLoading(false);
      return;
    }

    // Delete profile row (cascade or manual)
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", session.user.id);

    if (profileError) {
      toast.error("Failed to delete account data");
      setDeleteLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setDeleteLoading(false);
    toast.success("Account deleted successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="glass border-b border-border/30 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-xl font-bold gradient-text">ToolzBazzar</Link>
          <div className="flex items-center gap-3">
            {profile?.is_admin && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin" className="flex items-center gap-1"><Shield className="h-4 w-4" /> Admin</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subscription Card */}
          <div className="glass rounded-xl p-6">
            <h2 className="font-semibold mb-4 text-lg">Subscription</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={profile?.subscription_active ? "default" : "destructive"} className={profile?.subscription_active ? "gradient-btn border-0 text-primary-foreground" : ""}>
                  {profile?.subscription_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="text-sm font-medium">{profile?.plan || "None"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expires</span>
                <span className="text-sm font-medium">{profile?.expiry_date || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="glass rounded-xl p-6">
            <h2 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <User className="h-5 w-5" /> Profile
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">{profile?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{profile?.email}</span>
              </div>
            </div>

            <div className="border-t border-border/30 mt-4 pt-4 space-y-3">
              {/* Change Password */}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-border/50"
                onClick={() => setShowChangePassword(!showChangePassword)}
              >
                <KeyRound className="h-4 w-4 mr-2" /> Change Password
              </Button>

              {showChangePassword && (
                <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password" className="text-xs">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                      maxLength={128}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-xs">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))}
                      maxLength={128}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password" className="text-xs">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                      maxLength={128}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full gradient-btn border-0 text-primary-foreground font-semibold"
                    onClick={handleChangePassword}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? "Saving..." : "Save Password"}
                  </Button>
                </div>
              )}

              {/* Delete Account */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Your account and all associated data will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteLoading ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Actions / Inactive Message */}
          <div className="glass rounded-xl p-6">
            {profile?.subscription_active ? (
              <>
                <h2 className="font-semibold mb-4 text-lg">Quick Actions</h2>
                <div className="space-y-3">
                  <Button className="w-full gradient-btn border-0 text-primary-foreground font-semibold" onClick={handleOpenGoogleFlow}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Open Google Flow
                  </Button>
                  <Button variant="outline" className="w-full border-border/50" asChild>
                    <a href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/extensions/ToolzBazzar-Extension.zip`} download>
                      <Download className="h-4 w-4 mr-2" /> Download Extension
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-semibold mb-4 text-lg text-destructive">Subscription Inactive</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Your subscription is inactive. Please contact us on WhatsApp to activate your plan.
                </p>
                <Button asChild className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-semibold border-0">
                  <a href="https://wa.me/919448646624" target="_blank" rel="noopener noreferrer">
                    Contact on WhatsApp
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
