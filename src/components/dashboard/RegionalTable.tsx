import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCompactCurrency, formatCurrencyExact, formatPercent, formatNumber } from "@/lib/formatters";
import type { DadosRegionais, DadosAgrupados } from "@/lib/regionalProcessing";
import { cn } from "@/lib/utils";

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

interface RegionalTableProps {
  dados: DadosRegionais[] | DadosAgrupados[];
  tipo: "uf" | "regiao";
  onRowClick: (id: string) => void;
  selecionado: string | null;
}

function ValorComTooltip({ valor, formato }: { valor: number; formato: "currency" | "percent" | "number" }) {
  const valorFormatado = formato === "currency" 
    ? formatCompactCurrency(valor)
    : formato === "percent"
    ? formatPercent(valor)
    : formatNumber(valor);
  
  const valorExato = formato === "currency"
    ? formatCurrencyExact(valor)
    : formato === "percent"
    ? formatPercent(valor)
    : formatNumber(valor);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">{valorFormatado}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{valorExato}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function RegionalTable({ dados, tipo, onRowClick, selecionado }: RegionalTableProps) {
  const titulo = tipo === "uf" ? "Ranking por Estado" : "Ranking por Região";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{tipo === "uf" ? "Estado" : "Região"}</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">Mg %</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.map((item, idx) => {
                const id = tipo === "uf" ? (item as DadosRegionais).uf : (item as DadosAgrupados).nome;
                const nome = tipo === "uf" 
                  ? UF_NOMES[(item as DadosRegionais).uf] || (item as DadosRegionais).uf
                  : (item as DadosAgrupados).nome;
                
                return (
                  <TableRow
                    key={id}
                    onClick={() => onRowClick(id)}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      selecionado === id && "bg-primary/10"
                    )}
                  >
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{nome}</TableCell>
                    <TableCell className="text-right">
                      <ValorComTooltip valor={item.faturamento} formato="currency" />
                    </TableCell>
                    <TableCell className="text-right">
                      <ValorComTooltip valor={item.margem} formato="currency" />
                    </TableCell>
                    <TableCell className="text-right">
                      <ValorComTooltip valor={item.margemPercentual} formato="percent" />
                    </TableCell>
                    <TableCell className="text-right">
                      <ValorComTooltip valor={item.quantidade} formato="number" />
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
