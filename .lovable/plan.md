

# Refatoracao Completa da Logica de Filtros

## Bugs Encontrados

### Bug 1 (CRITICO): `.includes()` causa contaminacao cruzada de dados

Em `VisaoGeral.tsx` (linhas 82-83) e `VisaoRegional.tsx` (linhas 63-64), o filtro por setor usa:

```typescript
v.Equipe?.toUpperCase().includes(eq.toUpperCase())
```

O problema: `"EXPORTACAO VAREJO".includes("VAREJO")` retorna `true`. Isso significa que usuarios do setor Varejo veem dados de Exportacao Varejo misturados, inflando os valores. O correto e comparacao exata com `.trim()`.

### Bug 2: VisaoRegional ignora a selecao de equipe para usuarios com setor

A funcao `filtrarPorSetor` na VisaoRegional (linhas 60-68) sempre filtra por todas as equipes do setor quando `sector` existe, independente do que o usuario selecionou no dropdown. Se um usuario de exportacao selecionar "EXPORTACAO VAREJO" especificamente, o filtro ignora e mostra ambas as equipes de exportacao.

### Bug 3: Inconsistencia de case-sensitivity entre filtros

- `filtrarPorEquipe`: comparacao exata, case-sensitive (`item.Equipe?.trim() === equipe`)
- `filtrarDevolucoesExtraPorEquipe`: case-insensitive (`.toUpperCase()`)
- Caminho SECTOR_FILTER: `.includes()` com `.toUpperCase()`

Se os dados da API vierem com caixa diferente (ex: "Varejo" vs "VAREJO"), um filtro funciona e o outro nao.

### Bug 4: VisaoRegional nao processa devolucoesExtra

A pagina regional ignora completamente os dados de `devolucoesExtra` da rota `/api/vendas/devolucao`, mostrando valores de faturamento incorretos.

### Bug 5: Logica duplicada e divergente entre as paginas

VisaoGeral e VisaoRegional implementam a mesma logica de filtro de setor de formas diferentes, causando resultados inconsistentes entre as duas telas.

---

## Solucao

Centralizar TODA a logica de filtro em funcoes reutilizaveis no `dataProcessing.ts`, eliminando logica duplicada nas paginas.

### Arquivos a modificar

| Arquivo | Acao |
|---------|------|
| `src/lib/dataProcessing.ts` | Criar funcao centralizada `filtrarDadosPorEquipeOuSetor` |
| `src/pages/VisaoGeral.tsx` | Substituir logica duplicada pela funcao centralizada |
| `src/pages/VisaoRegional.tsx` | Substituir `filtrarPorSetor` pela funcao centralizada |

### Detalhes tecnicos

#### 1. `dataProcessing.ts` - Normalizar e centralizar

- Alterar `filtrarPorEquipe` para usar `.trim().toUpperCase()` em ambos os lados (comparacao exata, case-insensitive)
- Alterar `filtrarDevolucoesExtraPorEquipe` para o mesmo padrao
- Criar funcao `filtrarDadosComSetor` que recebe os dados, equipe selecionada, e sector, e retorna os dados filtrados corretamente:
  - Se `sector` existe e `equipe === "TODAS"`: filtra por equipes do setor usando comparacao EXATA (nao `.includes()`)
  - Se `sector` existe e equipe especifica: usa essa equipe (validando que pertence ao setor)
  - Se `sector` nao existe (admin): usa `filtrarPorEquipe` normalmente
- Criar versao equivalente para `DevolucaoExtraItem`

#### 2. `VisaoGeral.tsx` - Simplificar

Remover toda a logica de SECTOR_FILTER (linhas 62-98) e substituir por uma unica chamada a funcao centralizada.

#### 3. `VisaoRegional.tsx` - Corrigir e alinhar

- Remover funcao `filtrarPorSetor` local (linhas 60-68)
- Usar a mesma funcao centralizada
- Adicionar processamento de `devolucoesExtra` (que esta completamente ausente)

### Exemplo da funcao centralizada

```typescript
export function filtrarDadosComSetor(
  dados: VendaItem[],
  equipe: string,
  sector: string | null
): VendaItem[] {
  // Admin/consultor sem setor: filtro simples
  if (!sector) {
    return filtrarPorEquipe(dados, equipe);
  }

  const allowedEquipes = SECTOR_TO_EQUIPES[sector];
  if (!allowedEquipes) return filtrarPorEquipe(dados, equipe);

  // Setor com equipe especifica selecionada
  if (equipe !== "TODAS" && allowedEquipes.some(
    eq => eq.toUpperCase() === equipe.toUpperCase()
  )) {
    return filtrarPorEquipe(dados, equipe);
  }

  // Setor com "TODAS" - filtra por todas as equipes permitidas (EXATA)
  return dados.filter(item => 
    allowedEquipes.some(eq => 
      item.Equipe?.trim().toUpperCase() === eq.toUpperCase()
    )
  );
}
```

### Resultado esperado

- Valores consistentes entre Visao Geral e Visao Regional
- Sem contaminacao de dados de exportacao nos dados de varejo
- Filtro de equipe funciona corretamente em todas as paginas
- Devolucoes extras refletidas na visao regional

