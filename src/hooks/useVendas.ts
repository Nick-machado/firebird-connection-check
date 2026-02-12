import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/constants";
import type { VendaItem, DevolucaoExtraItem } from "@/types/venda";

interface VendasResponse {
  success: boolean;
  data: VendaItem[];
  error?: string;
  meta?: { total: number; queryTime: string; fetchedAt: string };
}

interface DevolucoesExtraResponse {
  success: boolean;
  data: DevolucaoExtraItem[];
  error?: string;
}

async function fetchVendas(dataInicio: string, dataFim: string): Promise<VendaItem[]> {
  const params = new URLSearchParams({ dataInicio, dataFim });
  const url = `${API_URL}/api/vendas?${params.toString()}`;
  const response = await fetch(url);
  const result: VendasResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Erro ao buscar dados");
  }

  // Detectar truncamento de dados
  if (result.meta && result.meta.total > result.data.length) {
    console.warn(
      `⚠️ TRUNCAMENTO DETECTADO para ${dataInicio}-${dataFim}: ` +
      `API retornou ${result.data.length} de ${result.meta.total} registros`
    );
  } else if (result.meta) {
    console.log(`✅ ${dataInicio}-${dataFim}: ${result.data.length}/${result.meta.total} registros`);
  }

  return result.data;
}

async function fetchDevolucoesExtra(dataInicio: string, dataFim: string): Promise<DevolucaoExtraItem[]> {
  const params = new URLSearchParams({ dataInicio, dataFim });
  const url = `${API_URL}/api/vendas/devolucao?${params.toString()}`;
  const response = await fetch(url);
  const result: DevolucoesExtraResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Erro ao buscar devoluções extras");
  }

  return result.data;
}

/**
 * Hook para buscar dados de vendas de 2 anos (ano selecionado + ano anterior)
 * Faz apenas 2 requisições cobrindo os 2 anos de uma vez
 */
export function useVendasDoisAnos(anoSelecionado: number, enabled: boolean = true) {
  const anoAtual = anoSelecionado;
  const anoAnterior = anoSelecionado - 1;

  return useQuery({
    queryKey: ["vendas-dois-anos", anoAtual],
    queryFn: async () => {
      const [vendasTotal, devolucoesTotal] = await Promise.all([
        fetchVendas(`01/01/${anoAnterior}`, `31/12/${anoAtual}`),
        fetchDevolucoesExtra(`01/01/${anoAnterior}`, `31/12/${anoAtual}`),
      ]);

      const dadosAnoAtual = vendasTotal.filter(v => v.Ano === anoAtual);
      const dadosAnoAnterior = vendasTotal.filter(v => v.Ano === anoAnterior);

      const devExtraAnoAtual = devolucoesTotal.filter(d => new Date(d.ENTREGA).getFullYear() === anoAtual);
      const devExtraAnoAnterior = devolucoesTotal.filter(d => new Date(d.ENTREGA).getFullYear() === anoAnterior);

      return {
        anoAtual: { ano: anoAtual, data: dadosAnoAtual },
        anoAnterior: { ano: anoAnterior, data: dadosAnoAnterior },
        devolucoesExtra: {
          anoAtual: devExtraAnoAtual,
          anoAnterior: devExtraAnoAnterior,
        },
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 2,
    refetchOnWindowFocus: false,
    enabled,
  });
}
