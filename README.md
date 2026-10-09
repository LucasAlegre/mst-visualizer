# mst-visualizer

<p align="right">
  <strong>English</strong> |
  <a href="README.pt-BR.md">Português (Brasil)</a>
</p>

**mst-visualizer** is an interactive, browser-based educational webtool for visualizing **Prim's** and **Kruskal's** minimum spanning tree (MST) algorithms.

The tool was built to make algorithmic decisions visible through synchronized graph and data structure views.

Live version: <https://lucasalegre.github.io/mst-visualizer/>

---

## ✨ Features

### Core functionality
- Choose between **Prim** (binary-heap version with `key[v]` / `pai[v]`) and **Kruskal** (with Union-Find: union by rank + path compression).
- Example graphs (including the lecture example A–G and the classic CLRS graph), JSON import/export, and **random connected graphs** (random spanning tree + extra edges by density).
- Step through each execution with:
  - **Run step**
  - **Auto run**
  - **Reset** to start over.

### Synchronized visualizations
- **Graph view**:
  - Prim: extracted vertices (set *X*), the current vertex *u*, the edge being examined, the edges crossing the cut (*X*, *V − X*), and the tree edges *T*.
  - Kruskal: the current edge, accepted edges, rejected edges (they would create a cycle), and vertices colored by component.
- **Data structure view**:
  - Prim: table with `key[v]`, `pai[v]` and heap membership, plus the heap contents.
  - Kruskal: sorted edge list with the status of each edge, Union-Find table (`pai[v]`, `rank[v]`) and a drawing of the Union-Find forest.
- Pseudocode with the active line highlighted, running total weight `w(T)` and `|T|`, and a step-by-step explanation.

### URL parameters
- `?algo=prim` (default) or `?algo=kruskal` preselects the algorithm.
- `?example=<key>` preselects an example graph: `aula` (default), `clrs`, `ties`, `sparse`.
- Example: <https://lucasalegre.github.io/mst-visualizer/?algo=kruskal&example=clrs>

### Usability & UI
- Projector-oriented layout with large typography and high-contrast visual states, light and dark themes.
- Fully client-side, with no backend or external framework.

---

## 🛠️ Tech stack

- Vanilla **HTML / CSS / JavaScript**
- No external UI framework

---

## 🎓 Credits

**Developed by**  
**Lucas Nunes Alegre**

**Original Style & UI Layout by**  
**Prof. Bruno Iochins Grisci** (from `scheduling-algorithms`)

**Development note**  
This webtool was created with the assistance of **Generative AI**.

---
## 📦 License

This project is licensed under the **MIT License**.

You are free to use, modify, and redistribute it, provided proper attribution is given.

See the `LICENSE` file for details.
