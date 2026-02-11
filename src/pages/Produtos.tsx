import { useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FiltrosVendas } from "@/components/dashboard/FiltrosVendas";
import { TopProdutosAtividadeChart } from "@/components/produtos/TopProdutosAtividadeChart";
import { MargemProdutoChart } from "@/components/produtos/MargemProdutoChart";
import { CrescimentoProdutosChart } from "@/components/produtos/CrescimentoProdutosChart";
import { useVendasDoisAnos } from "@/hooks/useVendas";
import { useUserRole } from "@/hooks/useUserRole";
import { useFiltros } from "@/contexts/FiltrosContext";
import {
  filtrarPorMes,
  filtrarDadosComSetor,
} from "@/lib/dataProcessing";
import {
  calcularTopProdutosPorAtividade,
  calcularMargemPorProduto,
  calcularCrescimentoProdutos,
} from "@/lib/produtosProcessing";
import { SECTOR_TO_EQUIPES } from "@/lib/constants";
import { Loader2, Package } from "lucide-react";

export default function Produtos() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const { sector, canViewAllData, roleLabel, loading: roleLoading } = useUserRole();
  const { ano, mes, equipe, setAno, setMes, setEquipe } = useFiltros();

  useEffect(() => {
    if (sector && SECTOR_TO_EQUIPES[sector]) {
      const allowedEquipes = SECTOR_TO_EQUIPES[sector];
      if (allowedEquipes.length === 1) {
        setEquipe(allowedEquipes[0]);
      }
    }
  }, [sector, setEquipe]);

  const { data: vendasData, isLoading, error } = useVendasDoisAnos(ano, !roleLoading);

  const dadosProcessados = useMemo(() => {
    if (!vendasData) return null;

    const dadosAtualFiltrados = filtrarDadosComSetor(vendasData.anoAtual.data, equipe, sector);
    const dadosAnteriorFiltrados = filtrarDadosComSetor(vendasData.anoAnterior.data, equipe, sector);

    const dadosMesAtual = filtrarPorMes(dadosAtualFiltrados, mes);
    const dadosMesAnterior = filtrarPorMes(dadosAnteriorFiltrados, mes);

    const topPorAtividade = calcularTopProdutosPorAtividade(dadosMesAtual);
    const margemPorProduto = calcularMargemPorProduto(dadosMesAtual, 20);
    const { crescimento, queda } = calcularCrescimentoProdutos(dadosMesAtual, dadosMesAnterior);

    return { topPorAtividade, margemPorProduto, crescimento, queda };
  }, [vendasData, ano, mes, equipe, sector]);

  if (roleLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              {roleLoading ? "Carregando permissões..." : "Carregando dados..."}
            </p>
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
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Análise de performance, margem e crescimento por produto
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
            {/* Top produtos por atividade */}
            <div className="animate-scale-in stagger-2 opacity-0">
              <TopProdutosAtividadeChart data={dadosProcessados.topPorAtividade} />
            </div>

            {/* Margem por produto */}
            <div className="animate-scale-in stagger-3 opacity-0">
              <MargemProdutoChart data={dadosProcessados.margemPorProduto} />
            </div>

            {/* Crescimento / Queda */}
            <div className="animate-fade-in-up stagger-4 opacity-0">
              <CrescimentoProdutosChart
                crescimento={dadosProcessados.crescimento}
                queda={dadosProcessados.queda}
                anoAtual={ano}
                anoAnterior={ano - 1}
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
