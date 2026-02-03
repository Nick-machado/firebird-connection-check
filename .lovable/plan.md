

# Plano: Refatorar Pagina de Clientes com Abordagem Hibrida

## Resumo
Refatorar a pagina de Clientes para utilizar os endpoints especificos da API de clientes (`/api/clientes` e `/api/clientes/ultima-compra`) em combinacao com os dados de vendas existentes, otimizando a precisao das metricas.

---

## Mudancas Principais

### O Que Muda

| Metrica | Antes | Depois |
|---------|-------|--------|
| **Clientes Novos** | Comparava IDs entre 2 anos de vendas | Usa campo `Data Cad.` da API de clientes |
| **Churn** | Calculava ultima compra processando todas as vendas | Usa campo `Ult.Compra` direto da API |
| **Top 10 e Frequencia** | Dados de vendas | Continua igual (dados de vendas) |

### Beneficios

1. **Precisao**: Data de cadastro real vs. primeira venda no periodo
2. **Performance**: Menos processamento para churn (endpoint dedicado)
3. **Dados extras**: Atividade, Categoria, Regiao, Situacao do cliente

---

## Arquivos a Modificar/Criar

```text
src/
├── hooks/
│   └── useClientes.ts              # NOVO - Hook para API de clientes
├── types/
│   └── cliente.ts                  # MODIFICAR - Adicionar tipo ClienteAPI
├── lib/
│   └── clientesProcessing.ts       # MODIFICAR - Adaptar funcoes para dados hibridos
├── pages/
│   └── Clientes.tsx                # MODIFICAR - Integrar novo hook
└── components/
    └── clientes/
        ├── TopClientesTable.tsx    # MODIFICAR - Adicionar colunas extras
        └── ChurnClientesCard.tsx   # MODIFICAR - Usar dados da API
```

---

## Detalhes Tecnicos

### 1. Novo Hook: `src/hooks/useClientes.ts`

```typescript
// Tipo do cliente retornado pela API
interface ClienteAPI {
  "Cod. Cli": number;
  "Cliente": string;
  "Atividade": string;
  "UF": string;
  "Cidade": string;
  "Email": string;
  "Ult.Compra": string; // ISO date
  "Data Cad.": string;  // ISO date
  "Situacao": "A" | "I";
  "Categoria": string | null;
  "Regiao": string;
}

// Hook para buscar todos os clientes
export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/clientes`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data as ClienteAPI[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
}

// Hook para buscar clientes com ultima compra no periodo (para churn)
export function useClientesUltimaCompra(dataInicio: string, dataFim: string) {
  return useQuery({
    queryKey: ["clientes-ultima-compra", dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams({ dataInicio, dataFim });
      const response = await fetch(`${API_URL}/api/clientes/ultima-compra?${params}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data as ClienteAPI[];
    },
    staleTime: 1000 * 60 * 20,
  });
}
```

### 2. Atualizar Tipos: `src/types/cliente.ts`

Adicionar:

```typescript
// Tipo para cliente da API (cadastro)
export interface ClienteAPI {
  "Cod. Cli": number;
  Cliente: string;
  Atividade: string;
  UF: string;
  Cidade: string;
  Email: string;
  "Ult.Compra": string;
  "Data Cad.": string;
  Situacao: "A" | "I";
  Categoria: string | null;
  Regiao: string;
}

// Atualizar ClienteAnalise para incluir dados extras
export interface ClienteAnalise {
  codigo: number;
  nome: string;
  faturamento: number;
  quantidadeNotas: number;
  ticketMedio: number;
  margem: number;
  margemPercentual: number;
  // Novos campos da API
  atividade?: string;
  regiao?: string;
  categoria?: string;
  ultimaCompra?: Date;
  dataCadastro?: Date;
  situacao?: "A" | "I";
}
```

### 3. Refatorar Processamento: `src/lib/clientesProcessing.ts`

**Nova funcao para clientes novos (usa Data Cad.):**

```typescript
export function calcularClientesNovosAPI(
  clientesAPI: ClienteAPI[],
  anoReferencia: number
): { novos: ClienteAPI[]; existentes: ClienteAPI[] } {
  const novos: ClienteAPI[] = [];
  const existentes: ClienteAPI[] = [];

  for (const cliente of clientesAPI) {
    const dataCad = new Date(cliente["Data Cad."]);
    if (dataCad.getFullYear() === anoReferencia) {
      novos.push(cliente);
    } else {
      existentes.push(cliente);
    }
  }

  return { novos, existentes };
}
```

**Funcao de churn otimizada (usa Ult.Compra da API):**

```typescript
export function calcularChurnAPI(
  clientesAPI: ClienteAPI[],
  dataReferencia: Date
): ChurnAnaliseData {
  const churn3Meses: ChurnClienteData[] = [];
  const churn6Meses: ChurnClienteData[] = [];

  const limite3 = new Date(dataReferencia);
  limite3.setMonth(limite3.getMonth() - 3);

  const limite6 = new Date(dataReferencia);
  limite6.setMonth(limite6.getMonth() - 6);

  for (const cliente of clientesAPI) {
    if (cliente.Situacao !== "A") continue; // Ignora inativos

    const ultCompra = new Date(cliente["Ult.Compra"]);
    const diasSemCompra = Math.floor(
      (dataReferencia.getTime() - ultCompra.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (ultCompra < limite6) {
      churn6Meses.push({ 
        cliente: mapClienteAPIToAnalise(cliente), 
        diasSemCompra, 
        ultimaCompra: ultCompra 
      });
    } else if (ultCompra < limite3) {
      churn3Meses.push({ 
        cliente: mapClienteAPIToAnalise(cliente), 
        diasSemCompra, 
        ultimaCompra: ultCompra 
      });
    }
  }

  return {
    churn3Meses: { clientes: churn3Meses, quantidade: churn3Meses.length, ... },
    churn6Meses: { clientes: churn6Meses, quantidade: churn6Meses.length, ... },
  };
}
```

**Funcao para enriquecer Top 10 com dados da API:**

```typescript
export function enriquecerClientesComAPI(
  clientesVendas: ClienteAnalise[],
  clientesAPI: ClienteAPI[]
): ClienteAnalise[] {
  const mapAPI = new Map(clientesAPI.map(c => [c["Cod. Cli"], c]));

  return clientesVendas.map(cliente => {
    const dadosAPI = mapAPI.get(cliente.codigo);
    if (dadosAPI) {
      return {
        ...cliente,
        atividade: dadosAPI.Atividade,
        regiao: dadosAPI.Regiao,
        categoria: dadosAPI.Categoria || undefined,
        situacao: dadosAPI.Situacao,
      };
    }
    return cliente;
  });
}
```

### 4. Atualizar Pagina: `src/pages/Clientes.tsx`

```typescript
// Adicionar imports
import { useClientes } from "@/hooks/useClientes";
import { calcularClientesNovosAPI, calcularChurnAPI, enriquecerClientesComAPI } from "@/lib/clientesProcessing";

// Dentro do componente
const { data: clientesAPI, isLoading: loadingClientes } = useClientes();
const { data: vendasData, isLoading: loadingVendas } = useVendasDoisAnos(ano);

const isLoading = loadingClientes || loadingVendas;

const dadosProcessados = useMemo(() => {
  if (!vendasData || !clientesAPI) return null;

  // Top 10 e frequencia - usa vendas (como antes)
  const topClientes = calcularTopClientesDetalhado(dadosMesFiltrados, 10);
  const frequenciaCompra = calcularFrequenciaCompra(dadosMesFiltrados);

  // Enriquece Top 10 com dados da API
  const topClientesEnriquecidos = enriquecerClientesComAPI(topClientes, clientesAPI);

  // Clientes novos - usa Data Cad. da API
  const { novos, existentes } = calcularClientesNovosAPI(clientesAPI, ano);

  // Churn - usa Ult.Compra da API
  const dataRef = new Date(ano, mes, 0);
  const churnClientes = calcularChurnAPI(clientesAPI, dataRef);

  return {
    topClientes: topClientesEnriquecidos,
    frequenciaCompra,
    clientesNovosRecorrentes: { novos, existentes },
    churnClientes,
    estatisticas,
  };
}, [vendasData, clientesAPI, ano, mes, equipe]);
```

### 5. Atualizar TopClientesTable

Adicionar colunas opcionais para Atividade e Regiao:

```tsx
// Na tabela, adicionar colunas
<TableHead>Atividade</TableHead>
<TableHead>Regiao</TableHead>

// No corpo
<TableCell>{cliente.atividade || "-"}</TableCell>
<TableCell>{cliente.regiao || "-"}</TableCell>
```

---

## Fluxo de Dados Apos Refatoracao

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Pagina Clientes.tsx                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐          ┌─────────────────────────────┐  │
│  │  useClientes()  │          │  useVendasDoisAnos(ano)     │  │
│  │                 │          │                             │  │
│  │ GET /api/       │          │ GET /api/vendas             │  │
│  │ clientes        │          │ (24 requests paralelas)     │  │
│  └────────┬────────┘          └──────────────┬──────────────┘  │
│           │                                  │                  │
│           ▼                                  ▼                  │
│  ┌─────────────────┐          ┌─────────────────────────────┐  │
│  │ ClienteAPI[]    │          │ VendaItem[]                 │  │
│  │ - Ult.Compra    │          │ - Total Merc.               │  │
│  │ - Data Cad.     │          │ - Nota (frequencia)         │  │
│  │ - Situacao      │          │ - $ Margem                  │  │
│  └────────┬────────┘          └──────────────┬──────────────┘  │
│           │                                  │                  │
│           └───────────┬──────────────────────┘                  │
│                       ▼                                         │
│           ┌─────────────────────────────────┐                   │
│           │   Processamento Hibrido         │                   │
│           │                                 │                   │
│           │  - Top 10: vendas + API enrich  │                   │
│           │  - Frequencia: vendas           │                   │
│           │  - Novos: API (Data Cad.)       │                   │
│           │  - Churn: API (Ult.Compra)      │                   │
│           └─────────────────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ordem de Implementacao

1. Criar `src/hooks/useClientes.ts` com os hooks de API
2. Atualizar `src/types/cliente.ts` com novos tipos
3. Atualizar `src/lib/clientesProcessing.ts` com novas funcoes
4. Refatorar `src/pages/Clientes.tsx` para usar abordagem hibrida
5. Atualizar componentes (`TopClientesTable`, `ChurnClientesCard`) para exibir dados extras
6. Testar com dados reais

