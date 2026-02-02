import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { formatCompactCurrency } from "@/lib/formatters";
import type { CanalPorRegiao } from "@/lib/regionalProcessing";

interface RegionalChannelsChartProps {
  dados: Map<string, CanalPorRegiao[]>;
  tipo: "uf" | "regiao";
  selecionado: string | null;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function RegionalChannelsChart({ dados, tipo, selecionado }: RegionalChannelsChartProps) {
  // Get top 5 regions/states by total revenue
  const regioesPorFaturamento: { nome: string; total: number }[] = [];
  dados.forEach((canais, regiao) => {
    const total = canais.reduce((sum, c) => sum + c.faturamento, 0);
    regioesPorFaturamento.push({ nome: regiao, total });
  });
  regioesPorFaturamento.sort((a, b) => b.total - a.total);
  
  const topRegioes = selecionado 
    ? [selecionado] 
    : regioesPorFaturamento.slice(0, 5).map((r) => r.nome);

  // Build chart data showing top 2 channels per region
  const chartData: { nome: string; canal1: number; canal1Nome: string; canal2: number; canal2Nome: string }[] = [];
  
  topRegioes.forEach((regiao) => {
    const canais = dados.get(regiao) || [];
    const topCanais = canais.slice(0, 2);
    
    chartData.push({
      nome: regiao,
      canal1: topCanais[0]?.faturamento || 0,
      canal1Nome: topCanais[0]?.canal || "",
      canal2: topCanais[1]?.faturamento || 0,
      canal2Nome: topCanais[1]?.canal || "",
    });
  });

  const titulo = tipo === "uf" 
    ? "Canais por Estado" 
    : "Canais por Região";

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string; payload: { canal1Nome: string; canal2Nome: string } }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              {entry.dataKey === "canal1" ? entry.payload.canal1Nome : entry.payload.canal2Nome}:
            </span>
            <span className="font-medium">{formatCompactCurrency(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 15, right: 15 }}>
            <XAxis type="number" tickFormatter={(v) => formatCompactCurrency(v)} />
            <YAxis 
              type="category" 
              dataKey="nome" 
              width={80}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="canal1" stackId="a" radius={[0, 0, 0, 0]}>
              {chartData.map((_, idx) => (
                <Cell key={`cell-1-${idx}`} fill={COLORS[0]} />
              ))}
              <LabelList 
                dataKey="canal1Nome" 
                position="insideLeft" 
                fill="hsl(var(--primary-foreground))"
                fontSize={10}
                formatter={(value: string) => value.length > 15 ? value.slice(0, 12) + "..." : value}
              />
            </Bar>
            <Bar dataKey="canal2" stackId="a" radius={[0, 4, 4, 0]}>
              {chartData.map((_, idx) => (
                <Cell key={`cell-2-${idx}`} fill={COLORS[1]} />
              ))}
              <LabelList 
                dataKey="canal2Nome" 
                position="insideLeft" 
                fill="hsl(var(--primary-foreground))"
                fontSize={10}
                formatter={(value: string) => value.length > 15 ? value.slice(0, 12) + "..." : value}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
