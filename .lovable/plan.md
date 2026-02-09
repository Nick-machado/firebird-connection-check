
# Diagnóstico e Correção: Faturamento Incorreto (R$ 680k vs R$ 4.6M)

## Problema Identificado

O valor de janeiro/2026 deveria ser ~R$ 4.6M, mas mostra ~R$ 680k e "muda sozinho" ao navegar entre páginas.

---

## Causa Raiz: Estado Local Reinicializado

O filtro de mês é inicializado com `new Date().getMonth() + 1` (Fevereiro = 2) **toda vez que o componente é montado**.

```typescript
// src/pages/VisaoGeral.tsx - linha 32
const mesAtual = new Date().getMonth() + 1; // = 2 (Fevereiro)
const [mes, setMes] = useState(mesAtual);    // Sempre inicia em Fevereiro!
```

**Comportamento:**
1. Você seleciona Janeiro (mes=1) - vê R$ 4.6M
2. Navega para outra página
3. Volta para Visão Geral - componente remonta
4. Estado reinicia para `mesAtual` (Fevereiro = 2)
5. Vê R$ 680k (valor de Fevereiro)

**Nota:** O cache do React Query mantém os dados, mas o filtro de mês reseta.

---

## Solução

### Abordagem: Persistir Filtros via Context ou URL

A melhor solução é manter os filtros **fora do componente**, usando um Context global ou sincronizando com a URL.

**Opção recomendada: Context para filtros**
- Cria um `FiltrosContext` que mantém ano/mês/equipe
- Todos os componentes de dashboard usam esse contexto
- Filtros persistem enquanto o usuário estiver na aplicação

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/contexts/FiltrosContext.tsx` | **Criar** - Context com ano, mês, equipe |
| `src/pages/VisaoGeral.tsx` | **Modificar** - Usar context em vez de useState local |
| `src/pages/VisaoRegional.tsx` | **Modificar** - Usar context em vez de useState local |
| `src/App.tsx` | **Modificar** - Wrap com FiltrosProvider |

---

## Detalhes Técnicos

### 1. Criar FiltrosContext

```typescript
// src/contexts/FiltrosContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

interface FiltrosContextType {
  ano: number;
  mes: number;
  equipe: string;
  setAno: (ano: number) => void;
  setMes: (mes: number) => void;
  setEquipe: (equipe: string) => void;
}

const FiltrosContext = createContext<FiltrosContextType | undefined>(undefined);

export function FiltrosProvider({ children }: { children: ReactNode }) {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;
  
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(mesAtual);
  const [equipe, setEquipe] = useState("TODAS");
  
  return (
    <FiltrosContext.Provider value={{ ano, mes, equipe, setAno, setMes, setEquipe }}>
      {children}
    </FiltrosContext.Provider>
  );
}

export function useFiltros() {
  const context = useContext(FiltrosContext);
  if (!context) {
    throw new Error("useFiltros deve ser usado dentro de FiltrosProvider");
  }
  return context;
}
```

### 2. Modificar VisaoGeral.tsx

```typescript
// Antes (problemático):
const [ano, setAno] = useState(anoAtual);
const [mes, setMes] = useState(mesAtual);
const [equipe, setEquipe] = useState("TODAS");

// Depois (corrigido):
const { ano, mes, equipe, setAno, setMes, setEquipe } = useFiltros();
```

### 3. Wrap App com Provider

```typescript
// src/App.tsx
import { FiltrosProvider } from "./contexts/FiltrosContext";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FiltrosProvider>
      {/* resto do app */}
    </FiltrosProvider>
  </QueryClientProvider>
);
```

---

## Resultado Esperado

Após a correção:
- Selecionar Janeiro/2026 mostra R$ 4.6M
- Navegar entre páginas mantém o filtro em Janeiro
- Voltar para Visão Geral continua mostrando Janeiro/R$ 4.6M
- Filtros só mudam quando o usuário explicitamente altera

---

## Resumo das Alterações

1. Criar `src/contexts/FiltrosContext.tsx`
2. Modificar `src/App.tsx` para incluir o Provider
3. Modificar `src/pages/VisaoGeral.tsx` para usar o context
4. Modificar `src/pages/VisaoRegional.tsx` para usar o context
