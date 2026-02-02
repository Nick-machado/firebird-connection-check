
# Plano: Corrigir Posicoes dos Estados no Mapa do Brasil

## Problema Identificado

Os paths SVG dos estados brasileiros estao com coordenadas incorretas, causando o posicionamento errado como mostrado na imagem. Os estados aparecem dispersos ao inves de formarem o contorno correto do Brasil.

---

## Causa Raiz

Os paths SVG atualmente no componente `BrazilMap.tsx` foram gerados com um sistema de coordenadas incompativel com o viewBox utilizado (`0 0 600 500`).

---

## Solucao

Substituir todos os paths SVG pelos paths corretos do pacote `react-brazil-map`, que tem coordenadas funcionais e testadas.

---

## Alteracoes Tecnicas

### Arquivo: `src/components/dashboard/BrazilMap.tsx`

1. **Atualizar viewBox**
   - De: `viewBox="0 0 600 500"`
   - Para: `viewBox="0 0 450 460"`

2. **Substituir o objeto ESTADOS_PATHS**
   
   Os novos paths vem do repositorio react-brazil-map e foram validados. Exemplo:

   | Estado | Path Original (incorreto) | Path Novo (correto) |
   |--------|---------------------------|---------------------|
   | TO | M357.2,153.9l5.5,0.5... | M289.558,235.641c16.104... |
   | BA | M456.2,203.7l4.2-0.4... | M313.276,197.775c2.084... |
   | SP | M371.5,305.6l1.9,2... | M239.3,330.554c3.26-4.356... |
   | ... | ... | ... |

3. **Extrair e mapear todos os 27 estados**

   Cada estado tera seu path SVG atualizado:
   - AC, AL, AM, AP, BA, CE, DF, ES
   - GO, MA, MG, MS, MT, PA, PB, PE
   - PI, PR, RJ, RN, RO, RR, RS, SC
   - SE, SP, TO

---

## Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/dashboard/BrazilMap.tsx` | Substituir paths SVG e viewBox |

---

## Resultado Esperado

- Mapa do Brasil renderizado corretamente
- Estados posicionados geograficamente conforme o mapa real
- Interatividade (hover, click) mantida
- Gradiente de cores por vendas funcionando

