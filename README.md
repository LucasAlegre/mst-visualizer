# mst-visualizer

<p align="right">
  <strong>English</strong> |
  <a href="README.pt-BR.md">Português (Brasil)</a>
</p>

**mst-visualizer** is an interactive, browser-based educational webtool for visualizing Prim's and Kruskal's minimum spanning tree algorithms.

The tool was built to make algorithmic decisions visible through synchronized graph and data structure views.

---

## ✨ Features

- **Prim / Kruskal switch** on the same graph (key <kbd>K</kbd>), so both algorithms can be compared side by side.
- **Large graph in the center**:
  - *Prim:* nodes in *X* (blue, already extracted from the heap) clearly separated from nodes in *V − X* (white), with *key*[*v*] next to each node; the extracted node (*u*) and the edge being evaluated are shown in orange, the best connection (*pai*[*v*], *v*) of each node to *X* is dashed and the tree *T* is solid.
  - *Kruskal:* the current edge in orange, accepted edges (in *T*) in blue, rejected edges (they would close a cycle) dashed in red, and each Union-Find component as a colored region around its nodes.
- **Data structures** in the side panel:
  - *Prim:* priority queue *H* ordered by *key* and the *key* / *pai* table.
  - *Kruskal:* edges in increasing order of cost (accepted, rejected, not examined) and the Union-Find table (*pai*, *rank*, root), showing path compression and union by rank.
- **Pseudocode** (the same versions as the course slides: `AlgoritmoPrimHeap` and `KruskalUF` with `Find` and `Union`), toggled by a button, with the current line highlighted.
- **Step-by-step execution**: forward, back, reset and auto-run with three speeds (keys <kbd>→</kbd> <kbd>←</kbd> <kbd>space</kbd> <kbd>A</kbd> <kbd>P</kbd> <kbd>K</kbd>).
- **Example graphs** (including the one from lectures 20 and 21) and connected planar **random graphs**; with Prim, click a node on the initial step to make it the source.
- Direct links to an algorithm/example/step: `?algo=kruskal&grafo=clrs&passo=5&pseudo=1` or `?algo=prim&grafo=aleatorio&n=8`.
- Colors and font (Lexend) match the course slides and the [dijkstra-visualizer](https://github.com/LucasAlegre/dijkstra-visualizer); the interface is in Portuguese. Fully client-side, no backend.

---

## 🛠️ Tech stack

- Vanilla **HTML / CSS / JavaScript**
- No external UI framework

---

## 🎓 Credits

**Developed by**  
**Lucas Nunes Alegre**

**Development note**  
This webtool was created with the assistance of **Generative AI**.

---
## 📦 License

This project is licensed under the **MIT License**.

You are free to use, modify, and redistribute it, provided proper attribution is given.

See the `LICENSE` file for details.
