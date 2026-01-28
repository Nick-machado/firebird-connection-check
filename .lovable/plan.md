

# Plano: Atualizar Filtro para usar "Flag Tipo"

## Resumo

Vou atualizar o sistema para usar o novo campo `"Flag Tipo"` retornado pela API, onde:
- **V** = Vendas
- **D** = Devoluções

Isso simplifica a lógica de separação, que atualmente depende de verificar se o texto "devolução" está presente no campo `"Tipo Movimento"`.

---

## Alterações

### 1. Adicionar campo no tipo (src/types/venda.ts)

Adicionar o novo campo `"Flag Tipo"` na interface `VendaItem`:

```typescript
"Flag Tipo": "V" | "D";
```

### 2. Atualizar função de separação (src/lib/dataProcessing.ts)

Modificar a função `separarVendasDevolucoes` para usar o novo campo:

**Antes:**
```typescript
export function separarVendasDevolucoes(data: VendaItem[]) {
  const vendas = data.filter((item) => !item["Tipo Movimento"]?.toLowerCase().includes("devolução"));
  const devolucoes = data.filter((item) => item["Tipo Movimento"]?.toLowerCase().includes("devolução"));
  return { vendas, devolucoes };
}
```

**Depois:**
```typescript
export function separarVendasDevolucoes(data: VendaItem[]) {
  const vendas = data.filter((item) => item["Flag Tipo"] === "V");
  const devolucoes = data.filter((item) => item["Flag Tipo"] === "D");
  return { vendas, devolucoes };
}
```

### 3. Corrigir erro de build (src/lib/exportToExcel.ts)

Corrigir o erro de tipagem no array `colWidths` - o tipo `ColInfo[]` espera objetos, não números:

**Antes:**
```typescript
const colWidths = vendasFormatadas.length > 0 ? Object.keys(vendasFormatadas[0]).map(() => 15) : [];
```

**Depois:**
```typescript
const colWidths = vendasFormatadas.length > 0 
  ? Object.keys(vendasFormatadas[0]).map(() => ({ wch: 15 })) 
  : [];
```

Também atualizar a lógica de separação neste arquivo para usar `"Flag Tipo"`.

### 4. Incluir "Flag Tipo" na exportação Excel

Adicionar o campo `"Flag Tipo"` na função `formatarDados` para que apareça no Excel exportado.

---

## Arquivos afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/types/venda.ts` | Adicionar campo `"Flag Tipo"` |
| `src/lib/dataProcessing.ts` | Atualizar `separarVendasDevolucoes` |
| `src/lib/exportToExcel.ts` | Corrigir tipagem + usar `"Flag Tipo"` |

---

## Benefícios

- Filtro mais confiável (não depende de texto)
- Performance levemente melhor (comparação simples vs string matching)
- Código mais limpo e fácil de manter

