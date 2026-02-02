import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/formatters";
import type { FrequenciaCompraData } from "@/types/cliente";
import { Repeat } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface FrequenciaCompraChartProps {
  data: FrequenciaCompraData[];
  taxaRecompraMedia: number;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

export function FrequenciaCompraChart({ data, taxaRecompraMedia }: FrequenciaCompraChartProps) {
  const totalClientes = data.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <Card className="shadow-elegant h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Repeat className="h-5 w-5 text-primary" />
          Frequência de Compra
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Taxa média de recompra */}
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Taxa Média de Recompra</p>
          <p className="text-3xl font-bold text-primary">
            {formatNumber(taxaRecompraMedia, 1)}x
          </p>
          <p className="text-xs text-muted-foreground">compras por cliente</p>
        </div>

        {/* Gráfico de pizza */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="quantidade"
                nameKey="frequencia"
                label={({ frequencia, percentual }) =>
                  `${frequencia}: ${formatPercent(percentual)}`
                }
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatNumber(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda detalhada */}
        <div className="space-y-2">
          {data.map((item, index) => (
            <div
              key={item.frequencia}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span>{item.frequencia}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium">{formatNumber(item.quantidade)}</span>
                <span className="text-muted-foreground w-16 text-right">
                  {formatPercent(item.percentual)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground pt-2 border-t">
          Total: {formatNumber(totalClientes)} clientes
        </div>
      </CardContent>
    </Card>
  );
}
