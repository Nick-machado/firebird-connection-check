import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/formatters";
import { CHART_COLORS } from "@/lib/constants";
import type { ProdutoResumo } from "@/lib/produtosProcessing";

interface Props {
  data: ProdutoResumo[];
}

export function MargemProdutoChart({ data }: Props) {
  const chartData = data.map((p) => ({
    nome: p.nome.length > 40 ? p.nome.substring(0, 37) + "..." : p.nome,
    nomeCompleto: p.nome,
    faturamento: p.faturamento,
    margem: p.margem,
    margemPercentual: p.margemPercentual,
  }));

  return (
    <Card className="shadow-elegant border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Margem por Produto (Top 20)</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhum dado disponível.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 40 + 50)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal />
              <XAxis
                type="number"
                tickFormatter={(v) => formatPercent(v)}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                domain={[0, "auto"]}
              />
              <YAxis
                type="category"
                dataKey="nome"
                width={200}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval={0}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "margemPercentual") return [formatPercent(value), "Margem %"];
                  return [formatCurrency(value), name];
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                labelFormatter={(label) => {
                  const item = chartData.find((d) => d.nome === label);
                  if (!item) return label;
                  return `${item.nomeCompleto}\nFat: ${formatCurrency(item.faturamento)} | Margem: ${formatCurrency(item.margem)}`;
                }}
              />
              <Bar dataKey="margemPercentual" radius={[0, 4, 4, 0]} name="margemPercentual">
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.margemPercentual >= 35
                        ? CHART_COLORS.secondary
                        : entry.margemPercentual >= 20
                        ? CHART_COLORS.tertiary
                        : CHART_COLORS.muted
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
