// Visualização dos algoritmos de Prim (com heap) e de Kruskal (com Union-Find)
// para árvore geradora mínima. Toda a execução é pré-calculada como uma lista
// de passos (snapshots); avançar/voltar apenas escolhe qual passo desenhar.
(function () {
  'use strict';

  const { EXAMPLES, randomGraph } = window.MSTGraphs;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const R = 27;       // raio dos vértices (unidades do SVG)
  const INF = Infinity;
  const COMP_COLORS = 8;

  const $ = id => document.getElementById(id);
  const ui = {
    layout: $('layout'),
    svg: $('graph'),
    title: $('title'),
    graphName: $('graphName'),
    sets: $('sets'),
    legend: $('legend'),
    sideTitle1: $('sideTitle1'),
    sideSub1: $('sideSub1'),
    sideBody1: $('sideBody1'),
    sideTitle2: $('sideTitle2'),
    sideSub2: $('sideSub2'),
    sideBody2: $('sideBody2'),
    pseudo: $('pseudo'),
    message: $('message'),
    stepCounter: $('stepCounter'),
    progressBar: $('progressBar'),
    pseudoPanel: $('pseudoPanel'),
    pseudoBtn: $('pseudoBtn'),
    primBtn: $('primBtn'),
    kruskalBtn: $('kruskalBtn'),
    graphsBtn: $('graphsBtn'),
    graphsMenu: $('graphsMenu'),
    exampleList: $('exampleList'),
    nodeCount: $('nodeCount'),
    nodeCountValue: $('nodeCountValue'),
    randomBtn: $('randomBtn'),
    helpBtn: $('helpBtn'),
    helpDialog: $('helpDialog'),
    resetBtn: $('resetBtn'),
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
    autoBtn: $('autoBtn'),
    speedSelect: $('speedSelect')
  };

  let algo = 'prim';    // 'prim' ou 'kruskal'
  let def = null;       // definição do grafo atual (para trocar de algoritmo)
  let graph = null;     // grafo normalizado
  let steps = [];       // snapshots da execução
  let current = 0;      // passo exibido
  let timer = null;     // execução automática
  let dom = null;       // elementos SVG do grafo atual

  const fmt = value => (value === INF ? '∞' : String(value));
  const nodeRef = id => `<span class="ref">${id}</span>`;
  const edgeName = e => `${e.u}–${e.v}`;
  const edgeRef = e => `(${nodeRef(e.u)}, ${nodeRef(e.v)})`;
  const math = s => `<i>${s}</i>`;

  // ── Pseudocódigos (os mesmos dos slides das aulas 20 e 21) ───────────────
  // Cada linha: [id, indentação ou 'meta', html]

  const PSEUDO = {
    prim: [
      {
        head: '<b>procedure</b> <span class="proc">PrimHeap</span>(<i>G</i> = (<i>V</i>, <i>E</i>), <i>s</i>)',
        lines: [
          ['p1', 'meta', '<b>Entrada:</b> grafo conexo <i>G</i> = (<i>V</i>, <i>E</i>) em listas de adjacência, custos <i>w</i>(<i>u</i>, <i>v</i>) e vértice inicial <i>s</i>'],
          ['p2', 'meta', '<b>Saída:</b> AGM <i>T</i>'],
          ['p3', 0, '<i>X</i> ← ∅, <i>T</i> ← ∅'],
          ['p4', 0, '<i>H</i> ← heap contendo apenas a tripla (0, <i>s</i>, ⊥)'],
          ['p5', 0, '<b>while</b> <i>H</i> não está vazio <b>do</b>'],
          ['p6', 1, '(<i>c</i>, <i>v</i>, <i>u</i>) ← ExtractMin(<i>H</i>) <span class="pseudo-comment">▷ aresta (<i>u</i>, <i>v</i>) de custo <i>c</i></span>'],
          ['p7', 1, '<b>if</b> <i>v</i> ∈ <i>X</i> <b>then</b>'],
          ['p8', 2, '<b>continue</b> <span class="pseudo-comment">▷ tripla obsoleta: <i>v</i> já está na árvore</span>'],
          ['p9', 1, 'Adicione <i>v</i> a <i>X</i>'],
          ['p10', 1, '<b>if</b> <i>u</i> ≠ ⊥ <b>then</b>'],
          ['p11', 2, '<i>T</i> ← <i>T</i> ∪ {(<i>u</i>, <i>v</i>)}'],
          ['p12', 2, '<b>if</b> |<i>T</i>| = |<i>V</i>| − 1 <b>then</b>'],
          ['p13', 3, '<b>Retorne</b> <i>T</i> <span class="pseudo-comment">▷ árvore completa</span>'],
          ['p14', 1, '<b>for</b> cada aresta (<i>v</i>, <i>x</i>) ∈ <i>E</i> com <i>x</i> ∉ <i>X</i> <b>do</b>'],
          ['p15', 2, 'Insert(<i>H</i>, (<i>w</i>(<i>v</i>, <i>x</i>), <i>x</i>, <i>v</i>))'],
          ['p16', 0, '<b>Retorne</b> <i>T</i>']
        ]
      }
    ],
    kruskal: [
      {
        head: '<b>procedure</b> <span class="proc">KruskalUF</span>(<i>G</i> = (<i>V</i>, <i>E</i>), <i>c</i>)',
        lines: [
          ['k1', 0, '<i>T</i> ← ∅'],
          ['k2', 0, 'ordene <i>E</i> em ordem crescente de custo'],
          ['k3', 0, 'Inicialize(<i>V</i>) <span class="pseudo-comment">▷ um conjunto por vértice</span>'],
          ['k4', 0, '<b>for</b> cada (<i>u</i>, <i>v</i>) ∈ <i>E</i>, na ordem escolhida <b>do</b>'],
          ['k5', 1, '<b>if</b> Find(<i>u</i>) ≠ Find(<i>v</i>) <b>then</b>'],
          ['k6', 2, '<i>T</i> ← <i>T</i> ∪ {(<i>u</i>, <i>v</i>)}'],
          ['k7', 2, 'Union(<i>u</i>, <i>v</i>)'],
          ['k8', 1, '<b>if</b> |<i>T</i>| = |<i>V</i>| − 1 <b>then</b>'],
          ['k9', 2, '<b>Retorne</b> <i>T</i>'],
          ['k10', 0, '<b>Retorne</b> <i>T</i>']
        ]
      },
      {
        head: '<b>procedure</b> <span class="proc">Find</span>(<i>v</i>) <span class="pseudo-comment">▷ com compressão</span>',
        lines: [
          ['f1', 0, '<b>if</b> <i>pai</i>[<i>v</i>] ≠ <i>v</i> <b>then</b>'],
          ['f2', 1, '<i>pai</i>[<i>v</i>] ← Find(<i>pai</i>[<i>v</i>])'],
          ['f3', 0, '<b>Retorne</b> <i>pai</i>[<i>v</i>]']
        ]
      },
      {
        head: '<b>procedure</b> <span class="proc">Union</span>(<i>u</i>, <i>v</i>) <span class="pseudo-comment">▷ por rank</span>',
        lines: [
          ['u1', 0, '<i>r</i> ← Find(<i>u</i>); <i>s</i> ← Find(<i>v</i>)'],
          ['u2', 0, '<b>if</b> <i>rank</i>[<i>r</i>] &lt; <i>rank</i>[<i>s</i>] <b>then</b> troque <i>r</i> e <i>s</i>'],
          ['u3', 0, '<i>pai</i>[<i>s</i>] ← <i>r</i>'],
          ['u4', 0, '<b>if</b> <i>rank</i>[<i>r</i>] = <i>rank</i>[<i>s</i>] <b>then</b> <i>rank</i>[<i>r</i>] ← <i>rank</i>[<i>r</i>] + 1']
        ]
      }
    ]
  };

  const LEGEND = {
    prim: [
      ['node-x', 'em <i>X</i> (já na árvore)'],
      ['node-rest', 'em <i>V − X</i>'],
      ['node-current', '<i>v</i> (extraído agora)'],
      ['line-active', 'aresta extraída / inserida'],
      ['line-cand', 'candidata em <i>H</i>'],
      ['line-tree', 'árvore <i>T</i>']
    ],
    kruskal: [
      ['line-active', 'aresta examinada'],
      ['line-tree', 'aceita (em <i>T</i>)'],
      ['line-rej', 'rejeitada (formaria ciclo)'],
      ['comp', 'componente (conjunto do Union-Find)']
    ]
  };

  // ── Grafo ────────────────────────────────────────────────────────────────

  function normalize(d) {
    const nodes = d.nodes.map(n => ({ ...n }));
    const edges = d.edges.map(([u, v, w, t]) => ({ u, v, w, t: t == null ? 0.5 : t }));
    const order = new Map(nodes.map((n, i) => [n.id, i]));
    const adj = new Map(nodes.map(n => [n.id, []]));
    edges.forEach((e, i) => {
      adj.get(e.u).push({ to: e.v, w: e.w, edge: i });
      adj.get(e.v).push({ to: e.u, w: e.w, edge: i });
    });
    adj.forEach(list => list.sort((a, b) => order.get(a.to) - order.get(b.to)));
    const source = order.has(d.source) ? d.source : nodes[0].id;
    return { name: d.name, description: d.description, source, nodes, edges, order, adj };
  }

  // ── Prim (pseudocódigo PrimHeap do slide da aula 20) ─────────────────
  // O heap guarda triplas (c, v, u): a aresta (u, v) de custo c, com u ∈ X.
  // Começa só com (0, s, ⊥); quando v entra em X, insere as arestas de v para
  // vértices fora de X. Triplas com v já em X são obsoletas e são descartadas.
  // Empates seguem a ordem das tuplas em Python (heapq): (c, v, u).

  const cmpTriple = (a, b) => {
    if (a.c !== b.c) return a.c - b.c;
    if (a.v !== b.v) return a.v < b.v ? -1 : 1;
    if (a.p !== b.p) {
      if (a.p === null) return -1;
      if (b.p === null) return 1;
      return a.p < b.p ? -1 : 1;
    }
    return a.seq - b.seq;
  };
  const tripleRef = t => `(${t.c}, ${nodeRef(t.v)}, ${t.p === null ? '⊥' : nodeRef(t.p)})`;

  function buildPrim(g) {
    const s = g.source;
    const ids = g.nodes.map(n => n.id);
    const n = ids.length;
    const X = [];
    const inX = new Set();
    const cost = {};      // custo da aresta que ligou v à árvore
    const pai = {};
    const paiEdge = {};
    const H = [];         // triplas { c, v, p, edge, seq }
    let seq = 0;
    const T = [];
    let W = 0;
    const out = [];

    const snap = extra => out.push(Object.assign({
      X: X.slice(), cost: { ...cost }, pai: { ...pai }, paiEdge: { ...paiEdge },
      H: H.map(t => ({ ...t })), T: T.slice(), W,
      wStar: null, target: null, edge: null, inserted: null, extracted: null, stale: null
    }, extra));

    snap({
      phase: 'input',
      lines: ['p1', 'p2'],
      msg: `<b>Entrada:</b> grafo não direcionado com ${n} vértices e ${g.edges.length} arestas com custos, e vértice inicial <i>s</i> = ${nodeRef(s)}. ` +
        `<b>Saída:</b> uma árvore geradora mínima <i>T</i>. <span class="tip">Clique em um vértice para mudar a origem.</span>`
    });

    H.push({ c: 0, v: s, p: null, edge: null, seq: seq++ });
    snap({
      phase: 'init',
      lines: ['p3', 'p4'],
      inserted: 0,
      msg: `<b>Inicialização:</b> <i>X</i> = ∅ e <i>T</i> = ∅. <i>H</i> começa <b>apenas</b> com a tripla (0, ${nodeRef(s)}, ⊥).`
    });

    let complete = false;
    while (H.length > 0) {
      let k = 0;
      H.forEach((t, idx) => { if (cmpTriple(t, H[k]) < 0) k = idx; });
      const [t] = H.splice(k, 1);
      const v = t.v;

      if (inX.has(v)) {
        snap({
          phase: 'stale',
          lines: ['p5', 'p6', 'p7', 'p8'],
          stale: v,
          extracted: { ...t, stale: true },
          msg: `<b>ExtractMin(<i>H</i>)</b> = ${tripleRef(t)}. Como ${nodeRef(v)} já está em <i>X</i>, a tripla é <b>obsoleta</b> (a aresta formaria um ciclo): descartada (<b>continue</b>).`
        });
        continue;
      }

      inX.add(v);
      X.push(v);
      cost[v] = t.c;
      const lines = ['p5', 'p6', 'p7', 'p9', 'p10'];
      let msg = `<b>ExtractMin(<i>H</i>)</b> = ${tripleRef(t)}: ${nodeRef(v)} ∉ <i>X</i>, então ${nodeRef(v)} entra em <i>X</i>.`;
      if (t.p !== null) {
        pai[v] = t.p;
        paiEdge[v] = t.edge;
        T.push(t.edge);
        W += t.c;
        lines.push('p11');
        msg += ` A aresta (${nodeRef(t.p)}, ${nodeRef(v)}) de custo ${t.c} entra em <i>T</i> <span class="good">(<i>w</i>(<i>T</i>) = ${W})</span>.`;
      } else {
        msg += ` <i>u</i> = ⊥: é a origem, nenhuma aresta entra em <i>T</i>.`;
      }
      snap({ phase: 'extract', lines, wStar: v, edge: t.edge, extracted: { ...t, stale: false }, msg });

      if (T.length === n - 1) {
        complete = true;
        snap({
          phase: 'done',
          lines: ['p12', 'p13'],
          msg: `<b>|<i>T</i>| = ${T.length} = |<i>V</i>| − 1: fim!</b> <i>T</i> é uma árvore geradora mínima de custo <b><i>w</i>(<i>T</i>) = ${W}</b>.` +
            (H.length ? ` As ${H.length} triplas que restam em <i>H</i> nem precisam ser extraídas.` : '')
        });
        break;
      }

      for (const { to: z, w, edge } of g.adj.get(v)) {
        if (inX.has(z)) continue;
        const ins = { c: w, v: z, p: v, edge, seq: seq++ };
        H.push(ins);
        snap({
          phase: 'insert',
          lines: ['p14', 'p15'],
          wStar: v,
          target: z,
          edge,
          inserted: ins.seq,
          msg: `Aresta (${nodeRef(v)}, ${nodeRef(z)}) de custo ${w} com ${nodeRef(z)} ∉ <i>X</i>: Insert(<i>H</i>, ${tripleRef(ins)}).`
        });
      }

      if (H.length > 0) {
        const skipped = g.adj.get(v).filter(a => inX.has(a.to)).length - (t.p !== null ? 1 : 0);
        snap({
          phase: 'pause',
          lines: ['p5'],
          msg: `Todas as arestas de ${nodeRef(v)} para vértices fora de <i>X</i> foram inseridas em <i>H</i>.` +
            (skipped > 0 ? ' Arestas para vértices já em <i>X</i> não são inseridas (formariam ciclo).' : '') +
            ` <span class="tip"><i>H</i> não está vazio; o próximo passo é ExtractMin(<i>H</i>). Qual tripla será extraída?</span>`
        });
      }
    }

    if (!complete) {
      snap({
        phase: 'done',
        lines: ['p5', 'p16'],
        msg: `<b><i>H</i> está vazio: fim!</b> ` + (T.length === n - 1
          ? `<i>T</i> é uma árvore geradora mínima de custo <b><i>w</i>(<i>T</i>) = ${W}</b>.`
          : `O grafo é desconexo: <i>T</i> é uma AGM só da componente de ${nodeRef(s)} (custo ${W}).`)
      });
    }
    return out;
  }

  // ── Kruskal (pseudocódigo KruskalUF do slide da aula 21) ─────────────────

  function buildKruskal(g) {
    const ids = g.nodes.map(n => n.id);
    const n = ids.length;
    const pai = {};
    const rank = {};
    const status = {};
    const T = [];
    let W = 0;
    let sorted = null;
    const out = [];

    const snap = extra => out.push(Object.assign({
      pai: { ...pai }, rank: { ...rank }, status: { ...status }, T: T.slice(), W,
      sorted, edge: null, targets: [], finds: null, changedPai: {}, changedRank: null
    }, extra));

    snap({
      phase: 'input',
      lines: [],
      msg: `<b>Entrada:</b> grafo não direcionado com ${n} vértices e ${g.edges.length} arestas com custos <i>c<sub>e</sub></i>. ` +
        `<b>Saída:</b> uma árvore geradora mínima <i>T</i>.`
    });

    sorted = g.edges.map((_, i) => i).sort((a, b) => (g.edges[a].w - g.edges[b].w) || (a - b));
    ids.forEach(id => { pai[id] = id; rank[id] = 0; });
    snap({
      phase: 'init',
      lines: ['k1', 'k2', 'k3'],
      msg: `<b>Inicialização:</b> <i>T</i> = ∅; as arestas são <b>ordenadas por custo</b> (empates: ordem de entrada); ` +
        `Inicialize(<i>V</i>): cada vértice é sua própria raiz (<i>pai</i>[<i>v</i>] = <i>v</i>, <i>rank</i>[<i>v</i>] = 0).`
    });

    let stopped = false;
    for (let p = 0; p < sorted.length; p++) {
      const i = sorted[p];
      const e = g.edges[i];
      const changed = {};
      const find = x => {
        if (pai[x] !== x) {
          const root = find(pai[x]);
          if (pai[x] !== root) { changed[x] = pai[x]; pai[x] = root; }
        }
        return pai[x];
      };
      const r = find(e.u);
      const s = find(e.v);
      const compressed = Object.keys(changed);
      const compMsg = compressed.length
        ? ` <span class="tip">Compressão de caminho: ${compressed.map(x => `<i>pai</i>[${nodeRef(x)}] ← ${nodeRef(pai[x])}`).join(', ')}.</span>`
        : '';
      const findLines = compressed.length ? ['f1', 'f2', 'f3'] : ['f1', 'f3'];
      const finds = `Find(${nodeRef(e.u)}) = ${nodeRef(r)} e Find(${nodeRef(e.v)}) = ${nodeRef(s)}`;
      const head = `Aresta ${edgeRef(e)} de custo ${e.w}: ${finds}`;

      if (r === s) {
        status[i] = 'rej';
        snap({
          phase: 'reject',
          lines: ['k4', 'k5', ...findLines],
          edge: i,
          pos: p,
          targets: [e.u, e.v],
          finds: { r, s },
          changedPai: changed,
          msg: `${head}: <b>mesma componente</b>. Adicionar a aresta formaria um ciclo: <span class="bad">rejeitada</span>.${compMsg}`
        });
        continue;
      }

      snap({
        phase: 'test',
        lines: ['k4', 'k5', ...findLines],
        edge: i,
        pos: p,
        targets: [e.u, e.v],
        finds: { r, s },
        changedPai: changed,
        msg: `${head}: <b>componentes diferentes</b>, a aresta não forma ciclo.${compMsg}`
      });

      T.push(i);
      W += e.w;
      status[i] = 'acc';
      let a = r;
      let b = s;
      if (rank[a] < rank[b]) [a, b] = [b, a];
      const rankMsg = rank[r] === rank[s]
        ? `<i>rank</i>[${nodeRef(r)}] = <i>rank</i>[${nodeRef(s)}] = ${rank[r]}`
        : `<i>rank</i>[${nodeRef(r)}] = ${rank[r]} ${rank[r] < rank[s] ? '&lt;' : '&gt;'} <i>rank</i>[${nodeRef(s)}] = ${rank[s]}`;
      pai[b] = a;
      let rankUp = null;
      if (rank[a] === rank[b]) { rank[a] += 1; rankUp = a; }
      snap({
        phase: 'union',
        lines: ['k6', 'k7', 'u1', 'u2', 'u3', ...(rankUp ? ['u4'] : [])],
        edge: i,
        pos: p,
        targets: [e.u, e.v],
        changedPai: { [b]: b },
        changedRank: rankUp,
        msg: `<span class="good">Aceita:</span> ${edgeRef(e)} entra em <i>T</i> (<i>w</i>(<i>T</i>) = ${W}). ` +
          `Union: ${rankMsg}, então <i>pai</i>[${nodeRef(b)}] ← ${nodeRef(a)}` +
          (rankUp ? ` e, como os ranks eram iguais, <i>rank</i>[${nodeRef(a)}] ← ${rank[a]}.` : '.')
      });

      if (T.length === n - 1) {
        sorted.slice(p + 1).forEach(j => { status[j] = 'skip'; });
        const rest = sorted.length - p - 1;
        snap({
          phase: 'done',
          lines: ['k8', 'k9'],
          msg: `<b>|<i>T</i>| = ${T.length} = |<i>V</i>| − 1: fim!</b> <i>T</i> é uma árvore geradora mínima de custo <b><i>w</i>(<i>T</i>) = ${W}</b>.` +
            (rest ? ` As ${rest} arestas restantes nem precisam ser examinadas.` : '')
        });
        stopped = true;
        break;
      }
    }

    if (!stopped) {
      snap({
        phase: 'done',
        lines: ['k10'],
        msg: `<b>Todas as arestas foram examinadas.</b> ` + (T.length === n - 1
          ? `<i>T</i> é uma árvore geradora mínima de custo <b><i>w</i>(<i>T</i>) = ${W}</b>.`
          : `O grafo é desconexo: <i>T</i> é uma floresta geradora mínima de custo ${W}.`)
      });
    }
    return out;
  }

  function rootOf(pai, x) {
    while (pai[x] !== x) x = pai[x];
    return x;
  }

  // Componentes atuais (conjuntos do Union-Find), na ordem dos vértices.
  function components(state) {
    const groups = new Map();
    graph.nodes.forEach(nd => {
      const r = state.pai[nd.id] === undefined ? nd.id : rootOf(state.pai, nd.id);
      if (!groups.has(r)) groups.set(r, []);
      groups.get(r).push(nd.id);
    });
    return [...groups.values()];
  }

  // ── Desenho do grafo (feito uma vez por grafo) ───────────────────────────

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
    if (parent) parent.appendChild(el);
    return el;
  }

  function edgeGeometry(g, e) {
    const a = g.nodes[g.order.get(e.u)];
    const b = g.nodes[g.order.get(e.v)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    return {
      d: `M${(a.x + ux * R).toFixed(1)},${(a.y + uy * R).toFixed(1)} L${(b.x - ux * R).toFixed(1)},${(b.y - uy * R).toFixed(1)}`,
      lx: a.x + dx * e.t,
      ly: a.y + dy * e.t
    };
  }

  // Escolhe, ao redor de cada vértice, direções livres de arestas para o
  // rótulo de custo e para a etiqueta "origem".
  const SPOTS = [-90, -45, -135, 0, 180, 45, 135, 90].map(deg => (deg * Math.PI) / 180);

  function freeDirections(g, n) {
    const dirs = [];
    g.edges.forEach(e => {
      if (e.u !== n.id && e.v !== n.id) return;
      const other = g.nodes[g.order.get(e.u === n.id ? e.v : e.u)];
      dirs.push(Math.atan2(other.y - n.y, other.x - n.x));
    });
    const gap = a => (dirs.length
      ? Math.min(...dirs.map(d => { const x = Math.abs(a - d) % (2 * Math.PI); return Math.min(x, 2 * Math.PI - x); }))
      : Math.PI);
    return SPOTS.map((a, i) => ({ a, score: Math.min(gap(a), Math.PI / 2) - i * 1e-3 }))
      .sort((p, q) => q.score - p.score)
      .map(p => p.a);
  }

  function buildGraph(g) {
    const svg = ui.svg;
    svg.innerHTML = '';

    const xs = g.nodes.map(n => n.x);
    const ys = g.nodes.map(n => n.y);
    const minX = Math.min(...xs) - 120;
    const maxX = Math.max(...xs) + 120;
    const minY = Math.min(...ys) - 80;
    const maxY = Math.max(...ys) + 72;
    svg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);

    const halos = svgEl('g', { class: 'layer-halos' }, svg);
    const edgeLayer = svgEl('g', { class: 'layer-edges' }, svg);
    const labelLayer = svgEl('g', { class: 'layer-labels' }, svg);
    const nodeLayer = svgEl('g', { class: 'layer-nodes' }, svg);

    const edges = g.edges.map(e => {
      const geo = edgeGeometry(g, e);
      const path = svgEl('path', { d: geo.d, class: 'edge' }, edgeLayer);
      const label = svgEl('text', { x: geo.lx.toFixed(1), y: geo.ly.toFixed(1), class: 'weight' }, labelLayer);
      label.textContent = e.w;
      return { path, label };
    });

    const nodes = {};
    g.nodes.forEach(n => {
      const halo = svgEl('circle', { cx: n.x, cy: n.y, r: R + 20, class: 'halo' }, halos);
      const group = svgEl('g', { class: 'node', 'data-id': n.id }, nodeLayer);
      svgEl('circle', { cx: n.x, cy: n.y, r: R + 7, class: 'ring' }, group);
      svgEl('circle', { cx: n.x, cy: n.y, r: R, class: 'body' }, group);
      const label = svgEl('text', { x: n.x, y: n.y, class: 'label' }, group);
      label.textContent = n.id;

      const dirs = freeDirections(g, n);
      const badgeAngle = dirs[0];
      const badge = svgEl('g', { class: 'badge hidden' }, group);
      const badgeRect = svgEl('rect', { rx: 8, ry: 8, height: 28 }, badge);
      const badgeText = svgEl('text', {}, badge);

      if (algo === 'prim' && n.id === g.source) {
        const apart = a => Math.abs(Math.atan2(Math.sin(a - badgeAngle), Math.cos(a - badgeAngle))) >= Math.PI / 2;
        const a = dirs.find(apart);
        const tag = svgEl('text', {
          x: (n.x + Math.cos(a) * (R + 22 + 26 * Math.abs(Math.cos(a)))).toFixed(1),
          y: (n.y + Math.sin(a) * (R + 20)).toFixed(1),
          class: 'source-tag'
        }, group);
        tag.textContent = 'origem';
      }

      group.addEventListener('click', () => pickSource(n.id));
      nodes[n.id] = { group, halo, badge, badgeRect, badgeText, badgeAngle, x: n.x, y: n.y };
    });

    dom = { nodes, edges };
  }

  // ── Desenho de um passo ──────────────────────────────────────────────────

  function setBadge(d, text, cls) {
    d.badgeText.textContent = text;
    const width = 20 + 12 * text.length;
    const ca = Math.cos(d.badgeAngle);
    const cx = d.x + ca * (R + 20 + Math.abs(ca) * (width / 2 - 12));
    const cy = d.y + Math.sin(d.badgeAngle) * (R + 20);
    d.badgeText.setAttribute('x', cx.toFixed(1));
    d.badgeText.setAttribute('y', cy.toFixed(1));
    d.badgeRect.setAttribute('x', (cx - width / 2).toFixed(1));
    d.badgeRect.setAttribute('y', (cy - 14).toFixed(1));
    d.badgeRect.setAttribute('width', width);
    d.badge.setAttribute('class', `badge ${cls}`);
  }

  function setEdge(i, kind) {
    const { path, label } = dom.edges[i];
    path.setAttribute('class', `edge ${kind}`);
    label.setAttribute('class', `weight ${kind}`);
  }

  // Para cada v fora de X, a tripla não obsoleta mais barata em H (se houver).
  function bestInHeap(state) {
    const inX = new Set(state.X);
    const best = {};
    state.H.forEach(t => {
      if (inX.has(t.v)) return;
      if (!best[t.v] || cmpTriple(t, best[t.v]) < 0) best[t.v] = t;
    });
    return best;
  }

  function renderPrimGraph(state) {
    const inX = new Set(state.X);
    const inT = new Set(state.T);
    const cand = new Set(state.H.filter(t => t.edge !== null && !inX.has(t.v)).map(t => t.edge));
    const best = bestInHeap(state);
    const started = state.phase !== 'input';

    graph.edges.forEach((e, i) => {
      let kind = 'base';
      if (i === state.edge) kind = 'active';
      else if (inT.has(i)) kind = 'tree';
      else if (cand.has(i)) kind = 'cand';
      else if (inX.has(e.u) && inX.has(e.v)) kind = 'inside';
      setEdge(i, kind);
    });

    graph.nodes.forEach(n => {
      const d = dom.nodes[n.id];
      const classes = ['node'];
      if (inX.has(n.id)) classes.push('in-x');
      if (n.id === state.wStar) classes.push('current');
      if (n.id === state.target) classes.push('target');
      if (n.id === state.stale) classes.push('stale');
      d.group.setAttribute('class', classes.join(' '));
      d.halo.setAttribute('class', inX.has(n.id) ? 'halo on' : 'halo');
      if (!started) {
        d.badge.setAttribute('class', 'badge hidden');
        return;
      }
      if (inX.has(n.id)) {
        setBadge(d, String(state.cost[n.id]), n.id === state.wStar ? 'current' : 'in-x');
      } else if (best[n.id]) {
        setBadge(d, String(best[n.id].c), n.id === state.target ? 'changed' : '');
      } else {
        d.badge.setAttribute('class', 'badge hidden');
      }
    });
  }

  function renderKruskalGraph(state) {
    const inT = new Set(state.T);
    const targets = new Set(state.targets);
    graph.edges.forEach((e, i) => {
      let kind = 'base';
      const st = state.status[i];
      if (i === state.edge) kind = state.phase === 'reject' ? 'rejnow' : (state.phase === 'union' ? 'tree' : 'active');
      else if (inT.has(i)) kind = 'tree';
      else if (st === 'rej') kind = 'rejected';
      else if (st === 'skip') kind = 'skipped';
      setEdge(i, kind);
    });

    const colorOf = {};
    if (state.phase !== 'input') {
      components(state).forEach(c => {
        if (c.length < 2) return;
        const color = graph.order.get(c[0]) % COMP_COLORS;
        c.forEach(id => { colorOf[id] = color; });
      });
    }
    graph.nodes.forEach(n => {
      const d = dom.nodes[n.id];
      const classes = ['node'];
      if (targets.has(n.id)) classes.push(state.phase === 'reject' ? 'target rej' : 'target');
      d.group.setAttribute('class', classes.join(' '));
      d.halo.setAttribute('class', colorOf[n.id] === undefined ? 'halo' : `halo comp comp-${colorOf[n.id]}`);
      d.badge.setAttribute('class', 'badge hidden');
    });
  }

  function setList(ids, fmtItem) {
    return ids.length ? `{ ${ids.map(fmtItem).join(', ')} }` : '∅';
  }

  function renderSets(state) {
    const wT = `<div class="set set-w"><span class="set-name">w</span>(<span class="set-name">T</span>) = <b>${state.W}</b></div>`;
    if (algo === 'prim') {
      const inX = new Set(state.X);
      ui.sets.innerHTML =
        `<div class="set set-x"><span class="set-name">X</span> = ${setList(state.X, nodeRef)}</div>` +
        `<div class="set set-rest"><span class="set-name">V − X</span> = ${setList(graph.nodes.map(n => n.id).filter(id => !inX.has(id)), nodeRef)}</div>` +
        wT;
    } else {
      ui.sets.innerHTML =
        `<div class="set set-t"><span class="set-name">T</span> = ${setList(state.T, i => `<span class="ref">${edgeName(graph.edges[i])}</span>`)}</div>` +
        wT;
    }
  }

  function renderPrimSide(state) {
    ui.sideTitle1.innerHTML = 'Fila de prioridade <i>H</i>';
    ui.sideSub1.innerHTML = 'triplas (<i>c</i>, <i>v</i>, <i>u</i>): aresta (<i>u</i>, <i>v</i>) de custo <i>c</i>, em ordem (o primeiro é o mínimo); triplas <span class="obsolete-text">cinza</span> são obsoletas';
    ui.sideTitle2.innerHTML = 'Árvore <i>T</i>';
    ui.sideSub2.innerHTML = 'para <i>v</i> ∈ <i>X</i>: a aresta que ligou <i>v</i> à árvore; para <i>v</i> ∉ <i>X</i>: a candidata mais barata em <i>H</i>';

    const inX = new Set(state.X);
    if (state.phase === 'input') {
      ui.sideBody1.innerHTML = '<div class="heap"><p class="empty">ainda não inicializada</p></div>';
    } else {
      const chip = (cls, t, title) =>
        `<div class="${cls.join(' ')}" title="${title}"><span class="chip-id">${t.v}</span><span class="chip-key">${t.c}</span><span class="chip-via">${t.p === null ? '⊥' : `de ${t.p}`}</span></div>`;
      const chips = [];
      if (state.extracted) {
        const t = state.extracted;
        chips.push(chip(t.stale ? ['chip', 'leaving', 'discarded'] : ['chip', 'leaving'], t,
          t.stale ? 'extraída agora: obsoleta, descartada' : 'extraída agora'));
      }
      state.H.slice().sort(cmpTriple).forEach((t, idx) => {
        const cls = ['chip'];
        const obsolete = inX.has(t.v);
        if (idx === 0) cls.push('min');
        if (obsolete) cls.push('obsolete');
        if (t.seq === state.inserted) cls.push('changed');
        chips.push(chip(cls, t, obsolete ? 'tripla obsoleta' : `(${t.c}, ${t.v}, ${t.p === null ? '⊥' : t.p})`));
      });
      ui.sideBody1.innerHTML = `<div class="heap">${chips.length ? chips.join('') : '<p class="empty">vazia</p>'}</div>`;
    }

    const best = bestInHeap(state);
    const started = state.phase !== 'input';
    const rows = graph.nodes.map(n => {
      const id = n.id;
      const cls = [inX.has(id) ? 'in-x' : 'rest'];
      if (id === state.wStar) cls.push('current');
      else if (id === state.target) cls.push('changed');
      let p = '–';
      let c = '–';
      let e = '';
      if (started && inX.has(id)) {
        p = state.pai[id] !== undefined ? state.pai[id] : '⊥';
        c = `<b>${state.cost[id]}</b>`;
        e = state.pai[id] !== undefined ? `${state.pai[id]}–${id}` : 'origem';
      } else if (started && best[id]) {
        p = `<span class="muted">${best[id].p}</span>`;
        c = `<span class="muted">${best[id].c}</span>`;
        e = `<span class="muted">candidata ${best[id].p}–${id}</span>`;
      }
      return `<tr class="${cls.join(' ')}"><td class="col-v"><span class="dot"></span>${id}</td><td class="col-pred">${p}</td><td class="col-key">${c}</td><td class="col-path">${e}</td></tr>`;
    }).join('');
    ui.sideBody2.innerHTML = `<table class="dist-table"><thead><tr><th>v</th><th>pai</th><th>custo</th><th>aresta</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderKruskalSide(state) {
    ui.sideTitle1.innerHTML = 'Arestas em ordem crescente';
    ui.sideSub1.innerHTML = '<span class="acc-text">aceitas</span> entram em <i>T</i>; <span class="rej-text">rejeitadas</span> formariam um ciclo';
    ui.sideTitle2.innerHTML = 'Union-Find';
    ui.sideSub2.innerHTML = 'raízes (<i>pai</i>[<i>v</i>] = <i>v</i>) representam as componentes';

    if (!state.sorted) {
      ui.sideBody1.innerHTML = '<div class="edge-list"><p class="empty">ainda não ordenadas</p></div>';
    } else {
      ui.sideBody1.innerHTML = `<div class="edge-list">${state.sorted.map(i => {
        const e = graph.edges[i];
        const cls = ['echip'];
        const st = state.status[i];
        if (i === state.edge) cls.push(state.phase === 'reject' ? 'rej now' : (state.phase === 'union' ? 'acc now' : 'cur'));
        else if (st === 'acc') cls.push('acc');
        else if (st === 'rej') cls.push('rej');
        else if (st === 'skip') cls.push('skip');
        return `<div class="${cls.join(' ')}"><span class="chip-id">${edgeName(e)}</span><span class="chip-key">${e.w}</span></div>`;
      }).join('')}</div>`;
    }

    const started = state.phase !== 'input';
    const comps = started ? components(state) : [];
    const compsLine = started
      ? `<p class="comps">Componentes: ${comps.map(c => `{${c.join(', ')}}`).join(' ')}</p>`
      : '';
    const targets = new Set(state.targets);
    const rows = graph.nodes.map(n => {
      const id = n.id;
      const cls = [];
      const isRoot = started && state.pai[id] === id;
      if (isRoot) cls.push('root');
      if (targets.has(id)) cls.push('current');
      const paiChanged = state.changedPai[id] !== undefined && state.changedPai[id] !== id;
      const unionChanged = state.changedPai[id] === id;
      if (paiChanged || unionChanged || id === state.changedRank) cls.push('changed');
      let p = '–';
      let rk = '–';
      let root = '';
      if (started) {
        p = paiChanged ? `<s>${state.changedPai[id]}</s> <b>${state.pai[id]}</b>` : (unionChanged ? `<s>${id}</s> <b>${state.pai[id]}</b>` : state.pai[id]);
        rk = id === state.changedRank ? `<s>${state.rank[id] - 1}</s> <b>${state.rank[id]}</b>` : state.rank[id];
        root = isRoot ? 'raiz' : `raiz ${rootOf(state.pai, id)}`;
      }
      return `<tr class="${cls.join(' ')}"><td class="col-v"><span class="dot"></span>${id}</td><td class="col-key">${p}</td><td class="col-pred">${rk}</td><td class="col-path">${root}</td></tr>`;
    }).join('');
    ui.sideBody2.innerHTML = `${compsLine}<table class="dist-table uf-table"><thead><tr><th>v</th><th>pai</th><th>rank</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderPseudoPanel() {
    ui.pseudo.innerHTML = PSEUDO[algo].map(proc =>
      `<p class="pseudo-head">${proc.head}</p><ol class="pseudo-lines">${proc.lines.map(([id, ind, html]) =>
        `<li data-line="${id}" class="${ind === 'meta' ? 'meta' : (ind ? `in${ind}` : '')}">${html}</li>`).join('')}</ol>`
    ).join('');
  }

  function renderLegend() {
    ui.legend.innerHTML = LEGEND[algo].map(([sw, text]) => `<li><span class="swatch ${sw}"></span><span>${text}</span></li>`).join('');
  }

  function render() {
    const state = steps[current];
    if (algo === 'prim') {
      renderPrimGraph(state);
      renderPrimSide(state);
    } else {
      renderKruskalGraph(state);
      renderKruskalSide(state);
    }
    renderSets(state);
    ui.pseudo.querySelectorAll('li[data-line]').forEach(li => {
      li.classList.toggle('hl', state.lines.includes(li.dataset.line));
    });
    ui.svg.classList.toggle('pickable', algo === 'prim' && state.phase === 'input');
    ui.message.innerHTML = state.msg;
    ui.stepCounter.textContent = `Passo ${current} de ${steps.length - 1}`;
    ui.progressBar.style.width = `${(100 * current) / (steps.length - 1)}%`;
    ui.prevBtn.disabled = current === 0;
    ui.resetBtn.disabled = current === 0;
    ui.nextBtn.disabled = current === steps.length - 1;
  }

  // ── Interação ────────────────────────────────────────────────────────────

  function goTo(index) {
    current = Math.max(0, Math.min(steps.length - 1, index));
    render();
    if (current === steps.length - 1) stopAuto();
  }

  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
    ui.autoBtn.innerHTML = '▶▶ Automático';
    ui.autoBtn.classList.remove('active');
  }

  function startAuto() {
    if (current === steps.length - 1) goTo(0);
    stopAuto();
    timer = setInterval(() => goTo(current + 1), Number(ui.speedSelect.value));
    ui.autoBtn.innerHTML = '❚❚ Pausar';
    ui.autoBtn.classList.add('active');
  }

  function loadGraph(d) {
    stopAuto();
    def = d;
    graph = normalize(d);
    steps = algo === 'prim' ? buildPrim(graph) : buildKruskal(graph);
    buildGraph(graph);
    ui.graphName.textContent = `${graph.name} · ${graph.description}`;
    goTo(0);
  }

  function setAlgo(name) {
    algo = name === 'kruskal' ? 'kruskal' : 'prim';
    const label = algo === 'prim' ? 'Prim' : 'Kruskal';
    ui.title.textContent = `Algoritmo de ${label}`;
    document.title = `Algoritmo de ${label} · Árvore Geradora Mínima`;
    ui.primBtn.classList.toggle('active', algo === 'prim');
    ui.kruskalBtn.classList.toggle('active', algo === 'kruskal');
    ui.primBtn.setAttribute('aria-pressed', String(algo === 'prim'));
    ui.kruskalBtn.setAttribute('aria-pressed', String(algo === 'kruskal'));
    document.body.dataset.algo = algo;
    renderPseudoPanel();
    renderLegend();
    if (def) loadGraph(def);
  }

  function pickSource(id) {
    if (algo !== 'prim' || steps[current].phase !== 'input' || id === graph.source) return;
    loadGraph({ ...def, source: id });
  }

  function toggleMenu(open) {
    const show = open === undefined ? ui.graphsMenu.hidden : open;
    ui.graphsMenu.hidden = !show;
    ui.graphsBtn.setAttribute('aria-expanded', String(show));
  }

  function togglePseudo() {
    const show = ui.pseudoPanel.hidden;
    ui.pseudoPanel.hidden = !show;
    ui.layout.classList.toggle('with-pseudo', show);
    ui.pseudoBtn.setAttribute('aria-pressed', String(show));
    ui.pseudoBtn.classList.toggle('active', show);
  }

  EXAMPLES.forEach(ex => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'example';
    btn.innerHTML = `<span class="example-name">${ex.name}</span><span class="example-desc">${ex.description}</span>`;
    btn.addEventListener('click', () => { loadGraph(ex); toggleMenu(false); });
    ui.exampleList.appendChild(btn);
  });

  ui.nodeCount.addEventListener('input', () => { ui.nodeCountValue.textContent = ui.nodeCount.value; });
  ui.randomBtn.addEventListener('click', () => {
    const g = randomGraph(Number(ui.nodeCount.value));
    if (g) loadGraph(g);
    toggleMenu(false);
  });

  ui.graphsBtn.addEventListener('click', event => { event.stopPropagation(); toggleMenu(); });
  ui.graphsMenu.addEventListener('click', event => event.stopPropagation());
  document.addEventListener('click', () => toggleMenu(false));

  ui.primBtn.addEventListener('click', () => { if (algo !== 'prim') setAlgo('prim'); });
  ui.kruskalBtn.addEventListener('click', () => { if (algo !== 'kruskal') setAlgo('kruskal'); });
  ui.pseudoBtn.addEventListener('click', togglePseudo);
  ui.helpBtn.addEventListener('click', () => ui.helpDialog.showModal());
  ui.resetBtn.addEventListener('click', () => { stopAuto(); goTo(0); });
  ui.prevBtn.addEventListener('click', () => { stopAuto(); goTo(current - 1); });
  ui.nextBtn.addEventListener('click', () => { stopAuto(); goTo(current + 1); });
  ui.autoBtn.addEventListener('click', () => (timer ? stopAuto() : startAuto()));
  ui.speedSelect.addEventListener('change', () => { if (timer) startAuto(); });

  document.addEventListener('keydown', event => {
    if (ui.helpDialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
    const tag = event.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    // Espaço/Enter num botão focado já acionam o próprio botão.
    if (tag === 'BUTTON' && (event.key === ' ' || event.key === 'Enter')) return;
    switch (event.key) {
      case 'ArrowRight':
      case ' ':
        event.preventDefault(); stopAuto(); goTo(current + 1); break;
      case 'ArrowLeft':
        event.preventDefault(); stopAuto(); goTo(current - 1); break;
      case 'Home':
        event.preventDefault(); stopAuto(); goTo(0); break;
      case 'End':
        event.preventDefault(); stopAuto(); goTo(steps.length - 1); break;
      case 'a': case 'A':
        timer ? stopAuto() : startAuto(); break;
      case 'p': case 'P':
        togglePseudo(); break;
      case 'k': case 'K':
        setAlgo(algo === 'prim' ? 'kruskal' : 'prim'); break;
      case 'Escape':
        toggleMenu(false); break;
      default:
    }
  });

  // Parâmetros opcionais na URL, úteis para linkar a partir dos slides:
  // ?algo=kruskal&grafo=clrs&passo=5&pseudo=1  ou  ?grafo=aleatorio&n=8
  const params = new URLSearchParams(window.location.search);
  const n = Math.max(4, Math.min(12, Number(params.get('n')) || 8));
  const initial = params.get('grafo') === 'aleatorio'
    ? randomGraph(n)
    : EXAMPLES.find(ex => ex.id === params.get('grafo'));
  algo = (params.get('algo') || '').trim().toLowerCase() === 'kruskal' ? 'kruskal' : 'prim';
  def = initial || EXAMPLES[0];
  if (params.has('origem')) def = { ...def, source: params.get('origem') };
  setAlgo(algo);
  if (params.has('passo')) goTo(Number(params.get('passo')) || 0);
  if (params.get('pseudo') === '1') togglePseudo();
})();
