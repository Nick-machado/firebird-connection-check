import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { ClientesTable } from "@/components/clientes/ClientesTable";
import { ClienteStatusCards } from "@/components/clientes/ClienteStatusCards";
import { ClienteVendasSheet } from "@/components/clientes/ClienteVendasSheet";
import { useClientes } from "@/hooks/useClientes";
import { useUserRole } from "@/hooks/useUserRole";
import {
  classificarClientesPorStatus,
} from "@/lib/clientesProcessing";
import { SECTOR_TO_EQUIPES, EQUIPES } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, UserCheck, AlertTriangle, UserX, AlertCircle, Filter } from "lucide-react";
import type { ClienteAnalise, ClienteStatus } from "@/types/cliente";

export default function Clientes() {
  const { sector, canViewAllData, roleLabel } = useUserRole();

  const [equipe, setEquipe] = useState("TODAS");
  const [statusFilter, setStatusFilter] = useState<ClienteStatus | "todos">("todos");
  const [selectedCliente, setSelectedCliente] = useState<ClienteAnalise | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Set equipe based on user sector on mount
  useEffect(() => {
    if (sector && SECTOR_TO_EQUIPES[sector]) {
      const allowedEquipes = SECTOR_TO_EQUIPES[sector];
      if (allowedEquipes.length === 1) {
        setEquipe(allowedEquipes[0]);
      } else if (allowedEquipes.length > 1) {
        setEquipe("TODAS");
      }
    }
  }, [sector]);

  const { data: clientesAPI, isLoading, error } = useClientes();

  const dadosProcessados = useMemo(() => {
    if (!clientesAPI) return null;

    // Classifica todos os clientes por status
    const statusData = classificarClientesPorStatus(clientesAPI);

    return statusData;
  }, [clientesAPI]);

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

  // Equipes permitidas para o usuário
  const equipesPermitidas = useMemo(() => {
    if (canViewAllData) return EQUIPES;
    if (sector && SECTOR_TO_EQUIPES[sector]) {
      const allowed = SECTOR_TO_EQUIPES[sector];
      return EQUIPES.filter((e) => e.valor === "TODAS" || allowed.includes(e.valor));
    }
    return EQUIPES;
  }, [canViewAllData, sector]);

  const handleClienteClick = (cliente: ClienteAnalise) => {
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

        {/* Filtro de Equipe */}
        <Card className="animate-fade-in-up stagger-1 opacity-0">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>
              
              <Select value={equipe} onValueChange={setEquipe}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione a equipe" />
                </SelectTrigger>
                <SelectContent>
                  {equipesPermitidas.map((eq) => (
                    <SelectItem key={eq.valor} value={eq.valor}>
                      {eq.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!canViewAllData && sector && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {roleLabel}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

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
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="animate-fade-in-up stagger-1 opacity-0">
                    <KPICard
                      title="Total de Clientes"
                      value={dadosProcessados.total}
                      format="number"
                      icon={<Users className="h-4 w-4" />}
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-2 opacity-0">
                    <KPICard
                      title="Clientes Ativos"
                      value={dadosProcessados.ativos.quantidade}
                      format="number"
                      icon={<UserCheck className="h-4 w-4" />}
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-3 opacity-0">
                    <KPICard
                      title="Em Risco"
                      value={dadosProcessados.emRisco.quantidade}
                      format="number"
                      icon={<AlertTriangle className="h-4 w-4" />}
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-4 opacity-0">
                    <KPICard
                      title="Inativos"
                      value={dadosProcessados.inativos.quantidade}
                      format="number"
                      icon={<UserX className="h-4 w-4" />}
                    />
                  </div>
                </div>

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
      />
    </DashboardLayout>
  );
}
