import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FiltrosVendas } from "@/components/dashboard/FiltrosVendas";
import { KPICard } from "@/components/dashboard/KPICard";
import { FaturamentoMensalChart } from "@/components/dashboard/FaturamentoMensalChart";
import { FaturamentoCanalChart } from "@/components/dashboard/FaturamentoCanalChart";
import { TopItemsChart } from "@/components/dashboard/TopItemsChart";
import { MargemCanalChart } from "@/components/dashboard/MargemCanalChart";
import { useVendasDoisAnos } from "@/hooks/useVendas";
import {
  filtrarPorEquipe,
  filtrarPorMes,
  calcularKPIs,
  calcularFaturamentoMensal,
  calcularFaturamentoPorCanal,
  calcularTopProdutos,
  calcularTopVendedores,
  calcularTopClientes,
  calcularMargemPorCanal,
  calcularFaturamentoPorRegiao,
} from "@/lib/dataProcessing";
import { CHART_COLORS } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DollarSign, TrendingDown, Receipt, Package, Percent, Users, BarChart3 } from "lucide-react";

export default function VisaoGeral() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(mesAtual);
  const [equipe, setEquipe] = useState("TODAS");

  // Busca dados do ano atual e anterior (query só muda quando ANO muda)
  const { data: vendasData, isLoading, error } = useVendasDoisAnos(ano);

  // Processa os dados (filtros de mês/equipe aplicados localmente)
  const dadosProcessados = useMemo(() => {
    if (!vendasData) return null;

    const dadosAnoAtual = vendasData.anoAtual.data;
    const dadosAnoAnterior = vendasData.anoAnterior.data;

    // Aplica filtro de equipe
    const dadosAnoAtualFiltrados = filtrarPorEquipe(dadosAnoAtual, equipe);
    const dadosAnoAnteriorFiltrados = filtrarPorEquipe(dadosAnoAnterior, equipe);

    // Dados do mês selecionado
    const dadosMesFiltrados = filtrarPorMes(dadosAnoAtualFiltrados, mes);
    const dadosMesAnteriorFiltrados = filtrarPorMes(dadosAnoAnteriorFiltrados, mes);

    // KPIs do mês
    const kpisMes = calcularKPIs(dadosMesFiltrados);
    const kpisMesAnterior = calcularKPIs(dadosMesAnteriorFiltrados);

    // Calcula variação YoY
    const variacaoFaturamento = kpisMesAnterior.faturamentoLiquido > 0
      ? ((kpisMes.faturamentoLiquido - kpisMesAnterior.faturamentoLiquido) / kpisMesAnterior.faturamentoLiquido) * 100
      : 0;

    const variacaoMargem = kpisMesAnterior.totalMargem > 0
      ? ((kpisMes.totalMargem - kpisMesAnterior.totalMargem) / kpisMesAnterior.totalMargem) * 100
      : 0;

    // Faturamento mensal para gráfico
    const faturamentoMensalAtual = calcularFaturamentoMensal(dadosAnoAtualFiltrados, ano);
    const faturamentoMensalAnterior = calcularFaturamentoMensal(dadosAnoAnteriorFiltrados, ano - 1);

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
  }, [vendasData, ano, mes, equipe]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visão Geral de Vendas</h1>
          <p className="text-muted-foreground">Análise completa de faturamento, margem e performance</p>
        </div>

        {/* Filtros */}
        <FiltrosVendas
          ano={ano}
          mes={mes}
          equipe={equipe}
          onAnoChange={setAno}
          onMesChange={setMes}
          onEquipeChange={setEquipe}
          mesAtualMax={ano === anoAtual ? mesAtual : 12}
        />

        {/* KPIs */}
        {dadosProcessados && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <KPICard
                title="Faturamento"
                value={dadosProcessados.kpisMes.faturamentoLiquido}
                format="compact"
                icon={<DollarSign className="h-4 w-4" />}
                trend={dadosProcessados.variacaoFaturamento}
                trendLabel="vs ano anterior"
              />
              <KPICard
                title="Devoluções"
                value={dadosProcessados.kpisMes.totalDevolucoes}
                format="compact"
                icon={<TrendingDown className="h-4 w-4" />}
              />
              <KPICard
                title="Notas Emitidas"
                value={dadosProcessados.kpisMes.totalNotas}
                format="number"
                icon={<Receipt className="h-4 w-4" />}
              />
              <KPICard
                title="CMV"
                value={dadosProcessados.kpisMes.totalCMV}
                format="compact"
                icon={<Package className="h-4 w-4" />}
              />
              <KPICard
                title="Margem"
                value={dadosProcessados.kpisMes.totalMargem}
                format="compact"
                icon={<BarChart3 className="h-4 w-4" />}
                trend={dadosProcessados.variacaoMargem}
                trendLabel="vs ano anterior"
              />
              <KPICard
                title="Margem %"
                value={dadosProcessados.kpisMes.margemPercentual}
                format="percent"
                icon={<Percent className="h-4 w-4" />}
              />
            </div>

            {/* Gráficos principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FaturamentoMensalChart
                dataAnoAtual={dadosProcessados.faturamentoMensalAtual}
                dataAnoAnterior={dadosProcessados.faturamentoMensalAnterior}
                anoAtual={ano}
                anoAnterior={ano - 1}
              />
              <FaturamentoCanalChart data={dadosProcessados.faturamentoPorCanal} />
            </div>

            {/* Margem por canal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MargemCanalChart data={dadosProcessados.margemPorCanal} />
              <TopItemsChart
                data={dadosProcessados.faturamentoPorRegiao}
                title="Faturamento por Região"
                color={CHART_COLORS.tertiary}
              />
            </div>

            {/* Análises detalhadas em abas */}
            <Tabs defaultValue="produtos" className="space-y-4">
              <TabsList>
                <TabsTrigger value="produtos">Top Produtos</TabsTrigger>
                <TabsTrigger value="vendedores">Top Vendedores</TabsTrigger>
                <TabsTrigger value="clientes">Top Clientes</TabsTrigger>
              </TabsList>

              <TabsContent value="produtos">
                <TopItemsChart
                  data={dadosProcessados.topProdutos}
                  title="Top 10 Produtos por Faturamento"
                  color={CHART_COLORS.primary}
                />
              </TabsContent>

              <TabsContent value="vendedores">
                <TopItemsChart
                  data={dadosProcessados.topVendedores}
                  title="Top 10 Vendedores por Faturamento"
                  color={CHART_COLORS.secondary}
                />
              </TabsContent>

              <TabsContent value="clientes">
                <TopItemsChart
                  data={dadosProcessados.topClientes}
                  title="Top 10 Clientes por Faturamento"
                  color={CHART_COLORS.tertiary}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
