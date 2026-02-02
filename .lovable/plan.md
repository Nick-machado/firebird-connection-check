

# Plano: Criar Página de Clientes

## Objetivo
Criar uma nova página dedicada à análise de clientes com métricas de faturamento, frequência de compra, novos vs. recorrentes e churn.

---

## Arquitetura da Solução

### Novos Arquivos a Criar

```text
src/
├── pages/
│   └── Clientes.tsx                    # Página principal
├── components/
│   └── clientes/
│       ├── TopClientesTable.tsx        # Tabela dos Top 10 clientes
│       ├── ClientesNovosRecorrentes.tsx # Gráfico/Cards novos vs recorrentes
│       ├── FrequenciaCompraChart.tsx   # Gráfico de frequência de compra
│       └── ChurnClientesCard.tsx       # Card de clientes em churn
└── lib/
    └── clientesProcessing.ts           # Funções de processamento de dados
```

---

## Métricas e Cálculos

### 1. Top 10 Clientes (R$)
- Agrupa vendas por `Cód. Cli` + `Cliente`
- Soma `Total Merc.` para cada cliente
- Ordena por valor decrescente
- Exibe: Nome, Código, Faturamento, Qtd. Notas, Ticket Médio, Margem

### 2. Taxa de Recompra / Frequência de Compra
- Para cada cliente, conta o número de notas únicas no período
- Calcula a média de compras por cliente
- Segmenta clientes por frequência:
  - 1 compra (ocasional)
  - 2-3 compras (regular)
  - 4+ compras (frequente)
- Exibe em gráfico de barras ou pizza

### 3. Clientes Novos vs. Recorrentes
- **Cliente Novo**: `Cód. Cli` que aparece no ano atual mas NÃO no ano anterior
- **Cliente Recorrente**: `Cód. Cli` que aparece em ambos os anos
- Exibe:
  - Cards com quantidade e percentual
  - Faturamento de clientes novos vs. recorrentes

### 4. Churn de Clientes
- Identifica clientes que:
  - Compraram há 3+ meses mas NÃO compraram nos últimos 3 meses
  - Compraram há 6+ meses mas NÃO compraram nos últimos 6 meses
- Exibe:
  - Quantidade de clientes em risco
  - Valor de faturamento perdido (baseado em compras anteriores)
  - Lista dos principais clientes em churn

---

## Detalhes Técnicos

### 1. Arquivo: `src/lib/clientesProcessing.ts`

Novas funções de processamento:

```typescript
// Tipos
interface ClienteData {
  codigo: number;
  nome: string;
  faturamento: number;
  notas: Set<string>;
  margem: number;
  ultimaCompra: Date;
  primeiraCompra: Date;
}

interface ClienteAnalise {
  codigo: number;
  nome: string;
  faturamento: number;
  quantidadeNotas: number;
  ticketMedio: number;
  margem: number;
  margemPercentual: number;
}

// Funções
function calcularTopClientes(data: VendaItem[], limite?: number): ClienteAnalise[]
function calcularFrequenciaCompra(data: VendaItem[]): { frequencia: string; quantidade: number; percentual: number }[]
function calcularClientesNovosRecorrentes(dataAnoAtual: VendaItem[], dataAnoAnterior: VendaItem[]): { novos: ClienteAnalise[]; recorrentes: ClienteAnalise[] }
function calcularChurnClientes(data: VendaItem[], mesesChurn: number): { clientesChurn: ClienteAnalise[]; faturamentoPerdido: number }
```

### 2. Arquivo: `src/pages/Clientes.tsx`

Estrutura da página:

```tsx
// Layout
<DashboardLayout>
  {/* Header + Filtros (Ano, Mês, Equipe) */}
  
  {/* KPIs resumo */}
  <Grid cols={4}>
    <KPICard title="Total Clientes Ativos" />
    <KPICard title="Clientes Novos" />
    <KPICard title="Taxa Recompra Média" />
    <KPICard title="Clientes em Risco (Churn)" />
  </Grid>
  
  {/* Top 10 Clientes - Tabela completa */}
  <TopClientesTable />
  
  {/* Gráficos lado a lado */}
  <Grid cols={2}>
    <ClientesNovosRecorrentes />
    <FrequenciaCompraChart />
  </Grid>
  
  {/* Churn detalhado */}
  <ChurnClientesCard />
</DashboardLayout>
```

### 3. Arquivo: `src/App.tsx`

Adicionar rota:
```tsx
<Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
```

### 4. Arquivo: `src/components/layout/DashboardLayout.tsx`

Atualizar menu para habilitar a página de Clientes:
```tsx
// Remover disabled: true do item "/clientes"
{ path: "/clientes", label: "Clientes", icon: Users }
```

---

## Componentes Visuais

### TopClientesTable
- Tabela com colunas: Posição, Nome, Código, Faturamento, Notas, Ticket Médio, Margem, Margem %
- Barra de progresso visual para faturamento
- Ordenação por coluna

### ClientesNovosRecorrentes
- Gráfico de barras lado a lado (novos vs recorrentes)
- Mostra quantidade e faturamento total de cada grupo

### FrequenciaCompraChart
- Gráfico de pizza ou donut
- Segmentos: 1 compra, 2-3 compras, 4+ compras

### ChurnClientesCard
- Cards com métricas de churn 3 e 6 meses
- Lista dos top 5 clientes em risco de churn
- Valor potencial perdido

---

## Filtros

A página usará os mesmos filtros das outras páginas:
- **Ano**: Seleciona o ano de análise
- **Mês**: Filtra dados até o mês selecionado (para churn, usa como referência)
- **Equipe**: Filtra por equipe de vendas

Os filtros usarão o hook `useVendasDoisAnos` existente para aproveitar o cache de dados.

---

## Ordem de Implementação

1. Criar `src/lib/clientesProcessing.ts` com todas as funções de cálculo
2. Criar tipos de dados em `src/types/cliente.ts`
3. Criar componentes individuais em `src/components/clientes/`
4. Criar página principal `src/pages/Clientes.tsx`
5. Atualizar rotas em `src/App.tsx`
6. Habilitar menu em `DashboardLayout.tsx`

