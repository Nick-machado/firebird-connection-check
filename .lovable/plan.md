

# Otimizar requisicoes: de 4 para 2

## Problema

O hook `useVendasDoisAnos` faz 4 requisicoes paralelas:
1. Vendas ano atual (2026)
2. Vendas ano anterior (2025)
3. Devolucoes ano atual (2026)
4. Devolucoes ano anterior (2025)

## Solucao

Consolidar para apenas 2 requisicoes cobrindo os 2 anos de uma vez:
1. Vendas de 01/01/2025 a 31/12/2026
2. Devolucoes de 01/01/2025 a 31/12/2026

Depois, separar os dados por ano no frontend usando o campo `Ano` (vendas) e `ENTREGA` (devolucoes).

## Arquivo a modificar

`src/hooks/useVendas.ts`

## Detalhes Tecnicos

### Logica de separacao dos dados

Vendas: cada item ja tem o campo `Ano` que indica o ano do registro.

```text
dadosAnoAtual = todosVendas.filter(item => item.Ano === anoAtual)
dadosAnoAnterior = todosVendas.filter(item => item.Ano === anoAnterior)
```

Devolucoes extras: usar o campo `ENTREGA` (data ISO) para extrair o ano.

```text
devAnoAtual = todasDevolucoes.filter(d => new Date(d.ENTREGA).getFullYear() === anoAtual)
devAnoAnterior = todasDevolucoes.filter(d => new Date(d.ENTREGA).getFullYear() === anoAnterior)
```

### Hook refatorado

- `fetchVendas` chamado uma vez: `01/01/${anoAnterior}` a `31/12/${anoAtual}`
- `fetchDevolucoesExtra` chamado uma vez: `01/01/${anoAnterior}` a `31/12/${anoAtual}`
- Dados separados por ano no retorno, mantendo a mesma interface de saida

### Funcao auxiliar `getUltimoDiaMes` 

Sera removida pois nao e mais utilizada.

## Resultado

- Requisicoes reduzidas de 4 para 2
- Menor carga na API e menor latencia total
- Interface de dados retornada pelo hook permanece identica (nenhuma alteracao nas paginas consumidoras)

