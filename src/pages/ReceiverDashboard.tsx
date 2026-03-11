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
import { Plus, X, UtensilsCrossed, MapPin, Users, Calendar } from "lucide-react";

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
  updated_at?: string;
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
    const { data } = await supabase.from("food_requests").select("*").eq("receiver_id", user.id).order("created_at", { ascending: false });
    if (data) {
      setRequests(data as FoodRequest[]);
      const volIds = data.filter(r => r.assigned_volunteer_id).map(r => r.assigned_volunteer_id!);
      if (volIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", volIds);
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
      toast.success("Food request submitted!");
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
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Receiver Dashboard</h1>
            <p className="font-body text-muted-foreground mt-1">Submit food requests and track your deliveries.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-1.5">
            {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Request Food</>}
          </Button>
        </div>

        {/* Profile */}
        {profile && (
          <Card className="mb-6 border-border shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success font-heading text-lg font-bold">
                  {profile.name?.charAt(0)?.toUpperCase() || "R"}
                </div>
                <div>
                  <p className="font-heading text-base font-semibold text-foreground">{profile.name}</p>
                  <p className="font-body text-sm text-muted-foreground">{profile.email}</p>
                </div>
                <div className="ml-auto text-right">
                  <span className="rounded-full bg-success/10 px-3 py-1 font-body text-xs font-semibold text-success capitalize">{role}</span>
                  {profile.phone && <p className="mt-1 font-body text-xs text-muted-foreground">{profile.phone}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Form */}
        {showForm && (
          <Card className="mb-6 border-border shadow-card-hover animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                Food Request Form
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="font-body text-sm font-medium">Receiver Name</Label>
                    <Input placeholder="Full name" value={form.receiver_name} onChange={e => setForm({ ...form, receiver_name: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-body text-sm font-medium">Phone</Label>
                    <Input placeholder="Contact number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-body text-sm font-medium">Location</Label>
                    <Input placeholder="Delivery address" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-body text-sm font-medium">Number of People</Label>
                    <Input type="number" min={1} value={form.people_count} onChange={e => setForm({ ...form, people_count: parseInt(e.target.value) || 1 })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-body text-sm font-medium">Required Date</Label>
                    <Input type="date" value={form.required_date} onChange={e => setForm({ ...form, required_date: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-sm font-medium">Notes (optional)</Label>
                  <Textarea placeholder="Any dietary requirements or special instructions..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button type="submit" disabled={submitting} className="gap-1.5">
                  <UtensilsCrossed className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Requests */}
        <div className="mb-4 flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold text-foreground">Your Requests</h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-body text-xs font-semibold text-primary">{requests.length}</span>
        </div>

        {requests.length === 0 ? (
          <Card className="border-border shadow-card">
            <CardContent className="p-8 text-center">
              <UtensilsCrossed className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-body text-muted-foreground">No requests yet. Click "Request Food" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              req.status === "delivered" ? (
                <FulfilledReceipt key={req.id} peopleCount={req.people_count} deliveryDate={new Date(req.updated_at || req.created_at).toLocaleDateString()} />
              ) : (
                <Card key={req.id} className="border-border shadow-card card-hover">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <h3 className="font-heading text-lg font-semibold text-foreground">{req.location}</h3>
                      </div>
                      <DeliveryStatusBadge status={req.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary/30 p-3 font-body text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span><span className="text-muted-foreground">People:</span> <span className="font-medium text-foreground">{req.people_count}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span><span className="text-muted-foreground">Date:</span> <span className="font-medium text-foreground">{req.required_date}</span></span>
                      </div>
                      {req.assigned_volunteer_id && (
                        <p className="col-span-2 text-foreground font-medium">
                          🚴 Volunteer: {volunteerNames[req.assigned_volunteer_id] || "Assigned"}
                        </p>
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
