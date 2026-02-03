
# Plano de Correção: Cliente ID undefined

## Problema Identificado

O campo de código do cliente está vindo da API como `"Cód. Cli"` (com acento no "ó"), mas o código está tentando acessar `"Cod. Cli"` (sem acento). Isso faz com que todos os clientes tenham `codigo: undefined`, impedindo:

1. A busca de vendas do cliente (API não é chamada)
2. O Sheet de abrir corretamente (depende do código para buscar vendas)
3. A key do mapeamento da tabela (usa codigo como key)

## Evidência

Console log mostra:
```
Cliente clicado: undefined VEMILER MATERIAL DE CONSTRUCAO LTDA
```

## Solução

### Arquivo: `src/types/cliente.ts`

Corrigir o nome do campo na interface ClienteAPI:

```typescript
// Linha 5 - DE:
"Cod. Cli": number;

// PARA:
"Cód. Cli": number;
```

### Arquivo: `src/lib/clientesProcessing.ts`

Corrigir a referência ao campo na função de mapeamento:

```typescript
// Linha 28 - DE:
codigo: cliente["Cod. Cli"],

// PARA:
codigo: cliente["Cód. Cli"],
```

## Impacto da Correção

Após essas mudanças:
- Todos os clientes terão seu código corretamente mapeado
- A tabela de clientes usará keys únicas (codigo)
- Clicar em um cliente abrirá o Sheet
- A API `/clientes/{id}/vendas` será chamada com o ID correto
- As vendas do cliente serão exibidas no painel lateral

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/cliente.ts` | Linha 5: `"Cod. Cli"` -> `"Cód. Cli"` |
| `src/lib/clientesProcessing.ts` | Linha 28: `cliente["Cod. Cli"]` -> `cliente["Cód. Cli"]` |

## Complexidade

Baixa - apenas 2 linhas de código precisam ser alteradas (correção de typo/encoding).
