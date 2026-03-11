import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DeliveryStatusBadge from "@/components/DeliveryStatusBadge";
import DeliveryMap from "@/components/DeliveryMap";
import FulfilledReceipt from "@/components/FulfilledReceipt";
import { toast } from "sonner";

interface FoodRequest {
  id: string;
  receiver_name: string;
  phone: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  people_count: number;
  required_date: string;
  notes: string;
  status: string;
  assigned_volunteer_id: string | null;
  created_at: string;
}

export default function ReceiverDashboard() {
  const { user, profile, role } = useAuth();
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ receiver_name: "", phone: "", location: "", people_count: 1, required_date: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [volunteerNames, setVolunteerNames] = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("food_requests")
      .select("*")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      setRequests(data as FoodRequest[]);
      // Fetch volunteer names
      const volIds = data.filter(r => r.assigned_volunteer_id).map(r => r.assigned_volunteer_id!);
      if (volIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name")
          .in("user_id", volIds);
        if (profiles) {
          const map: Record<string, string> = {};
          profiles.forEach((p: any) => { map[p.user_id] = p.name; });
          setVolunteerNames(map);
        }
      }
    }
  };

  useEffect(() => { fetchRequests(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("food_requests").insert({
        receiver_id: user.id,
        receiver_name: form.receiver_name,
        phone: form.phone,
        location: form.location,
        people_count: form.people_count,
        required_date: form.required_date,
        notes: form.notes,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Food request submitted");
      setShowForm(false);
      setForm({ receiver_name: "", phone: "", location: "", people_count: 1, required_date: "", notes: "" });
      fetchRequests();
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
          <h1 className="font-heading text-2xl font-bold text-foreground">Receiver Dashboard</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Request Food"}
          </Button>
        </div>

        {/* Profile info */}
        {profile && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2 font-body text-sm">
                <div><span className="text-muted-foreground">Name:</span> {profile.name}</div>
                <div><span className="text-muted-foreground">Email:</span> {profile.email}</div>
                <div><span className="text-muted-foreground">Role:</span> <span className="capitalize">{role}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> {profile.phone || "—"}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Food Request Form</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="font-body">Receiver Name</Label>
                    <Input value={form.receiver_name} onChange={e => setForm({ ...form, receiver_name: e.target.value })} required />
                  </div>
                  <div>
                    <Label className="font-body">Phone</Label>
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                  </div>
                  <div>
                    <Label className="font-body">Location</Label>
                    <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
                  </div>
                  <div>
                    <Label className="font-body">Number of People</Label>
                    <Input type="number" min={1} value={form.people_count} onChange={e => setForm({ ...form, people_count: parseInt(e.target.value) || 1 })} required />
                  </div>
                  <div>
                    <Label className="font-body">Required Date</Label>
                    <Input type="date" value={form.required_date} onChange={e => setForm({ ...form, required_date: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <Label className="font-body">Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Your Requests</h2>
        {requests.length === 0 ? (
          <p className="font-body text-muted-foreground">You have no pending requests.</p>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              req.status === "delivered" ? (
                <FulfilledReceipt
                  key={req.id}
                  peopleCount={req.people_count}
                  deliveryDate={new Date(req.updated_at || req.created_at).toLocaleDateString()}
                />
              ) : (
                <Card key={req.id}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-heading text-lg font-semibold">{req.location}</h3>
                      <DeliveryStatusBadge status={req.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-body text-sm text-muted-foreground">
                      <p>People: {req.people_count}</p>
                      <p>Date: {req.required_date}</p>
                      {req.assigned_volunteer_id && (
                        <p className="col-span-2">Volunteer: {volunteerNames[req.assigned_volunteer_id] || "Assigned"}</p>
                      )}
                    </div>
                    {req.latitude && req.longitude && (
                      <div className="mt-3">
                        <DeliveryMap lat={req.latitude} lng={req.longitude} label={req.location} />
                      </div>
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
