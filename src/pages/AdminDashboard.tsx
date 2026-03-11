import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeliveryStatusBadge from "@/components/DeliveryStatusBadge";
import { toast } from "sonner";
import { ClipboardList, Clock, Truck, IndianRupee, CheckCircle2, UserCheck } from "lucide-react";

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
    await supabase.from("notifications").insert({ user_id: volunteerId, message: "You have a new delivery task.", type: "assignment" });
    const req = requests.find(r => r.id === requestId);
    if (req) {
      const volName = volunteers.find(v => v.user_id === volunteerId)?.name || "A volunteer";
      const { data: frData } = await supabase.from("food_requests").select("receiver_id").eq("id", requestId).single();
      if (frData) {
        await supabase.from("notifications").insert({ user_id: frData.receiver_id, message: `Your food will be delivered by ${volName}.`, type: "update" });
      }
    }
    toast.success("Volunteer assigned");
    fetchData();
  };

  const statCards = [
    { label: "Total Requests", value: stats.total, icon: ClipboardList, color: "text-foreground" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-primary" },
    { label: "Delivered", value: stats.delivered, icon: Truck, color: "text-success" },
    { label: "Donations", value: `₹${stats.donations}`, icon: IndianRupee, color: "text-accent" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="font-body text-muted-foreground mt-1">Manage food requests, assign volunteers, and track progress.</p>
        </div>

        {/* Profile Card */}
        {profile && (
          <Card className="mb-6 border-border shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-heading text-lg font-bold">
                  {profile.name?.charAt(0)?.toUpperCase() || "A"}
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

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label} className="stat-accent border-border shadow-stat">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className={`font-heading text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="font-body text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Requests */}
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold text-foreground">Food Requests</h2>
        </div>
        {requests.length === 0 ? (
          <Card className="border-border shadow-card">
            <CardContent className="p-8 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-body text-muted-foreground">No food requests yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <Card key={req.id} className="border-border shadow-card card-hover">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-foreground">{req.receiver_name}</h3>
                      <p className="font-body text-sm text-muted-foreground">{req.location}</p>
                    </div>
                    <DeliveryStatusBadge status={req.status} />
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg bg-secondary/50 p-3 font-body text-sm">
                    <p><span className="text-muted-foreground">People:</span> <span className="font-medium text-foreground">{req.people_count}</span></p>
                    <p><span className="text-muted-foreground">Phone:</span> <span className="font-medium text-foreground">{req.phone}</span></p>
                    <p><span className="text-muted-foreground">Date:</span> <span className="font-medium text-foreground">{req.required_date}</span></p>
                    {req.notes && <p className="col-span-2"><span className="text-muted-foreground">Notes:</span> <span className="font-medium text-foreground">{req.notes}</span></p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {req.status === "pending" && (
                      <Button onClick={() => approveRequest(req.id)} className="gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
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
                        <Button onClick={() => assignVolunteer(req.id)} className="gap-1.5">
                          <UserCheck className="h-4 w-4" />
                          Assign
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
