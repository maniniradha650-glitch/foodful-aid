import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";

interface Notification {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setNotifications(data as Notification[]);
    };
    fetchNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const typeIcons: Record<string, string> = {
    assignment: "🚴",
    update: "📦",
    info: "ℹ️",
    request: "🍽️",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl p-4 md:p-6">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            Notifications
          </h1>
          <p className="font-body text-muted-foreground mt-1">
            {notifications.filter(n => !n.is_read).length} unread notifications
          </p>
        </div>

        {notifications.length === 0 ? (
          <Card className="border-border shadow-card">
            <CardContent className="p-8 text-center">
              <Bell className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-body text-muted-foreground">No notifications yet. You'll see updates here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <Card
                key={n.id}
                className={`border-border shadow-card transition-all duration-200 ${
                  n.is_read ? "opacity-60" : "border-l-4 border-l-primary"
                }`}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 text-lg">{typeIcons[n.type] || "📌"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-foreground">{n.message}</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.is_read && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)} className="shrink-0 gap-1 text-xs">
                      <CheckCheck className="h-3.5 w-3.5" />
                      Read
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
