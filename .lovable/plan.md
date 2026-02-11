

# Integrar Nova Rota de Devoluções (`/api/vendas/devolucao`)

## O que muda

A nova rota retorna devoluções com formato diferente do endpoint principal. Esses valores precisam ser **somados** as devoluções existentes (Flag Tipo = "D") para que o faturamento liquido seja calculado corretamente.

**Campos da nova rota:**
| Campo | Uso |
|-------|-----|
| `TOTAL_LIQ` | Valor da devolucao (equivale a `Total NF`) |
| `ENTREGA` | Data (para extrair mes/ano) |
| `Equipe` | Filtro por equipe |

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/types/venda.ts` | Criar interface `DevolucaoExtraItem` |
| `src/hooks/useVendas.ts` | Criar `fetchDevolucoesExtra` e buscar em paralelo com vendas |
| `src/lib/dataProcessing.ts` | Alterar `calcularKPIs` e `calcularFaturamentoMensal` para receber devoluções extras |
| `src/pages/VisaoGeral.tsx` | Passar devoluções extras para as funções de processamento |
| `src/pages/VisaoRegional.tsx` | Idem |

---

## Detalhes Tecnicos

### 1. Nova interface (`src/types/venda.ts`)

```typescript
export interface DevolucaoExtraItem {
  Nota: number;
  ID: number;
  ENTREGA: string;
  Fornecedor: number;
  TOTAL_LIQ: number;
  "Referência": string;
  Equipe: string;
}
```

### 2. Buscar devoluções extras (`src/hooks/useVendas.ts`)

- Nova funcao `fetchDevolucoesExtra(dataInicio, dataFim)` chamando `/api/vendas/devolucao`
- Nova funcao `fetchDevolucoesAnoCompleto(ano)` fazendo 12 requisicoes em paralelo (mesmo padrao)
- Dentro de `useVendasDoisAnos`, buscar devoluções extras em paralelo junto com as vendas
- Retornar `devolucoesExtra` no resultado da query

### 3. Somar devoluções no processamento (`src/lib/dataProcessing.ts`)

- `calcularKPIs` recebe parametro opcional `devolucoesExtra: DevolucaoExtraItem[]`
  - Soma `TOTAL_LIQ` de cada item ao `totalDevolucoes` existente
  - Filtra por equipe antes de somar
- `calcularFaturamentoMensal` recebe o mesmo parametro
  - Extrai mes de `ENTREGA` e soma ao mapa `devolucoesPorMes`

### 4. Passar dados nas paginas

- `VisaoGeral.tsx` e `VisaoRegional.tsx`: filtrar `devolucoesExtra` por equipe e mes, e passar para `calcularKPIs` e `calcularFaturamentoMensal`

---

## Fluxo de Dados

```text
useVendasDoisAnos
  |-- fetchAnoCompleto(2026)     --> vendas + devoluções Flag "D"
  |-- fetchAnoCompleto(2025)     --> vendas + devoluções Flag "D"  
  |-- fetchDevolucoesAno(2026)   --> devoluções extras (nova rota)
  |-- fetchDevolucoesAno(2025)   --> devoluções extras (nova rota)
  |
  v
calcularKPIs(dadosMes, devolucoesExtraMes)
  totalDevolucoes = Flag "D" + TOTAL_LIQ extras
  faturamentoLiquido = totalFaturado - totalDevolucoes
```

## Resultado

- KPI "Devoluções" mostrara a soma das duas fontes
- KPI "Fat. Liquido" sera Faturamento Bruto menos todas as devoluções
- Grafico de faturamento mensal tambem refletira as devoluções extras
- Filtro de equipe sera aplicado tambem nas devoluções extras
