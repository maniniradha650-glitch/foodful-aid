import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DeliveryStatusBadge from "@/components/DeliveryStatusBadge";
import DeliveryMap from "@/components/DeliveryMap";
import FulfilledReceipt from "@/components/FulfilledReceipt";
import { toast } from "sonner";
import { Truck, MapPin, Phone, Users, Calendar, ArrowRight, XCircle } from "lucide-react";

interface Task {
  id: string;
  volunteer_id: string;
  request_id: string;
  status: string;
  pickup_time: string | null;
  delivery_time: string | null;
  created_at: string;
  food_requests?: {
    id: string;
    receiver_name: string;
    phone: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    people_count: number;
    required_date: string;
    status: string;
  };
}

export default function VolunteerDashboard() {
  const { user, profile, role } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("delivery_tasks")
      .select("*, food_requests(*)")
      .eq("volunteer_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setTasks(data as any);
  };

  useEffect(() => { fetchTasks(); }, [user]);

  const updateStatus = async (taskId: string, requestId: string, newStatus: string) => {
    try {
      await supabase.from("delivery_tasks").update({
        status: newStatus,
        ...(newStatus === "food_picked" ? { pickup_time: new Date().toISOString() } : {}),
        ...(newStatus === "delivered" ? { delivery_time: new Date().toISOString() } : {}),
      }).eq("id", taskId);

      const requestStatusMap: Record<string, string> = {
        accepted: "volunteer_assigned",
        food_picked: "food_picked",
        on_the_way: "on_the_way",
        delivered: "delivered",
      };
      if (requestStatusMap[newStatus]) {
        await supabase.from("food_requests").update({ status: requestStatusMap[newStatus] }).eq("id", requestId);
      }
      toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}`);
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const nextStatus: Record<string, string> = {
    assigned: "accepted",
    accepted: "food_picked",
    food_picked: "on_the_way",
    on_the_way: "delivered",
  };

  const nextLabel: Record<string, string> = {
    assigned: "Accept Task",
    accepted: "Mark Food Picked",
    food_picked: "Mark On The Way",
    on_the_way: "Mark Delivered",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Volunteer Dashboard</h1>
          <p className="font-body text-muted-foreground mt-1">Manage your delivery assignments and track progress.</p>
        </div>

        {/* Profile */}
        {profile && (
          <Card className="mb-6 border-border shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent font-heading text-lg font-bold">
                  {profile.name?.charAt(0)?.toUpperCase() || "V"}
                </div>
                <div>
                  <p className="font-heading text-base font-semibold text-foreground">{profile.name}</p>
                  <p className="font-body text-sm text-muted-foreground">{profile.email}</p>
                </div>
                <span className="ml-auto rounded-full bg-accent/10 px-3 py-1 font-body text-xs font-semibold text-accent capitalize">{role}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold text-foreground">Assigned Deliveries</h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-body text-xs font-semibold text-primary">{tasks.length}</span>
        </div>

        {tasks.length === 0 ? (
          <Card className="border-border shadow-card">
            <CardContent className="p-8 text-center">
              <Truck className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-body text-muted-foreground">No assigned deliveries yet. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => {
              const req = task.food_requests;
              if (task.status === "delivered" && req) {
                return (
                  <FulfilledReceipt
                    key={task.id}
                    peopleCount={req.people_count}
                    deliveryDate={task.delivery_time ? new Date(task.delivery_time).toLocaleDateString() : "—"}
                  />
                );
              }
              return (
                <Card key={task.id} className="border-border shadow-card card-hover overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <h3 className="font-heading text-base font-semibold text-foreground">{req?.location || "Unknown"}</h3>
                      </div>
                      <DeliveryStatusBadge status={task.status} />
                    </div>
                    <div className="p-5">
                      {req && (
                        <div className="grid grid-cols-2 gap-3 mb-4 rounded-lg bg-secondary/30 p-3 font-body text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span><span className="text-muted-foreground">Receiver:</span> <span className="font-medium text-foreground">{req.receiver_name}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span><span className="text-muted-foreground">Phone:</span> <span className="font-medium text-foreground">{req.phone}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span><span className="text-muted-foreground">People:</span> <span className="font-medium text-foreground">{req.people_count}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span><span className="text-muted-foreground">Date:</span> <span className="font-medium text-foreground">{req.required_date}</span></span>
                          </div>
                        </div>
                      )}
                      {req?.latitude && req?.longitude && (
                        <div className="mb-4">
                          <DeliveryMap lat={req.latitude} lng={req.longitude} label={req.location} />
                        </div>
                      )}
                      {nextStatus[task.status] && (
                        <div className="flex gap-2">
                          <Button onClick={() => updateStatus(task.id, task.request_id, nextStatus[task.status])} className="gap-1.5">
                            <ArrowRight className="h-4 w-4" />
                            {nextLabel[task.status]}
                          </Button>
                          {task.status === "assigned" && (
                            <Button variant="outline" onClick={async () => {
                              await supabase.from("delivery_tasks").delete().eq("id", task.id);
                              await supabase.from("food_requests").update({ assigned_volunteer_id: null, status: "approved" }).eq("id", task.request_id);
                              toast.info("Task rejected");
                              fetchTasks();
                            }} className="gap-1.5">
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
