# mst-visualizer

<p align="right">
  <a href="README.md">English</a> |
  <strong>Português (Brasil)</strong>
</p>

**mst-visualizer** é uma ferramenta educacional interativa, executada no navegador, para visualização dos algoritmos de árvore geradora mínima (AGM / MST) de **Prim** e de **Kruskal**.

A ferramenta foi construída para tornar visíveis as decisões do algoritmo por meio de visualizações sincronizadas do grafo e das estruturas de dados.

Versão online: <https://lucasalegre.github.io/mst-visualizer/>

---

## ✨ Funcionalidades

### Funcionalidade principal
- Escolha entre **Prim** (versão com heap binário, `key[v]` / `pai[v]`) e **Kruskal** (com Union-Find: união por rank + compressão de caminho).
- Grafos de exemplo (incluindo o exemplo da aula A–G e o grafo clássico do CLRS), importação/exportação em JSON e **grafos aleatórios conexos** (árvore geradora aleatória + arestas extras conforme a densidade).
- Execução passo a passo com:
  - **Executar passo**
  - **Execução automática**
  - **Resetar** para começar de novo.

### Visualizações sincronizadas
- **Visualização em grafo**:
  - Prim: vértices já extraídos (conjunto *X*), o vértice atual *u*, a aresta examinada, as arestas que cruzam o corte (*X*, *V − X*) e as arestas da árvore *T*.
  - Kruskal: a aresta atual, arestas aceitas, arestas rejeitadas (formariam ciclo) e vértices coloridos por componente.
- **Visualização das estruturas de dados**:
  - Prim: tabela com `key[v]`, `pai[v]` e pertinência ao heap, além do conteúdo do heap.
  - Kruskal: lista de arestas ordenadas com o status de cada uma, tabela Union-Find (`pai[v]`, `rank[v]`) e um desenho da floresta Union-Find.
- Pseudocódigo com a linha ativa destacada, peso total `w(T)` e `|T|` acumulados, e explicação de cada passo.

### Parâmetros de URL
- `?algo=prim` (padrão) ou `?algo=kruskal` pré-seleciona o algoritmo.
- `?example=<chave>` pré-seleciona um grafo de exemplo: `aula` (padrão), `clrs`, `ties`, `sparse`.
- Exemplo: <https://lucasalegre.github.io/mst-visualizer/?algo=kruskal&example=clrs>

### Usabilidade e UI
- Layout voltado para projeção em sala, com tipografia grande e estados visuais contrastantes, temas claro e escuro.
- Totalmente no cliente, sem backend e sem framework externo.

---

## 🛠️ Stack tecnológica

- **HTML / CSS / JavaScript** puro
- Sem framework externo de UI

---

## 🎓 Créditos

**Desenvolvido por**  
**Lucas Nunes Alegre**

**Estilo Visual Original por**  
**Prof. Bruno Iochins Grisci** (baseado em `scheduling-algorithms`)

**Nota de desenvolvimento**  
Esta ferramenta foi criada com a assistência de **IA Generativa**.

---
## 📦 Licença

Este projeto está licenciado sob a **Licença MIT**.

Você pode usar, modificar e redistribuir, desde que haja a devida atribuição.

Veja o arquivo `LICENSE` para detalhes.
