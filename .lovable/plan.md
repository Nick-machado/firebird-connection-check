

## Plano: Usar Faturamento Líquido e Remover Card de Variação

### O que será feito

1. **Remover o card "Variação Geográfica Total"** - Este componente será completamente removido da página Regional

2. **Alterar cálculo de faturamento para Líquido** - Todas as funções de processamento regional passarão a usar:
   - **Faturamento Líquido = Vendas - Devoluções** (igual à Visão Geral)
   - Em vez do atual que usa apenas as Vendas

---

### Detalhes Técnicos

**Arquivo: `src/pages/VisaoRegional.tsx`**
- Remover import do `RegionalVariationCard`
- Remover o bloco JSX do card de variação (linhas 286-292)
- Remover cálculos de `variacaoTotalMoM` e `variacaoTotalYoY` do useMemo

**Arquivo: `src/lib/regionalProcessing.ts`**
- Modificar `calcularDadosPorUF()`: Usar vendas E devoluções para calcular faturamento líquido
- Modificar `calcularVariacoesPorUF()`: Usar faturamento líquido nas comparações
- Modificar `calcularVariacoesPorRegiao()`: Usar faturamento líquido nas comparações
- Modificar `calcularCanaisPorUF()`: Usar faturamento líquido
- Modificar `calcularCanaisPorRegiao()`: Usar faturamento líquido
- Modificar `calcularTopProdutosPorLocal()`: Usar faturamento líquido
- Modificar `calcularTopClientesPorLocal()`: Usar faturamento líquido

**Lógica de cálculo do Faturamento Líquido:**
```text
Para cada UF/Região:
  faturamentoLiquido = soma(vendas.TotalNF) - soma(abs(devolucoes.TotalNF))
```

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| Card "Variação Geográfica Total" visível | Card removido |
| Faturamento = apenas vendas (bruto) | Faturamento = vendas - devoluções (líquido) |
| Valores diferentes da Visão Geral | Valores consistentes com Visão Geral |

