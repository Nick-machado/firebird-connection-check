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

  // Renderiza label customizado para o gráfico de pizza
  const renderCustomLabel = ({ canal, percentual, cx, cy, midAngle, outerRadius }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Trunca nomes muito longos apenas no label externo
    const displayName = canal.length > 15 ? canal.substring(0, 12) + '...' : canal;
    
    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--muted-foreground))"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={11}
      >
        {`${displayName} (${formatPercent(percentual)})`}
      </text>
    );
  };

  return (
    <Card className="shadow-elegant border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Faturamento por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
              dataKey="valor"
              nameKey="canal"
              label={renderCustomLabel}
              labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
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
