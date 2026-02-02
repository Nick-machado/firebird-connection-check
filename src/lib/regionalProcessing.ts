import type { VendaItem } from "@/types/venda";
import { separarVendasDevolucoes } from "./dataProcessing";

export interface DadosRegionais {
  uf: string;
  regiao: string;
  faturamento: number;
  margem: number;
  margemPercentual: number;
  quantidade: number;
  notas: number;
  variacaoMoM?: number;
  variacaoYoY?: number;
}

export interface DadosAgrupados {
  nome: string;
  faturamento: number;
  margem: number;
  margemPercentual: number;
  quantidade: number;
  notas: number;
  variacaoMoM?: number;
  variacaoYoY?: number;
}

export interface CanalPorRegiao {
  regiao: string;
  canal: string;
  faturamento: number;
  percentual: number;
}

// Mapeamento de UF para Região
const UF_REGIAO: Record<string, string> = {
  AC: "Norte",
  AM: "Norte",
  AP: "Norte",
  PA: "Norte",
  RO: "Norte",
  RR: "Norte",
  TO: "Norte",
  AL: "Nordeste",
  BA: "Nordeste",
  CE: "Nordeste",
  MA: "Nordeste",
  PB: "Nordeste",
  PE: "Nordeste",
  PI: "Nordeste",
  RN: "Nordeste",
  SE: "Nordeste",
  DF: "Centro-Oeste",
  GO: "Centro-Oeste",
  MS: "Centro-Oeste",
  MT: "Centro-Oeste",
  ES: "Sudeste",
  MG: "Sudeste",
  RJ: "Sudeste",
  SP: "Sudeste",
  PR: "Sul",
  RS: "Sul",
  SC: "Sul",
};

export function getRegiaoFromUF(uf: string): string {
  return UF_REGIAO[uf.trim().toUpperCase()] || "Outros";
}

// Calcula dados por UF usando Faturamento Líquido (vendas - devoluções)
export function calcularDadosPorUF(data: VendaItem[]): DadosRegionais[] {
  const { vendas, devolucoes } = separarVendasDevolucoes(data);

  const porUF = new Map<string, {
    faturamentoVendas: number;
    faturamentoDevolucoes: number;
    margem: number;
    quantidade: number;
    notas: Set<string>;
    regiao: string;
  }>();

  // Processa vendas
  vendas.forEach((item) => {
    const uf = item.UF?.trim().toUpperCase() || "XX";
    const atual = porUF.get(uf) || {
      faturamentoVendas: 0,
      faturamentoDevolucoes: 0,
      margem: 0,
      quantidade: 0,
      notas: new Set(),
      regiao: getRegiaoFromUF(uf),
    };

    atual.faturamentoVendas += item["Total NF"] || 0;
    atual.margem += item["$ Margem"] || 0;
    atual.quantidade += item["Quant."] || 0;
    if (item.Nota) atual.notas.add(item.Nota.trim());
    
    porUF.set(uf, atual);
  });

  // Processa devoluções
  devolucoes.forEach((item) => {
    const uf = item.UF?.trim().toUpperCase() || "XX";
    const atual = porUF.get(uf) || {
      faturamentoVendas: 0,
      faturamentoDevolucoes: 0,
      margem: 0,
      quantidade: 0,
      notas: new Set(),
      regiao: getRegiaoFromUF(uf),
    };

    atual.faturamentoDevolucoes += Math.abs(item["Total NF"] || 0);
    
    porUF.set(uf, atual);
  });

  const resultado: DadosRegionais[] = [];
  porUF.forEach((dados, uf) => {
    const faturamentoLiquido = dados.faturamentoVendas - dados.faturamentoDevolucoes;
    resultado.push({
      uf,
      regiao: dados.regiao,
      faturamento: faturamentoLiquido,
      margem: dados.margem,
      margemPercentual: faturamentoLiquido > 0 ? (dados.margem / faturamentoLiquido) * 100 : 0,
      quantidade: dados.quantidade,
      notas: dados.notas.size,
    });
  });

  return resultado.sort((a, b) => b.faturamento - a.faturamento);
}

// Calcula dados por Região
export function calcularDadosPorRegiao(data: VendaItem[]): DadosAgrupados[] {
  const dadosUF = calcularDadosPorUF(data);
  
  const porRegiao = new Map<string, {
    faturamento: number;
    margem: number;
    quantidade: number;
    notas: number;
  }>();

  dadosUF.forEach((item) => {
    const atual = porRegiao.get(item.regiao) || {
      faturamento: 0,
      margem: 0,
      quantidade: 0,
      notas: 0,
    };

    atual.faturamento += item.faturamento;
    atual.margem += item.margem;
    atual.quantidade += item.quantidade;
    atual.notas += item.notas;
    
    porRegiao.set(item.regiao, atual);
  });

  const resultado: DadosAgrupados[] = [];
  porRegiao.forEach((dados, nome) => {
    resultado.push({
      nome,
      faturamento: dados.faturamento,
      margem: dados.margem,
      margemPercentual: dados.faturamento > 0 ? (dados.margem / dados.faturamento) * 100 : 0,
      quantidade: dados.quantidade,
      notas: dados.notas,
    });
  });

  return resultado.sort((a, b) => b.faturamento - a.faturamento);
}

// Calcula faturamento líquido por UF (usado nas variações)
function calcularFaturamentoLiquidoPorUF(data: VendaItem[]): Map<string, number> {
  const { vendas, devolucoes } = separarVendasDevolucoes(data);
  const resultado = new Map<string, number>();

  vendas.forEach((item) => {
    const uf = item.UF?.trim().toUpperCase() || "XX";
    resultado.set(uf, (resultado.get(uf) || 0) + (item["Total NF"] || 0));
  });

  devolucoes.forEach((item) => {
    const uf = item.UF?.trim().toUpperCase() || "XX";
    resultado.set(uf, (resultado.get(uf) || 0) - Math.abs(item["Total NF"] || 0));
  });

  return resultado;
}

// Calcula variações MoM e YoY por UF usando Faturamento Líquido
export function calcularVariacoesPorUF(
  dadosAtual: VendaItem[],
  dadosMesAnterior: VendaItem[],
  dadosAnoAnterior: VendaItem[]
): Map<string, { variacaoMoM: number; variacaoYoY: number }> {
  const faturamentoAtual = calcularFaturamentoLiquidoPorUF(dadosAtual);
  const faturamentoMesAnterior = calcularFaturamentoLiquidoPorUF(dadosMesAnterior);
  const faturamentoAnoAnterior = calcularFaturamentoLiquidoPorUF(dadosAnoAnterior);

  const resultado = new Map<string, { variacaoMoM: number; variacaoYoY: number }>();
  
  faturamentoAtual.forEach((valorAtual, uf) => {
    const valorMesAnterior = faturamentoMesAnterior.get(uf) || 0;
    const valorAnoAnterior = faturamentoAnoAnterior.get(uf) || 0;

    const variacaoMoM = valorMesAnterior > 0 
      ? ((valorAtual - valorMesAnterior) / valorMesAnterior) * 100 
      : valorAtual > 0 ? 100 : 0;
    
    const variacaoYoY = valorAnoAnterior > 0 
      ? ((valorAtual - valorAnoAnterior) / valorAnoAnterior) * 100 
      : valorAtual > 0 ? 100 : 0;

    resultado.set(uf, { variacaoMoM, variacaoYoY });
  });

  return resultado;
}

// Calcula faturamento líquido por Região (usado nas variações)
function calcularFaturamentoLiquidoPorRegiao(data: VendaItem[]): Map<string, number> {
  const { vendas, devolucoes } = separarVendasDevolucoes(data);
  const resultado = new Map<string, number>();

  vendas.forEach((item) => {
    const uf = item.UF?.trim().toUpperCase() || "XX";
    const regiao = getRegiaoFromUF(uf);
    resultado.set(regiao, (resultado.get(regiao) || 0) + (item["Total NF"] || 0));
  });

  devolucoes.forEach((item) => {
    const uf = item.UF?.trim().toUpperCase() || "XX";
    const regiao = getRegiaoFromUF(uf);
    resultado.set(regiao, (resultado.get(regiao) || 0) - Math.abs(item["Total NF"] || 0));
  });

  return resultado;
}

// Calcula variações MoM e YoY por Região usando Faturamento Líquido
export function calcularVariacoesPorRegiao(
  dadosAtual: VendaItem[],
  dadosMesAnterior: VendaItem[],
  dadosAnoAnterior: VendaItem[]
): Map<string, { variacaoMoM: number; variacaoYoY: number }> {
  const faturamentoAtual = calcularFaturamentoLiquidoPorRegiao(dadosAtual);
  const faturamentoMesAnterior = calcularFaturamentoLiquidoPorRegiao(dadosMesAnterior);
  const faturamentoAnoAnterior = calcularFaturamentoLiquidoPorRegiao(dadosAnoAnterior);

  const resultado = new Map<string, { variacaoMoM: number; variacaoYoY: number }>();
  
  faturamentoAtual.forEach((valorAtual, regiao) => {
    const valorMesAnterior = faturamentoMesAnterior.get(regiao) || 0;
    const valorAnoAnterior = faturamentoAnoAnterior.get(regiao) || 0;

    const variacaoMoM = valorMesAnterior > 0 
      ? ((valorAtual - valorMesAnterior) / valorMesAnterior) * 100 
      : valorAtual > 0 ? 100 : 0;
    
    const variacaoYoY = valorAnoAnterior > 0 
      ? ((valorAtual - valorAnoAnterior) / valorAnoAnterior) * 100 
      : valorAtual > 0 ? 100 : 0;

    resultado.set(regiao, { variacaoMoM, variacaoYoY });
  });

  return resultado;
}

// Calcula canais mais fortes por UF usando Faturamento Líquido
export function calcularCanaisPorUF(data: VendaItem[]): Map<string, CanalPorRegiao[]> {
  const { vendas, devolucoes } = separarVendasDevolucoes(data);

  const porUFCanal = new Map<string, Map<string, number>>();
  const totalPorUF = new Map<string, number>();

  // Processa vendas
  vendas.forEach((item) => {
    const uf = item.UF?.trim().toUpperCase() || "XX";
    const canal = item.Atividade?.trim() || "Outros";
    const valor = item["Total NF"] || 0;

    if (!porUFCanal.has(uf)) {
      porUFCanal.set(uf, new Map());
    }
    const canaisUF = porUFCanal.get(uf)!;
    canaisUF.set(canal, (canaisUF.get(canal) || 0) + valor);
    
    totalPorUF.set(uf, (totalPorUF.get(uf) || 0) + valor);
  });

  // Subtrai devoluções
  devolucoes.forEach((item) => {
    const uf = item.UF?.trim().toUpperCase() || "XX";
    const canal = item.Atividade?.trim() || "Outros";
    const valor = Math.abs(item["Total NF"] || 0);

    if (porUFCanal.has(uf)) {
      const canaisUF = porUFCanal.get(uf)!;
      canaisUF.set(canal, (canaisUF.get(canal) || 0) - valor);
    }
    
    totalPorUF.set(uf, (totalPorUF.get(uf) || 0) - valor);
  });

  const resultado = new Map<string, CanalPorRegiao[]>();
  
  porUFCanal.forEach((canais, uf) => {
    const total = Math.abs(totalPorUF.get(uf) || 1);
    const canaisOrdenados: CanalPorRegiao[] = [];
    
    canais.forEach((faturamento, canal) => {
      canaisOrdenados.push({
        regiao: uf,
        canal,
        faturamento,
        percentual: total > 0 ? (faturamento / total) * 100 : 0,
      });
    });
    
    resultado.set(uf, canaisOrdenados.sort((a, b) => b.faturamento - a.faturamento));
  });

  return resultado;
}

// Calcula canais mais fortes por Região usando Faturamento Líquido
export function calcularCanaisPorRegiao(data: VendaItem[]): Map<string, CanalPorRegiao[]> {
  const { vendas, devolucoes } = separarVendasDevolucoes(data);

  const porRegiaoCanal = new Map<string, Map<string, number>>();
  const totalPorRegiao = new Map<string, number>();

  // Processa vendas
  vendas.forEach((item) => {
    const uf = item.UF?.trim().toUpperCase() || "XX";
    const regiao = getRegiaoFromUF(uf);
    const canal = item.Atividade?.trim() || "Outros";
    const valor = item["Total NF"] || 0;

    if (!porRegiaoCanal.has(regiao)) {
      porRegiaoCanal.set(regiao, new Map());
    }
    const canaisRegiao = porRegiaoCanal.get(regiao)!;
    canaisRegiao.set(canal, (canaisRegiao.get(canal) || 0) + valor);
    
    totalPorRegiao.set(regiao, (totalPorRegiao.get(regiao) || 0) + valor);
  });

  // Subtrai devoluções
  devolucoes.forEach((item) => {
    const uf = item.UF?.trim().toUpperCase() || "XX";
    const regiao = getRegiaoFromUF(uf);
    const canal = item.Atividade?.trim() || "Outros";
    const valor = Math.abs(item["Total NF"] || 0);

    if (porRegiaoCanal.has(regiao)) {
      const canaisRegiao = porRegiaoCanal.get(regiao)!;
      canaisRegiao.set(canal, (canaisRegiao.get(canal) || 0) - valor);
    }
    
    totalPorRegiao.set(regiao, (totalPorRegiao.get(regiao) || 0) - valor);
  });

  const resultado = new Map<string, CanalPorRegiao[]>();
  
  porRegiaoCanal.forEach((canais, regiao) => {
    const total = Math.abs(totalPorRegiao.get(regiao) || 1);
    const canaisOrdenados: CanalPorRegiao[] = [];
    
    canais.forEach((faturamento, canal) => {
      canaisOrdenados.push({
        regiao,
        canal,
        faturamento,
        percentual: total > 0 ? (faturamento / total) * 100 : 0,
      });
    });
    
    resultado.set(regiao, canaisOrdenados.sort((a, b) => b.faturamento - a.faturamento));
  });

  return resultado;
}

// Top produtos de uma UF/Região específica usando Faturamento Líquido
export function calcularTopProdutosPorLocal(
  data: VendaItem[],
  filtro: { tipo: "uf" | "regiao"; valor: string },
  limite = 5
): { nome: string; valor: number }[] {
  const { vendas, devolucoes } = separarVendasDevolucoes(data);

  const filtrarPorLocal = (item: VendaItem) => {
    if (filtro.tipo === "uf") {
      return item.UF?.trim().toUpperCase() === filtro.valor.toUpperCase();
    }
    return getRegiaoFromUF(item.UF?.trim() || "") === filtro.valor;
  };

  const vendasFiltradas = vendas.filter(filtrarPorLocal);
  const devolucoesFiltradas = devolucoes.filter(filtrarPorLocal);

  const porProduto = new Map<string, number>();
  
  vendasFiltradas.forEach((item) => {
    const produto = item.Produto?.trim() || "Sem nome";
    porProduto.set(produto, (porProduto.get(produto) || 0) + (item["Total NF"] || 0));
  });

  devolucoesFiltradas.forEach((item) => {
    const produto = item.Produto?.trim() || "Sem nome";
    porProduto.set(produto, (porProduto.get(produto) || 0) - Math.abs(item["Total NF"] || 0));
  });

  const resultado: { nome: string; valor: number }[] = [];
  porProduto.forEach((valor, nome) => {
    resultado.push({ nome, valor });
  });

  return resultado.sort((a, b) => b.valor - a.valor).slice(0, limite);
}

// Top clientes de uma UF/Região específica usando Faturamento Líquido
export function calcularTopClientesPorLocal(
  data: VendaItem[],
  filtro: { tipo: "uf" | "regiao"; valor: string },
  limite = 5
): { nome: string; valor: number }[] {
  const { vendas, devolucoes } = separarVendasDevolucoes(data);

  const filtrarPorLocal = (item: VendaItem) => {
    if (filtro.tipo === "uf") {
      return item.UF?.trim().toUpperCase() === filtro.valor.toUpperCase();
    }
    return getRegiaoFromUF(item.UF?.trim() || "") === filtro.valor;
  };

  const vendasFiltradas = vendas.filter(filtrarPorLocal);
  const devolucoesFiltradas = devolucoes.filter(filtrarPorLocal);

  const porCliente = new Map<string, number>();
  
  vendasFiltradas.forEach((item) => {
    const cliente = item.Cliente?.trim() || "Sem cliente";
    porCliente.set(cliente, (porCliente.get(cliente) || 0) + (item["Total NF"] || 0));
  });

  devolucoesFiltradas.forEach((item) => {
    const cliente = item.Cliente?.trim() || "Sem cliente";
    porCliente.set(cliente, (porCliente.get(cliente) || 0) - Math.abs(item["Total NF"] || 0));
  });

  const resultado: { nome: string; valor: number }[] = [];
  porCliente.forEach((valor, nome) => {
    resultado.push({ nome, valor });
  });

  return resultado.sort((a, b) => b.valor - a.valor).slice(0, limite);
}

// Calcula o range de valores para gradiente de cor
export function calcularRangeValores(dados: DadosRegionais[] | DadosAgrupados[], metrica: "faturamento" | "margem" | "quantidade"): { min: number; max: number } {
  if (dados.length === 0) return { min: 0, max: 0 };

  const valores = dados.map((d) => d[metrica]);
  return {
    min: Math.min(...valores),
    max: Math.max(...valores),
  };
}

// Calcula cor baseada no valor (gradiente verde)
export function calcularCorGradiente(valor: number, min: number, max: number): string {
  if (max === min) return "hsl(142, 76%, 50%)";
  
  const normalizado = (valor - min) / (max - min);
  // De cinza claro (sem vendas) até verde escuro (mais vendas)
  const lightness = 90 - normalizado * 50; // 90% -> 40%
  const saturation = 20 + normalizado * 60; // 20% -> 80%
  
  return `hsl(142, ${saturation}%, ${lightness}%)`;
}
