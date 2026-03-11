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

interface DeliveryTask {
  id: string;
  status: string;
  volunteer_id: string;
  request_id: string;
}

export default function DonorDashboard() {
  const { user, profile, role } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", request_id: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [donRes, reqRes, taskRes] = await Promise.all([
      supabase.from("donations").select("*").eq("donor_id", user.id).order("created_at", { ascending: false }),
      supabase.from("food_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("delivery_tasks").select("*"),
    ]);
    if (donRes.data) setDonations(donRes.data as Donation[]);
    if (reqRes.data) setRequests(reqRes.data as FoodRequest[]);
    if (taskRes.data) setTasks(taskRes.data as DeliveryTask[]);
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
      toast.success("Donation recorded");
      setShowForm(false);
      setForm({ amount: "", request_id: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-foreground">Donor Dashboard</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Donate"}
          </Button>
        </div>

        {profile && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2 font-body text-sm">
                <div><span className="text-muted-foreground">Name:</span> {profile.name}</div>
                <div><span className="text-muted-foreground">Email:</span> {profile.email}</div>
                <div><span className="text-muted-foreground">Role:</span> <span className="capitalize">{role}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="font-heading text-xl">Make a Donation</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleDonate} className="space-y-4">
                <div>
                  <Label className="font-body">Amount (₹)</Label>
                  <Input type="number" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div>
                  <Label className="font-body">Link to Food Request (optional)</Label>
                  <Select value={form.request_id} onValueChange={v => setForm({ ...form, request_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select request" /></SelectTrigger>
                    <SelectContent>
                      {requests.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.receiver_name} — {r.location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Processing..." : "Donate"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Donation history */}
        <h2 className="mb-4 font-heading text-xl font-semibold">Donation History</h2>
        {donations.length === 0 ? (
          <p className="font-body text-muted-foreground">You have no donations yet.</p>
        ) : (
          <div className="space-y-3">
            {donations.map(d => (
              <Card key={d.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-body text-sm">
                      <p className="font-semibold text-foreground">₹{d.amount}</p>
                      <p className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
                    </div>
                    {d.request_id && (() => {
                      const req = requests.find(r => r.id === d.request_id);
                      return req ? <DeliveryStatusBadge status={req.status} /> : null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delivery tracking */}
        <h2 className="mb-4 mt-8 font-heading text-xl font-semibold">Delivery Progress</h2>
        {requests.filter(r => r.status !== "pending").length === 0 ? (
          <p className="font-body text-muted-foreground">No active deliveries.</p>
        ) : (
          <div className="space-y-4">
            {requests.filter(r => r.status !== "pending").map(req => (
              req.status === "delivered" ? (
                <FulfilledReceipt key={req.id} peopleCount={req.people_count} deliveryDate={req.required_date} />
              ) : (
                <Card key={req.id}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-heading font-semibold">{req.receiver_name} — {req.location}</h3>
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
