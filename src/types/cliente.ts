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
  "Ult.Compra": string; // ISO date string
  "Data Cad.": string; // ISO date string
  Situacao: "A" | "I";
  Categoria: string | null;
  Regiao: string;
}

/**
 * Análise detalhada de cliente com métricas de vendas
 */
export interface ClienteAnalise {
  codigo: number;
  nome: string;
  faturamento: number;
  quantidadeNotas: number;
  ticketMedio: number;
  margem: number;
  margemPercentual: number;
  // Campos extras da API de clientes
  atividade?: string;
  regiao?: string;
  categoria?: string;
  ultimaCompra?: Date;
  dataCadastro?: Date;
  situacao?: "A" | "I";
  uf?: string;
  cidade?: string;
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
