import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatCompactCurrency } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number;
  format?: "currency" | "percent" | "number" | "compact";
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  format = "currency",
  icon,
  trend,
  trendLabel,
  className,
}: KPICardProps) {
  const formattedValue = (() => {
    switch (format) {
      case "currency":
        return formatCurrency(value);
      case "compact":
        return formatCompactCurrency(value);
      case "percent":
        return formatPercent(value);
      case "number":
        return new Intl.NumberFormat("pt-BR").format(value);
      default:
        return value.toString();
    }
  })();

  const getTrendIcon = () => {
    if (!trend) return <Minus className="h-3 w-3 text-muted-foreground" />;
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-success" />;
    return <TrendingDown className="h-3 w-3 text-destructive" />;
  };

  const getTrendColor = () => {
    if (!trend) return "text-muted-foreground";
    return trend > 0 ? "text-success" : "text-destructive";
  };

  return (
    <Card className={cn("shadow-elegant hover:shadow-lg transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-foreground">{formattedValue}</span>
        </div>
        {(trend !== undefined || trendLabel) && (
          <div className="mt-2 flex items-center gap-1">
            {getTrendIcon()}
            <span className={cn("text-xs font-medium", getTrendColor())}>
              {trend !== undefined && `${trend > 0 ? "+" : ""}${formatPercent(trend)}`}
            </span>
            {trendLabel && (
              <span className="text-xs text-muted-foreground ml-1">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
