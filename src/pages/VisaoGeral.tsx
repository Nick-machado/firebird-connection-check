import { useMemo, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FiltrosVendas } from "@/components/dashboard/FiltrosVendas";
import { KPICard } from "@/components/dashboard/KPICard";
import { FaturamentoMensalChart } from "@/components/dashboard/FaturamentoMensalChart";
import { FaturamentoCanalChart } from "@/components/dashboard/FaturamentoCanalChart";
import { TopItemsChart } from "@/components/dashboard/TopItemsChart";
import { MargemCanalChart } from "@/components/dashboard/MargemCanalChart";
import { useVendasDoisAnos } from "@/hooks/useVendas";
import { useUserRole } from "@/hooks/useUserRole";
import { useFiltros } from "@/contexts/FiltrosContext";
import {
  filtrarPorMes,
  filtrarDadosComSetor,
  filtrarDevolucoesExtraComSetor,
  filtrarDevolucoesExtraPorMes,
  calcularKPIs,
  calcularFaturamentoMensal,
  calcularFaturamentoPorCanal,
  calcularTopProdutos,
  calcularTopVendedores,
  calcularTopClientes,
  calcularMargemPorCanal,
  calcularFaturamentoPorRegiao,
} from "@/lib/dataProcessing";
import { exportarVendasExcel } from "@/lib/exportToExcel";
import { CHART_COLORS, SECTOR_TO_EQUIPES } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, DollarSign, TrendingDown, Receipt, Package, Percent, BarChart3, FileDown, AlertCircle, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function VisaoGeral() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const { sector, canViewAllData, roleLabel, loading: roleLoading } = useUserRole();
  const { ano, mes, equipe, setAno, setMes, setEquipe } = useFiltros();
  const queryClient = useQueryClient();

  // Set equipe based on user sector on mount
  useEffect(() => {
    if (sector && SECTOR_TO_EQUIPES[sector]) {
      const allowedEquipes = SECTOR_TO_EQUIPES[sector];
      if (allowedEquipes.length === 1) {
        setEquipe(allowedEquipes[0]);
      }
    }
  }, [sector, setEquipe]);

  // Busca dados do ano atual e anterior (query só muda quando ANO muda)
  const { data: vendasData, isLoading, error } = useVendasDoisAnos(ano, !roleLoading);

  // Processa os dados (filtros de mês/equipe aplicados localmente)
  const dadosProcessados = useMemo(() => {
    if (!vendasData) return null;

    const dadosAnoAtual = vendasData.anoAtual.data;
    const dadosAnoAnterior = vendasData.anoAnterior.data;
    const devExtraAnoAtual = vendasData.devolucoesExtra?.anoAtual || [];
    const devExtraAnoAnterior = vendasData.devolucoesExtra?.anoAnterior || [];

    // Filtrar por equipe/setor usando função centralizada
    const dadosAnoAtualFiltrados = filtrarDadosComSetor(dadosAnoAtual, equipe, sector);
    const dadosAnoAnteriorFiltrados = filtrarDadosComSetor(dadosAnoAnterior, equipe, sector);
    const devExtraAtualFiltrados = filtrarDevolucoesExtraComSetor(devExtraAnoAtual, equipe, sector);
    const devExtraAnteriorFiltrados = filtrarDevolucoesExtraComSetor(devExtraAnoAnterior, equipe, sector);

    // Dados do mês selecionado
    const dadosMesFiltrados = filtrarPorMes(dadosAnoAtualFiltrados, mes);
    const dadosMesAnteriorFiltrados = filtrarPorMes(dadosAnoAnteriorFiltrados, mes);
    const devExtraMes = filtrarDevolucoesExtraPorMes(devExtraAtualFiltrados, mes);
    const devExtraMesAnterior = filtrarDevolucoesExtraPorMes(devExtraAnteriorFiltrados, mes);

    // KPIs do mês
    const kpisMes = calcularKPIs(dadosMesFiltrados, devExtraMes);
    const kpisMesAnterior = calcularKPIs(dadosMesAnteriorFiltrados, devExtraMesAnterior);

    // Debug logging temporário
    console.log(`📊 DEBUG MÊS ${mes}/${ano}:`, {
      totalRegistrosAnoAtual: dadosAnoAtual.length,
      registrosMesFiltrados: dadosMesFiltrados.length,
      vendasCount: dadosMesFiltrados.filter(i => i['Flag Tipo']?.trim() === 'V').length,
      devolucoesCount: dadosMesFiltrados.filter(i => i['Flag Tipo']?.trim() === 'D').length,
      bruto: kpisMes.totalFaturado,
      devolucoes: kpisMes.totalDevolucoes,
      liquido: kpisMes.faturamentoLiquido,
      devExtraMesCount: devExtraMes.length,
      equipe,
      sector,
    });

    // Calcula variação YoY
    const variacaoFaturamento = kpisMesAnterior.faturamentoLiquido > 0
      ? ((kpisMes.faturamentoLiquido - kpisMesAnterior.faturamentoLiquido) / kpisMesAnterior.faturamentoLiquido) * 100
      : 0;

    const variacaoMargem = kpisMesAnterior.totalMargem > 0
      ? ((kpisMes.totalMargem - kpisMesAnterior.totalMargem) / kpisMesAnterior.totalMargem) * 100
      : 0;

    // Faturamento mensal para gráfico
    const faturamentoMensalAtual = calcularFaturamentoMensal(dadosAnoAtualFiltrados, ano, devExtraAtualFiltrados);
    const faturamentoMensalAnterior = calcularFaturamentoMensal(dadosAnoAnteriorFiltrados, ano - 1, devExtraAnteriorFiltrados);

    // Outras métricas do mês
    const faturamentoPorCanal = calcularFaturamentoPorCanal(dadosMesFiltrados);
    const topProdutos = calcularTopProdutos(dadosMesFiltrados);
    const topVendedores = calcularTopVendedores(dadosMesFiltrados);
    const topClientes = calcularTopClientes(dadosMesFiltrados);
    const margemPorCanal = calcularMargemPorCanal(dadosMesFiltrados);
    const faturamentoPorRegiao = calcularFaturamentoPorRegiao(dadosMesFiltrados);

    return {
      kpisMes,
      variacaoFaturamento,
      variacaoMargem,
      faturamentoMensalAtual,
      faturamentoMensalAnterior,
      faturamentoPorCanal,
      topProdutos,
      topVendedores,
      topClientes,
      margemPorCanal,
      faturamentoPorRegiao,
    };
  }, [vendasData, ano, mes, equipe, sector]);

  if (roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando permissões...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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

  const handleExportExcel = () => {
    if (!vendasData) {
      alert('Nenhum dado disponível para exportar');
      return;
    }

    // Filtra os dados de acordo com os filtros aplicados
    let dadosFiltrados = vendasData.anoAtual.data;
    dadosFiltrados = filtrarDadosComSetor(dadosFiltrados, equipe, sector);
    dadosFiltrados = filtrarPorMes(dadosFiltrados, mes);

    // Cria o nome do arquivo com os filtros
    const mesNome = mes < 10 ? `0${mes}` : mes;
    const nomeArquivo = `vendas_${ano}_${mesNome}_${equipe}.xlsx`;

    exportarVendasExcel(dadosFiltrados, nomeArquivo);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in-up flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Visão Geral de Vendas</h1>
            <p className="text-muted-foreground">Análise completa de faturamento, margem e performance</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["vendas-dois-anos"] })}
              className="gap-2"
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              onClick={handleExportExcel}
              className="gap-2"
              variant="outline"
            >
              <FileDown className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
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

        {/* KPIs */}
        {dadosProcessados && (
          <>
            {/* Alerta quando não há dados significativos */}
            {dadosProcessados.kpisMes.totalNotas === 0 && dadosProcessados.kpisMes.faturamentoLiquido === 0 ? (
              <Alert className="animate-fade-in-up">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sem dados disponíveis</AlertTitle>
                <AlertDescription>
                  Não foram encontrados registros de vendas para o período selecionado. 
                  Tente selecionar outro mês ou verifique os filtros aplicados.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="animate-fade-in-up stagger-1 opacity-0">
                    <KPICard
                      title="Faturamento Bruto"
                      value={dadosProcessados.kpisMes.totalFaturado}
                      format="compact"
                      icon={<DollarSign className="h-4 w-4" />}
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-2 opacity-0">
                    <KPICard
                      title="Fat. Líquido"
                      value={dadosProcessados.kpisMes.faturamentoLiquido}
                      format="compact"
                      icon={<DollarSign className="h-4 w-4" />}
                      trend={dadosProcessados.variacaoFaturamento}
                      trendLabel="vs ano anterior"
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-3 opacity-0">
                    <KPICard
                      title="Devoluções"
                      value={dadosProcessados.kpisMes.totalDevolucoes}
                      format="compact"
                      icon={<TrendingDown className="h-4 w-4" />}
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-4 opacity-0">
                    <KPICard
                      title="Notas Emitidas"
                      value={dadosProcessados.kpisMes.totalNotas}
                      format="number"
                      icon={<Receipt className="h-4 w-4" />}
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-5 opacity-0">
                    <KPICard
                      title="CMV"
                      value={dadosProcessados.kpisMes.totalCMV}
                      format="compact"
                      icon={<Package className="h-4 w-4" />}
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-6 opacity-0">
                    <KPICard
                      title="Margem"
                      value={dadosProcessados.kpisMes.totalMargem}
                      format="compact"
                      icon={<BarChart3 className="h-4 w-4" />}
                      trend={dadosProcessados.variacaoMargem}
                      trendLabel="vs ano anterior"
                    />
                  </div>
                  <div className="animate-fade-in-up stagger-7 opacity-0">
                    <KPICard
                      title="Margem %"
                      value={dadosProcessados.kpisMes.margemPercentual}
                      format="percent"
                      icon={<Percent className="h-4 w-4" />}
                    />
                  </div>
                </div>

                {/* Gráficos principais */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="animate-scale-in stagger-2 opacity-0">
                    <FaturamentoMensalChart
                      dataAnoAtual={dadosProcessados.faturamentoMensalAtual}
                      dataAnoAnterior={dadosProcessados.faturamentoMensalAnterior}
                      anoAtual={ano}
                      anoAnterior={ano - 1}
                    />
                  </div>
                  <div className="animate-scale-in stagger-3 opacity-0">
                    <FaturamentoCanalChart data={dadosProcessados.faturamentoPorCanal} />
                  </div>
                </div>

                {/* Margem por canal */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="animate-scale-in stagger-4 opacity-0">
                    <MargemCanalChart data={dadosProcessados.margemPorCanal} />
                  </div>
                  <div className="animate-scale-in stagger-5 opacity-0">
                    <TopItemsChart
                      data={dadosProcessados.faturamentoPorRegiao}
                      title="Faturamento por Região"
                      color={CHART_COLORS.tertiary}
                    />
                  </div>
                </div>

                {/* Análises detalhadas em abas */}
                <div className="animate-fade-in-up stagger-6 opacity-0">
                  <Tabs defaultValue="produtos" className="space-y-4">
                    <TabsList className="bg-muted/50 backdrop-blur-sm">
                      <TabsTrigger value="produtos">Top Produtos</TabsTrigger>
                      <TabsTrigger value="vendedores">Top Vendedores</TabsTrigger>
                      <TabsTrigger value="clientes">Top Clientes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="produtos" className="animate-fade-in">
                      <TopItemsChart
                        data={dadosProcessados.topProdutos}
                        title="Top 10 Produtos por Faturamento"
                        color={CHART_COLORS.primary}
                      />
                    </TabsContent>

                    <TabsContent value="vendedores" className="animate-fade-in">
                      <TopItemsChart
                        data={dadosProcessados.topVendedores}
                        title="Top 10 Vendedores por Faturamento"
                        color={CHART_COLORS.secondary}
                      />
                    </TabsContent>

                    <TabsContent value="clientes" className="animate-fade-in">
                      <TopItemsChart
                        data={dadosProcessados.topClientes}
                        title="Top 10 Clientes por Faturamento"
                        color={CHART_COLORS.tertiary}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
