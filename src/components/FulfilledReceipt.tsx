import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FulfilledReceiptProps {
  peopleCount: number;
  deliveryDate: string;
}

export default function FulfilledReceipt({ peopleCount, deliveryDate }: FulfilledReceiptProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-sm text-center">
        <CardContent className="space-y-6 p-8">
          {/* Simple hand-drawn style SVG */}
          <svg viewBox="0 0 120 80" className="mx-auto h-24 w-36 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* Left hand giving */}
            <path d="M10 60 Q20 40 30 45 Q35 47 40 50 L50 50" />
            <path d="M30 45 Q32 38 38 40" />
            <path d="M34 42 Q36 35 42 38" />
            {/* Bowl */}
            <ellipse cx="60" cy="48" rx="15" ry="5" />
            <path d="M45 48 Q50 65 60 65 Q70 65 75 48" />
            {/* Right hand receiving */}
            <path d="M70 50 L80 50 Q85 47 90 45 Q100 40 110 60" />
            <path d="M82 40 Q84 35 90 38" />
            <path d="M86 42 Q88 38 92 40" />
          </svg>
          <p className="font-heading text-lg text-foreground">
            Food for {peopleCount} people was delivered on {deliveryDate}.
          </p>
          <Button variant="fulfilled" disabled>
            Fulfilled
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
