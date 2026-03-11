const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  approved: "bg-secondary text-secondary-foreground",
  volunteer_assigned: "bg-accent/20 text-accent",
  food_picked: "bg-primary/20 text-foreground",
  on_the_way: "bg-accent text-accent-foreground",
  delivered: "bg-primary text-primary-foreground",
  assigned: "bg-accent/20 text-accent",
  accepted: "bg-primary/20 text-foreground",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  volunteer_assigned: "Volunteer Assigned",
  food_picked: "Food Picked",
  on_the_way: "On The Way",
  delivered: "Delivered",
  assigned: "Assigned",
  accepted: "Accepted",
};

export default function DeliveryStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 font-body text-xs font-medium ${statusColors[status] || "bg-muted text-muted-foreground"}`}>
      {statusLabels[status] || status}
    </span>
  );
}
