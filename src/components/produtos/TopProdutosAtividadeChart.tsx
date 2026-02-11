import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatCompactCurrency, formatCurrency } from "@/lib/formatters";
import { CHART_COLORS } from "@/lib/constants";
import type { ProdutoPorAtividade } from "@/lib/produtosProcessing";
import { useState } from "react";

interface Props {
  data: ProdutoPorAtividade[];
}

export function TopProdutosAtividadeChart({ data }: Props) {
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<string>(
    data[0]?.atividade || ""
  );

  const atividadeData = data.find((a) => a.atividade === atividadeSelecionada);
  const chartData = atividadeData?.produtos.map((p) => ({
    nome: p.nome.length > 40 ? p.nome.substring(0, 37) + "..." : p.nome,
    nomeCompleto: p.nome,
    faturamento: p.faturamento,
    margem: p.margem,
  })) || [];

  return (
    <Card className="shadow-elegant border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-semibold">Top Produtos por Atividade</CardTitle>
          <Select value={atividadeSelecionada} onValueChange={setAtividadeSelecionada}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecione a atividade" />
            </SelectTrigger>
            <SelectContent>
              {data.map((a) => (
                <SelectItem key={a.atividade} value={a.atividade}>
                  {a.atividade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Nenhum produto encontrado para esta atividade.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40 + 50)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal />
              <XAxis
                type="number"
                tickFormatter={(v) => formatCompactCurrency(v)}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
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
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === "faturamento" ? "Faturamento" : "Margem",
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                labelFormatter={(label) => {
                  const item = chartData.find((d) => d.nome === label);
                  return item?.nomeCompleto || label;
                }}
              />
              <Bar dataKey="faturamento" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} name="faturamento" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
