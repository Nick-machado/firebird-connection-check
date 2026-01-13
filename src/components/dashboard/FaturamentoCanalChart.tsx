import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { FaturamentoPorCanal } from "@/types/venda";
import { CHART_PALETTE } from "@/lib/constants";

interface FaturamentoCanalChartProps {
  data: FaturamentoPorCanal[];
}

export function FaturamentoCanalChart({ data }: FaturamentoCanalChartProps) {
  // Agrupa canais pequenos em "Outros"
  const threshold = 3; // 3%
  const mainData = data.filter((item) => item.percentual >= threshold);
  const outros = data.filter((item) => item.percentual < threshold);
  
  const chartData = [
    ...mainData,
    ...(outros.length > 0
      ? [{
          canal: "Outros",
          valor: outros.reduce((sum, item) => sum + item.valor, 0),
          percentual: outros.reduce((sum, item) => sum + item.percentual, 0),
        }]
      : []),
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.canal}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(data.valor)}</p>
          <p className="text-sm text-primary">{formatPercent(data.percentual)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-elegant">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Faturamento por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="valor"
              nameKey="canal"
              label={({ canal, percentual }) => `${canal} (${formatPercent(percentual)})`}
              labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
