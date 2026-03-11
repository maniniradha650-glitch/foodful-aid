import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeliveryStatusBadge from "@/components/DeliveryStatusBadge";
import { toast } from "sonner";

interface FoodRequest {
  id: string;
  receiver_name: string;
  phone: string;
  location: string;
  people_count: number;
  required_date: string;
  notes: string;
  status: string;
  assigned_volunteer_id: string | null;
  created_at: string;
}

interface VolunteerOption {
  user_id: string;
  name: string;
}

export default function AdminDashboard() {
  const { user, profile, role } = useAuth();
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerOption[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, donations: 0 });

  const fetchData = async () => {
    const [reqRes, volRes, donRes] = await Promise.all([
      supabase.from("food_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "volunteer"),
      supabase.from("donations").select("amount"),
    ]);

    if (reqRes.data) {
      setRequests(reqRes.data as FoodRequest[]);
      setStats({
        total: reqRes.data.length,
        pending: reqRes.data.filter(r => r.status === "pending").length,
        delivered: reqRes.data.filter(r => r.status === "delivered").length,
        donations: donRes.data?.reduce((sum, d: any) => sum + Number(d.amount), 0) || 0,
      });
    }

    if (volRes.data) {
      const volIds = volRes.data.map((v: any) => v.user_id);
      if (volIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", volIds);
        if (profiles) setVolunteers(profiles as VolunteerOption[]);
      }
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const approveRequest = async (requestId: string) => {
    await supabase.from("food_requests").update({ status: "approved" }).eq("id", requestId);
    toast.success("Request approved");
    fetchData();
  };

  const assignVolunteer = async (requestId: string) => {
    const volunteerId = selectedVolunteers[requestId];
    if (!volunteerId) { toast.error("Select a volunteer first"); return; }

    await supabase.from("food_requests").update({ assigned_volunteer_id: volunteerId, status: "volunteer_assigned" }).eq("id", requestId);
    await supabase.from("delivery_tasks").insert({ volunteer_id: volunteerId, request_id: requestId, status: "assigned" });
    
    // Notify volunteer
    await supabase.from("notifications").insert({ user_id: volunteerId, message: "You have a new delivery task.", type: "assignment" });
    
    // Notify receiver
    const req = requests.find(r => r.id === requestId);
    if (req) {
      const volName = volunteers.find(v => v.user_id === volunteerId)?.name || "A volunteer";
      // Find receiver user_id from food_requests
      const { data: frData } = await supabase.from("food_requests").select("receiver_id").eq("id", requestId).single();
      if (frData) {
        await supabase.from("notifications").insert({ user_id: frData.receiver_id, message: `Your food will be delivered by ${volName}.`, type: "update" });
      }
    }

    toast.success("Volunteer assigned");
    fetchData();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="mb-6 font-heading text-2xl font-bold text-foreground">Admin Dashboard</h1>

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

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-heading text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="font-body text-sm text-muted-foreground">Total Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-heading text-2xl font-bold text-primary">{stats.pending}</p>
              <p className="font-body text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-heading text-2xl font-bold text-foreground">{stats.delivered}</p>
              <p className="font-body text-sm text-muted-foreground">Delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-heading text-2xl font-bold text-foreground">₹{stats.donations}</p>
              <p className="font-body text-sm text-muted-foreground">Donations</p>
            </CardContent>
          </Card>
        </div>

        {/* Requests */}
        <h2 className="mb-4 font-heading text-xl font-semibold">Food Requests</h2>
        {requests.length === 0 ? (
          <p className="font-body text-muted-foreground">You have no pending requests.</p>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <Card key={req.id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-heading text-lg font-semibold">{req.receiver_name}</h3>
                    <DeliveryStatusBadge status={req.status} />
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-1 font-body text-sm text-muted-foreground">
                    <p>Location: {req.location}</p>
                    <p>People: {req.people_count}</p>
                    <p>Phone: {req.phone}</p>
                    <p>Date: {req.required_date}</p>
                    {req.notes && <p className="col-span-2">Notes: {req.notes}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {req.status === "pending" && (
                      <Button onClick={() => approveRequest(req.id)}>
                        Approve Request
                      </Button>
                    )}
                    {(req.status === "approved" || req.status === "pending") && !req.assigned_volunteer_id && (
                      <>
                        <Select value={selectedVolunteers[req.id] || ""} onValueChange={v => setSelectedVolunteers(prev => ({ ...prev, [req.id]: v }))}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select volunteer" />
                          </SelectTrigger>
                          <SelectContent>
                            {volunteers.map(v => (
                              <SelectItem key={v.user_id} value={v.user_id}>{v.name || "Unnamed"}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={() => assignVolunteer(req.id)}>
                          Assign Volunteer
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
