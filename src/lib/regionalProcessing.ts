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
}

export interface DadosAgrupados {
  nome: string;
  faturamento: number;
  margem: number;
  margemPercentual: number;
  quantidade: number;
  notas: number;
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

// Calcula dados por UF
export function calcularDadosPorUF(data: VendaItem[]): DadosRegionais[] {
  const { vendas } = separarVendasDevolucoes(data);

  const porUF = new Map<string, {
    faturamento: number;
    margem: number;
    quantidade: number;
    notas: Set<string>;
    regiao: string;
  }>();

  vendas.forEach((item) => {
    const uf = item.UF?.trim().toUpperCase() || "XX";
    const atual = porUF.get(uf) || {
      faturamento: 0,
      margem: 0,
      quantidade: 0,
      notas: new Set(),
      regiao: getRegiaoFromUF(uf),
    };

    atual.faturamento += item["Total NF"] || 0;
    atual.margem += item["$ Margem"] || 0;
    atual.quantidade += item["Quant."] || 0;
    if (item.Nota) atual.notas.add(item.Nota.trim());
    
    porUF.set(uf, atual);
  });

  const resultado: DadosRegionais[] = [];
  porUF.forEach((dados, uf) => {
    resultado.push({
      uf,
      regiao: dados.regiao,
      faturamento: dados.faturamento,
      margem: dados.margem,
      margemPercentual: dados.faturamento > 0 ? (dados.margem / dados.faturamento) * 100 : 0,
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

// Top produtos de uma UF/Região específica
export function calcularTopProdutosPorLocal(
  data: VendaItem[],
  filtro: { tipo: "uf" | "regiao"; valor: string },
  limite = 5
): { nome: string; valor: number }[] {
  const { vendas } = separarVendasDevolucoes(data);

  const vendasFiltradas = vendas.filter((item) => {
    if (filtro.tipo === "uf") {
      return item.UF?.trim().toUpperCase() === filtro.valor.toUpperCase();
    }
    return getRegiaoFromUF(item.UF?.trim() || "") === filtro.valor;
  });

  const porProduto = new Map<string, number>();
  vendasFiltradas.forEach((item) => {
    const produto = item.Produto?.trim() || "Sem nome";
    porProduto.set(produto, (porProduto.get(produto) || 0) + (item["Total NF"] || 0));
  });

  const resultado: { nome: string; valor: number }[] = [];
  porProduto.forEach((valor, nome) => {
    resultado.push({ nome, valor });
  });

  return resultado.sort((a, b) => b.valor - a.valor).slice(0, limite);
}

// Top clientes de uma UF/Região específica
export function calcularTopClientesPorLocal(
  data: VendaItem[],
  filtro: { tipo: "uf" | "regiao"; valor: string },
  limite = 5
): { nome: string; valor: number }[] {
  const { vendas } = separarVendasDevolucoes(data);

  const vendasFiltradas = vendas.filter((item) => {
    if (filtro.tipo === "uf") {
      return item.UF?.trim().toUpperCase() === filtro.valor.toUpperCase();
    }
    return getRegiaoFromUF(item.UF?.trim() || "") === filtro.valor;
  });

  const porCliente = new Map<string, number>();
  vendasFiltradas.forEach((item) => {
    const cliente = item.Cliente?.trim() || "Sem cliente";
    porCliente.set(cliente, (porCliente.get(cliente) || 0) + (item["Total NF"] || 0));
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
