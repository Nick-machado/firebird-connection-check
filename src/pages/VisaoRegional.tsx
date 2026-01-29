import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FiltrosVendas } from "@/components/dashboard/FiltrosVendas";
import { BrazilMap } from "@/components/dashboard/BrazilMap";
import { RegionalTable } from "@/components/dashboard/RegionalTable";
import { RegionalDetailPanel } from "@/components/dashboard/RegionalDetailPanel";
import { useVendasDoisAnos } from "@/hooks/useVendas";
import { filtrarPorEquipe, filtrarPorMes } from "@/lib/dataProcessing";
import {
  calcularDadosPorUF,
  calcularDadosPorRegiao,
  calcularTopProdutosPorLocal,
  calcularTopClientesPorLocal,
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

  // Filtros gerais
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(mesAtual);
  const [equipe, setEquipe] = useState("TODAS");

  // Configurações do mapa
  const [metrica, setMetrica] = useState<Metrica>("faturamento");
  const [granularidade, setGranularidade] = useState<Granularidade>("uf");

  // Estado selecionado
  const [estadoSelecionado, setEstadoSelecionado] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Busca dados
  const { data: vendasData, isLoading, error } = useVendasDoisAnos(ano);

  // Processa os dados regionais
  const dadosProcessados = useMemo(() => {
    if (!vendasData) return null;

    let dados = vendasData.anoAtual.data;
    dados = filtrarPorEquipe(dados, equipe);
    dados = filtrarPorMes(dados, mes);

    const dadosPorUF = calcularDadosPorUF(dados);
    const dadosPorRegiao = calcularDadosPorRegiao(dados);

    return {
      dados,
      dadosPorUF,
      dadosPorRegiao,
    };
  }, [vendasData, mes, equipe]);

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mapa */}
            <div className="animate-scale-in stagger-3 opacity-0">
              <BrazilMap
                dados={dadosProcessados.dadosPorUF}
                metrica={metrica}
                onEstadoClick={handleEstadoClick}
                estadoSelecionado={granularidade === "uf" ? estadoSelecionado : null}
              />
            </div>

            {/* Tabela */}
            <div className="animate-scale-in stagger-4 opacity-0">
              <RegionalTable
                dados={granularidade === "uf" ? dadosProcessados.dadosPorUF : dadosProcessados.dadosPorRegiao}
                tipo={granularidade}
                onRowClick={handleEstadoClick}
                selecionado={estadoSelecionado}
              />
            </div>
          </div>
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
