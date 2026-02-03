/**
 * Tipo para cliente retornado pela API de cadastro
 */
export interface ClienteAPI {
  "Cod. Cli": number;
  Cliente: string;
  Atividade: string;
  UF: string;
  Cidade: string;
  Email: string;
  "Últ.Compra": string; // ISO date string (note: com acento)
  "Data Cad.": string; // ISO date string
  Situacao: "A" | "I";
  Categoria: string | null;
  Regiao: string;
}

/**
 * Tipo para venda retornada pela API de vendas do cliente
 */
export interface VendaClienteAPI {
  Id: number;
  Data: string;
  Nota: string;
  Produto: string;
  "Cód. Prod": string;
  Quant: number;
  "Valor Unit.": number;
  "Total NF": number;
  "Total Merc.": number;
  "$ Margem": number;
  "Mg.Líq": number;
  Categoria: string;
  Subgrupo: string;
  Vendedor: string;
  Equipe: string;
}

/**
 * Status de atividade do cliente baseado na última compra
 */
export type ClienteStatus = "ativo" | "em_risco" | "inativo";

/**
 * Análise detalhada de cliente com métricas e status
 */
export interface ClienteAnalise {
  codigo: number;
  nome: string;
  faturamento: number;
  quantidadeNotas: number;
  ticketMedio: number;
  margem: number;
  margemPercentual: number;
  // Campos da API de clientes
  atividade?: string;
  regiao?: string;
  categoria?: string;
  ultimaCompra?: Date;
  dataCadastro?: Date;
  situacao?: "A" | "I";
  uf?: string;
  cidade?: string;
  email?: string;
  // Status calculado
  status?: ClienteStatus;
  diasSemCompra?: number;
}

/**
 * Dados de classificação de clientes por status
 */
export interface ClientesStatusData {
  ativos: {
    clientes: ClienteAnalise[];
    quantidade: number;
  };
  emRisco: {
    clientes: ClienteAnalise[];
    quantidade: number;
  };
  inativos: {
    clientes: ClienteAnalise[];
    quantidade: number;
  };
  total: number;
}

export interface FrequenciaCompraData {
  frequencia: string;
  quantidade: number;
  percentual: number;
}

/**
 * Dados de clientes novos vs recorrentes (versão híbrida)
 */
export interface ClientesNovosRecorrentesData {
  novos: {
    quantidade: number;
    faturamento: number;
    percentualQtd: number;
    percentualFat: number;
  };
  recorrentes: {
    quantidade: number;
    faturamento: number;
    percentualQtd: number;
    percentualFat: number;
  };
  total: number;
}

export interface ChurnClienteData {
  cliente: ClienteAnalise;
  diasSemCompra: number;
  ultimaCompra: Date;
}

export interface ChurnAnaliseData {
  churn3Meses: {
    clientes: ChurnClienteData[];
    quantidade: number;
    faturamentoPerdido: number;
  };
  churn6Meses: {
    clientes: ChurnClienteData[];
    quantidade: number;
    faturamentoPerdido: number;
  };
}
