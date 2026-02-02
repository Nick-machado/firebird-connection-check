import { useMemo } from "react";
import Brazil from "@react-map/brazil";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import type { DadosRegionais } from "@/lib/regionalProcessing";

interface BrazilMapInteractiveProps {
  dados: DadosRegionais[];
  metrica: "faturamento" | "margem" | "quantidade";
  onEstadoClick: (uf: string) => void;
  estadoSelecionado: string | null;
}

// Mapeamento de UF para nome completo
const UF_NOMES: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AM: "Amazonas",
  AP: "Amapá",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MG: "Minas Gerais",
  MS: "Mato Grosso do Sul",
  MT: "Mato Grosso",
  PA: "Pará",
  PB: "Paraíba",
  PE: "Pernambuco",
  PI: "Piauí",
  PR: "Paraná",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RO: "Rondônia",
  RR: "Roraima",
  RS: "Rio Grande do Sul",
  SC: "Santa Catarina",
  SE: "Sergipe",
  SP: "São Paulo",
  TO: "Tocantins",
  EX: "Exterior",
};

// Mapeamento de UF para nome do estado usado pelo @react-map/brazil
const UF_TO_STATE_NAME: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AM: "Amazonas",
  AP: "Amapá",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MG: "Minas Gerais",
  MS: "Mato Grosso do Sul",
  MT: "Mato Grosso",
  PA: "Pará",
  PB: "Paraíba",
  PE: "Pernambuco",
  PI: "Piauí",
  PR: "Paraná",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RO: "Rondônia",
  RR: "Roraima",
  RS: "Rio Grande do Sul",
  SC: "Santa Catarina",
  SE: "Sergipe",
  SP: "São Paulo",
  TO: "Tocantins",
};

function calcularCorGradiente(valor: number, min: number, max: number): string {
  if (max === min) return "#4ade80";
  const normalizado = (valor - min) / (max - min);
  const lightness = 90 - normalizado * 50;
  const saturation = 20 + normalizado * 60;
  return `hsl(142, ${saturation}%, ${lightness}%)`;
}

export function BrazilMapInteractive({
  dados,
  metrica,
  onEstadoClick,
  estadoSelecionado,
}: BrazilMapInteractiveProps) {
  const dadosPorUF = useMemo(() => {
    const map = new Map<string, DadosRegionais>();
    dados.forEach((d) => map.set(d.uf, d));
    return map;
  }, [dados]);

  const range = useMemo(() => {
    if (dados.length === 0) return { min: 0, max: 0 };
    const valores = dados
      .map((d) => d[metrica])
      .filter((v) => typeof v === "number" && !isNaN(v) && v >= 0);
    if (valores.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...valores), max: Math.max(...valores) };
  }, [dados, metrica]);

  const getCorEstado = (uf: string): string => {
    const dado = dadosPorUF.get(uf);
    if (!dado) return "#e5e7eb";
    const valor = dado[metrica];
    if (typeof valor !== "number" || isNaN(valor) || valor < 0) return "#e5e7eb";
    if (range.min === range.max) return "#4ade80";
    return calcularCorGradiente(valor, range.min, range.max);
  };

  const cityColors = useMemo(() => {
    const colors: Record<string, string> = {};
    Object.entries(UF_TO_STATE_NAME).forEach(([uf, stateName]) => {
      colors[stateName] = getCorEstado(uf);
    });
    return colors;
  }, [dadosPorUF, range, metrica]);

  const stateNameToUf = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(UF_TO_STATE_NAME).forEach(([uf, name]) => map.set(name, uf));
    return map;
  }, []);

  const handleStateClick = (stateName: string | null) => {
    if (!stateName) return;
    const uf = stateNameToUf.get(stateName);
    if (!uf) return;
    onEstadoClick(uf);
  };

  const dadosSelecionados = estadoSelecionado ? dadosPorUF.get(estadoSelecionado) : null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Mapa de Vendas por Estado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex justify-center p-4 rounded-lg overflow-hidden">
            <div className="w-fit max-w-full mx-auto" data-brazil-map="interactive">
              <Brazil
                type="select-single"
                size={520}
                mapColor="transparent"
                strokeColor="#9ca3af"
                strokeWidth={1}
                hoverColor="#fbbf24"
                selectColor="#3b82f6"
                hints={true}
                hintTextColor="#1f2937"
                hintBackgroundColor="#ffffff"
                hintPadding="8px 12px"
                hintBorderRadius={6}
                onSelect={handleStateClick}
                cityColors={cityColors}
              />
            </div>
          </div>

          {estadoSelecionado && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">
                {UF_NOMES[estadoSelecionado]} ({estadoSelecionado})
              </h3>
              {dadosSelecionados ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-blue-700">Faturamento</p>
                    <p className="font-semibold text-blue-900">
                      {formatCompactCurrency(dadosSelecionados.faturamento)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700">Margem</p>
                    <p className="font-semibold text-blue-900">
                      {formatCompactCurrency(dadosSelecionados.margem)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700">Margem %</p>
                    <p className="font-semibold text-blue-900">
                      {formatPercent(dadosSelecionados.margemPercentual)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700">Quantidade</p>
                    <p className="font-semibold text-blue-900">
                      {formatNumber(dadosSelecionados.quantidade)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-blue-700">Sem dados disponíveis</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-600">Menor</span>
              <div className="h-3 w-32 rounded bg-gradient-to-r from-gray-200 to-green-600" />
              <span className="text-xs text-gray-600">Maior</span>
            </div>
            <p className="text-center text-xs text-gray-500">
              Clique em um estado para ver detalhes
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t">
            <div className="text-center">
              <p className="text-xs text-gray-600">Total</p>
              <p className="font-semibold text-sm">
                {formatCompactCurrency(dados.reduce((sum, d) => sum + d.faturamento, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Estados</p>
              <p className="font-semibold text-sm">{dados.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Margem Média</p>
              <p className="font-semibold text-sm">
                {formatPercent(
                  dados.length > 0
                    ? dados.reduce((sum, d) => sum + d.margemPercentual, 0) / dados.length
                    : 0
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Total Notas</p>
              <p className="font-semibold text-sm">
                {formatNumber(dados.reduce((sum, d) => sum + d.notas, 0))}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}