export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatCurrencyExact(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${formatNumber(value, 2)}%`;
}

export function formatCompactCurrency(value: number): string {
  if (value >= 1000000) {
    return `R$ ${formatNumber(value / 1000000, 2)}M`;
  }
  if (value >= 1000) {
    return `R$ ${formatNumber(value / 1000, 1)}K`;
  }
  return formatCurrency(value);
}

export function getMesNome(mes: number): string {
  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];
  return meses[mes - 1] || "";
}

export function getMesNomeCompleto(mes: number): string {
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return meses[mes - 1] || "";
}
