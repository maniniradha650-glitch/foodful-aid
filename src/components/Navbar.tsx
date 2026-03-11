import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Bell, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const dashboardPath = role === "admin" ? "/admin" : role === "volunteer" ? "/volunteer" : role === "donor" ? "/donor" : "/receiver";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="font-heading text-lg font-bold text-primary-foreground">अ</span>
          </div>
          <span className="font-heading text-xl font-bold text-foreground">
            Annadanam <span className="text-gradient-primary"></span>
          </span>
        </Link>

        {/* Desktop nav */}
        {user && profile ? (
          <div className="hidden items-center gap-3 md:flex">
            <Link
              to={dashboardPath}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/notifications"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-body text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </Link>

            <div className="mx-2 h-8 w-px bg-border" />

            <div className="text-right">
              <p className="font-heading text-sm font-semibold text-foreground">
                Welcome, {profile.name || user.email}
              </p>
              <p className="font-body text-xs text-primary font-medium capitalize">
                {role}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate("/signup")}>
              Sign Up
            </Button>
          </div>
        )}

        {/* Mobile toggle */}
        <button className="md:hidden p-2 rounded-lg hover:bg-secondary" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden animate-fade-in">
          {user && profile ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="font-heading text-sm font-semibold text-foreground">
                  {profile.name || user.email}
                </p>
                <p className="font-body text-xs text-primary font-medium capitalize">{role}</p>
              </div>
              <Link
                to={dashboardPath}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-body text-sm text-foreground hover:bg-secondary"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <Link
                to="/notifications"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-body text-sm text-foreground hover:bg-secondary"
              >
                <Bell className="h-4 w-4" /> Notifications
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full gap-1.5">
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => { navigate("/login"); setMobileOpen(false); }}>
                Sign In
              </Button>
              <Button className="w-full" onClick={() => { navigate("/signup"); setMobileOpen(false); }}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
