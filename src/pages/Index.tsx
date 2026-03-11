import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-body text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Redirect logged-in users to their dashboard
  if (user && role) {
    const dashMap: Record<string, string> = {
      admin: "/admin",
      volunteer: "/volunteer",
      donor: "/donor",
      receiver: "/receiver",
    };
    return <Navigate to={dashMap[role] || "/receiver"} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-4 font-heading text-4xl font-bold text-foreground md:text-5xl">
          Annadanam Seva Platform
        </h1>
        <p className="mb-8 max-w-lg font-body text-lg text-muted-foreground">
          A dignified platform for coordinating food service — connecting receivers, volunteers, donors, and administrators.
        </p>
        <div className="flex gap-4">
          <Button size="lg" onClick={() => navigate("/signup")}>
            Get Started
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate("/login")}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
