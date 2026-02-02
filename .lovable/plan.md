
# Plano: Corrigir Busca de Dados para Evitar Truncamento

## Problema Identificado

A API está truncando os dados quando o período de busca é muito grande (ano inteiro). Ao buscar de `01/01/2026` a `31/12/2026`, a API retorna apenas uma parte dos registros, resultando em R$ 683.005,46 em vez dos R$ 3.7M esperados.

---

## Solucao

Modificar a estrategia de busca para fazer requisicoes **mes a mes** em paralelo, garantindo que todos os dados sejam retornados corretamente.

---

## Alteracoes Tecnicas

### 1. Modificar Hook `useVendasDoisAnos`

**Arquivo:** `src/hooks/useVendas.ts`

Alterar a funcao para buscar os 12 meses individualmente em paralelo:

```text
Antes (busca ano inteiro - trunca):
  fetchVendas("01/01/2026", "31/12/2026")

Depois (busca mes a mes - sem truncamento):
  Promise.all([
    fetchVendas("01/01/2026", "31/01/2026"),
    fetchVendas("01/02/2026", "28/02/2026"),
    fetchVendas("01/03/2026", "31/03/2026"),
    ... (12 meses)
  ])
```

Beneficios:
- Evita limite de registros da API
- Requisicoes em paralelo mantem performance
- Dados completos para cada mes

### 2. Funcao Auxiliar para Ultimo Dia do Mes

Criar funcao que retorna o ultimo dia de cada mes considerando anos bissextos:

| Mes | Ultimo Dia |
|-----|------------|
| Jan | 31         |
| Fev | 28 ou 29   |
| Mar | 31         |
| Abr | 30         |
| Mai | 31         |
| Jun | 30         |
| Jul | 31         |
| Ago | 31         |
| Set | 30         |
| Out | 31         |
| Nov | 30         |
| Dez | 31         |

---

## Fluxo de Busca

```text
+-------------------+
|  Seleciona Ano    |
|     (2026)        |
+--------+----------+
         |
         v
+--------+----------+
| 24 Requisicoes    |
| em Paralelo       |
| (12 meses x 2 anos)|
+--------+----------+
         |
         v
+--------+----------+
| Combina Resultados|
| em Array Unico    |
+--------+----------+
         |
         v
+--------+----------+
| Filtro Local      |
| (Mes/Equipe)      |
+-------------------+
```

---

## Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useVendas.ts` | Modificar busca para mes a mes |

---

## Resultado Esperado

- Janeiro 2026 mostrara os R$ 3.7M corretos
- Todos os meses terao dados completos
- Performance mantida com requisicoes paralelas
