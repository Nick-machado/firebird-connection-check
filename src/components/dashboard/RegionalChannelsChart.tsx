import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCompactCurrency } from "@/lib/formatters";
import type { CanalPorRegiao } from "@/lib/regionalProcessing";
import { useMemo } from "react";

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
  "hsl(210, 70%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(30, 80%, 55%)",
  "hsl(180, 60%, 45%)",
  "hsl(350, 65%, 55%)",
];

export function RegionalChannelsChart({ dados, tipo, selecionado }: RegionalChannelsChartProps) {
  // Get data for selected region or top 5
  const { chartData, canaisUnicos } = useMemo(() => {
    const regioesPorFaturamento: { nome: string; total: number }[] = [];
    dados.forEach((canais, regiao) => {
      const total = canais.reduce((sum, c) => sum + c.faturamento, 0);
      regioesPorFaturamento.push({ nome: regiao, total });
    });
    regioesPorFaturamento.sort((a, b) => b.total - a.total);
    
    const topRegioes = selecionado 
      ? [selecionado] 
      : regioesPorFaturamento.slice(0, 5).map((r) => r.nome);

    // Collect all unique channels across selected regions
    const todosCanais = new Set<string>();
    topRegioes.forEach((regiao) => {
      const canais = dados.get(regiao) || [];
      canais.forEach((c) => todosCanais.add(c.canal));
    });

    // Sort channels by total revenue across all regions
    const canaisPorTotal = new Map<string, number>();
    topRegioes.forEach((regiao) => {
      const canais = dados.get(regiao) || [];
      canais.forEach((c) => {
        canaisPorTotal.set(c.canal, (canaisPorTotal.get(c.canal) || 0) + c.faturamento);
      });
    });
    
    const canaisOrdenados = Array.from(todosCanais).sort(
      (a, b) => (canaisPorTotal.get(b) || 0) - (canaisPorTotal.get(a) || 0)
    );

    // Build chart data with all channels as separate data keys
    const data: Record<string, string | number>[] = [];
    
    topRegioes.forEach((regiao) => {
      const canais = dados.get(regiao) || [];
      const item: Record<string, string | number> = { nome: regiao };
      
      canaisOrdenados.forEach((canal) => {
        const canalData = canais.find((c) => c.canal === canal);
        item[canal] = canalData?.faturamento || 0;
      });
      
      data.push(item);
    });

    return { chartData: data, canaisUnicos: canaisOrdenados };
  }, [dados, selecionado]);

  const titulo = tipo === "uf" 
    ? "Canais por Estado" 
    : "Canais por Região";

  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: { 
    active?: boolean; 
    payload?: { value: number; dataKey: string; fill: string }[]; 
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    
    // Sort by value descending
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
    
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 text-sm max-w-xs">
        <p className="font-medium mb-2">{label}</p>
        {sortedPayload.map((entry, idx) => (
          entry.value > 0 && (
            <p key={idx} className="flex justify-between gap-4">
              <span className="text-muted-foreground truncate max-w-[150px]" title={String(entry.dataKey)}>
                {entry.dataKey}:
              </span>
              <span className="font-medium">{formatCompactCurrency(entry.value)}</span>
            </p>
          )
        ))}
      </div>
    );
  };

  // Calculate dynamic height based on number of regions
  const chartHeight = Math.max(250, chartData.length * 60);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 15, right: 15 }}>
            <XAxis type="number" tickFormatter={(v) => formatCompactCurrency(v)} />
            <YAxis 
              type="category" 
              dataKey="nome" 
              width={80}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {canaisUnicos.map((canal, idx) => (
              <Bar 
                key={canal} 
                dataKey={canal} 
                stackId="a" 
                fill={COLORS[idx % COLORS.length]}
                radius={idx === canaisUnicos.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {canaisUnicos.slice(0, 8).map((canal, idx) => (
            <div key={canal} className="flex items-center gap-1.5 text-xs">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-muted-foreground truncate max-w-[100px]" title={canal}>
                {canal}
              </span>
            </div>
          ))}
          {canaisUnicos.length > 8 && (
            <span className="text-xs text-muted-foreground">+{canaisUnicos.length - 8} mais</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}