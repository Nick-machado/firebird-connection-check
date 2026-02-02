import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCompactCurrency, formatCurrencyExact, formatNumber, formatPercent } from "@/lib/formatters";
import type { DadosRegionais, DadosAgrupados } from "@/lib/regionalProcessing";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

// Nomes dos estados
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

const METRICA_LABELS: Record<Metrica, string> = {
  faturamento: "Faturamento",
  margem: "Margem",
  quantidade: "Quantidade",
};

interface RegionalTableProps {
  dados: DadosRegionais[] | DadosAgrupados[];
  tipo: "uf" | "regiao";
  metrica: Metrica;
  onRowClick: (id: string) => void;
  selecionado: string | null;
}

export function RegionalTable({ dados, tipo, metrica, onRowClick, selecionado }: RegionalTableProps) {
  const titulo = tipo === "uf" ? "Ranking por Estado" : "Ranking por Região";

  // Ordena dados pela métrica selecionada
  const dadosOrdenados = useMemo(() => {
    return [...dados].sort((a, b) => b[metrica] - a[metrica]);
  }, [dados, metrica]);

  // Formata o valor de acordo com a métrica
  const formatarValor = (item: DadosRegionais | DadosAgrupados) => {
    if (metrica === "quantidade") {
      return formatNumber(item.quantidade);
    }
    if (metrica === "margem") {
      return `${formatCompactCurrency(item.margem)} (${formatPercent(item.margemPercentual)})`;
    }
    return formatCompactCurrency(item.faturamento);
  };

  // Formata o valor exato para tooltip
  const formatarValorExato = (item: DadosRegionais | DadosAgrupados) => {
    if (metrica === "quantidade") {
      return formatNumber(item.quantidade);
    }
    if (metrica === "margem") {
      return formatCurrencyExact(item.margem);
    }
    return formatCurrencyExact(item.faturamento);
  };

  return (
    <Card className="min-h-[500px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{titulo}</CardTitle>
        <p className="text-xs text-muted-foreground">Clique para ver detalhes</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full max-h-[420px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{tipo === "uf" ? "Estado" : "Região"}</TableHead>
                <TableHead className="text-right">{METRICA_LABELS[metrica]}</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dadosOrdenados.map((item, idx) => {
                const id = tipo === "uf" ? (item as DadosRegionais).uf : (item as DadosAgrupados).nome;
                const nome = tipo === "uf" 
                  ? UF_NOMES[(item as DadosRegionais).uf] || (item as DadosRegionais).uf
                  : (item as DadosAgrupados).nome;
                
                return (
                  <TableRow
                    key={id}
                    onClick={() => onRowClick(id)}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors group",
                      selecionado === id && "bg-primary/10"
                    )}
                  >
                    <TableCell>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold">
                        {idx + 1}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{nome}</TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help font-semibold text-primary">
                            {formatarValor(item)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{formatarValorExato(item)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}