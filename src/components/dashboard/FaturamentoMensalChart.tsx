import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatCompactCurrency, formatCurrency } from "@/lib/formatters";
import type { FaturamentoMensal } from "@/types/venda";
import { CHART_COLORS } from "@/lib/constants";

interface FaturamentoMensalChartProps {
  dataAnoAtual: FaturamentoMensal[];
  dataAnoAnterior?: FaturamentoMensal[];
  anoAtual: number;
  anoAnterior?: number;
}

export function FaturamentoMensalChart({
  dataAnoAtual,
  dataAnoAnterior,
  anoAtual,
  anoAnterior,
}: FaturamentoMensalChartProps) {
  // Combina os dados para o gráfico - apenas valores líquidos
  const chartData = dataAnoAtual.map((item) => {
    const anoAnteriorItem = (dataAnoAnterior || []).find(
      (a) => Number(a.mes) === Number(item.mes)
    );
    return {
      mes: item.mesNome,
      [`${anoAtual}`]: item.valorLiquido,
      ...(anoAnterior && anoAnteriorItem 
        ? { [`${anoAnterior}`]: anoAnteriorItem.valorLiquido } 
        : {}),
    };
  });

  return (
    <Card className="shadow-elegant border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Comparativo Mensal de Faturamento Líquido</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="mes" 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              interval={0}
            />
            <YAxis
              tickFormatter={(value) => formatCompactCurrency(value)}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              width={70}
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
            <Legend />
            {/* Ano Atual */}
            <Line
              type="monotone"
              dataKey={`${anoAtual}`}
              name={`${anoAtual}`}
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.primary, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            {/* Ano Anterior */}
            {anoAnterior && (
              <Line
                type="monotone"
                dataKey={`${anoAnterior}`}
                name={`${anoAnterior}`}
                stroke={CHART_COLORS.muted}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: CHART_COLORS.muted, strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
