import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatarUltimaCompra,
  getStatusColor,
  getStatusLabel,
} from "@/lib/clientesProcessing";
import type { ClienteAnalise, ClienteStatus } from "@/types/cliente";
import { Users, Search, ChevronRight } from "lucide-react";

interface ClientesTableProps {
  data: ClienteAnalise[];
  onClienteClick: (cliente: ClienteAnalise) => void;
  statusFilter: ClienteStatus | "todos";
}

export function ClientesTable({ data, onClienteClick, statusFilter }: ClientesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filtra por busca
  const clientesFiltrados = data.filter((cliente) => {
    if (!searchTerm) return true;
    const termo = searchTerm.toLowerCase();
    return (
      cliente.nome?.toLowerCase().includes(termo) ||
      cliente.codigo?.toString().includes(termo) ||
      cliente.atividade?.toLowerCase().includes(termo) ||
      cliente.regiao?.toLowerCase().includes(termo) ||
      cliente.cidade?.toLowerCase().includes(termo)
    );
  });

  // Paginação
  const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const clientesPaginados = clientesFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const statusTitle = statusFilter === "todos" 
    ? "Todos os Clientes" 
    : `Clientes ${getStatusLabel(statusFilter)}s`;

  return (
    <Card className="shadow-elegant">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            {statusTitle}
            <Badge variant="secondary" className="ml-2">
              {clientesFiltrados.length}
            </Badge>
          </CardTitle>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Código</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Compra</TableHead>
                <TableHead>Região</TableHead>
                <TableHead>Atividade</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesPaginados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {searchTerm
                      ? "Nenhum cliente encontrado para a busca"
                      : "Nenhum cliente disponível"}
                  </TableCell>
                </TableRow>
              ) : (
                clientesPaginados.map((cliente) => (
                  <TableRow
                    key={cliente.codigo}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onClienteClick(cliente)}
                  >
                    <TableCell className="font-medium max-w-[200px] truncate" title={cliente.nome}>
                      {cliente.nome}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {cliente.codigo}
                    </TableCell>
                    <TableCell>
                      {cliente.status && (
                        <Badge
                          variant="outline"
                          className={cn("text-xs", getStatusColor(cliente.status))}
                        >
                          {getStatusLabel(cliente.status)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatarUltimaCompra(cliente.ultimaCompra)}
                      {cliente.diasSemCompra !== undefined && cliente.diasSemCompra < 9999 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({cliente.diasSemCompra}d)
                        </span>
                      )}
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
                    <TableCell className="text-sm text-muted-foreground">
                      {cliente.cidade && cliente.uf
                        ? `${cliente.cidade}/${cliente.uf}`
                        : cliente.uf || "-"}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, clientesFiltrados.length)} de {clientesFiltrados.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
