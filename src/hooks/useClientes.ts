import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/constants";
import type { ClienteAPI, VendaClienteAPI } from "@/types/cliente";

/**
 * Hook para buscar todos os clientes da API
 */
export function useClientes(enabled: boolean = true) {
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
    enabled,
  });
}

/**
 * Hook para buscar vendas de um cliente específico
 */
export function useClienteVendas(clienteId: number | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ["cliente-vendas", clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const response = await fetch(`${API_URL}/api/clientes/${clienteId}/vendas`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar vendas do cliente: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido ao buscar vendas");
      }
      // Ordenar por data mais recente
      const vendas = result.data as VendaClienteAPI[];
      return vendas.sort((a, b) => 
        new Date(b.Data).getTime() - new Date(a.Data).getTime()
      );
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    enabled: !!clienteId && enabled,
  });
}
