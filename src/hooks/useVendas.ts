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

function getUltimoDiaMes(mes: number, ano: number): number {
  return new Date(ano, mes, 0).getDate();
}

/**
 * Busca vendas de um semestre (6 meses) fazendo queries mensais sequenciais
 * para não sobrecarregar o backend
 */
async function fetchVendasSemestre(ano: number, mesInicio: number, mesFim: number): Promise<VendaItem[]> {
  const resultados: VendaItem[] = [];
  for (let mes = mesInicio; mes <= mesFim; mes++) {
    const inicio = `01/${String(mes).padStart(2, '0')}/${ano}`;
    const ultimoDia = getUltimoDiaMes(mes, ano);
    const fim = `${ultimoDia}/${String(mes).padStart(2, '0')}/${ano}`;
    const dados = await fetchVendas(inicio, fim);
    resultados.push(...dados);
  }
  return resultados;
}

/**
 * Hook para buscar dados de vendas de 2 anos (ano selecionado + ano anterior)
 * Faz queries mensais sequenciais para não sobrecarregar o backend
 */
export function useVendasDoisAnos(anoSelecionado: number, enabled: boolean = true) {
  const anoAtual = anoSelecionado;
  const anoAnterior = anoSelecionado - 1;

  return useQuery({
    queryKey: ["vendas-dois-anos", anoAtual],
    queryFn: async () => {
      // Busca vendas mês a mês para cada ano (sequencial para não sobrecarregar)
      // Ano anterior: 2 semestres sequenciais
      const dadosAnoAnteriorS1 = await fetchVendasSemestre(anoAnterior, 1, 6);
      const dadosAnoAnteriorS2 = await fetchVendasSemestre(anoAnterior, 7, 12);
      const dadosAnoAnterior = [...dadosAnoAnteriorS1, ...dadosAnoAnteriorS2];

      // Ano atual: 2 semestres sequenciais
      const dadosAnoAtualS1 = await fetchVendasSemestre(anoAtual, 1, 6);
      const dadosAnoAtualS2 = await fetchVendasSemestre(anoAtual, 7, 12);
      const dadosAnoAtual = [...dadosAnoAtualS1, ...dadosAnoAtualS2];

      // Devoluções são leves, busca anual em paralelo
      const [devExtraAnoAtual, devExtraAnoAnterior] = await Promise.all([
        fetchDevolucoesExtra(`01/01/${anoAtual}`, `31/12/${anoAtual}`),
        fetchDevolucoesExtra(`01/01/${anoAnterior}`, `31/12/${anoAnterior}`),
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 2,
    refetchOnWindowFocus: false,
    enabled,
  });
}
