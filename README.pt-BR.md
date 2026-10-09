# mst-visualizer

<p align="right">
  <a href="README.md">English</a> |
  <strong>Português (Brasil)</strong>
</p>

**mst-visualizer** é uma ferramenta educacional interativa, executada no navegador, para visualização dos algoritmos de Prim e de Kruskal para árvore geradora mínima.

A ferramenta foi construída para tornar visíveis as decisões do algoritmo por meio de visualizações sincronizadas do grafo e das estruturas de dados.

---

## ✨ Funcionalidades

- **Alternância Prim / Kruskal** no mesmo grafo (tecla <kbd>K</kbd>), para comparar os dois algoritmos.
- **Grafo grande no centro**:
  - *Prim:* vértices em *X* (azuis, já extraídos do heap) claramente separados dos vértices em *V − X* (brancos), com *key*[*v*] junto de cada vértice; o vértice extraído (*u*) e a aresta avaliada aparecem em laranja, a melhor ligação (*pai*[*v*], *v*) de cada vértice a *X* fica tracejada e a árvore *T*, contínua.
  - *Kruskal:* a aresta atual em laranja, as aceitas (em *T*) em azul, as rejeitadas (formariam ciclo) tracejadas em vermelho, e cada componente do Union-Find como uma região colorida ao redor dos seus vértices.
- **Estruturas de dados** no painel lateral:
  - *Prim:* fila de prioridade *H* ordenada por *key* e a tabela *key* / *pai*.
  - *Kruskal:* arestas em ordem crescente de custo (aceitas, rejeitadas, não examinadas) e a tabela do Union-Find (*pai*, *rank*, raiz), mostrando a compressão de caminho e a união por rank.
- **Pseudocódigo** (as mesmas versões dos slides: `AlgoritmoPrimHeap` e `KruskalUF` com `Find` e `Union`), aberto por um botão, com a linha executada em destaque.
- **Execução passo a passo**: avançar, voltar, reiniciar e modo automático com três velocidades (teclas <kbd>→</kbd> <kbd>←</kbd> <kbd>espaço</kbd> <kbd>A</kbd> <kbd>P</kbd> <kbd>K</kbd>).
- **Grafos de exemplo** (incluindo o das aulas 20 e 21) e **grafos aleatórios** planares e conexos; no Prim, clique em um vértice no passo inicial para escolher a origem.
- Links diretos para um algoritmo/exemplo/passo: `?algo=kruskal&grafo=clrs&passo=5&pseudo=1` ou `?algo=prim&grafo=aleatorio&n=8`.
- Paleta e fonte (Lexend) iguais às dos slides da disciplina e do [dijkstra-visualizer](https://github.com/LucasAlegre/dijkstra-visualizer); totalmente no cliente, sem backend.

---

## 🛠️ Stack tecnológica

- **HTML / CSS / JavaScript** puro
- Sem framework externo de UI

---

## 🎓 Créditos

**Desenvolvido por**  
**Lucas Nunes Alegre**

**Nota de desenvolvimento**  
Esta ferramenta foi criada com a assistência de **IA Generativa**.

---
## 📦 Licença

Este projeto está licenciado sob a **Licença MIT**.

Você pode usar, modificar e redistribuir, desde que haja a devida atribuição.

Veja o arquivo `LICENSE` para detalhes.
