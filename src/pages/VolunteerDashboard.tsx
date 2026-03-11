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
      await supabase.from("delivery_tasks").update({ status: newStatus, ...(newStatus === "food_picked" ? { pickup_time: new Date().toISOString() } : {}), ...(newStatus === "delivered" ? { delivery_time: new Date().toISOString() } : {}) }).eq("id", taskId);
      
      // Map task status to food_request status
      const requestStatusMap: Record<string, string> = {
        accepted: "volunteer_assigned",
        food_picked: "food_picked",
        on_the_way: "on_the_way",
        delivered: "delivered",
      };
      if (requestStatusMap[newStatus]) {
        await supabase.from("food_requests").update({ status: requestStatusMap[newStatus] }).eq("id", requestId);
      }
      toast.success(`Status updated to ${newStatus}`);
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
      <div className="container mx-auto p-4">
        <h1 className="mb-6 font-heading text-2xl font-bold text-foreground">Volunteer Dashboard</h1>

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

        <h2 className="mb-4 font-heading text-xl font-semibold">Assigned Deliveries</h2>
        {tasks.length === 0 ? (
          <p className="font-body text-muted-foreground">You have no pending tasks.</p>
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
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-heading text-lg font-semibold">{req?.location || "Unknown"}</h3>
                      <DeliveryStatusBadge status={task.status} />
                    </div>
                    {req && (
                      <div className="grid grid-cols-2 gap-1 font-body text-sm text-muted-foreground">
                        <p>Receiver: {req.receiver_name}</p>
                        <p>Phone: {req.phone}</p>
                        <p>People: {req.people_count}</p>
                        <p>Date: {req.required_date}</p>
                      </div>
                    )}
                    {req?.latitude && req?.longitude && (
                      <div className="my-3">
                        <DeliveryMap lat={req.latitude} lng={req.longitude} label={req.location} />
                      </div>
                    )}
                    {nextStatus[task.status] && (
                      <div className="mt-3 flex gap-2">
                        <Button onClick={() => updateStatus(task.id, task.request_id, nextStatus[task.status])}>
                          {nextLabel[task.status]}
                        </Button>
                        {task.status === "assigned" && (
                          <Button variant="outline" onClick={() => {
                            // Reject: just remove assignment
                            supabase.from("delivery_tasks").delete().eq("id", task.id);
                            supabase.from("food_requests").update({ assigned_volunteer_id: null, status: "approved" }).eq("id", task.request_id);
                            toast.info("Task rejected");
                            fetchTasks();
                          }}>
                            Reject Task
                          </Button>
                        )}
                      </div>
                    )}
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
