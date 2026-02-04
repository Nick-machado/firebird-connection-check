import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemo } from "react";
import { useClienteVendas } from "@/hooks/useClientes";
import { useUserRole } from "@/hooks/useUserRole";
import { SECTOR_TO_EQUIPES } from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import {
  formatarUltimaCompra,
  getStatusColor,
  getStatusLabel,
} from "@/lib/clientesProcessing";
import type { ClienteAnalise } from "@/types/cliente";
import { Loader2, Mail, MapPin, Building, Calendar, ShoppingCart } from "lucide-react";

interface ClienteVendasSheetProps {
  cliente: ClienteAnalise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriasFiltro?: string[];
}

export function ClienteVendasSheet({
  cliente,
  open,
  onOpenChange,
  categoriasFiltro,
}: ClienteVendasSheetProps) {
  const { data: vendas, isLoading, error } = useClienteVendas(cliente?.codigo || null);
  const { sector, canViewAllData } = useUserRole();


  const vendasFiltradas = useMemo(() => {
    if (!vendas) return [];
    let filtradas = vendas;

    if (!canViewAllData && sector && SECTOR_TO_EQUIPES[sector]) {
      const allowedEquipes = SECTOR_TO_EQUIPES[sector];
      filtradas = filtradas.filter((venda) =>
        allowedEquipes.some((eq) => (venda.Equipe || "").toUpperCase().includes(eq.toUpperCase()))
      );
    }

    if (!categoriasFiltro || categoriasFiltro.length === 0) return filtradas;

    return filtradas.filter((venda) =>
      categoriasFiltro.some(
        (categoria) => (venda.Categoria || "").toLowerCase() === categoria.toLowerCase()
      )
    );
  }, [vendas, categoriasFiltro, canViewAllData, sector]);

  const formatDate = (dateStr: string) => {
    // Parse manual para evitar problema de timezone
    // A API retorna datas no formato ISO (YYYY-MM-DD) que são interpretadas como UTC
    // causando shift de -1 dia quando convertidas para timezone local
    const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
  };

  const formatDateOnly = (date?: Date) => {
    if (!date) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Histórico de Vendas
          </SheetTitle>
          <SheetDescription>
            {cliente?.nome}
          </SheetDescription>
        </SheetHeader>

        {cliente && (
          <>
            {/* Informações do Cliente */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Código:</span>
                  <span className="font-medium">{cliente.codigo}</span>
                </div>
                
                {cliente.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${cliente.email}`}
                      className="text-primary hover:underline truncate"
                    >
                      {cliente.email}
                    </a>
                  </div>
                )}
                
                {(cliente.cidade || cliente.uf) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {cliente.cidade && cliente.uf
                        ? `${cliente.cidade}/${cliente.uf}`
                        : cliente.cidade || cliente.uf}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Última Compra:</span>
                  <span className="font-medium">
                    {formatDateOnly(cliente.ultimaCompra)}
                  </span>
                </div>
                
                {cliente.status && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge
                      variant="outline"
                      className={getStatusColor(cliente.status)}
                    >
                      {getStatusLabel(cliente.status)}
                    </Badge>
                  </div>
                )}
                
                {cliente.regiao && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Região:</span>
                    <Badge variant="outline">{cliente.regiao}</Badge>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-2" />

            {/* Tabela de Vendas */}
            <div className="flex-1 overflow-hidden">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                Vendas
                {vendas && (
                  <Badge variant="secondary">{vendasFiltradas.length}</Badge>
                )}
              </h4>

              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center text-destructive py-8">
                  Erro ao carregar vendas: {(error as Error).message}
                </div>
              ) : vendasFiltradas.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-380px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Margem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendasFiltradas.map((venda, index) => (
                        <TableRow key={`${venda.Nota}-${venda["Cód. Prod"]}-${index}`}>
                          <TableCell className="text-sm">
                            {formatDate(venda.Data)}
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {venda.Nota?.trim()}
                          </TableCell>
                          <TableCell
                            className="text-sm max-w-[200px] truncate"
                            title={venda.Produto}
                          >
                            {venda.Produto}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatNumber(venda["Quant."])}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatCurrency(venda["Total Merc."])}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            <span
                              className={
                                venda["Mg.Líq"] >= 30
                                  ? "text-green-600"
                                  : venda["Mg.Líq"] >= 15
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }
                            >
                              {venda["Mg.Líq"]?.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma venda encontrada para este cliente
                </div>
              )}
            </div>

            {/* Resumo de Vendas */}
            {vendasFiltradas.length > 0 && (
              <div className="pt-4 border-t mt-auto">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Vendas</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(vendasFiltradas.reduce((acc, v) => acc + (v["Total Merc."] || 0), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Margem Total</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(vendasFiltradas.reduce((acc, v) => acc + (v["$ Margem"] || 0), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Itens</p>
                    <p className="text-lg font-bold">
                      {formatNumber(vendasFiltradas.length)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
