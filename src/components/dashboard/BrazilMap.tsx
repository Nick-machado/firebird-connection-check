import { useMemo, useState } from "react";
import { MapBrazil } from "react-brazil-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactCurrency, formatPercent, formatNumber } from "@/lib/formatters";
import type { DadosRegionais } from "@/lib/regionalProcessing";
import { calcularCorGradiente, calcularRangeValores } from "@/lib/regionalProcessing";

// Mapeamento de UF para nome completo
const UF_NOMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá",
  BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
  GO: "Goiás", MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul",
  MT: "Mato Grosso", PA: "Pará", PB: "Paraíba", PE: "Pernambuco",
  PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul", SC: "Santa Catarina",
  SE: "Sergipe", SP: "São Paulo", TO: "Tocantins",
};

type Metrica = "faturamento" | "margem" | "quantidade";

interface BrazilMapProps {
  dados: DadosRegionais[];
  metrica: Metrica;
  onEstadoClick: (uf: string) => void;
  estadoSelecionado: string | null;
}

export function BrazilMap({ dados, metrica, onEstadoClick, estadoSelecionado }: BrazilMapProps) {
  const [estadoHover, setEstadoHover] = useState<string | null>(null);

  // Criar mapa de UF -> dados para acesso rápido
  const dadosPorUF = useMemo(() => {
    const map = new Map<string, DadosRegionais>();
    dados.forEach((d) => map.set(d.uf, d));
    return map;
  }, [dados]);

  // Calcular range para gradiente de cor
  const range = useMemo(() => calcularRangeValores(dados, metrica), [dados, metrica]);

  const estadoAtual = estadoHover || estadoSelecionado;
  const dadoEstadoAtual = estadoAtual ? dadosPorUF.get(estadoAtual.toUpperCase()) : null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Mapa de Vendas por Estado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative flex justify-center">
          <MapBrazil
            onChange={(uf: string) => {
              if (uf) {
                onEstadoClick(uf.toUpperCase());
                setEstadoHover(uf.toUpperCase());
              }
            }}
            width={380}
            height={380}
            bg="transparent"
            colorStroke="hsl(var(--border))"
          />

          {/* Tooltip flutuante */}
          {estadoAtual && (
            <div className="absolute top-2 right-2 bg-popover border rounded-lg shadow-lg p-3 text-sm z-10 max-w-[200px]">
              <p className="font-semibold">{UF_NOMES[estadoAtual.toUpperCase()]} ({estadoAtual.toUpperCase()})</p>
              {dadoEstadoAtual ? (
                <>
                  <p>Faturamento: {formatCompactCurrency(dadoEstadoAtual.faturamento)}</p>
                  <p>Margem: {formatCompactCurrency(dadoEstadoAtual.margem)} ({formatPercent(dadoEstadoAtual.margemPercentual)})</p>
                  <p>Quantidade: {formatNumber(dadoEstadoAtual.quantidade)}</p>
                  <p>Notas: {formatNumber(dadoEstadoAtual.notas)}</p>
                </>
              ) : (
                <p className="text-muted-foreground">Sem dados</p>
              )}
            </div>
          )}
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-xs text-muted-foreground">Menor</span>
          <div
            className="h-3 w-32 rounded"
            style={{
              background: `linear-gradient(to right, hsl(142, 20%, 90%), hsl(142, 80%, 40%))`,
            }}
          />
          <span className="text-xs text-muted-foreground">Maior</span>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-1">
          Clique em um estado para ver detalhes
        </p>
      </CardContent>
    </Card>
  );
}
