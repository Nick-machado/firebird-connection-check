import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatCompactCurrency, formatCurrency } from "@/lib/formatters";
import type { TopItem } from "@/types/venda";
import { CHART_COLORS } from "@/lib/constants";

interface TopItemsChartProps {
  data: TopItem[];
  title: string;
  color?: string;
  horizontal?: boolean;
}

export function TopItemsChart({ data, title, color = CHART_COLORS.primary, horizontal = true }: TopItemsChartProps) {
  // Trunca nomes longos
  const chartData = data.map((item) => ({
    ...item,
    nomeDisplay: item.nome.length > 25 ? item.nome.substring(0, 22) + "..." : item.nome,
  }));

  return (
    <Card className="shadow-elegant">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          {horizontal ? (
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal />
              <XAxis
                type="number"
                tickFormatter={(value) => formatCompactCurrency(value)}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                type="category"
                dataKey="nomeDisplay"
                width={95}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                labelFormatter={(label) => {
                  const item = chartData.find((d) => d.nomeDisplay === label);
                  return item?.nome || label;
                }}
              />
              <Bar dataKey="valor" fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="nomeDisplay"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                height={60}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                tickFormatter={(value) => formatCompactCurrency(value)}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="valor" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
