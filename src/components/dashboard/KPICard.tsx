import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatCompactCurrency, formatCurrencyExact } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  // Valor exato para o tooltip
  const exactValue = (() => {
    switch (format) {
      case "currency":
      case "compact":
        return formatCurrencyExact(value);
      case "percent":
        return `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value)}%`;
      case "number":
        return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
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
    <TooltipProvider>
      <Card className={cn(
        "shadow-elegant transition-all duration-300 hover:shadow-lg hover-glow border-border/50 bg-card/80 backdrop-blur-sm",
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            {icon && <span className="text-primary/70">{icon}</span>}
          </div>
          <div className="mt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-2xl font-bold text-foreground cursor-help">
                  {formattedValue}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{exactValue}</p>
              </TooltipContent>
            </Tooltip>
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
    </TooltipProvider>
  );
}
