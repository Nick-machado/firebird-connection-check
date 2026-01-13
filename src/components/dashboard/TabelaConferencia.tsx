import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import type { VendaItem } from "@/types/venda";
import { Search, TableIcon } from "lucide-react";

interface TabelaConferenciaProps {
  data: VendaItem[];
  mesNome: string;
}

export function TabelaConferencia({ data, mesNome }: TabelaConferenciaProps) {
  const [busca, setBusca] = useState("");

  const dadosFiltrados = useMemo(() => {
    if (!busca.trim()) return data;

    const termo = busca.toLowerCase();
    return data.filter(
      (item) =>
        item.Cliente.toLowerCase().includes(termo) ||
        item.Produto.toLowerCase().includes(termo) ||
        item.Nota.toLowerCase().includes(termo) ||
        item.Vendedor.toLowerCase().includes(termo)
    );
  }, [data, busca]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">
              Dados Brutos - {mesNome}
            </CardTitle>
            <Badge variant="secondary">{data.length} registros</Badge>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente, produto, nota..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] w-full">
          <div className="min-w-[1800px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-24">Data</TableHead>
                  <TableHead className="w-28">Nota</TableHead>
                  <TableHead className="w-16">Tipo</TableHead>
                  <TableHead className="w-48">Cliente</TableHead>
                  <TableHead className="w-48">Produto</TableHead>
                  <TableHead className="w-20 text-right">Quant.</TableHead>
                  <TableHead className="w-24 text-right">Valor Unit.</TableHead>
                  <TableHead className="w-24 text-right">Total NF</TableHead>
                  <TableHead className="w-24 text-right">Total Merc.</TableHead>
                  <TableHead className="w-24 text-right">ICM</TableHead>
                  <TableHead className="w-24 text-right">PIS/Cofins</TableHead>
                  <TableHead className="w-24 text-right">Frete</TableHead>
                  <TableHead className="w-24 text-right">Comissão</TableHead>
                  <TableHead className="w-24 text-right">Líquido</TableHead>
                  <TableHead className="w-24 text-right">CMV</TableHead>
                  <TableHead className="w-24 text-right">$ Margem</TableHead>
                  <TableHead className="w-20 text-right">Mg.Líq %</TableHead>
                  <TableHead className="w-32">Vendedor</TableHead>
                  <TableHead className="w-24">Região</TableHead>
                  <TableHead className="w-20">UF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFiltrados.map((item, index) => (
                  <TableRow key={`${item.Id}-${index}`}>
                    <TableCell className="font-mono text-xs">{item.Data}</TableCell>
                    <TableCell className="font-mono text-xs">{item.Nota}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item["Tipo Movimento"] === "V" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {item["Tipo Movimento"] === "V" ? "Venda" : "Dev"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-48" title={item.Cliente}>
                      {item.Cliente}
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-48" title={item.Produto}>
                      {item.Produto}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatNumber(item["Quant."])}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(item["Valor Unit."])}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(item["Total NF"])}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(item["Total Merc."])}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(item["Vlr.ICM"])}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(item["Vlr.Pis/Cofins"])}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(item["Vlr.Frete"])}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(item["Vlr.Comissão"])}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(item["Vlr.Líquido"])}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(item["Vlr.CMV"])}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(item["$ Margem"])}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatPercent(item["Mg.Líq"])}
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-32" title={item.Vendedor}>
                      {item.Vendedor}
                    </TableCell>
                    <TableCell className="text-xs">{item.Região}</TableCell>
                    <TableCell className="text-xs">{item.UF}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
