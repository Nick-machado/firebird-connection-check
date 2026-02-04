import type {
  ClienteAPI,
  ClienteAnalise,
  ClienteStatus,
  ClientesStatusData,
} from "@/types/cliente";
import { parseLocalDate, diffInDays } from "@/lib/dateUtils";

/**
 * Converte ClienteAPI para ClienteAnalise com status calculado
 */
export function mapClienteAPIToAnalise(
  cliente: ClienteAPI,
  dataReferencia: Date = new Date()
): ClienteAnalise {
  const ultimaCompra = parseLocalDate(cliente["Últ.Compra"]);
  const diasSemCompra = ultimaCompra
    ? diffInDays(ultimaCompra, dataReferencia)
    : 9999;

  let status: ClienteStatus = "inativo";
  if (diasSemCompra <= 90) {
    status = "ativo";
  } else if (diasSemCompra <= 180) {
    status = "em_risco";
  }

  return {
    codigo: cliente["Cód. Cli"],
    nome: cliente.Cliente,
    faturamento: 0,
    quantidadeNotas: 0,
    ticketMedio: 0,
    margem: 0,
    margemPercentual: 0,
    atividade: cliente.Atividade,
    regiao: cliente.Regiao,
    categoria: cliente.Categoria || undefined,
    ultimaCompra,
    dataCadastro: parseLocalDate(cliente["Data Cad."]),
    situacao: cliente.Situacao,
    uf: cliente.UF,
    cidade: cliente.Cidade,
    email: cliente.Email,
    status,
    diasSemCompra,
  };
}

/**
 * Classifica clientes por status de atividade
 * - Ativo: comprou nos últimos 3 meses (90 dias)
 * - Em Risco: não comprou entre 3-6 meses (91-180 dias)
 * - Inativo: não comprou há mais de 6 meses (181+ dias)
 */
export function classificarClientesPorStatus(
  clientesAPI: ClienteAPI[],
  dataReferencia: Date = new Date()
): ClientesStatusData {
  const ativos: ClienteAnalise[] = [];
  const emRisco: ClienteAnalise[] = [];
  const inativos: ClienteAnalise[] = [];

  for (const cliente of clientesAPI) {
    const clienteAnalise = mapClienteAPIToAnalise(cliente, dataReferencia);

    switch (clienteAnalise.status) {
      case "ativo":
        ativos.push(clienteAnalise);
        break;
      case "em_risco":
        emRisco.push(clienteAnalise);
        break;
      case "inativo":
        inativos.push(clienteAnalise);
        break;
    }
  }

  // Ordena por dias sem compra (menor primeiro para ativos, maior primeiro para inativos)
  ativos.sort((a, b) => (a.diasSemCompra || 0) - (b.diasSemCompra || 0));
  emRisco.sort((a, b) => (a.diasSemCompra || 0) - (b.diasSemCompra || 0));
  inativos.sort((a, b) => (a.diasSemCompra || 0) - (b.diasSemCompra || 0));

  return {
    ativos: {
      clientes: ativos,
      quantidade: ativos.length,
    },
    emRisco: {
      clientes: emRisco,
      quantidade: emRisco.length,
    },
    inativos: {
      clientes: inativos,
      quantidade: inativos.length,
    },
    total: ativos.length + emRisco.length + inativos.length,
  };
}

/**
 * Filtra clientes por equipe/região
 */
export function filtrarClientesPorEquipe(
  clientes: ClienteAPI[],
  equipe: string,
  allowedEquipes?: string[]
): ClienteAPI[] {
  if (equipe === "TODAS" && !allowedEquipes) {
    return clientes;
  }

  if (equipe === "TODAS" && allowedEquipes) {
    // Filtra por região baseado nas equipes permitidas
    return clientes.filter((c) => {
      const regiao = c.Regiao?.toUpperCase() || "";
      return allowedEquipes.some((eq) => {
        // Mapeia equipes para regiões quando possível
        if (eq === "VAREJO" || eq === "INDUSTRIAL") {
          return true; // Não há mapeamento direto, mostra todos
        }
        if (eq.includes("EXPORTAÇÃO")) {
          return regiao.includes("EXPORT") || regiao.includes("INTERNACIONAL");
        }
        return false;
      });
    });
  }

  // Filtro específico por equipe - usa região como proxy
  // Como não temos equipe no cliente, filtramos por categoria ou atividade
  return clientes;
}

/**
 * Formata a data da última compra para exibição
 */
export function formatarUltimaCompra(data: Date | undefined): string {
  if (!data) return "Nunca";
  
  const agora = new Date();
  const dias = Math.floor((agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
  
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Ontem";
  if (dias < 7) return `${dias} dias atrás`;
  if (dias < 30) return `${Math.floor(dias / 7)} semanas atrás`;
  if (dias < 365) {
    const meses = Math.floor(dias / 30);
    return `${meses} ${meses === 1 ? "mês" : "meses"} atrás`;
  }
  const anos = Math.floor(dias / 365);
  return `${anos} ${anos === 1 ? "ano" : "anos"} atrás`;
}

/**
 * Retorna a cor do badge baseado no status
 */
export function getStatusColor(status: ClienteStatus): string {
  switch (status) {
    case "ativo":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "em_risco":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "inativo":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * Retorna o label do status
 */
export function getStatusLabel(status: ClienteStatus): string {
  switch (status) {
    case "ativo":
      return "Ativo";
    case "em_risco":
      return "Em Risco";
    case "inativo":
      return "Inativo";
    default:
      return "Desconhecido";
  }
}
