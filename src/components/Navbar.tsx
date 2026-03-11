import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";

export default function Navbar() {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const dashboardPath = role === "admin" ? "/admin" : role === "volunteer" ? "/volunteer" : role === "donor" ? "/donor" : "/receiver";

  return (
    <nav className="border-b border-border bg-card px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="font-heading text-xl font-bold text-foreground">
          Annadanam Seva
        </Link>
        {user && profile ? (
          <div className="flex items-center gap-4">
            <Link to={dashboardPath} className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link to="/notifications" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              Notifications
            </Link>
            <div className="text-right">
              <p className="font-heading text-sm font-semibold text-foreground">
                Welcome, {profile.name || user.email}
              </p>
              <p className="font-body text-xs text-muted-foreground capitalize">
                Role: {role}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate("/signup")}>
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
