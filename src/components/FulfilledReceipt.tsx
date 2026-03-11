import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface FulfilledReceiptProps {
  peopleCount: number;
  deliveryDate: string;
}

export default function FulfilledReceipt({ peopleCount, deliveryDate }: FulfilledReceiptProps) {
  return (
    <Card className="border-success/20 bg-success/5 shadow-card">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <div>
          <p className="font-heading text-base font-semibold text-foreground">
            Delivered Successfully
          </p>
          <p className="font-body text-sm text-muted-foreground">
            Food for {peopleCount} people was delivered on {deliveryDate}.
          </p>
        </div>
        <span className="ml-auto rounded-full bg-success/10 px-3 py-1 font-body text-xs font-semibold text-success">
          Fulfilled
        </span>
      </CardContent>
    </Card>
  );
}
