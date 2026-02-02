import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import type { ClientesNovosRecorrentesData } from "@/types/cliente";
import { UserPlus, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

interface ClientesNovosRecorrentesProps {
  data: ClientesNovosRecorrentesData;
}

export function ClientesNovosRecorrentes({ data }: ClientesNovosRecorrentesProps) {
  const chartData = [
    {
      name: "Quantidade",
      Novos: data.novos.quantidade,
      Recorrentes: data.recorrentes.quantidade,
    },
  ];

  const chartDataFaturamento = [
    {
      name: "Faturamento",
      Novos: data.novos.faturamento,
      Recorrentes: data.recorrentes.faturamento,
    },
  ];

  return (
    <Card className="shadow-elegant h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Clientes Novos vs. Recorrentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cards resumo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Novos</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatNumber(data.novos.quantidade)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatPercent(data.novos.percentualQtd)} do total
            </p>
            <p className="text-sm font-medium mt-2">
              {formatCurrency(data.novos.faturamento)}
            </p>
          </div>

          <div className="bg-secondary/50 rounded-lg p-4 border border-secondary">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-secondary-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Recorrentes</span>
            </div>
            <p className="text-2xl font-bold">
              {formatNumber(data.recorrentes.quantidade)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatPercent(data.recorrentes.percentualQtd)} do total
            </p>
            <p className="text-sm font-medium mt-2">
              {formatCurrency(data.recorrentes.faturamento)}
            </p>
          </div>
        </div>

        {/* Gráfico de barras comparativo */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartDataFaturamento}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                type="number"
                tickFormatter={(value) =>
                  value >= 1000000
                    ? `R$ ${(value / 1000000).toFixed(1)}M`
                    : `R$ ${(value / 1000).toFixed(0)}K`
                }
                className="text-xs"
              />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="Novos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Recorrentes" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
