import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/constants";
import type { VendaItem } from "@/types/venda";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface VendasResponse {
  success: boolean;
  data: VendaItem[];
  pagination?: PaginationInfo;
  error?: string;
}

/**
 * Busca TODAS as páginas de vendas para o período especificado
 */
async function fetchVendas(dataInicio: string, dataFim: string): Promise<VendaItem[]> {
  const allData: VendaItem[] = [];
  let currentPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const params = new URLSearchParams({ 
      dataInicio, 
      dataFim, 
      page: currentPage.toString(),
      limit: "500" // Pede mais registros por página para menos requests
    });
    
    const url = `${API_URL}/api/vendas?${params.toString()}`;
    const response = await fetch(url);
    const result: VendasResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Erro ao buscar dados");
    }

    allData.push(...result.data);
    
    // Verifica se há próxima página
    hasNextPage = result.pagination?.hasNextPage ?? false;
    currentPage++;
    
    // Safety: evita loop infinito (máx 500 páginas)
    if (currentPage > 500) break;
  }

  return allData;
}

/**
 * Hook para buscar dados de vendas de 2 anos (ano selecionado + ano anterior)
 * - A query só é executada quando o ANO muda
 * - Filtros de mês/equipe são aplicados localmente via useMemo
 * - Cache de 20 minutos para performance
 */
export function useVendasDoisAnos(anoSelecionado: number) {
  const anoAtual = anoSelecionado;
  const anoAnterior = anoSelecionado - 1;

  return useQuery({
    queryKey: ["vendas-dois-anos", anoAtual],
    queryFn: async () => {
      // Busca os 2 anos em paralelo - formato DD/MM/YYYY
      const [dadosAnoAtual, dadosAnoAnterior] = await Promise.all([
        fetchVendas(`01/01/${anoAtual}`, `31/12/${anoAtual}`),
        fetchVendas(`01/01/${anoAnterior}`, `31/12/${anoAnterior}`),
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
  });
}
