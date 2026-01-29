

# Plano: Simplificar Gráfico e Adicionar Tooltip com Valor Exato

## Resumo

Vou fazer duas melhorias:
1. **Gráfico**: Mostrar apenas valores líquidos (remover linhas de Bruto)
2. **KPI Cards**: Adicionar tooltip que mostra o valor exato sem arredondamento ao passar o mouse

---

## Alterações

### 1. Simplificar Gráfico de Faturamento Mensal

**Arquivo:** `src/components/dashboard/FaturamentoMensalChart.tsx`

Remover as linhas de "Bruto" e manter apenas as de "Líquido":

- Remover `${anoAtual} Bruto` e `${anoAnterior} Bruto` do chartData
- Remover os componentes `<Line>` de Bruto (linhas 70-78 e 89-99)
- Manter apenas as linhas de Líquido para o ano atual e anterior
- Atualizar o título para "Comparativo Mensal de Faturamento Líquido"

**Resultado visual:** Gráfico mais limpo com apenas 2 linhas (ano atual vs anterior)

---

### 2. Adicionar Tooltip nos KPI Cards

**Arquivo:** `src/components/dashboard/KPICard.tsx`

Adicionar um tooltip que mostra o valor exato quando o usuário passa o mouse:

- Importar componentes de Tooltip do Radix UI
- Envolver o valor formatado em um `<Tooltip>`
- Mostrar o valor completo (formatCurrency) no tooltip
- Funciona para todos os formatos: currency, compact, percent, number

**Exemplo de interação:**
- Card mostra: `R$ 3,8M` (formato compacto)
- Tooltip mostra: `R$ 3.807.419,39` (valor exato)

---

## Arquivos Afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/dashboard/FaturamentoMensalChart.tsx` | Remover linhas de Bruto |
| `src/components/dashboard/KPICard.tsx` | Adicionar Tooltip com valor exato |

---

## Detalhes Técnicos

### Novo formatador para valores exatos

Vou criar uma função `formatCurrencyExact` em `src/lib/formatters.ts` que formata moeda com todas as casas decimais:

```typescript
export function formatCurrencyExact(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
```

### Estrutura do Tooltip no KPICard

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span className="text-2xl font-bold text-foreground cursor-help">
      {formattedValue}
    </span>
  </TooltipTrigger>
  <TooltipContent>
    <p>{exactValue}</p>
  </TooltipContent>
</Tooltip>
```

---

## Benefícios

- Gráfico mais limpo e fácil de ler
- Acesso fácil ao valor exato sem precisar exportar dados
- Melhor experiência do usuário para análises precisas

