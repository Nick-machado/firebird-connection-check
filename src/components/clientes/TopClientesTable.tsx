import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import type { ClienteAnalise } from "@/types/cliente";
import { Trophy } from "lucide-react";

interface TopClientesTableProps {
  data: ClienteAnalise[];
}

export function TopClientesTable({ data }: TopClientesTableProps) {
  const maxFaturamento = data.length > 0 ? data[0].faturamento : 0;

  return (
    <Card className="shadow-elegant">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Top 10 Clientes por Faturamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Código</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="w-32">% do Top</TableHead>
                <TableHead className="text-right">Notas</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead>Região</TableHead>
                <TableHead>Atividade</TableHead>
                <TableHead className="text-right">Margem %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Nenhum cliente encontrado para o período selecionado
                  </TableCell>
                </TableRow>
              ) : (
                data.map((cliente, index) => {
                  const progressValue = maxFaturamento > 0
                    ? (cliente.faturamento / maxFaturamento) * 100
                    : 0;

                  return (
                    <TableRow key={cliente.codigo}>
                      <TableCell className="font-medium">
                        {index === 0 && <span className="text-yellow-500">🥇</span>}
                        {index === 1 && <span className="text-gray-400">🥈</span>}
                        {index === 2 && <span className="text-amber-600">🥉</span>}
                        {index > 2 && <span className="text-muted-foreground">{index + 1}</span>}
                      </TableCell>
                      <TableCell className="font-medium max-w-[180px] truncate" title={cliente.nome}>
                        {cliente.nome}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {cliente.codigo}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(cliente.faturamento)}
                      </TableCell>
                      <TableCell>
                        <Progress value={progressValue} className="h-2" />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(cliente.quantidadeNotas)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(cliente.ticketMedio)}
                      </TableCell>
                      <TableCell>
                        {cliente.regiao ? (
                          <Badge variant="outline" className="text-xs">
                            {cliente.regiao}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate" title={cliente.atividade}>
                        {cliente.atividade || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            cliente.margemPercentual >= 20
                              ? "text-green-600"
                              : cliente.margemPercentual >= 10
                              ? "text-yellow-600"
                              : "text-red-600"
                          }
                        >
                          {formatPercent(cliente.margemPercentual)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
