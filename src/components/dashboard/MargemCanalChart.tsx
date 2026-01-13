import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/formatters";
import { CHART_COLORS } from "@/lib/constants";

interface MargemCanalChartProps {
  data: { canal: string; margem: number; margemPercentual: number; faturamento: number }[];
}

export function MargemCanalChart({ data }: MargemCanalChartProps) {
  const chartData = data.slice(0, 8).map((item) => ({
    ...item,
    canalDisplay: item.canal.length > 20 ? item.canal.substring(0, 17) + "..." : item.canal,
  }));

  return (
    <Card className="shadow-elegant">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Margem por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
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
              dataKey="canalDisplay"
              width={95}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "margem") return formatCurrency(value);
                return formatPercent(value);
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            <Bar dataKey="margem" name="Margem R$" fill={CHART_COLORS.secondary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
