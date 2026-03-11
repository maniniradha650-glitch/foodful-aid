import { CheckCircle2, Clock, Truck, Package, MapPin, UserCheck, ThumbsUp } from "lucide-react";

const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  pending: { bg: "bg-muted", text: "text-muted-foreground", icon: Clock, label: "Pending" },
  approved: { bg: "bg-accent/10", text: "text-accent", icon: ThumbsUp, label: "Approved" },
  volunteer_assigned: { bg: "bg-primary/10", text: "text-primary", icon: UserCheck, label: "Volunteer Assigned" },
  food_picked: { bg: "bg-warning/10", text: "text-warning", icon: Package, label: "Food Picked" },
  on_the_way: { bg: "bg-accent/15", text: "text-accent", icon: Truck, label: "On The Way" },
  delivered: { bg: "bg-success/10", text: "text-success", icon: CheckCircle2, label: "Delivered" },
  assigned: { bg: "bg-primary/10", text: "text-primary", icon: UserCheck, label: "Assigned" },
  accepted: { bg: "bg-accent/10", text: "text-accent", icon: ThumbsUp, label: "Accepted" },
};

export default function DeliveryStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { bg: "bg-muted", text: "text-muted-foreground", icon: Clock, label: status };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-xs font-semibold ${config.bg} ${config.text}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
