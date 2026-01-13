import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatCompactCurrency, formatCurrency } from "@/lib/formatters";
import type { TopItem } from "@/types/venda";
import { CHART_COLORS } from "@/lib/constants";
import { useMemo } from "react";

interface TopItemsChartProps {
  data: TopItem[];
  title: string;
  color?: string;
  horizontal?: boolean;
}

// Calcula largura estimada de texto em pixels
function estimateTextWidth(text: string, fontSize: number = 11): number {
  const avgCharWidth = fontSize * 0.6;
  return text.length * avgCharWidth;
}

// Encontra a largura máxima necessária para os labels
function calculateMaxLabelWidth(items: string[], fontSize: number = 11, maxWidth: number = 300): number {
  const maxTextWidth = Math.max(...items.map(item => estimateTextWidth(item, fontSize)));
  return Math.min(maxTextWidth + 20, maxWidth);
}

export function TopItemsChart({ data, title, color = CHART_COLORS.primary, horizontal = true }: TopItemsChartProps) {
  // Calcula dimensões dinâmicas baseadas nos dados
  const { chartData, yAxisWidth, chartHeight } = useMemo(() => {
    const names = data.map(item => item.nome);
    // Calcula largura baseada no texto mais longo, com limites razoáveis
    const maxLabelWidth = calculateMaxLabelWidth(names, 11, 220);
    const itemHeight = 40;
    const minHeight = 300;
    const calculatedHeight = Math.max(minHeight, data.length * itemHeight + 50);
    
    return {
      chartData: data.map((item) => ({
        ...item,
        nomeDisplay: item.nome,
      })),
      yAxisWidth: maxLabelWidth,
      chartHeight: calculatedHeight,
    };
  }, [data]);

  // Renderiza label customizado para Y-axis com quebra de linha se necessário
  const CustomYAxisTick = ({ x, y, payload }: any) => {
    const text = payload.value;
    const maxCharsPerLine = 45;
    
    if (text.length <= maxCharsPerLine) {
      return (
        <text
          x={x}
          y={y}
          dy={4}
          textAnchor="end"
          fill="hsl(var(--muted-foreground))"
          fontSize={11}
        >
          {text}
        </text>
      );
    }
    
    // Quebra em múltiplas linhas
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach((word: string) => {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    
    return (
      <text x={x} y={y} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={10}>
        {lines.map((line, i) => (
          <tspan key={i} x={x} dy={i === 0 ? -(lines.length - 1) * 6 : 12}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  return (
    <Card className="shadow-elegant border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          {horizontal ? (
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
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
                width={yAxisWidth}
                tick={<CustomYAxisTick />}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval={0}
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
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="nomeDisplay"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                height={80}
                angle={-45}
                textAnchor="end"
                interval={0}
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
