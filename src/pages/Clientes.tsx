import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClientesTable } from "@/components/clientes/ClientesTable";
import { ClienteStatusCards } from "@/components/clientes/ClienteStatusCards";
import { ClienteVendasSheet } from "@/components/clientes/ClienteVendasSheet";
import { useClientes } from "@/hooks/useClientes";
import { useUserRole } from "@/hooks/useUserRole";
import {
  classificarClientesPorStatus,
} from "@/lib/clientesProcessing";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, Filter } from "lucide-react";
import type { ClienteAnalise, ClienteStatus } from "@/types/cliente";

export default function Clientes() {
  const { roleLabel, role } = useUserRole();

  const [categoriaFilter, setCategoriaFilter] = useState("TODAS");
  const [linhasSelecionadas, setLinhasSelecionadas] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<ClienteStatus | "todos">("todos");
  const [selectedCliente, setSelectedCliente] = useState<ClienteAnalise | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: clientesAPI, isLoading, error } = useClientes();

  const canFilterCategories = role === "admin" || role === "consultor";

  const categoriasPermitidas = useMemo(() => {
    if (canFilterCategories) return null;

    switch (role) {
      case "gerente_varejo":
      case "varejo":
        return ["LINHA VAREJO", "LINHA MISTA"];
      case "gerente_industria":
      case "industria":
        return ["LINHA INDUSTRIAL", "LINHA MISTA"];
      case "gerente_exportacao":
      case "exportacao":
        return ["EXPORTAÇÃO", "LINHA MISTA"];
      default:
        return null;
    }
  }, [canFilterCategories, role]);

  const clientesPermitidos = useMemo(() => {
    if (!clientesAPI) return [];
    if (!categoriasPermitidas || categoriasPermitidas.length === 0) return clientesAPI;

    return clientesAPI.filter((cliente) => {
      const categoria = (cliente.Categoria || "").trim().toLowerCase();
      return categoriasPermitidas.some(
        (permitida) => categoria === permitida.toLowerCase()
      );
    });
  }, [clientesAPI, categoriasPermitidas]);

  const categoriasDisponiveis = useMemo(() => {
    const categoriasSet = new Set<string>();

    for (const cliente of clientesPermitidos) {
      const categoria = cliente.Categoria?.trim();
      categoriasSet.add(categoria && categoria.length > 0 ? categoria : "Sem categoria");
    }

    return ["TODAS", ...Array.from(categoriasSet).sort((a, b) => a.localeCompare(b))];
  }, [clientesPermitidos]);

  useEffect(() => {
    if (canFilterCategories) {
      if (categoriasDisponiveis.length === 0) return;
      if (!categoriasDisponiveis.includes(categoriaFilter)) {
        setCategoriaFilter("TODAS");
      }
      return;
    }

    if (categoriasPermitidas && categoriasPermitidas.length > 0) {
      setLinhasSelecionadas((prev) =>
        prev.length > 0 ? prev : [...categoriasPermitidas]
      );
    }
  }, [categoriasDisponiveis, categoriaFilter, canFilterCategories, categoriasPermitidas]);

  const clientesPorCategoria = useMemo(() => {
    if (canFilterCategories) {
      if (categoriaFilter === "TODAS") return clientesPermitidos;

      return clientesPermitidos.filter((cliente) => {
        if (categoriaFilter === "Sem categoria") {
          return !cliente.Categoria || cliente.Categoria.trim().length === 0;
        }

        return (cliente.Categoria || "").toLowerCase() === categoriaFilter.toLowerCase();
      });
    }

    if (!categoriasPermitidas || categoriasPermitidas.length === 0) return clientesPermitidos;
    if (!linhasSelecionadas.length) return [];

    return clientesPermitidos.filter((cliente) =>
      linhasSelecionadas.some(
        (linha) => (cliente.Categoria || "").toLowerCase() === linha.toLowerCase()
      )
    );
  }, [clientesPermitidos, categoriaFilter, canFilterCategories, categoriasPermitidas, linhasSelecionadas]);

  const dadosProcessados = useMemo(() => {
    if (!clientesAPI) return null;

    const statusData = classificarClientesPorStatus(clientesPorCategoria);

    return statusData;
  }, [clientesAPI, clientesPorCategoria]);

  // Filtra clientes pelo status selecionado
  const clientesFiltrados = useMemo(() => {
    if (!dadosProcessados) return [];

    let clientes: ClienteAnalise[] = [];

    switch (statusFilter) {
      case "ativo":
        clientes = dadosProcessados.ativos.clientes;
        break;
      case "em_risco":
        clientes = dadosProcessados.emRisco.clientes;
        break;
      case "inativo":
        clientes = dadosProcessados.inativos.clientes;
        break;
      default:
        clientes = [
          ...dadosProcessados.ativos.clientes,
          ...dadosProcessados.emRisco.clientes,
          ...dadosProcessados.inativos.clientes,
        ];
    }

    return clientes;
  }, [dadosProcessados, statusFilter]);

  const handleClienteClick = (cliente: ClienteAnalise) => {
    console.log("Cliente clicado:", cliente.codigo, cliente.nome);
    setSelectedCliente(cliente);
    setSheetOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando clientes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-destructive font-medium">Erro ao carregar dados</p>
            <p className="text-muted-foreground text-sm mt-2">{(error as Error).message}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-foreground">Gestão de Clientes</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os clientes por status de atividade
          </p>
        </div>

        {canFilterCategories && (
          <Card className="animate-fade-in-up stagger-1 opacity-0">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtros:</span>
                </div>

                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasDisponiveis.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {roleLabel && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {roleLabel}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!canFilterCategories && categoriasPermitidas && categoriasPermitidas.length > 0 && (
          <Card className="animate-fade-in-up stagger-1 opacity-0">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Linhas:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categoriasPermitidas.map((linha) => {
                    const ativa = linhasSelecionadas.includes(linha);
                    return (
                      <Button
                        key={linha}
                        type="button"
                        size="sm"
                        variant={ativa ? "default" : "outline"}
                        onClick={() => {
                          setLinhasSelecionadas((prev) =>
                            prev.includes(linha)
                              ? prev.filter((item) => item !== linha)
                              : [...prev, linha]
                          );
                        }}
                      >
                        {linha}
                      </Button>
                    );
                  })}
                </div>

                {roleLabel && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {roleLabel}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {dadosProcessados && (
          <>
            {dadosProcessados.total === 0 ? (
              <Alert className="animate-fade-in-up">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sem dados disponíveis</AlertTitle>
                <AlertDescription>
                  Não foram encontrados clientes cadastrados.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Cards de Status com filtro */}
                <div className="animate-scale-in stagger-2 opacity-0">
                  <ClienteStatusCards
                    data={dadosProcessados}
                    activeFilter={statusFilter}
                    onFilterChange={setStatusFilter}
                  />
                </div>

                {/* Tabela de Clientes */}
                <div className="animate-scale-in stagger-3 opacity-0">
                  <ClientesTable
                    data={clientesFiltrados}
                    onClienteClick={handleClienteClick}
                    statusFilter={statusFilter}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Sheet de Vendas do Cliente */}
      <ClienteVendasSheet
        cliente={selectedCliente}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        categoriasFiltro={
          canFilterCategories
            ? categoriaFilter === "TODAS"
              ? []
              : [categoriaFilter]
            : linhasSelecionadas
        }
      />
    </DashboardLayout>
  );
}
