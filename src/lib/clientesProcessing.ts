import type { VendaItem } from "@/types/venda";
import type {
  ClienteAnalise,
  ClienteAPI,
  FrequenciaCompraData,
  ClientesNovosRecorrentesData,
  ChurnAnaliseData,
  ChurnClienteData,
} from "@/types/cliente";

/**
 * Agrupa dados de vendas por cliente e calcula métricas
 */
function agruparPorCliente(data: VendaItem[]): Map<number, {
  codigo: number;
  nome: string;
  faturamento: number;
  notas: Set<string>;
  margem: number;
  ultimaCompra: Date;
}> {
  const clientes = new Map<number, {
    codigo: number;
    nome: string;
    faturamento: number;
    notas: Set<string>;
    margem: number;
    ultimaCompra: Date;
  }>();

  // Filtra apenas vendas (não devoluções)
  const vendas = data.filter((v) => v["Flag Tipo"]?.trim() === "V");

  for (const venda of vendas) {
    const codigo = venda["Cód. Cli"];
    if (!codigo) continue;

    const existing = clientes.get(codigo);
    const dataVenda = parseDataVenda(venda.Data);

    if (existing) {
      existing.faturamento += venda["Total Merc."] || 0;
      existing.notas.add(venda.Nota);
      existing.margem += venda["$ Margem"] || 0;
      if (dataVenda > existing.ultimaCompra) {
        existing.ultimaCompra = dataVenda;
      }
    } else {
      clientes.set(codigo, {
        codigo,
        nome: venda.Cliente || `Cliente ${codigo}`,
        faturamento: venda["Total Merc."] || 0,
        notas: new Set([venda.Nota]),
        margem: venda["$ Margem"] || 0,
        ultimaCompra: dataVenda,
      });
    }
  }

  return clientes;
}

/**
 * Converte string de data "DD/MM/YYYY" para Date
 */
function parseDataVenda(dataStr: string): Date {
  if (!dataStr) return new Date(0);
  const parts = dataStr.split("/");
  if (parts.length !== 3) return new Date(0);
  const [dia, mes, ano] = parts.map(Number);
  return new Date(ano, mes - 1, dia);
}

/**
 * Converte ClienteAPI para ClienteAnalise (sem dados de vendas)
 */
export function mapClienteAPIToAnalise(cliente: ClienteAPI): ClienteAnalise {
  return {
    codigo: cliente["Cod. Cli"],
    nome: cliente.Cliente,
    faturamento: 0,
    quantidadeNotas: 0,
    ticketMedio: 0,
    margem: 0,
    margemPercentual: 0,
    atividade: cliente.Atividade,
    regiao: cliente.Regiao,
    categoria: cliente.Categoria || undefined,
    ultimaCompra: cliente["Ult.Compra"] ? new Date(cliente["Ult.Compra"]) : undefined,
    dataCadastro: cliente["Data Cad."] ? new Date(cliente["Data Cad."]) : undefined,
    situacao: cliente.Situacao,
    uf: cliente.UF,
    cidade: cliente.Cidade,
  };
}

/**
 * Calcula os top N clientes por faturamento
 */
export function calcularTopClientesDetalhado(
  data: VendaItem[],
  limite = 10
): ClienteAnalise[] {
  const clientes = agruparPorCliente(data);

  const resultado: ClienteAnalise[] = [];

  for (const cliente of clientes.values()) {
    const quantidadeNotas = cliente.notas.size;
    resultado.push({
      codigo: cliente.codigo,
      nome: cliente.nome,
      faturamento: cliente.faturamento,
      quantidadeNotas,
      ticketMedio: quantidadeNotas > 0 ? cliente.faturamento / quantidadeNotas : 0,
      margem: cliente.margem,
      margemPercentual: cliente.faturamento > 0
        ? (cliente.margem / cliente.faturamento) * 100
        : 0,
    });
  }

  return resultado
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, limite);
}

/**
 * Enriquece clientes de vendas com dados da API de cadastro
 */
export function enriquecerClientesComAPI(
  clientesVendas: ClienteAnalise[],
  clientesAPI: ClienteAPI[]
): ClienteAnalise[] {
  const mapAPI = new Map(clientesAPI.map((c) => [c["Cod. Cli"], c]));

  return clientesVendas.map((cliente) => {
    const dadosAPI = mapAPI.get(cliente.codigo);
    if (dadosAPI) {
      return {
        ...cliente,
        atividade: dadosAPI.Atividade,
        regiao: dadosAPI.Regiao,
        categoria: dadosAPI.Categoria || undefined,
        situacao: dadosAPI.Situacao,
        uf: dadosAPI.UF,
        cidade: dadosAPI.Cidade,
        ultimaCompra: dadosAPI["Ult.Compra"] ? new Date(dadosAPI["Ult.Compra"]) : undefined,
        dataCadastro: dadosAPI["Data Cad."] ? new Date(dadosAPI["Data Cad."]) : undefined,
      };
    }
    return cliente;
  });
}

/**
 * Calcula a frequência de compra dos clientes
 * Segmenta em: 1 compra, 2-3 compras, 4+ compras
 */
export function calcularFrequenciaCompra(data: VendaItem[]): FrequenciaCompraData[] {
  const clientes = agruparPorCliente(data);

  let ocasional = 0; // 1 compra
  let regular = 0; // 2-3 compras
  let frequente = 0; // 4+ compras

  for (const cliente of clientes.values()) {
    const qtdNotas = cliente.notas.size;
    if (qtdNotas === 1) {
      ocasional++;
    } else if (qtdNotas >= 2 && qtdNotas <= 3) {
      regular++;
    } else if (qtdNotas >= 4) {
      frequente++;
    }
  }

  const total = ocasional + regular + frequente;
  if (total === 0) {
    return [
      { frequencia: "1 compra", quantidade: 0, percentual: 0 },
      { frequencia: "2-3 compras", quantidade: 0, percentual: 0 },
      { frequencia: "4+ compras", quantidade: 0, percentual: 0 },
    ];
  }

  return [
    {
      frequencia: "1 compra",
      quantidade: ocasional,
      percentual: (ocasional / total) * 100,
    },
    {
      frequencia: "2-3 compras",
      quantidade: regular,
      percentual: (regular / total) * 100,
    },
    {
      frequencia: "4+ compras",
      quantidade: frequente,
      percentual: (frequente / total) * 100,
    },
  ];
}

/**
 * Calcula clientes novos usando Data Cad. da API
 * - Novo: cadastrado no ano de referência
 * - Existente: cadastrado antes do ano de referência
 */
export function calcularClientesNovosAPI(
  clientesAPI: ClienteAPI[],
  anoReferencia: number
): { novos: ClienteAPI[]; existentes: ClienteAPI[] } {
  const novos: ClienteAPI[] = [];
  const existentes: ClienteAPI[] = [];

  for (const cliente of clientesAPI) {
    if (!cliente["Data Cad."]) {
      existentes.push(cliente);
      continue;
    }
    
    const dataCad = new Date(cliente["Data Cad."]);
    if (dataCad.getFullYear() === anoReferencia) {
      novos.push(cliente);
    } else {
      existentes.push(cliente);
    }
  }

  return { novos, existentes };
}

/**
 * Calcula clientes novos vs recorrentes combinando API + vendas
 * Usa Data Cad. da API para determinar se é novo
 * Usa dados de vendas para calcular faturamento
 */
export function calcularClientesNovosRecorrentesHibrido(
  clientesAPI: ClienteAPI[],
  vendasAnoAtual: VendaItem[],
  anoReferencia: number
): ClientesNovosRecorrentesData {
  const { novos: novosAPI, existentes: existentesAPI } = calcularClientesNovosAPI(clientesAPI, anoReferencia);
  
  // Cria set de códigos de clientes novos
  const codigosNovos = new Set(novosAPI.map((c) => c["Cod. Cli"]));
  
  // Agrupa vendas por cliente
  const vendasPorCliente = agruparPorCliente(vendasAnoAtual);
  
  let novosQtd = 0;
  let novosFat = 0;
  let recorrentesQtd = 0;
  let recorrentesFat = 0;
  
  for (const [codigo, cliente] of vendasPorCliente) {
    if (codigosNovos.has(codigo)) {
      novosQtd++;
      novosFat += cliente.faturamento;
    } else {
      recorrentesQtd++;
      recorrentesFat += cliente.faturamento;
    }
  }
  
  const totalQtd = novosQtd + recorrentesQtd;
  const totalFat = novosFat + recorrentesFat;
  
  return {
    novos: {
      quantidade: novosQtd,
      faturamento: novosFat,
      percentualQtd: totalQtd > 0 ? (novosQtd / totalQtd) * 100 : 0,
      percentualFat: totalFat > 0 ? (novosFat / totalFat) * 100 : 0,
    },
    recorrentes: {
      quantidade: recorrentesQtd,
      faturamento: recorrentesFat,
      percentualQtd: totalQtd > 0 ? (recorrentesQtd / totalQtd) * 100 : 0,
      percentualFat: totalFat > 0 ? (recorrentesFat / totalFat) * 100 : 0,
    },
    total: totalQtd,
  };
}

/**
 * Calcula clientes novos vs recorrentes (versão legada usando vendas)
 * Mantida para compatibilidade
 */
export function calcularClientesNovosRecorrentes(
  dataAnoAtual: VendaItem[],
  dataAnoAnterior: VendaItem[]
): ClientesNovosRecorrentesData {
  const clientesAnoAtual = agruparPorCliente(dataAnoAtual);
  const clientesAnoAnterior = agruparPorCliente(dataAnoAnterior);

  const codigosAnoAnterior = new Set(clientesAnoAnterior.keys());

  let novosQtd = 0;
  let novosFat = 0;
  let recorrentesQtd = 0;
  let recorrentesFat = 0;

  for (const [codigo, cliente] of clientesAnoAtual) {
    if (codigosAnoAnterior.has(codigo)) {
      recorrentesQtd++;
      recorrentesFat += cliente.faturamento;
    } else {
      novosQtd++;
      novosFat += cliente.faturamento;
    }
  }

  const totalQtd = novosQtd + recorrentesQtd;
  const totalFat = novosFat + recorrentesFat;

  return {
    novos: {
      quantidade: novosQtd,
      faturamento: novosFat,
      percentualQtd: totalQtd > 0 ? (novosQtd / totalQtd) * 100 : 0,
      percentualFat: totalFat > 0 ? (novosFat / totalFat) * 100 : 0,
    },
    recorrentes: {
      quantidade: recorrentesQtd,
      faturamento: recorrentesFat,
      percentualQtd: totalQtd > 0 ? (recorrentesQtd / totalQtd) * 100 : 0,
      percentualFat: totalFat > 0 ? (recorrentesFat / totalFat) * 100 : 0,
    },
    total: totalQtd,
  };
}

/**
 * Calcula o churn de clientes usando Ult.Compra da API
 * Identifica clientes ativos que não compraram recentemente
 */
export function calcularChurnAPI(
  clientesAPI: ClienteAPI[],
  dataReferencia: Date
): ChurnAnaliseData {
  const churn3Meses: ChurnClienteData[] = [];
  const churn6Meses: ChurnClienteData[] = [];

  const limite3Meses = new Date(dataReferencia);
  limite3Meses.setMonth(limite3Meses.getMonth() - 3);

  const limite6Meses = new Date(dataReferencia);
  limite6Meses.setMonth(limite6Meses.getMonth() - 6);

  for (const cliente of clientesAPI) {
    // Ignora clientes inativos
    if (cliente.Situacao !== "A") continue;
    
    // Ignora clientes sem data de última compra
    if (!cliente["Ult.Compra"]) continue;

    const ultimaCompra = new Date(cliente["Ult.Compra"]);
    
    // Ignora datas inválidas
    if (isNaN(ultimaCompra.getTime())) continue;
    
    const diasSemCompra = Math.floor(
      (dataReferencia.getTime() - ultimaCompra.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Ignora compras futuras ou no mesmo dia
    if (diasSemCompra <= 0) continue;

    const clienteAnalise = mapClienteAPIToAnalise(cliente);

    // Churn 6+ meses (mais crítico)
    if (ultimaCompra < limite6Meses) {
      churn6Meses.push({
        cliente: clienteAnalise,
        diasSemCompra,
        ultimaCompra,
      });
    }
    // Churn 3-6 meses (em risco)
    else if (ultimaCompra < limite3Meses) {
      churn3Meses.push({
        cliente: clienteAnalise,
        diasSemCompra,
        ultimaCompra,
      });
    }
  }

  // Ordena por dias sem compra (maior primeiro)
  churn3Meses.sort((a, b) => b.diasSemCompra - a.diasSemCompra);
  churn6Meses.sort((a, b) => b.diasSemCompra - a.diasSemCompra);

  return {
    churn3Meses: {
      clientes: churn3Meses,
      quantidade: churn3Meses.length,
      faturamentoPerdido: churn3Meses.reduce((acc, c) => acc + c.cliente.faturamento, 0),
    },
    churn6Meses: {
      clientes: churn6Meses,
      quantidade: churn6Meses.length,
      faturamentoPerdido: churn6Meses.reduce((acc, c) => acc + c.cliente.faturamento, 0),
    },
  };
}

/**
 * Calcula o churn de clientes (versão legada usando vendas)
 * Mantida para compatibilidade
 */
export function calcularChurnClientes(
  dataTotal: VendaItem[],
  mesReferencia: number,
  anoReferencia: number
): ChurnAnaliseData {
  const clientes = agruparPorCliente(dataTotal);
  
  // Data de referência (último dia do mês selecionado)
  const dataRef = new Date(anoReferencia, mesReferencia, 0);
  
  // Limites para churn
  const limite3Meses = new Date(dataRef);
  limite3Meses.setMonth(limite3Meses.getMonth() - 3);
  
  const limite6Meses = new Date(dataRef);
  limite6Meses.setMonth(limite6Meses.getMonth() - 6);

  const churn3Meses: ChurnClienteData[] = [];
  const churn6Meses: ChurnClienteData[] = [];

  for (const cliente of clientes.values()) {
    const ultimaCompra = cliente.ultimaCompra;
    const diasSemCompra = Math.floor(
      (dataRef.getTime() - ultimaCompra.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Se a última compra foi antes do limite de 6 meses
    if (ultimaCompra < limite6Meses && ultimaCompra > new Date(0)) {
      churn6Meses.push({
        cliente: {
          codigo: cliente.codigo,
          nome: cliente.nome,
          faturamento: cliente.faturamento,
          quantidadeNotas: cliente.notas.size,
          ticketMedio: cliente.notas.size > 0 ? cliente.faturamento / cliente.notas.size : 0,
          margem: cliente.margem,
          margemPercentual: cliente.faturamento > 0 ? (cliente.margem / cliente.faturamento) * 100 : 0,
        },
        diasSemCompra,
        ultimaCompra,
      });
    }
    // Se a última compra foi antes do limite de 3 meses mas depois de 6 meses
    else if (ultimaCompra < limite3Meses && ultimaCompra >= limite6Meses) {
      churn3Meses.push({
        cliente: {
          codigo: cliente.codigo,
          nome: cliente.nome,
          faturamento: cliente.faturamento,
          quantidadeNotas: cliente.notas.size,
          ticketMedio: cliente.notas.size > 0 ? cliente.faturamento / cliente.notas.size : 0,
          margem: cliente.margem,
          margemPercentual: cliente.faturamento > 0 ? (cliente.margem / cliente.faturamento) * 100 : 0,
        },
        diasSemCompra,
        ultimaCompra,
      });
    }
  }

  // Ordena por faturamento perdido (maior primeiro)
  churn3Meses.sort((a, b) => b.cliente.faturamento - a.cliente.faturamento);
  churn6Meses.sort((a, b) => b.cliente.faturamento - a.cliente.faturamento);

  return {
    churn3Meses: {
      clientes: churn3Meses,
      quantidade: churn3Meses.length,
      faturamentoPerdido: churn3Meses.reduce((acc, c) => acc + c.cliente.faturamento, 0),
    },
    churn6Meses: {
      clientes: churn6Meses,
      quantidade: churn6Meses.length,
      faturamentoPerdido: churn6Meses.reduce((acc, c) => acc + c.cliente.faturamento, 0),
    },
  };
}

/**
 * Calcula estatísticas gerais de clientes
 */
export function calcularEstatisticasClientes(data: VendaItem[]) {
  const clientes = agruparPorCliente(data);
  
  let totalNotas = 0;
  for (const cliente of clientes.values()) {
    totalNotas += cliente.notas.size;
  }

  const totalClientes = clientes.size;
  const taxaRecompraMedia = totalClientes > 0 ? totalNotas / totalClientes : 0;

  return {
    totalClientesAtivos: totalClientes,
    taxaRecompraMedia,
  };
}
