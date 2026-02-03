import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FiltrosVendas } from "@/components/dashboard/FiltrosVendas";
import { KPICard } from "@/components/dashboard/KPICard";
import { TopClientesTable } from "@/components/clientes/TopClientesTable";
import { ClientesNovosRecorrentes } from "@/components/clientes/ClientesNovosRecorrentes";
import { FrequenciaCompraChart } from "@/components/clientes/FrequenciaCompraChart";
import { ChurnClientesCard } from "@/components/clientes/ChurnClientesCard";
import { useVendasDoisAnos } from "@/hooks/useVendas";
import { useClientes } from "@/hooks/useClientes";
import { useUserRole } from "@/hooks/useUserRole";
import { filtrarPorEquipe, filtrarPorMes } from "@/lib/dataProcessing";
import {
  calcularTopClientesDetalhado,
  calcularFrequenciaCompra,
  calcularClientesNovosRecorrentesHibrido,
  calcularChurnAPI,
  calcularEstatisticasClientes,
  enriquecerClientesComAPI,
} from "@/lib/clientesProcessing";
import { SECTOR_TO_EQUIPES } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Users, UserPlus, Repeat, UserX, AlertCircle } from "lucide-react";

export default function Clientes() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const { sector, canViewAllData, roleLabel } = useUserRole();

  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(mesAtual);
  const [equipe, setEquipe] = useState("TODAS");

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

  // Hooks para buscar dados
  const { data: vendasData, isLoading: loadingVendas, error: errorVendas } = useVendasDoisAnos(ano);
  const { data: clientesAPI, isLoading: loadingClientes, error: errorClientes } = useClientes();

  const isLoading = loadingVendas || loadingClientes;
  const error = errorVendas || errorClientes;

  const dadosProcessados = useMemo(() => {
    if (!vendasData || !clientesAPI) return null;

    const dadosAnoAtual = vendasData.anoAtual.data;

    // Apply sector-based filtering
    let equipeFilter = equipe;
    if (sector && SECTOR_TO_EQUIPES[sector]) {
      const allowedEquipes = SECTOR_TO_EQUIPES[sector];
      if (equipe === "TODAS") {
        equipeFilter = "SECTOR_FILTER";
      } else if (!allowedEquipes.includes(equipe)) {
        equipeFilter = allowedEquipes[0];
      }
    }

    let dadosAnoAtualFiltrados;

    if (equipeFilter === "SECTOR_FILTER" && sector) {
      const allowedEquipes = SECTOR_TO_EQUIPES[sector];
      dadosAnoAtualFiltrados = dadosAnoAtual.filter(
        (v) => allowedEquipes.some((eq) => v.Equipe?.toUpperCase().includes(eq.toUpperCase()))
      );
    } else {
      dadosAnoAtualFiltrados = filtrarPorEquipe(dadosAnoAtual, equipeFilter);
    }

    // Dados do mês selecionado
    const dadosMesFiltrados = filtrarPorMes(dadosAnoAtualFiltrados, mes);

    // Top 10 e frequência - usa vendas (como antes)
    const topClientes = calcularTopClientesDetalhado(dadosMesFiltrados, 10);
    const frequenciaCompra = calcularFrequenciaCompra(dadosMesFiltrados);
    const estatisticas = calcularEstatisticasClientes(dadosMesFiltrados);

    // Enriquece Top 10 com dados da API
    const topClientesEnriquecidos = enriquecerClientesComAPI(topClientes, clientesAPI);

    // Clientes novos vs recorrentes - usa Data Cad. da API + faturamento de vendas
    const clientesNovosRecorrentes = calcularClientesNovosRecorrentesHibrido(
      clientesAPI,
      dadosAnoAtualFiltrados,
      ano
    );

    // Churn - usa Ult.Compra da API (mais preciso)
    const dataRef = new Date(ano, mes, 0); // último dia do mês
    const churnClientes = calcularChurnAPI(clientesAPI, dataRef);

    return {
      topClientes: topClientesEnriquecidos,
      frequenciaCompra,
      clientesNovosRecorrentes,
      churnClientes,
      estatisticas,
    };
  }, [vendasData, clientesAPI, ano, mes, equipe, sector]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando dados...</p>
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

  const totalChurn = dadosProcessados
    ? dadosProcessados.churnClientes.churn3Meses.quantidade +
      dadosProcessados.churnClientes.churn6Meses.quantidade
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-foreground">Análise de Clientes</h1>
          <p className="text-muted-foreground">
            Métricas de faturamento, frequência, novos vs. recorrentes e churn
          </p>
        </div>

        {/* Filtros */}
        <div className="animate-fade-in-up stagger-1 opacity-0">
          <FiltrosVendas
            ano={ano}
            mes={mes}
            equipe={equipe}
            onAnoChange={setAno}
            onMesChange={setMes}
            onEquipeChange={setEquipe}
            mesAtualMax={ano === anoAtual ? mesAtual : 12}
            sectorLocked={!canViewAllData && !!sector}
            sectorLabel={roleLabel}
          />
        </div>

        {dadosProcessados && (
          <>
            {dadosProcessados.topClientes.length === 0 ? (
              <Alert className="animate-fade-in-up">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sem dados disponíveis</AlertTitle>
                <AlertDescription>
                  Não foram encontrados registros de clientes para o período selecionado.
                  Tente selecionar outro mês ou verifique os filtros aplicados.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="animate-fade-in-up stagger-1 opacity-0">
                    <KPICard
                      title="Clientes Ativos"
                      value={dadosProcessados.estatisticas.totalClientesAtivos}
                      format="number"
                      icon={<Users className="h-4 w-4" />}
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-2 opacity-0">
                    <KPICard
                      title="Clientes Novos"
                      value={dadosProcessados.clientesNovosRecorrentes.novos.quantidade}
                      format="number"
                      icon={<UserPlus className="h-4 w-4" />}
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-3 opacity-0">
                    <KPICard
                      title="Taxa Recompra Média"
                      value={dadosProcessados.estatisticas.taxaRecompraMedia}
                      format="number"
                      icon={<Repeat className="h-4 w-4" />}
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-4 opacity-0">
                    <KPICard
                      title="Clientes em Risco"
                      value={totalChurn}
                      format="number"
                      icon={<UserX className="h-4 w-4" />}
                    />
                  </div>
                </div>

                {/* Top 10 Clientes */}
                <div className="animate-scale-in stagger-2 opacity-0">
                  <TopClientesTable data={dadosProcessados.topClientes} />
                </div>

                {/* Gráficos lado a lado */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="animate-scale-in stagger-3 opacity-0">
                    <ClientesNovosRecorrentes data={dadosProcessados.clientesNovosRecorrentes} />
                  </div>
                  <div className="animate-scale-in stagger-4 opacity-0">
                    <FrequenciaCompraChart
                      data={dadosProcessados.frequenciaCompra}
                      taxaRecompraMedia={dadosProcessados.estatisticas.taxaRecompraMedia}
                    />
                  </div>
                </div>

                {/* Churn */}
                <div className="animate-fade-in-up stagger-5 opacity-0">
                  <ChurnClientesCard data={dadosProcessados.churnClientes} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
