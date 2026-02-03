import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/constants";
import type { ClienteAPI } from "@/types/cliente";

/**
 * Hook para buscar todos os clientes da API
 */
export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/clientes`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar clientes: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido ao buscar clientes");
      }
      return result.data as ClienteAPI[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
}

/**
 * Hook para buscar clientes com última compra no período (para análise de churn)
 */
export function useClientesUltimaCompra(dataInicio: string, dataFim: string) {
  return useQuery({
    queryKey: ["clientes-ultima-compra", dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams({ dataInicio, dataFim });
      const response = await fetch(`${API_URL}/api/clientes/ultima-compra?${params}`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar clientes: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido ao buscar clientes");
      }
      return result.data as ClienteAPI[];
    },
    staleTime: 1000 * 60 * 20, // 20 minutos
    enabled: !!dataInicio && !!dataFim,
  });
}
