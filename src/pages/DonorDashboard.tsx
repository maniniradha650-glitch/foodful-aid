import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeliveryStatusBadge from "@/components/DeliveryStatusBadge";
import DeliveryMap from "@/components/DeliveryMap";
import FulfilledReceipt from "@/components/FulfilledReceipt";
import { toast } from "sonner";
import { Heart, Plus, X, IndianRupee, MapPin, TrendingUp } from "lucide-react";

interface Donation {
  id: string;
  donor_name: string;
  amount: number;
  request_id: string | null;
  created_at: string;
}

interface FoodRequest {
  id: string;
  receiver_name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  people_count: number;
  required_date: string;
  status: string;
}

export default function DonorDashboard() {
  const { user, profile, role } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", request_id: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [donRes, reqRes] = await Promise.all([
      supabase.from("donations").select("*").eq("donor_id", user.id).order("created_at", { ascending: false }),
      supabase.from("food_requests").select("*").order("created_at", { ascending: false }),
    ]);
    if (donRes.data) setDonations(donRes.data as Donation[]);
    if (reqRes.data) setRequests(reqRes.data as FoodRequest[]);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("donations").insert({
        donor_id: user.id,
        donor_name: profile.name,
        amount: parseFloat(form.amount),
        request_id: form.request_id || null,
      });
      if (error) throw error;
      toast.success("Donation recorded! Thank you 🙏");
      setShowForm(false);
      setForm({ amount: "", request_id: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Donor Dashboard</h1>
            <p className="font-body text-muted-foreground mt-1">Track your donations and delivery progress.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-1.5">
            {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Donate</>}
          </Button>
        </div>

        {/* Profile + Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {profile && (
            <Card className="border-border shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-heading text-lg font-bold">
                    {profile.name?.charAt(0)?.toUpperCase() || "D"}
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold text-foreground">{profile.name}</p>
                    <p className="font-body text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 font-body text-xs font-semibold text-primary capitalize">{role}</span>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="stat-accent border-border shadow-stat">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold text-primary">₹{totalDonated.toLocaleString()}</p>
                  <p className="font-body text-xs text-muted-foreground">Total Donated · {donations.length} contributions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Donation Form */}
        {showForm && (
          <Card className="mb-6 border-border shadow-card-hover animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Make a Donation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleDonate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-body text-sm font-medium">Amount (₹)</Label>
                  <Input type="number" min="1" placeholder="Enter amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-sm font-medium">Link to Food Request (optional)</Label>
                  <Select value={form.request_id} onValueChange={v => setForm({ ...form, request_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select a request to sponsor" /></SelectTrigger>
                    <SelectContent>
                      {requests.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.receiver_name} — {r.location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={submitting} className="gap-1.5">
                  <Heart className="h-4 w-4" />
                  {submitting ? "Processing..." : "Donate Now"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Donation history */}
        <div className="mb-4 flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold text-foreground">Donation History</h2>
        </div>
        {donations.length === 0 ? (
          <Card className="border-border shadow-card">
            <CardContent className="p-8 text-center">
              <Heart className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-body text-muted-foreground">No donations yet. Be the first to make a difference!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 mb-8">
            {donations.map(d => (
              <Card key={d.id} className="border-border shadow-card card-hover">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <IndianRupee className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-body text-sm">
                      <p className="font-semibold text-foreground">₹{d.amount.toLocaleString()}</p>
                      <p className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {d.request_id && (() => {
                    const req = requests.find(r => r.id === d.request_id);
                    return req ? <DeliveryStatusBadge status={req.status} /> : null;
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delivery tracking */}
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" />
          <h2 className="font-heading text-xl font-semibold text-foreground">Delivery Progress</h2>
        </div>
        {requests.filter(r => r.status !== "pending").length === 0 ? (
          <Card className="border-border shadow-card">
            <CardContent className="p-8 text-center">
              <MapPin className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-body text-muted-foreground">No active deliveries to track.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.filter(r => r.status !== "pending").map(req => (
              req.status === "delivered" ? (
                <FulfilledReceipt key={req.id} peopleCount={req.people_count} deliveryDate={req.required_date} />
              ) : (
                <Card key={req.id} className="border-border shadow-card card-hover">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-heading font-semibold text-foreground">{req.receiver_name} — {req.location}</h3>
                      <DeliveryStatusBadge status={req.status} />
                    </div>
                    {req.latitude && req.longitude && (
                      <DeliveryMap lat={req.latitude} lng={req.longitude} label={req.location} />
                    )}
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
