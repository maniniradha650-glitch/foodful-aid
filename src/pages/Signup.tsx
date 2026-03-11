import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

type UserRole = "receiver" | "volunteer" | "donor";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("receiver");
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSubmitting(true);
    try {
      await signUp(email, password, name, role);
      toast.success("Account created! Please check your email to confirm.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign up");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="font-heading text-xl font-bold text-primary-foreground">अ</span>
            </div>
            <span className="font-heading text-2xl font-bold text-foreground">Annadanam Seva</span>
          </Link>
        </div>

        <Card className="shadow-card-hover border-border">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-heading text-2xl">Create Account</CardTitle>
            <CardDescription className="font-body">Join the community and start making a difference</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="font-body text-sm font-medium">Full Name</Label>
                <Input id="name" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-body text-sm font-medium">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="font-body text-sm font-medium">Password</Label>
                <Input id="password" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-sm font-medium">I want to</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receiver">Request Food (Receiver)</SelectItem>
                    <SelectItem value="volunteer">Deliver Food (Volunteer)</SelectItem>
                    <SelectItem value="donor">Donate (Donor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                <UserPlus className="h-4 w-4" />
                {submitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            <p className="mt-6 text-center font-body text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Sign In</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
