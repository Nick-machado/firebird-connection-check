import type { VendaItem } from "@/types/venda";
import { separarVendasDevolucoes } from "./dataProcessing";

export interface ProdutoPorAtividade {
  atividade: string;
  produtos: ProdutoResumo[];
}

export interface ProdutoResumo {
  nome: string;
  faturamento: number;
  margem: number;
  margemPercentual: number;
  quantidade: number;
}

export interface ProdutoCrescimento {
  nome: string;
  faturamentoAtual: number;
  faturamentoAnterior: number;
  variacao: number; // percentual
  diferencaAbsoluta: number;
}

/**
 * Top produtos agrupados por atividade
 */
export function calcularTopProdutosPorAtividade(
  data: VendaItem[],
  limitePorAtividade = 10
): ProdutoPorAtividade[] {
  const { vendas } = separarVendasDevolucoes(data);

  const porAtividade = new Map<
    string,
    Map<string, { faturamento: number; margem: number; quantidade: number }>
  >();

  vendas.forEach((item) => {
    const atividade = item.Atividade?.trim() || "Outros";
    const produto = item.Produto?.trim() || "Sem nome";

    if (!porAtividade.has(atividade)) {
      porAtividade.set(atividade, new Map());
    }

    const produtosMap = porAtividade.get(atividade)!;
    const atual = produtosMap.get(produto) || { faturamento: 0, margem: 0, quantidade: 0 };
    produtosMap.set(produto, {
      faturamento: atual.faturamento + (item["Total NF"] || 0),
      margem: atual.margem + (item["$ Margem"] || 0),
      quantidade: atual.quantidade + (item["Quant."] || 0),
    });
  });

  const resultado: ProdutoPorAtividade[] = [];

  porAtividade.forEach((produtosMap, atividade) => {
    const produtos: ProdutoResumo[] = [];
    produtosMap.forEach((dados, nome) => {
      produtos.push({
        nome,
        faturamento: dados.faturamento,
        margem: dados.margem,
        margemPercentual: dados.faturamento > 0 ? (dados.margem / dados.faturamento) * 100 : 0,
        quantidade: dados.quantidade,
      });
    });

    produtos.sort((a, b) => b.faturamento - a.faturamento);

    resultado.push({
      atividade,
      produtos: produtos.slice(0, limitePorAtividade),
    });
  });

  // Ordena atividades pelo total de faturamento
  resultado.sort((a, b) => {
    const totalA = a.produtos.reduce((s, p) => s + p.faturamento, 0);
    const totalB = b.produtos.reduce((s, p) => s + p.faturamento, 0);
    return totalB - totalA;
  });

  return resultado;
}

/**
 * Margem de faturamento por produto (todos os produtos, top N)
 */
export function calcularMargemPorProduto(
  data: VendaItem[],
  limite = 20
): ProdutoResumo[] {
  const { vendas } = separarVendasDevolucoes(data);

  const porProduto = new Map<string, { faturamento: number; margem: number; quantidade: number }>();

  vendas.forEach((item) => {
    const produto = item.Produto?.trim() || "Sem nome";
    const atual = porProduto.get(produto) || { faturamento: 0, margem: 0, quantidade: 0 };
    porProduto.set(produto, {
      faturamento: atual.faturamento + (item["Total NF"] || 0),
      margem: atual.margem + (item["$ Margem"] || 0),
      quantidade: atual.quantidade + (item["Quant."] || 0),
    });
  });

  const resultado: ProdutoResumo[] = [];
  porProduto.forEach((dados, nome) => {
    resultado.push({
      nome,
      faturamento: dados.faturamento,
      margem: dados.margem,
      margemPercentual: dados.faturamento > 0 ? (dados.margem / dados.faturamento) * 100 : 0,
      quantidade: dados.quantidade,
    });
  });

  return resultado.sort((a, b) => b.faturamento - a.faturamento).slice(0, limite);
}

/**
 * Produtos com maior crescimento e queda (comparação entre períodos)
 * Exige faturamento mínimo para evitar ruído de produtos muito pequenos
 */
export function calcularCrescimentoProdutos(
  dadosAtual: VendaItem[],
  dadosAnterior: VendaItem[],
  limite = 10,
  faturamentoMinimo = 1000
): { crescimento: ProdutoCrescimento[]; queda: ProdutoCrescimento[] } {
  const { vendas: vendasAtual } = separarVendasDevolucoes(dadosAtual);
  const { vendas: vendasAnterior } = separarVendasDevolucoes(dadosAnterior);

  const fatAtual = new Map<string, number>();
  const fatAnterior = new Map<string, number>();

  vendasAtual.forEach((item) => {
    const produto = item.Produto?.trim() || "Sem nome";
    fatAtual.set(produto, (fatAtual.get(produto) || 0) + (item["Total NF"] || 0));
  });

  vendasAnterior.forEach((item) => {
    const produto = item.Produto?.trim() || "Sem nome";
    fatAnterior.set(produto, (fatAnterior.get(produto) || 0) + (item["Total NF"] || 0));
  });

  // Combina todos os produtos
  const todosProdutos = new Set([...fatAtual.keys(), ...fatAnterior.keys()]);
  const comparacoes: ProdutoCrescimento[] = [];

  todosProdutos.forEach((nome) => {
    const atual = fatAtual.get(nome) || 0;
    const anterior = fatAnterior.get(nome) || 0;

    // Filtro de relevância
    if (atual < faturamentoMinimo && anterior < faturamentoMinimo) return;

    const variacao = anterior > 0 ? ((atual - anterior) / anterior) * 100 : atual > 0 ? 100 : 0;

    comparacoes.push({
      nome,
      faturamentoAtual: atual,
      faturamentoAnterior: anterior,
      variacao,
      diferencaAbsoluta: atual - anterior,
    });
  });

  // Top crescimento (maior variação positiva)
  const crescimento = comparacoes
    .filter((p) => p.variacao > 0)
    .sort((a, b) => b.variacao - a.variacao)
    .slice(0, limite);

  // Top queda (maior variação negativa)
  const queda = comparacoes
    .filter((p) => p.variacao < 0)
    .sort((a, b) => a.variacao - b.variacao)
    .slice(0, limite);

  return { crescimento, queda };
}
