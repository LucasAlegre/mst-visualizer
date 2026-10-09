// Grafos de exemplo e gerador de grafos aleatórios (não direcionados).
// Cada grafo: { id, name, description, source, nodes: [{id, x, y}], edges: [[u, v, peso, posRótulo?]] }
// As coordenadas são livres: a visualização ajusta a escala automaticamente.
(function () {
  'use strict';

  const EXAMPLES = [
    {
      id: 'aula20',
      name: 'Exemplo das aulas 20 e 21',
      description: '7 vértices · 12 arestas · AGM de peso 13',
      source: 'A',
      nodes: [
        { id: 'A', x: 230, y: 60 },
        { id: 'B', x: 690, y: 60 },
        { id: 'C', x: 0, y: 270 },
        { id: 'D', x: 460, y: 270 },
        { id: 'E', x: 920, y: 270 },
        { id: 'F', x: 230, y: 480 },
        { id: 'G', x: 690, y: 480 }
      ],
      edges: [
        ['A', 'B', 1], ['C', 'A', 1], ['C', 'D', 2], ['C', 'F', 3], ['D', 'A', 2], ['D', 'B', 3],
        ['D', 'E', 5], ['D', 'F', 4], ['D', 'G', 5], ['E', 'B', 4], ['E', 'G', 2], ['F', 'G', 6]
      ]
    },
    {
      id: 'clrs',
      name: 'Grafo do CLRS (a a i)',
      description: '9 vértices · 14 arestas · AGM de peso 37',
      source: 'a',
      nodes: [
        { id: 'a', x: 0, y: 220 },
        { id: 'b', x: 190, y: 40 },
        { id: 'c', x: 460, y: 40 },
        { id: 'd', x: 730, y: 40 },
        { id: 'e', x: 920, y: 220 },
        { id: 'f', x: 730, y: 400 },
        { id: 'g', x: 460, y: 400 },
        { id: 'h', x: 190, y: 400 },
        { id: 'i', x: 325, y: 220 }
      ],
      edges: [
        ['a', 'b', 4], ['a', 'h', 8], ['b', 'c', 8], ['b', 'h', 11], ['c', 'd', 7], ['c', 'f', 4, 0.4],
        ['c', 'i', 2], ['d', 'e', 9], ['d', 'f', 14], ['e', 'f', 10], ['f', 'g', 2], ['g', 'h', 1],
        ['g', 'i', 6], ['h', 'i', 7]
      ]
    },
    {
      id: 'empates',
      name: 'Pesos iguais',
      description: '7 vértices · várias AGMs de peso 5',
      source: 'A',
      nodes: [
        { id: 'A', x: 0, y: 250 },
        { id: 'B', x: 230, y: 40 },
        { id: 'C', x: 560, y: 40 },
        { id: 'D', x: 790, y: 250 },
        { id: 'E', x: 560, y: 460 },
        { id: 'F', x: 230, y: 460 },
        { id: 'G', x: 395, y: 250 }
      ],
      edges: [
        ['A', 'B', 1], ['B', 'C', 1], ['C', 'D', 1], ['D', 'E', 1], ['E', 'F', 1], ['F', 'A', 1],
        ['G', 'A', 3], ['G', 'C', 3], ['G', 'E', 3]
      ]
    }
  ];

  // ── Grafo aleatório ──────────────────────────────────────────────────────
  // Sorteia pontos bem espaçados e liga pares próximos sem cruzar arestas
  // (grafo planar, fácil de ler); depois remove arestas mantendo-o conexo.

  const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function cross(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  function segmentsCross(p1, p2, q1, q2) {
    const d1 = cross(q1, q2, p1);
    const d2 = cross(q1, q2, p2);
    const d3 = cross(p1, p2, q1);
    const d4 = cross(p1, p2, q2);
    return d1 * d2 < 0 && d3 * d4 < 0;
  }

  function pointSegmentDistance(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  function isConnected(n, edges) {
    const adj = Array.from({ length: n }, () => []);
    edges.forEach(e => { adj[e.i].push(e.j); adj[e.j].push(e.i); });
    const seen = new Set([0]);
    const stack = [0];
    while (stack.length) {
      adj[stack.pop()].forEach(k => {
        if (!seen.has(k)) { seen.add(k); stack.push(k); }
      });
    }
    return seen.size === n;
  }

  function tryRandomGraph(n) {
    const W = 1000;
    const H = 560;
    let minDist = Math.sqrt((W * H) / n) * 0.62;
    const pts = [];
    let tries = 0;
    while (pts.length < n) {
      const p = { x: Math.random() * W, y: Math.random() * H };
      if (pts.every(q => Math.hypot(p.x - q.x, p.y - q.y) >= minDist)) pts.push(p);
      if (++tries > 4000) { minDist *= 0.9; tries = 0; }
    }
    pts.sort((a, b) => a.x - b.x); // A é o vértice mais à esquerda

    const pairs = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        pairs.push({ i, j, d: Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) });
      }
    }
    pairs.sort((a, b) => a.d - b.d);

    const chosen = [];
    for (const p of pairs) {
      if (p.d > minDist * 2.4) break;
      const a = pts[p.i];
      const b = pts[p.j];
      const crosses = chosen.some(c =>
        c.i !== p.i && c.i !== p.j && c.j !== p.i && c.j !== p.j &&
        segmentsCross(a, b, pts[c.i], pts[c.j]));
      if (crosses) continue;
      const nearNode = pts.some((q, k) => k !== p.i && k !== p.j && pointSegmentDistance(q, a, b) < 55);
      if (nearNode) continue;
      chosen.push(p);
    }
    if (!isConnected(n, chosen)) return null;

    // Mantém uma árvore geradora e cerca de 55% das arestas extras
    // (sobram ciclos suficientes para a AGM não ser trivial).
    const target = Math.round((n - 1) + (chosen.length - (n - 1)) * 0.55);
    let edges = chosen.slice();
    for (const e of shuffle(chosen.slice())) {
      if (edges.length <= target) break;
      const rest = edges.filter(x => x !== e);
      if (isConnected(n, rest)) edges = rest;
    }

    const ids = pts.map((_, i) => String.fromCharCode(65 + i));
    return {
      id: 'aleatorio',
      name: 'Grafo aleatório',
      description: `${n} vértices · ${edges.length} arestas`,
      source: 'A',
      nodes: pts.map((p, i) => ({ id: ids[i], x: Math.round(p.x), y: Math.round(p.y) })),
      edges: edges.map(e => [ids[e.i], ids[e.j], randInt(1, 12)])
    };
  }

  function randomGraph(n) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const g = tryRandomGraph(n);
      if (g) return g;
    }
    return null;
  }

  window.MSTGraphs = { EXAMPLES, randomGraph };
})();
