import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/constants";
import type { VendaItem } from "@/types/venda";

interface VendasResponse {
  success: boolean;
  data: VendaItem[];
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

/**
 * Retorna o último dia do mês considerando anos bissextos
 */
function getUltimoDiaMes(mes: number, ano: number): number {
  // Usa o dia 0 do próximo mês para obter o último dia do mês atual
  return new Date(ano, mes, 0).getDate();
}

/**
 * Busca dados de um ano inteiro fazendo 12 requisições em paralelo (uma por mês)
 * Isso evita o truncamento de dados que ocorre quando a API recebe períodos muito grandes
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
  
  // Combina todos os meses em um único array
  return resultadosMeses.flat();
}

/**
 * Hook para buscar dados de vendas de 2 anos (ano selecionado + ano anterior)
 * - Busca mês a mês em paralelo para evitar truncamento da API
 * - A query só é executada quando o ANO muda
 * - Filtros de mês/equipe são aplicados localmente via useMemo
 * - Cache de 20 minutos para performance
 */
export function useVendasDoisAnos(anoSelecionado: number, enabled: boolean = true) {
  const anoAtual = anoSelecionado;
  const anoAnterior = anoSelecionado - 1;

  return useQuery({
    queryKey: ["vendas-dois-anos", anoAtual],
    queryFn: async () => {
      // Busca os 2 anos em paralelo (cada ano faz 12 requisições internas)
      const [dadosAnoAtual, dadosAnoAnterior] = await Promise.all([
        fetchAnoCompleto(anoAtual),
        fetchAnoCompleto(anoAnterior),
      ]);

      return {
        anoAtual: { ano: anoAtual, data: dadosAnoAtual },
        anoAnterior: { ano: anoAnterior, data: dadosAnoAnterior },
      };
    },
    staleTime: 1000 * 60 * 20, // 20 minutos - não refaz query
    gcTime: 1000 * 60 * 30, // 30 minutos no garbage collector
    retry: 2,
    refetchOnWindowFocus: false, // Não refaz ao focar na janela
    enabled,
  });
}
