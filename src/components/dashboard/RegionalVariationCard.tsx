import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface RegionalVariationCardProps {
  titulo: string;
  variacaoMoM: number;
  variacaoYoY: number;
}

function VariationIndicator({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = Math.abs(value) < 0.5;

  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className={cn(
        "flex items-center gap-1 text-lg font-bold",
        isNeutral && "text-muted-foreground",
        isPositive && !isNeutral && "text-emerald-600",
        isNegative && !isNeutral && "text-red-600"
      )}>
        {isNeutral ? (
          <Minus className="h-4 w-4" />
        ) : isPositive ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        <span>{formatPercent(Math.abs(value))}</span>
      </div>
    </div>
  );
}

export function RegionalVariationCard({ titulo, variacaoMoM, variacaoYoY }: RegionalVariationCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <VariationIndicator value={variacaoMoM} label="vs Mês Anterior" />
          <VariationIndicator value={variacaoYoY} label="vs Ano Anterior" />
        </div>
      </CardContent>
    </Card>
  );
}
