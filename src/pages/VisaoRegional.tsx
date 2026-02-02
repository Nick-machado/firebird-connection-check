import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FiltrosVendas } from "@/components/dashboard/FiltrosVendas";
import { BrazilMap } from "@/components/dashboard/BrazilMap";
import { RegionalTable } from "@/components/dashboard/RegionalTable";
import { RegionalDetailPanel } from "@/components/dashboard/RegionalDetailPanel";
import { RegionalChannelsChart } from "@/components/dashboard/RegionalChannelsChart";

import { useVendasDoisAnos } from "@/hooks/useVendas";
import { useUserRole } from "@/hooks/useUserRole";
import { filtrarPorEquipe, filtrarPorMes } from "@/lib/dataProcessing";
import { SECTOR_TO_EQUIPES } from "@/lib/constants";
import {
  calcularDadosPorUF,
  calcularDadosPorRegiao,
  calcularTopProdutosPorLocal,
  calcularTopClientesPorLocal,
  calcularVariacoesPorUF,
  calcularVariacoesPorRegiao,
  calcularCanaisPorUF,
  calcularCanaisPorRegiao,
  type DadosRegionais,
} from "@/lib/regionalProcessing";
import { Loader2, Map, BarChart3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Metrica = "faturamento" | "margem" | "quantidade";
type Granularidade = "uf" | "regiao";

export default function VisaoRegional() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const { sector, canViewAllData, roleLabel } = useUserRole();

  // Filtros gerais
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(mesAtual);
  const [equipe, setEquipe] = useState("TODAS");

  // Set equipe based on user sector on mount
  useEffect(() => {
    if (sector && SECTOR_TO_EQUIPES[sector]) {
      const allowedEquipes = SECTOR_TO_EQUIPES[sector];
      if (allowedEquipes.length === 1) {
        setEquipe(allowedEquipes[0]);
      }
    }
  }, [sector]);

  // Configurações do mapa
  const [metrica, setMetrica] = useState<Metrica>("faturamento");
  const [granularidade, setGranularidade] = useState<Granularidade>("uf");

  // Estado selecionado
  const [estadoSelecionado, setEstadoSelecionado] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Busca dados
  const { data: vendasData, isLoading, error } = useVendasDoisAnos(ano);

  // Helper para filtrar dados por setor
  const filtrarPorSetor = (dados: typeof vendasData.anoAtual.data) => {
    if (sector && SECTOR_TO_EQUIPES[sector]) {
      const allowedEquipes = SECTOR_TO_EQUIPES[sector];
      return dados.filter(
        (v) => allowedEquipes.some((eq) => v.Equipe?.toUpperCase().includes(eq.toUpperCase()))
      );
    }
    return filtrarPorEquipe(dados, equipe);
  };

  // Processa os dados regionais com variações
  const dadosProcessados = useMemo(() => {
    if (!vendasData) return null;

    // Dados do mês atual
    let dadosMesAtual = filtrarPorSetor(vendasData.anoAtual.data);
    dadosMesAtual = filtrarPorMes(dadosMesAtual, mes);

    // Dados do mês anterior (mesmo ano ou ano anterior se janeiro)
    const mesAnterior = mes > 1 ? mes - 1 : 12;
    const dadosFonteMesAnterior = mes > 1 ? vendasData.anoAtual.data : vendasData.anoAnterior.data;
    let dadosMesAnterior = filtrarPorSetor(dadosFonteMesAnterior);
    dadosMesAnterior = filtrarPorMes(dadosMesAnterior, mesAnterior);

    // Dados do mesmo mês do ano anterior
    let dadosAnoAnterior = filtrarPorSetor(vendasData.anoAnterior.data);
    dadosAnoAnterior = filtrarPorMes(dadosAnoAnterior, mes);

    // Calcular dados base
    const dadosPorUF = calcularDadosPorUF(dadosMesAtual);
    const dadosPorRegiao = calcularDadosPorRegiao(dadosMesAtual);

    // Calcular variações
    const variacoesPorUF = calcularVariacoesPorUF(dadosMesAtual, dadosMesAnterior, dadosAnoAnterior);
    const variacoesPorRegiao = calcularVariacoesPorRegiao(dadosMesAtual, dadosMesAnterior, dadosAnoAnterior);

    // Adicionar variações aos dados
    const dadosPorUFComVariacoes = dadosPorUF.map((item) => {
      const variacoes = variacoesPorUF.get(item.uf);
      return {
        ...item,
        variacaoMoM: variacoes?.variacaoMoM ?? 0,
        variacaoYoY: variacoes?.variacaoYoY ?? 0,
      };
    });

    const dadosPorRegiaoComVariacoes = dadosPorRegiao.map((item) => {
      const variacoes = variacoesPorRegiao.get(item.nome);
      return {
        ...item,
        variacaoMoM: variacoes?.variacaoMoM ?? 0,
        variacaoYoY: variacoes?.variacaoYoY ?? 0,
      };
    });

    // Calcular canais por região/UF
    const canaisPorUF = calcularCanaisPorUF(dadosMesAtual);
    const canaisPorRegiao = calcularCanaisPorRegiao(dadosMesAtual);

    return {
      dados: dadosMesAtual,
      dadosPorUF: dadosPorUFComVariacoes,
      dadosPorRegiao: dadosPorRegiaoComVariacoes,
      canaisPorUF,
      canaisPorRegiao,
    };
  }, [vendasData, mes, equipe, sector]);

  // Dados do estado selecionado
  const dadosEstadoSelecionado = useMemo((): DadosRegionais | null => {
    if (!estadoSelecionado || !dadosProcessados) return null;
    
    if (granularidade === "uf") {
      return dadosProcessados.dadosPorUF.find((d) => d.uf === estadoSelecionado) || null;
    } else {
      const dadoRegiao = dadosProcessados.dadosPorRegiao.find((d) => d.nome === estadoSelecionado);
      if (!dadoRegiao) return null;
      
      // Converte DadosAgrupados para DadosRegionais
      return {
        uf: estadoSelecionado,
        regiao: estadoSelecionado,
        faturamento: dadoRegiao.faturamento,
        margem: dadoRegiao.margem,
        margemPercentual: dadoRegiao.margemPercentual,
        quantidade: dadoRegiao.quantidade,
        notas: dadoRegiao.notas,
        variacaoMoM: dadoRegiao.variacaoMoM,
        variacaoYoY: dadoRegiao.variacaoYoY,
      };
    }
  }, [estadoSelecionado, dadosProcessados, granularidade]);

  // Top produtos e clientes do local selecionado
  const topProdutos = useMemo(() => {
    if (!estadoSelecionado || !dadosProcessados) return [];
    return calcularTopProdutosPorLocal(dadosProcessados.dados, {
      tipo: granularidade,
      valor: estadoSelecionado,
    });
  }, [estadoSelecionado, dadosProcessados, granularidade]);

  const topClientes = useMemo(() => {
    if (!estadoSelecionado || !dadosProcessados) return [];
    return calcularTopClientesPorLocal(dadosProcessados.dados, {
      tipo: granularidade,
      valor: estadoSelecionado,
    });
  }, [estadoSelecionado, dadosProcessados, granularidade]);

  const handleEstadoClick = (id: string) => {
    setEstadoSelecionado(id);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setEstadoSelecionado(null);
  };

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
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-foreground">Visão Regional</h1>
          <p className="text-muted-foreground">Análise geográfica de vendas por estado e região</p>
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

        {/* Controles do mapa */}
        <div className="animate-fade-in-up stagger-2 opacity-0 flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-sm">Visualização</Label>
            <Tabs value={granularidade} onValueChange={(v) => setGranularidade(v as Granularidade)}>
              <TabsList>
                <TabsTrigger value="uf" className="gap-2">
                  <Map className="h-4 w-4" />
                  Por Estado
                </TabsTrigger>
                <TabsTrigger value="regiao" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Por Região
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Métrica do Mapa</Label>
            <Select value={metrica} onValueChange={(v) => setMetrica(v as Metrica)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="faturamento">Faturamento</SelectItem>
                <SelectItem value="margem">Margem</SelectItem>
                <SelectItem value="quantidade">Quantidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {dadosProcessados && (
          <>
            {/* Mapa e Tabela */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="animate-scale-in stagger-4 opacity-0">
                <BrazilMap
                  dados={dadosProcessados.dadosPorUF}
                  metrica={metrica}
                  onEstadoClick={handleEstadoClick}
                  estadoSelecionado={granularidade === "uf" ? estadoSelecionado : null}
                />
              </div>

              <div className="animate-scale-in stagger-5 opacity-0">
                <RegionalTable
                  dados={granularidade === "uf" ? dadosProcessados.dadosPorUF : dadosProcessados.dadosPorRegiao}
                  tipo={granularidade}
                  onRowClick={handleEstadoClick}
                  selecionado={estadoSelecionado}
                />
              </div>
            </div>

            {/* Gráfico de Canais por Região */}
            <div className="animate-scale-in stagger-6 opacity-0">
              <RegionalChannelsChart
                dados={granularidade === "uf" ? dadosProcessados.canaisPorUF : dadosProcessados.canaisPorRegiao}
                tipo={granularidade}
                selecionado={estadoSelecionado}
              />
            </div>
          </>
        )}

        {/* Painel de detalhes */}
        <RegionalDetailPanel
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
          dadosEstado={dadosEstadoSelecionado}
          topProdutos={topProdutos}
          topClientes={topClientes}
        />
      </div>
    </DashboardLayout>
  );
}
