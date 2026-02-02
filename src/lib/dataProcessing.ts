import type { VendaItem, KPIData, FaturamentoMensal, FaturamentoPorCanal, TopItem } from "@/types/venda";
import { getMesNome } from "./formatters";

// Filtra vendas por equipe
export function filtrarPorEquipe(data: VendaItem[], equipe: string): VendaItem[] {
  if (equipe === "TODAS") return data;
  return data.filter((item) => item.Equipe?.trim() === equipe);
}

// Filtra vendas por mês
export function filtrarPorMes(data: VendaItem[], mes: number): VendaItem[] {
  return data.filter((item) => Number(item.Mês) === mes);
}

// Separa vendas de devoluções usando o campo "Flag Tipo"
export function separarVendasDevolucoes(data: VendaItem[]) {
  const vendas = data.filter((item) => item["Flag Tipo"]?.trim() === "V");
  const devolucoes = data.filter((item) => item["Flag Tipo"]?.trim() === "D");
  return { vendas, devolucoes };
}

// Calcula KPIs principais
export function calcularKPIs(data: VendaItem[]): KPIData {
  const { vendas, devolucoes } = separarVendasDevolucoes(data);

  const totalFaturado = vendas.reduce((sum, item) => sum + (item["Total NF"] || 0), 0);
  const totalDevolucoes = Math.abs(devolucoes.reduce((sum, item) => sum + (item["Total NF"] || 0), 0));
  const faturamentoLiquido = totalFaturado - totalDevolucoes;
  const totalCMV = Math.abs(vendas.reduce((sum, item) => sum + (item["Vlr.CMV"] || 0), 0));
  const totalMargem = vendas.reduce((sum, item) => sum + (item["$ Margem"] || 0), 0);
  
  // Conta notas únicas
  const notasUnicas = new Set(vendas.map((item) => item.Nota?.trim()));
  const totalNotas = notasUnicas.size;
  
  const ticketMedio = totalNotas > 0 ? faturamentoLiquido / totalNotas : 0;
  const margemPercentual = faturamentoLiquido > 0 ? (totalMargem / faturamentoLiquido) * 100 : 0;

  return {
    totalFaturado,
    totalDevolucoes,
    faturamentoLiquido,
    totalCMV,
    totalMargem,
    margemPercentual,
    ticketMedio,
    totalNotas,
  };
}

// Calcula faturamento mensal (bruto e líquido)
export function calcularFaturamentoMensal(data: VendaItem[], ano: number): FaturamentoMensal[] {
  const { vendas, devolucoes } = separarVendasDevolucoes(data);

  const faturamentoBrutoPorMes = new Map<number, number>();
  const devolucoesPorMes = new Map<number, number>();

  // Soma vendas (bruto)
  vendas.forEach((item) => {
    const mes = Number(item.Mês);
    if (!isNaN(mes) && mes >= 1 && mes <= 12) {
      const atual = faturamentoBrutoPorMes.get(mes) || 0;
      faturamentoBrutoPorMes.set(mes, atual + (item["Total NF"] || 0));
    }
  });

  // Soma devoluções
  devolucoes.forEach((item) => {
    const mes = Number(item.Mês);
    if (!isNaN(mes) && mes >= 1 && mes <= 12) {
      const atual = devolucoesPorMes.get(mes) || 0;
      devolucoesPorMes.set(mes, atual + Math.abs(item["Total NF"] || 0));
    }
  });

  // Converte para array ordenado
  const resultado: FaturamentoMensal[] = [];
  for (let mes = 1; mes <= 12; mes++) {
    const bruto = faturamentoBrutoPorMes.get(mes) || 0;
    const devolucao = devolucoesPorMes.get(mes) || 0;
    resultado.push({
      mes,
      mesNome: getMesNome(mes),
      valorBruto: bruto,
      valorLiquido: bruto - devolucao,
      ano,
    });
  }

  return resultado;
}

// Calcula faturamento por canal (atividade)
export function calcularFaturamentoPorCanal(data: VendaItem[]): FaturamentoPorCanal[] {
  const { vendas } = separarVendasDevolucoes(data);

  const porCanal = new Map<string, number>();
  let total = 0;

  vendas.forEach((item) => {
    const canal = item.Atividade?.trim() || "Outros";
    const valor = item["Total NF"] || 0;
    porCanal.set(canal, (porCanal.get(canal) || 0) + valor);
    total += valor;
  });

  const resultado: FaturamentoPorCanal[] = [];
  porCanal.forEach((valor, canal) => {
    resultado.push({
      canal,
      valor,
      percentual: total > 0 ? (valor / total) * 100 : 0,
    });
  });

  return resultado.sort((a, b) => b.valor - a.valor);
}

// Top produtos
export function calcularTopProdutos(data: VendaItem[], limite = 10): TopItem[] {
  const { vendas } = separarVendasDevolucoes(data);

  const porProduto = new Map<string, { valor: number; quantidade: number; margem: number }>();

  vendas.forEach((item) => {
    const produto = item.Produto?.trim() || "Sem nome";
    const atual = porProduto.get(produto) || { valor: 0, quantidade: 0, margem: 0 };
    porProduto.set(produto, {
      valor: atual.valor + (item["Total NF"] || 0),
      quantidade: atual.quantidade + (item["Quant."] || 0),
      margem: atual.margem + (item["$ Margem"] || 0),
    });
  });

  const resultado: TopItem[] = [];
  porProduto.forEach((dados, nome) => {
    resultado.push({
      nome,
      valor: dados.valor,
      quantidade: dados.quantidade,
      margem: dados.margem,
    });
  });

  return resultado.sort((a, b) => b.valor - a.valor).slice(0, limite);
}

// Top vendedores
export function calcularTopVendedores(data: VendaItem[], limite = 10): TopItem[] {
  const { vendas } = separarVendasDevolucoes(data);

  const porVendedor = new Map<string, number>();

  vendas.forEach((item) => {
    const vendedor = item.Vendedor?.trim() || "Sem vendedor";
    porVendedor.set(vendedor, (porVendedor.get(vendedor) || 0) + (item["Total NF"] || 0));
  });

  const resultado: TopItem[] = [];
  porVendedor.forEach((valor, nome) => {
    resultado.push({ nome, valor });
  });

  return resultado.sort((a, b) => b.valor - a.valor).slice(0, limite);
}

// Top clientes
export function calcularTopClientes(data: VendaItem[], limite = 10): TopItem[] {
  const { vendas } = separarVendasDevolucoes(data);

  const porCliente = new Map<string, { valor: number; notas: Set<string> }>();

  vendas.forEach((item) => {
    const cliente = item.Cliente?.trim() || "Sem cliente";
    const atual = porCliente.get(cliente) || { valor: 0, notas: new Set() };
    atual.valor += item["Total NF"] || 0;
    if (item.Nota) atual.notas.add(item.Nota.trim());
    porCliente.set(cliente, atual);
  });

  const resultado: TopItem[] = [];
  porCliente.forEach((dados, nome) => {
    resultado.push({
      nome,
      valor: dados.valor,
      quantidade: dados.notas.size, // Número de notas (para ticket médio)
    });
  });

  return resultado.sort((a, b) => b.valor - a.valor).slice(0, limite);
}

// Margem por canal
export function calcularMargemPorCanal(data: VendaItem[]): { canal: string; margem: number; margemPercentual: number; faturamento: number }[] {
  const { vendas } = separarVendasDevolucoes(data);

  const porCanal = new Map<string, { margem: number; faturamento: number }>();

  vendas.forEach((item) => {
    const canal = item.Atividade?.trim() || "Outros";
    const atual = porCanal.get(canal) || { margem: 0, faturamento: 0 };
    porCanal.set(canal, {
      margem: atual.margem + (item["$ Margem"] || 0),
      faturamento: atual.faturamento + (item["Total NF"] || 0),
    });
  });

  const resultado: { canal: string; margem: number; margemPercentual: number; faturamento: number }[] = [];
  porCanal.forEach((dados, canal) => {
    resultado.push({
      canal,
      margem: dados.margem,
      faturamento: dados.faturamento,
      margemPercentual: dados.faturamento > 0 ? (dados.margem / dados.faturamento) * 100 : 0,
    });
  });

  return resultado.sort((a, b) => b.margem - a.margem);
}

// Faturamento por região
export function calcularFaturamentoPorRegiao(data: VendaItem[]): TopItem[] {
  const { vendas } = separarVendasDevolucoes(data);

  const porRegiao = new Map<string, number>();

  vendas.forEach((item) => {
    const regiao = item.Região?.trim() || "Outros";
    porRegiao.set(regiao, (porRegiao.get(regiao) || 0) + (item["Total NF"] || 0));
  });

  const resultado: TopItem[] = [];
  porRegiao.forEach((valor, nome) => {
    resultado.push({ nome, valor });
  });

  return resultado.sort((a, b) => b.valor - a.valor);
}

// Faturamento por UF
export function calcularFaturamentoPorUF(data: VendaItem[]): TopItem[] {
  const { vendas } = separarVendasDevolucoes(data);

  const porUF = new Map<string, number>();

  vendas.forEach((item) => {
    const uf = item.UF?.trim() || "Outros";
    porUF.set(uf, (porUF.get(uf) || 0) + (item["Total NF"] || 0));
  });

  const resultado: TopItem[] = [];
  porUF.forEach((valor, nome) => {
    resultado.push({ nome, valor });
  });

  return resultado.sort((a, b) => b.valor - a.valor);
}
