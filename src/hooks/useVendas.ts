import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/constants";
import type { VendaItem, DevolucaoExtraItem } from "@/types/venda";

interface VendasResponse {
  success: boolean;
  data: VendaItem[];
  error?: string;
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
 * Retorna o último dia do mês considerando anos bissextos
 */
function getUltimoDiaMes(mes: number, ano: number): number {
  return new Date(ano, mes, 0).getDate();
}

/**
 * Busca dados de um ano inteiro fazendo 12 requisições em paralelo (uma por mês)
 */
async function fetchAnoCompleto(ano: number): Promise<VendaItem[]> {
  const promessasMeses = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const mesFormatado = mes.toString().padStart(2, "0");
    const ultimoDia = getUltimoDiaMes(mes, ano);
    
    const dataInicio = `01/${mesFormatado}/${ano}`;
    const dataFim = `${ultimoDia}/${mesFormatado}/${ano}`;
    
    return fetchVendas(dataInicio, dataFim);
  });

  const resultadosMeses = await Promise.all(promessasMeses);
  return resultadosMeses.flat();
}

/**
 * Busca devoluções extras de um ano inteiro fazendo 12 requisições em paralelo
 */
async function fetchDevolucoesAnoCompleto(ano: number): Promise<DevolucaoExtraItem[]> {
  const promessasMeses = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const mesFormatado = mes.toString().padStart(2, "0");
    const ultimoDia = getUltimoDiaMes(mes, ano);
    
    const dataInicio = `01/${mesFormatado}/${ano}`;
    const dataFim = `${ultimoDia}/${mesFormatado}/${ano}`;
    
    return fetchDevolucoesExtra(dataInicio, dataFim);
  });

  const resultadosMeses = await Promise.all(promessasMeses);
  return resultadosMeses.flat();
}

/**
 * Hook para buscar dados de vendas de 2 anos (ano selecionado + ano anterior)
 * Inclui devoluções extras da nova rota /api/vendas/devolucao
 */
export function useVendasDoisAnos(anoSelecionado: number, enabled: boolean = true) {
  const anoAtual = anoSelecionado;
  const anoAnterior = anoSelecionado - 1;

  return useQuery({
    queryKey: ["vendas-dois-anos", anoAtual],
    queryFn: async () => {
      const [dadosAnoAtual, dadosAnoAnterior, devExtraAnoAtual, devExtraAnoAnterior] = await Promise.all([
        fetchAnoCompleto(anoAtual),
        fetchAnoCompleto(anoAnterior),
        fetchDevolucoesAnoCompleto(anoAtual),
        fetchDevolucoesAnoCompleto(anoAnterior),
      ]);

      return {
        anoAtual: { ano: anoAtual, data: dadosAnoAtual },
        anoAnterior: { ano: anoAnterior, data: dadosAnoAnterior },
        devolucoesExtra: {
          anoAtual: devExtraAnoAtual,
          anoAnterior: devExtraAnoAnterior,
        },
      };
    },
    staleTime: 1000 * 60 * 20,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
    enabled,
  });
}
