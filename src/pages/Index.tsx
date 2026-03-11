import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, Truck, Users, ShieldCheck } from "lucide-react";

export default function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-body text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && role) {
    const dashMap: Record<string, string> = { admin: "/admin", volunteer: "/volunteer", donor: "/donor", receiver: "/receiver" };
    return <Navigate to={dashMap[role] || "/receiver"} replace />;
  }

  const features = [
    { icon: Heart, title: "Donate Food", desc: "Sponsor meals for those in need. Track every donation from kitchen to delivery." },
    { icon: Truck, title: "Volunteer Delivery", desc: "Accept delivery tasks, navigate to locations, and update status in real-time." },
    { icon: Users, title: "Request Meals", desc: "Submit food requests with location and count. Get notified when help is on the way." },
    { icon: ShieldCheck, title: "Admin Oversight", desc: "Approve requests, assign volunteers, and monitor the entire workflow end-to-end." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative mx-auto flex min-h-[75vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-body text-sm font-medium text-primary">Serving communities with dignity</span>
          </div>
          <h1 className="mb-5 font-heading text-4xl font-bold leading-tight text-foreground md:text-6xl">
            Annadanam <span className="text-gradient-primary"></span> Platform
          </h1>
          <p className="mb-10 max-w-2xl font-body text-lg leading-relaxed text-muted-foreground md:text-xl">
            A dignified platform connecting food donors, volunteers, and receivers — ensuring no one goes hungry. Track every meal from kitchen to table.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => navigate("/signup")} className="text-base px-8">
              Get Started Free
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/login")} className="text-base px-8">
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-3 text-center font-heading text-3xl font-bold text-foreground">How It Works</h2>
          <p className="mx-auto mb-12 max-w-xl text-center font-body text-muted-foreground">
            Four roles, one mission — eliminating food waste and hunger through coordinated community action.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="font-body text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Test Credentials */}
      <section className="border-t border-border py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center font-heading text-2xl font-bold text-foreground">Demo Credentials</h2>
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            {[
              { role: "Admin", email: "admin@annadanam.test", pass: "Admin@123", color: "bg-destructive/10 text-destructive" },
              { role: "Volunteer", email: "volunteer@annadanam.test", pass: "Volunteer@123", color: "bg-accent/10 text-accent" },
              { role: "Receiver", email: "receiver@annadanam.test", pass: "Receiver@123", color: "bg-success/10 text-success" },
              { role: "Donor", email: "donor@annadanam.test", pass: "Donor@123", color: "bg-primary/10 text-primary" },
            ].map((cred) => (
              <div key={cred.role} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <span className={`mb-2 inline-block rounded-full px-2.5 py-0.5 font-body text-xs font-semibold ${cred.color}`}>
                  {cred.role}
                </span>
                <p className="font-body text-sm text-foreground"><span className="text-muted-foreground">Email:</span> {cred.email}</p>
                <p className="font-body text-sm text-foreground"><span className="text-muted-foreground">Password:</span> {cred.pass}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="font-body text-sm text-muted-foreground">
            © {new Date().getFullYear()} Annadanam. Built with ❤️ for community food service.
          </p>
        </div>
      </footer>
    </div>
  );
}
