
# Plano: Alinhar Containers do Mapa e da Tabela Regional

## Problema Identificado
Os containers do **Mapa de Vendas por Estado** e **Ranking por Estado** possuem dimensões inconsistentes:
- **BrazilMap**: Usa `h-full` no Card, mas o SVG tem `maxHeight: "450px"` (altura dinâmica)
- **RegionalTable**: Usa `min-h-[500px]` (altura mínima fixa de 500px)

O problema é que `h-full` no mapa depende do container pai, enquanto a tabela tem uma altura mínima diferente. Isso causa desalinhamento visual.

## Solução
Definir uma altura fixa e idêntica para ambos os componentes, usando o mapa como referência. O SVG do mapa tem `maxHeight: "450px"`, então calcularemos a altura total do Card considerando o header.

### Alterações Técnicas

**1. BrazilMap.tsx (linha 81)**
- Trocar `h-full` por uma altura fixa `h-[560px]`
- Isso garante que o Card tenha sempre a mesma altura

```tsx
// De:
<Card className="h-full">

// Para:
<Card className="h-[560px]">
```

**2. RegionalTable.tsx (linha 68)**
- Trocar `min-h-[500px]` por a mesma altura fixa `h-[560px]`
- Ajustar o container de scroll interno para ocupar o espaço disponível

```tsx
// De:
<Card className="min-h-[500px] flex flex-col">

// Para:
<Card className="h-[560px] flex flex-col">
```

**3. RegionalTable.tsx (linha 74)**
- Remover `max-h-[420px]` para permitir que a tabela ocupe todo o espaço flexível disponível

```tsx
// De:
<div className="h-full max-h-[420px] overflow-y-auto">

// Para:
<div className="h-full overflow-y-auto">
```

## Resultado Esperado
Ambos os containers terão exatamente 560px de altura, ficando perfeitamente alinhados lado a lado no grid de duas colunas.
