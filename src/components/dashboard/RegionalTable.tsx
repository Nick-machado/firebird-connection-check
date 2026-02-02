import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCompactCurrency, formatCurrencyExact } from "@/lib/formatters";
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

interface RegionalTableProps {
  dados: DadosRegionais[] | DadosAgrupados[];
  tipo: "uf" | "regiao";
  onRowClick: (id: string) => void;
  selecionado: string | null;
}

export function RegionalTable({ dados, tipo, onRowClick, selecionado }: RegionalTableProps) {
  const titulo = tipo === "uf" ? "Ranking por Estado" : "Ranking por Região";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{titulo}</CardTitle>
        <p className="text-xs text-muted-foreground">Clique para ver detalhes</p>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{tipo === "uf" ? "Estado" : "Região"}</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="w-8"></TableHead>
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
                            {formatCompactCurrency(item.faturamento)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{formatCurrencyExact(item.faturamento)}</p>
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