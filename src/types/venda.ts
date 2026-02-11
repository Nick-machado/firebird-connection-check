export interface VendaItem {
  Data: string;
  Empresa: number;
  Nota: string;
  "Tipo Movimento": string;
  "Cód. Cli": number;
  Cliente: string;
  "Cód. Prod": string;
  Produto: string;
  "Quant.": number;
  "Valor Unit.": number;
  "Desconto.": number;
  "Total Desc.": number;
  "Total NF": number;
  "Total Merc.": number;
  "Vlr.ICM": number;
  "Part.Dest.": number;
  "Vlr.Pis/Cofins": number;
  "Vlr.Frete": number;
  "Vlr.Comissão": number;
  "Vlr.ZF": number;
  "Vlr.Líquido": number;
  "Vlr.CMV": number;
  "$ Margem": number;
  "Mg.Líq": number;
  "Mg.Bruta": number;
  "Vlr.IPI": number;
  Categoria: string;
  Atividade: string;
  Região: string;
  Grupo: string;
  Subgrupo: string;
  Vendedor: string;
  Equipe: string;
  CFOP: string;
  UF: string;
  Cidade: string;
  Mês: number;
  Ano: number;
  Estoque: string;
  Marca: string;
  Id: number;
  "Flag Tipo": "V" | "D";
}

export interface KPIData {
  totalFaturado: number;
  totalDevolucoes: number;
  faturamentoLiquido: number;
  totalCMV: number;
  totalMargem: number;
  margemPercentual: number;
  ticketMedio: number;
  totalNotas: number;
}

export interface FaturamentoMensal {
  mes: number;
  mesNome: string;
  valorBruto: number;
  valorLiquido: number;
  ano: number;
}

export interface FaturamentoPorCanal {
  canal: string;
  valor: number;
  percentual: number;
}

export interface TopItem {
  nome: string;
  valor: number;
  quantidade?: number;
  margem?: number;
}

export interface DevolucaoExtraItem {
  Nota: number;
  ID: number;
  ENTREGA: string;
  Fornecedor: number;
  TOTAL_LIQ: number;
  "Referência": string;
  Equipe: string;
}

export interface FiltrosVendas {
  ano: number;
  mes: number;
  equipe: string;
}
