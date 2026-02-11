import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCompactCurrency, formatPercent } from "@/lib/formatters";
import type { ProdutoCrescimento } from "@/lib/produtosProcessing";

interface Props {
  crescimento: ProdutoCrescimento[];
  queda: ProdutoCrescimento[];
  anoAtual: number;
  anoAnterior: number;
}

function ProdutoTable({
  data,
  tipo,
  anoAtual,
  anoAnterior,
}: {
  data: ProdutoCrescimento[];
  tipo: "crescimento" | "queda";
  anoAtual: number;
  anoAnterior: number;
}) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-4">
        Nenhum produto com {tipo === "crescimento" ? "crescimento" : "queda"} significativo.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Produto</TableHead>
            <TableHead className="text-right">{anoAnterior}</TableHead>
            <TableHead className="text-right">{anoAtual}</TableHead>
            <TableHead className="text-right">Variação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium text-sm max-w-[250px] truncate" title={item.nome}>
                {item.nome}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatCompactCurrency(item.faturamentoAnterior)}
              </TableCell>
              <TableCell className="text-right text-sm">
                {formatCompactCurrency(item.faturamentoAtual)}
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={tipo === "crescimento" ? "default" : "destructive"}
                  className="gap-1"
                >
                  {tipo === "crescimento" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {item.variacao > 0 ? "+" : ""}
                  {formatPercent(item.variacao)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CrescimentoProdutosChart({ crescimento, queda, anoAtual, anoAnterior }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-elegant border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Maior Crescimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProdutoTable
            data={crescimento}
            tipo="crescimento"
            anoAtual={anoAtual}
            anoAnterior={anoAnterior}
          />
        </CardContent>
      </Card>

      <Card className="shadow-elegant border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Maior Queda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProdutoTable
            data={queda}
            tipo="queda"
            anoAtual={anoAtual}
            anoAnterior={anoAnterior}
          />
        </CardContent>
      </Card>
    </div>
  );
}
