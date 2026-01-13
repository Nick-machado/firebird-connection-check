import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/formatters";
import { CHART_COLORS } from "@/lib/constants";
import { useMemo } from "react";

interface MargemCanalChartProps {
  data: { canal: string; margem: number; margemPercentual: number; faturamento: number }[];
}

// Calcula largura estimada de texto em pixels
function estimateTextWidth(text: string, fontSize: number = 11): number {
  const avgCharWidth = fontSize * 0.6;
  return text.length * avgCharWidth;
}

export function MargemCanalChart({ data }: MargemCanalChartProps) {
  const { chartData, yAxisWidth, chartHeight } = useMemo(() => {
    const slicedData = data.slice(0, 8);
    const names = slicedData.map(item => item.canal);
    const maxTextWidth = Math.max(...names.map(name => estimateTextWidth(name, 11)));
    // Limita a largura máxima para não ocupar espaço demais
    const calculatedWidth = Math.min(Math.max(maxTextWidth + 15, 80), 180);
    const itemHeight = 38;
    const minHeight = 280;
    const calculatedHeight = Math.max(minHeight, slicedData.length * itemHeight + 40);
    
    return {
      chartData: slicedData.map((item) => ({
        ...item,
        canalDisplay: item.canal,
      })),
      yAxisWidth: calculatedWidth,
      chartHeight: calculatedHeight,
    };
  }, [data]);

  // Renderiza label customizado para Y-axis
  const CustomYAxisTick = ({ x, y, payload }: any) => {
    const text = payload.value;
    const maxCharsPerLine = 35;
    
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
        <CardTitle className="text-base font-semibold">Margem por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 15, bottom: 5 }}>
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
              width={yAxisWidth}
              tick={<CustomYAxisTick />}
              axisLine={{ stroke: "hsl(var(--border))" }}
              interval={0}
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
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.canalDisplay === label);
                return item?.canal || label;
              }}
            />
            <Legend />
            <Bar dataKey="margem" name="Margem R$" fill={CHART_COLORS.secondary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
