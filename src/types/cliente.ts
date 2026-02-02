export interface ClienteAnalise {
  codigo: number;
  nome: string;
  faturamento: number;
  quantidadeNotas: number;
  ticketMedio: number;
  margem: number;
  margemPercentual: number;
}

export interface FrequenciaCompraData {
  frequencia: string;
  quantidade: number;
  percentual: number;
}

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
