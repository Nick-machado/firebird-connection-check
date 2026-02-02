import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { ChurnAnaliseData } from "@/types/cliente";
import { AlertTriangle, UserX } from "lucide-react";

interface ChurnClientesCardProps {
  data: ChurnAnaliseData;
}

export function ChurnClientesCard({ data }: ChurnClientesCardProps) {
  const totalChurn = data.churn3Meses.quantidade + data.churn6Meses.quantidade;
  const totalPerdido = data.churn3Meses.faturamentoPerdido + data.churn6Meses.faturamentoPerdido;

  // Combina e ordena por faturamento
  const topChurn = [
    ...data.churn3Meses.clientes.map((c) => ({ ...c, periodo: "3 meses" })),
    ...data.churn6Meses.clientes.map((c) => ({ ...c, periodo: "6+ meses" })),
  ]
    .sort((a, b) => b.cliente.faturamento - a.cliente.faturamento)
    .slice(0, 5);

  return (
    <Card className="shadow-elegant">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserX className="h-5 w-5 text-destructive" />
          Clientes em Risco (Churn)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Churn 3 meses</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {formatNumber(data.churn3Meses.quantidade)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(data.churn3Meses.faturamentoPerdido)} em risco
            </p>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Churn 6+ meses</span>
            </div>
            <p className="text-2xl font-bold text-destructive">
              {formatNumber(data.churn6Meses.quantidade)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(data.churn6Meses.faturamentoPerdido)} perdido
            </p>
          </div>

          <div className="bg-muted/50 border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Total em Risco</span>
            </div>
            <p className="text-2xl font-bold">
              {formatNumber(totalChurn)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(totalPerdido)} potencial
            </p>
          </div>
        </div>

        {/* Tabela com top 5 clientes em churn */}
        <div>
          <h4 className="text-sm font-medium mb-3">Top 5 Clientes em Risco de Churn</h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Faturamento Anterior</TableHead>
                  <TableHead className="text-right">Dias sem Compra</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topChurn.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum cliente em churn identificado
                    </TableCell>
                  </TableRow>
                ) : (
                  topChurn.map((item) => (
                    <TableRow key={item.cliente.codigo}>
                      <TableCell className="font-medium max-w-[200px] truncate" title={item.cliente.nome}>
                        {item.cliente.nome}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.cliente.codigo}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.cliente.faturamento)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(item.diasSemCompra)} dias
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.periodo === "3 meses" ? "secondary" : "destructive"}
                        >
                          {item.periodo}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
