
# Diagnostico: Janeiro errado + Fevereiro vazio

## Descobertas da Investigacao

### Fevereiro 2026: Problema na API (nao no frontend)

Testei a rota da API diretamente e confirmei: a API retorna `data: []` (vazio) para fevereiro 2026. Voce tambem confirmou isso. O frontend esta correto ao mostrar "Sem dados disponiveis" - ele simplesmente nao recebe dados do servidor. Este problema precisa ser resolvido na API/banco de dados.

### Janeiro 2026: Possivel truncamento de dados pela API

Identifiquei um problema critico no frontend: **a aplicacao ignora o campo `meta.total` da API**. A resposta da API inclui:

```text
{ "success": true, "data": [...], "meta": { "total": 850 } }
```

Mas o frontend so le `data` e ignora `meta`:

```typescript
// Codigo atual - nao verifica se recebeu todos os registros
interface VendasResponse {
  success: boolean;
  data: VendaItem[];
  error?: string;  // <-- nao tem 'meta'!
}
```

Se a API retorna apenas uma parte dos registros (ex: 500 de 850), o frontend soma apenas o que recebeu, resultando em valores menores que o real.

---

## Plano de Correcao

### 1. Detectar e alertar truncamento de dados

Alterar o `useVendas.ts` para:
- Incluir `meta` na interface de resposta
- Comparar `meta.total` com `data.length`
- Se forem diferentes, disparar um aviso no console com os numeros exatos
- Isso vai confirmar se o problema eh truncamento

### 2. Adicionar log de debug temporario

Adicionar console.log no processamento de `VisaoGeral.tsx` para rastrear:
- Quantos registros foram recebidos por mes
- Quantos sao vendas (Flag V) vs devolucoes (Flag D)
- Soma de `Total NF` das vendas = Faturamento Bruto
- Soma de devolucoes (base + extras)

Isso vai nos mostrar exatamente onde o valor diverge dos R$ 4.6M esperados.

### 3. Botao de atualizar dados

Adicionar um botao de refresh ao lado do "Exportar Excel" para forcar nova busca, invalidando o cache do React Query (que mantem dados por 20 minutos mesmo se a API for atualizada).

### 4. Reducao do staleTime do cache

Reduzir o `staleTime` de 20 para 5 minutos para que os dados sejam atualizados com mais frequencia.

---

## Arquivos a modificar

| Arquivo | Acao |
|---------|------|
| `src/hooks/useVendas.ts` | Verificar `meta.total` vs `data.length`, reduzir cache |
| `src/pages/VisaoGeral.tsx` | Adicionar debug logging + botao refresh |

---

## Detalhes Tecnicos

### useVendas.ts - Verificar truncamento

```typescript
interface VendasResponse {
  success: boolean;
  data: VendaItem[];
  error?: string;
  meta?: { total: number; queryTime: string; fetchedAt: string };
}

async function fetchVendas(dataInicio: string, dataFim: string): Promise<VendaItem[]> {
  // ... fetch ...
  const result: VendasResponse = await response.json();
  
  // Alerta de truncamento
  if (result.meta && result.meta.total > result.data.length) {
    console.warn(
      `TRUNCAMENTO DETECTADO para ${dataInicio}-${dataFim}: ` +
      `API retornou ${result.data.length} de ${result.meta.total} registros`
    );
  }
  
  return result.data;
}
```

### VisaoGeral.tsx - Debug logging

Dentro do `useMemo`, apos filtrar os dados:

```typescript
console.log('DEBUG JANEIRO:', {
  totalRegistrosAnoAtual: dadosAnoAtual.length,
  registrosMes: dadosMesFiltrados.length,
  vendasCount: dadosMesFiltrados.filter(i => i['Flag Tipo']?.trim() === 'V').length,
  devolucoesCount: dadosMesFiltrados.filter(i => i['Flag Tipo']?.trim() === 'D').length,
  bruto: kpisMes.totalFaturado,
  devolucoes: kpisMes.totalDevolucoes,
  liquido: kpisMes.faturamentoLiquido,
  devExtraMes: devExtraMes.length,
});
```

### VisaoGeral.tsx - Botao refresh

```typescript
const queryClient = useQueryClient();

const handleRefresh = () => {
  queryClient.invalidateQueries({ queryKey: ["vendas-dois-anos"] });
};
```

---

## Resultado Esperado

Apos a implementacao:
- O console vai mostrar exatamente quantos registros estao sendo processados e os valores calculados
- Se houver truncamento, um warning claro aparecera no console
- O botao de refresh permite forcar nova busca sem esperar o cache expirar
- Com esses dados de debug, poderemos identificar e corrigir a causa exata do valor errado de janeiro
