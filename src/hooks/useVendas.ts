import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/constants";
import type { VendaItem } from "@/types/venda";

interface VendasResponse {
  success: boolean;
  data: VendaItem[];
  error?: string;
}

async function fetchVendas(dataInicio: string, dataFim: string): Promise<VendaItem[]> {
  const url = `${API_URL}/api/vendas?dataInicio=${encodeURIComponent(dataInicio)}&dataFim=${encodeURIComponent(dataFim)}`;
  const response = await fetch(url);
  const result: VendasResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Erro ao buscar dados");
  }

  return result.data;
}

export function useVendas(ano: number) {
  const dataInicio = `01/01/${ano}`;
  const dataFim = `31/12/${ano}`;

  return useQuery({
    queryKey: ["vendas", ano],
    queryFn: () => fetchVendas(dataInicio, dataFim),
    staleTime: 1000 * 60 * 20, // 20 minutos de cache
    retry: 2,
  });
}

export function useVendasMultiplosAnos(anos: number[]) {
  return useQuery({
    queryKey: ["vendas-multiplos", anos],
    queryFn: async () => {
      const results = await Promise.all(
        anos.map(async (ano) => {
          const data = await fetchVendas(`01/01/${ano}`, `31/12/${ano}`);
          return { ano, data };
        })
      );
      return results;
    },
    staleTime: 1000 * 60 * 20,
    retry: 2,
  });
}
