(function () {
  'use strict';

  /* ========================================================================
   * Core logic (pure functions, no DOM). Exported for Node-based testing.
   * ====================================================================== */

  const INF = Infinity;

  function compareLabels(a, b) {
    return String(a).localeCompare(String(b), 'en', { numeric: true });
  }

  function formatValue(value) {
    if (value === INF) return '∞';
    if (value === undefined || value === null) return '⊥';
    return String(value);
  }

  function edgeLabel(edge, from) {
    if (from && edge.target === from) return `${edge.target}–${edge.source}`;
    return `${edge.source}–${edge.target}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  const exampleGraphs = {
    aula: {
      label: 'Lecture Example (A–G)',
      graph: {
        start: 'A',
        nodes: [
          { id: 'A', x: 1, y: 0 },
          { id: 'B', x: 3, y: 0 },
          { id: 'C', x: 0, y: 1 },
          { id: 'D', x: 2, y: 1 },
          { id: 'E', x: 4, y: 1 },
          { id: 'F', x: 1, y: 2 },
          { id: 'G', x: 3, y: 2 }
        ],
        edges: [
          { source: 'A', target: 'B', weight: 1 },
          { source: 'C', target: 'A', weight: 1 },
          { source: 'C', target: 'D', weight: 2 },
          { source: 'C', target: 'F', weight: 3 },
          { source: 'D', target: 'A', weight: 2 },
          { source: 'D', target: 'B', weight: 3 },
          { source: 'D', target: 'E', weight: 5 },
          { source: 'D', target: 'F', weight: 4 },
          { source: 'D', target: 'G', weight: 5 },
          { source: 'E', target: 'B', weight: 4 },
          { source: 'E', target: 'G', weight: 2 },
          { source: 'F', target: 'G', weight: 6 }
        ]
      }
    },
    clrs: {
      label: 'CLRS Classic (a–i)',
      graph: {
        start: 'a',
        nodes: [
          { id: 'a', x: 0, y: 1 },
          { id: 'b', x: 1, y: 0 },
          { id: 'c', x: 2, y: 0 },
          { id: 'd', x: 3, y: 0 },
          { id: 'e', x: 4, y: 1 },
          { id: 'f', x: 3, y: 2 },
          { id: 'g', x: 2, y: 2 },
          { id: 'h', x: 1, y: 2 },
          { id: 'i', x: 1.55, y: 1 }
        ],
        edges: [
          { source: 'a', target: 'b', weight: 4 },
          { source: 'a', target: 'h', weight: 8 },
          { source: 'b', target: 'c', weight: 8 },
          { source: 'b', target: 'h', weight: 11 },
          { source: 'c', target: 'd', weight: 7 },
          { source: 'c', target: 'f', weight: 4 },
          { source: 'c', target: 'i', weight: 2 },
          { source: 'd', target: 'e', weight: 9 },
          { source: 'd', target: 'f', weight: 14 },
          { source: 'e', target: 'f', weight: 10 },
          { source: 'f', target: 'g', weight: 2 },
          { source: 'g', target: 'h', weight: 1 },
          { source: 'g', target: 'i', weight: 6 },
          { source: 'h', target: 'i', weight: 7 }
        ]
      }
    },
    ties: {
      label: 'Equal Weights (several MSTs)',
      graph: {
        start: 'A',
        nodes: [
          { id: 'A', x: 0, y: 0 },
          { id: 'B', x: 2, y: 0 },
          { id: 'C', x: 2, y: 2 },
          { id: 'D', x: 0, y: 2 },
          { id: 'E', x: 1, y: 1 }
        ],
        edges: [
          { source: 'A', target: 'B', weight: 1 },
          { source: 'B', target: 'C', weight: 1 },
          { source: 'C', target: 'D', weight: 1 },
          { source: 'D', target: 'A', weight: 1 },
          { source: 'E', target: 'A', weight: 2 },
          { source: 'E', target: 'B', weight: 2 },
          { source: 'E', target: 'C', weight: 2 },
          { source: 'E', target: 'D', weight: 2 }
        ]
      }
    },
    sparse: {
      label: 'Sparse Network (A–H)',
      graph: {
        start: 'A',
        nodes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        edges: [
          { source: 'A', target: 'B', weight: 7 },
          { source: 'A', target: 'D', weight: 5 },
          { source: 'B', target: 'C', weight: 8 },
          { source: 'B', target: 'D', weight: 9 },
          { source: 'B', target: 'E', weight: 7 },
          { source: 'C', target: 'E', weight: 5 },
          { source: 'D', target: 'E', weight: 15 },
          { source: 'D', target: 'F', weight: 6 },
          { source: 'E', target: 'F', weight: 8 },
          { source: 'E', target: 'G', weight: 9 },
          { source: 'F', target: 'G', weight: 11 },
          { source: 'G', target: 'H', weight: 3 },
          { source: 'F', target: 'H', weight: 12 }
        ]
      }
    }
  };

  const DEFAULT_EXAMPLE = 'aula';

  /**
   * Validates a graph definition and returns {start, nodes:[{id,x?,y?}], edges:[{source,target,weight}]}.
   * Positions are kept as given (any coordinate system); layout is handled separately.
   */
  function normalizeGraphDefinition(definition) {
    if (!definition || typeof definition !== 'object') {
      throw new Error('Graph definition must be a JSON object.');
    }

    if (!Array.isArray(definition.edges) || definition.edges.length === 0) {
      throw new Error('Graph must include a non-empty "edges" array.');
    }

    const seenPairs = new Set();
    const edgeList = definition.edges.map((edge, index) => {
      if (!edge || typeof edge !== 'object') {
        throw new Error(`Edge at index ${index} is not valid.`);
      }

      const source = String(edge.source ?? '').trim();
      const target = String(edge.target ?? '').trim();
      const weight = Number(edge.weight);

      if (!source || !target) {
        throw new Error(`Edge at index ${index} must define source and target.`);
      }
      if (source === target) {
        throw new Error(`Edge ${source}–${target} is a self-loop; self-loops are not allowed.`);
      }
      if (edge.weight === undefined || edge.weight === null || edge.weight === '' || !Number.isFinite(weight)) {
        throw new Error(`Edge ${source}–${target} must have a numeric weight.`);
      }

      const pairKey = [source, target].sort().join('\u0000');
      if (seenPairs.has(pairKey)) {
        throw new Error(`Duplicate edge ${source}–${target}: the graph is undirected, so each pair may appear only once.`);
      }
      seenPairs.add(pairKey);

      return { source, target, weight };
    });

    const nodeMap = new Map();
    if (Array.isArray(definition.nodes)) {
      definition.nodes.forEach((rawNode, index) => {
        if (typeof rawNode === 'string' || typeof rawNode === 'number') {
          const id = String(rawNode).trim();
          if (!id) throw new Error(`Node at index ${index} is empty.`);
          nodeMap.set(id, { id });
          return;
        }

        if (!rawNode || typeof rawNode !== 'object') {
          throw new Error(`Node at index ${index} is not valid.`);
        }

        const id = String(rawNode.id ?? '').trim();
        if (!id) throw new Error(`Node at index ${index} must include an id.`);

        const x = Number(rawNode.x);
        const y = Number(rawNode.y);
        const hasPos = rawNode.x !== undefined && rawNode.y !== undefined && Number.isFinite(x) && Number.isFinite(y);
        nodeMap.set(id, hasPos ? { id, x, y } : { id });
      });
    }

    edgeList.forEach(edge => {
      if (!nodeMap.has(edge.source)) nodeMap.set(edge.source, { id: edge.source });
      if (!nodeMap.has(edge.target)) nodeMap.set(edge.target, { id: edge.target });
    });

    const nodeList = Array.from(nodeMap.values());
    if (nodeList.length < 2) {
      throw new Error('Graph must contain at least two nodes.');
    }

    const requestedStart = definition.start === undefined || definition.start === null
      ? ''
      : String(definition.start).trim();
    const start = requestedStart && nodeMap.has(requestedStart) ? requestedStart : nodeList[0].id;

    return { start, nodes: nodeList, edges: edgeList };
  }

  function buildAdjacency(nodeIds, edgeList) {
    const adjacency = {};
    nodeIds.forEach(id => {
      adjacency[id] = [];
    });
    edgeList.forEach((edge, index) => {
      adjacency[edge.source].push({ node: edge.target, weight: edge.weight, edge: index });
      adjacency[edge.target].push({ node: edge.source, weight: edge.weight, edge: index });
    });
    Object.keys(adjacency).forEach(id => {
      adjacency[id].sort((a, b) => compareLabels(a.node, b.node) || a.edge - b.edge);
    });
    return adjacency;
  }

  function isConnected(graphDef) {
    const ids = graphDef.nodes.map(n => (typeof n === 'string' ? n : n.id));
    if (ids.length === 0) return true;
    const adjacency = buildAdjacency(ids, graphDef.edges);
    const seen = new Set([ids[0]]);
    const stack = [ids[0]];
    while (stack.length > 0) {
      const u = stack.pop();
      adjacency[u].forEach(({ node }) => {
        if (!seen.has(node)) {
          seen.add(node);
          stack.push(node);
        }
      });
    }
    return seen.size === ids.length;
  }

  /**
   * Layered (BFS) layout adapted from the Dijkstra visualizer: the start node on the left,
   * one column per BFS level. Returns normalized coordinates in [0, 1].
   */
  function computeLayeredLayout(nodeIds, edgeList, startId) {
    const adjacency = {};
    nodeIds.forEach(id => {
      adjacency[id] = new Set();
    });
    edgeList.forEach(edge => {
      if (adjacency[edge.source] && adjacency[edge.target]) {
        adjacency[edge.source].add(edge.target);
        adjacency[edge.target].add(edge.source);
      }
    });

    const levels = new Map();
    const root = adjacency[startId] ? startId : nodeIds[0];
    const queue = [root];
    levels.set(root, 0);
    while (queue.length > 0) {
      const current = queue.shift();
      const currentLevel = levels.get(current);
      Array.from(adjacency[current]).sort(compareLabels).forEach(next => {
        if (!levels.has(next)) {
          levels.set(next, currentLevel + 1);
          queue.push(next);
        }
      });
    }

    let maxLevel = 0;
    levels.forEach(level => {
      maxLevel = Math.max(maxLevel, level);
    });
    nodeIds.forEach(id => {
      if (!levels.has(id)) {
        maxLevel += 1;
        levels.set(id, maxLevel);
      }
    });

    const grouped = new Map();
    nodeIds.forEach(id => {
      const level = levels.get(id);
      if (!grouped.has(level)) grouped.set(level, []);
      grouped.get(level).push(id);
    });

    const safeMaxLevel = Math.max(maxLevel, 1);
    const layout = {};
    const sortedLevels = Array.from(grouped.keys()).sort((a, b) => a - b);

    sortedLevels.forEach(level => {
      let ids = grouped.get(level).sort(compareLabels);

      // Order each column by the average position of already placed neighbors (fewer crossings).
      if (level > 0) {
        const barycenter = id => {
          const placed = Array.from(adjacency[id]).filter(n => layout[n]);
          if (placed.length === 0) return 0.5;
          return placed.reduce((sum, n) => sum + layout[n].y, 0) / placed.length;
        };
        ids = ids
          .map(id => ({ id, b: barycenter(id) }))
          .sort((a, b) => a.b - b.b || compareLabels(a.id, b.id))
          .map(item => item.id);
      }

      const baseX = maxLevel === 0 ? 0.5 : level / safeMaxLevel;
      const stagger = ids.length > 2 ? Math.min(0.06, 0.28 / safeMaxLevel) : 0;

      ids.forEach((id, index) => {
        const baseY = ids.length === 1 ? 0.5 : index / (ids.length - 1);
        const seed = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const jitter = id === root ? 0 : ((seed % 11) - 5) / 400;
        const offset = stagger === 0 ? 0 : (index % 2 === 0 ? -stagger : stagger);
        layout[id] = {
          x: clamp(baseX + offset, 0, 1),
          y: clamp(baseY + jitter, 0, 1)
        };
      });
    });

    return layout;
  }

  /** Maps arbitrary coordinates (or a computed layout) to normalized [0, 1] positions. */
  function computeNormalizedPositions(normalized) {
    const allPositioned = normalized.nodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.y));
    let raw;
    if (allPositioned) {
      raw = {};
      normalized.nodes.forEach(n => {
        raw[n.id] = { x: n.x, y: n.y };
      });
    } else {
      raw = computeLayeredLayout(normalized.nodes.map(n => n.id), normalized.edges, normalized.start);
    }

    const xs = Object.values(raw).map(p => p.x);
    const ys = Object.values(raw).map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const result = {};
    Object.entries(raw).forEach(([id, p]) => {
      result[id] = {
        x: maxX > minX ? (p.x - minX) / (maxX - minX) : 0.5,
        y: maxY > minY ? (p.y - minY) / (maxY - minY) : 0.5
      };
    });
    return result;
  }

  /**
   * Random connected graph: a random spanning tree (each vertex, in random order, attaches to a
   * random earlier vertex) plus every other pair with probability `density`.
   */
  function generateRandomGraph(nodeCount, density, rng = Math.random) {
    const makeNodeId = index => (index < 26 ? String.fromCharCode(65 + index) : `N${index + 1}`);
    const ids = [];
    for (let i = 0; i < nodeCount; i++) ids.push(makeNodeId(i));

    const order = ids.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    const pairKey = (a, b) => (compareLabels(a, b) < 0 ? `${a}|${b}` : `${b}|${a}`);
    const chosen = new Set();
    for (let i = 1; i < order.length; i++) {
      const parent = order[Math.floor(rng() * i)];
      chosen.add(pairKey(order[i], parent));
    }

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = pairKey(ids[i], ids[j]);
        if (!chosen.has(key) && rng() < density) chosen.add(key);
      }
    }

    const edges = Array.from(chosen)
      .map(key => key.split('|'))
      .sort((a, b) => compareLabels(a[0], b[0]) || compareLabels(a[1], b[1]))
      .map(([source, target]) => ({ source, target, weight: Math.floor(rng() * 9) + 1 }));

    return { start: ids[0], nodes: ids, edges };
  }

  /* ---------------------------- Prim ---------------------------------- */

  function primHeapOrder(inHeap, key) {
    return inHeap.slice().sort((a, b) => {
      const ka = key[a];
      const kb = key[b];
      if (ka !== kb) return ka < kb ? -1 : 1;
      return compareLabels(a, b);
    });
  }

  function buildPrimTrace(graphDef) {
    const ids = graphDef.nodes.map(n => n.id);
    const edges = graphDef.edges;
    const start = graphDef.start;
    const adjacency = buildAdjacency(ids, edges);
    const n = ids.length;

    const key = {};
    const pai = {};
    const paiEdge = {};
    const inHeap = new Set(ids);
    const X = [];
    const T = [];
    let total = 0;
    const steps = [];

    const snapshot = extra => {
      steps.push({
        algo: 'prim',
        key: { ...key },
        pai: { ...pai },
        paiEdge: { ...paiEdge },
        inHeap: ids.filter(id => inHeap.has(id)),
        X: X.slice(),
        T: T.slice(),
        total,
        current: null,
        examEdge: null,
        examV: null,
        checks: [],
        changed: [],
        ...extra
      });
    };

    ids.forEach(id => {
      key[id] = INF;
      pai[id] = null;
      paiEdge[id] = null;
    });
    key[start] = 0;

    snapshot({
      type: 'init',
      lines: ['init', 'init-s', 'build'],
      changed: [start],
      message: `Initialization: key[v] = ∞ and pai[v] = ⊥ for every vertex; key[${start}] = 0 and T = ∅. The min-heap H contains all ${n} vertices.`
    });

    while (inHeap.size > 0) {
      const u = primHeapOrder(Array.from(inHeap), key)[0];
      inHeap.delete(u);
      X.push(u);

      const lines = ['while', 'extract'];
      let message = `ExtractMin(H) = ${u} (key ${formatValue(key[u])}).`;
      if (pai[u] !== null) {
        const e = paiEdge[u];
        T.push(e);
        total += edges[e].weight;
        lines.push('add');
        message += ` pai[${u}] = ${pai[u]} ≠ ⊥ → add edge ${pai[u]}–${u} (w = ${edges[e].weight}) to T. Now w(T) = ${total}.`;
      } else if (u === start) {
        message += ` pai[${u}] = ⊥ (start vertex) → no edge is added.`;
      } else {
        message += ` key = ∞ and pai[${u}] = ⊥: ${u} is not connected to the vertices already extracted, so it starts a new tree (the graph is disconnected).`;
      }

      const toScan = adjacency[u].filter(({ node }) => inHeap.has(node));
      if (toScan.length === 0 && inHeap.size > 0) {
        message += ` No edge (${u}, v) with v ∈ H to scan.`;
      } else if (toScan.length > 0) {
        message += ` Next: scan the edges (${u}, v) with v ∈ H: ${toScan.map(item => item.node).join(', ')}.`;
      }

      snapshot({ type: 'extract', current: u, lines, message, changed: [u] });

      const checks = [];
      toScan.forEach(({ node: v, weight: w, edge: e }) => {
        const before = key[v];
        const beforePai = pai[v];
        const updated = w < before;
        if (updated) {
          pai[v] = u;
          key[v] = w;
          paiEdge[v] = e;
        }
        checks.push({ u, v, w, before, beforePai, updated });

        const stepMessage = updated
          ? `Edge ${u}–${v}: w(${u},${v}) = ${w} < key[${v}] = ${formatValue(before)} → pai[${v}] ← ${u}, key[${v}] ← ${w}, DecreaseKey(H, ${v}, ${w}).`
          : `Edge ${u}–${v}: w(${u},${v}) = ${w} is not less than key[${v}] = ${formatValue(before)} → no change (${v} keeps pai[${v}] = ${formatValue(beforePai)}).`;

        snapshot({
          type: 'examine',
          current: u,
          examEdge: e,
          examV: v,
          checks: checks.slice(),
          changed: updated ? [v] : [],
          lines: updated ? ['for', 'if', 'update', 'decrease'] : ['for', 'if'],
          message: stepMessage
        });
      });
    }

    const connected = T.length === n - 1;
    snapshot({
      type: 'done',
      lines: ['return'],
      message: connected
        ? `H = ∅ → return T. Minimum spanning tree with |T| = ${T.length} edges and total weight ${total}.`
        : `H = ∅ → return T. The graph is disconnected: T is a minimum spanning forest with ${T.length} edges and total weight ${total}.`
    });

    return steps;
  }

  /* ---------------------------- Kruskal -------------------------------- */

  function kruskalSortedOrder(edges) {
    return edges
      .map((edge, index) => ({ weight: edge.weight, index }))
      .sort((a, b) => a.weight - b.weight || a.index - b.index)
      .map(item => item.index);
  }

  function buildKruskalTrace(graphDef) {
    const ids = graphDef.nodes.map(n => n.id);
    const edges = graphDef.edges;
    const n = ids.length;
    const order = kruskalSortedOrder(edges);
    const status = edges.map(() => 'pending');
    const T = [];
    let total = 0;
    let pai = null;
    let rank = null;
    let colorOf = {};
    const colorCount = 8;
    const steps = [];

    const snapshot = extra => {
      steps.push({
        algo: 'kruskal',
        order: order.slice(),
        status: status.slice(),
        pai: pai ? { ...pai } : null,
        rank: rank ? { ...rank } : null,
        colorOf: { ...colorOf },
        T: T.slice(),
        total,
        currentEdge: null,
        changed: [],
        finds: null,
        ...extra
      });
    };

    snapshot({
      type: 'sort',
      lines: ['init-t', 'sort'],
      message: `T = ∅. Sort the ${edges.length} edges by increasing weight (ties keep the input order): ${order.map(e => `${edgeLabel(edges[e])} (${edges[e].weight})`).join(', ')}.`
    });

    pai = {};
    rank = {};
    ids.forEach(id => {
      pai[id] = id;
      rank[id] = 0;
    });
    snapshot({
      type: 'initialize',
      lines: ['initialize'],
      changed: ids.slice(),
      message: `Initialize(V): every vertex is its own component, pai[v] = v and rank[v] = 0 (${n} components).`
    });

    const find = (v, compressions) => {
      const path = [];
      let r = v;
      while (pai[r] !== r) {
        path.push(r);
        r = pai[r];
      }
      path.forEach(x => {
        if (pai[x] !== r) {
          compressions.push({ v: x, from: pai[x], to: r });
          pai[x] = r;
        }
      });
      return r;
    };

    const pickColor = () => {
      const usage = new Array(colorCount).fill(0);
      Object.values(colorOf).forEach(c => {
        usage[c] += 1;
      });
      let best = 0;
      for (let c = 1; c < colorCount; c++) {
        if (usage[c] < usage[best]) best = c;
      }
      return best;
    };

    let finished = false;
    for (let k = 0; k < order.length; k++) {
      const e = order[k];
      const { source: u, target: v, weight: w } = edges[e];
      const compressions = [];
      const ru = find(u, compressions);
      const rv = find(v, compressions);
      const compressionText = compressions.length > 0
        ? ` Path compression: ${compressions.map(c => `pai[${c.v}] ← ${c.to}`).join(', ')}.`
        : '';
      const changed = compressions.map(c => c.v);

      if (ru !== rv) {
        T.push(e);
        total += w;
        status[e] = 'accepted';

        // Union by rank; on ties the root of u becomes the parent.
        let parent;
        let child;
        let unionText;
        if (rank[ru] > rank[rv]) {
          parent = ru;
          child = rv;
          unionText = `rank[${ru}] = ${rank[ru]} > rank[${rv}] = ${rank[rv]}, so pai[${rv}] ← ${ru}`;
        } else if (rank[ru] < rank[rv]) {
          parent = rv;
          child = ru;
          unionText = `rank[${ru}] = ${rank[ru]} < rank[${rv}] = ${rank[rv]}, so pai[${ru}] ← ${rv}`;
        } else {
          parent = ru;
          child = rv;
          unionText = `rank[${ru}] = rank[${rv}] = ${rank[ru]}, so pai[${rv}] ← ${ru} and rank[${ru}] ← ${rank[ru] + 1}`;
        }
        pai[child] = parent;
        if (rank[parent] === rank[child]) rank[parent] += 1;
        changed.push(child, parent);

        const parentColor = colorOf[parent];
        const childColor = colorOf[child];
        delete colorOf[child];
        if (parentColor === undefined) {
          colorOf[parent] = childColor !== undefined ? childColor : pickColor();
        }

        snapshot({
          type: 'accept',
          currentEdge: e,
          changed,
          finds: { u, v, ru, rv },
          lines: ['for', 'if', 'add', 'union'],
          message: `Edge ${edgeLabel(edges[e])} (w = ${w}): Find(${u}) = ${ru}, Find(${v}) = ${rv}: different components → accept edge ${edgeLabel(edges[e])}, Union(${u}, ${v}): ${unionText}.${compressionText} Now w(T) = ${total}, |T| = ${T.length}.`
        });

        if (T.length === n - 1) {
          const remaining = order.slice(k + 1);
          remaining.forEach(idx => {
            status[idx] = 'skipped';
          });
          snapshot({
            type: 'done',
            lines: ['check'],
            message: `|T| = ${T.length} = |V| − 1 → return T. Minimum spanning tree with total weight ${total}.${remaining.length > 0 ? ` The remaining edges (${remaining.map(idx => edgeLabel(edges[idx])).join(', ')}) are never examined.` : ''}`
          });
          finished = true;
          break;
        }
      } else {
        status[e] = 'rejected';
        snapshot({
          type: 'reject',
          currentEdge: e,
          changed,
          finds: { u, v, ru, rv },
          lines: ['for', 'if'],
          message: `Edge ${edgeLabel(edges[e])} (w = ${w}): Find(${u}) = ${ru}, Find(${v}) = ${rv}: same component → reject ${edgeLabel(edges[e])} (it would create a cycle).${compressionText}`
        });
      }
    }

    if (!finished) {
      snapshot({
        type: 'done',
        lines: ['return'],
        message: `All edges examined but |T| = ${T.length} < |V| − 1 = ${n - 1}: the graph is disconnected, so T is a minimum spanning forest with total weight ${total}.`
      });
    }

    return steps;
  }

  function findRootNoCompress(paiMap, v) {
    let r = v;
    let guard = 0;
    while (paiMap[r] !== r && guard < 10000) {
      r = paiMap[r];
      guard += 1;
    }
    return r;
  }

  const Core = {
    INF,
    exampleGraphs,
    DEFAULT_EXAMPLE,
    compareLabels,
    normalizeGraphDefinition,
    buildAdjacency,
    isConnected,
    computeLayeredLayout,
    computeNormalizedPositions,
    generateRandomGraph,
    primHeapOrder,
    buildPrimTrace,
    kruskalSortedOrder,
    buildKruskalTrace,
    findRootNoCompress,
    edgeLabel
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Core;
  }

  if (typeof document === 'undefined') return;

  /* ========================================================================
   * UI
   * ====================================================================== */

  const PRIM_PSEUDO = [
    { key: 'init', indent: 0, text: 'for each v ∈ V: key[v] ← ∞; pai[v] ← ⊥' },
    { key: 'init-s', indent: 0, text: 'key[s] ← 0; T ← ∅' },
    { key: 'build', indent: 0, text: 'H ← min-heap with all v ∈ V, ordered by key' },
    { key: 'while', indent: 0, text: 'while H ≠ ∅:' },
    { key: 'extract', indent: 1, text: 'u ← ExtractMin(H)' },
    { key: 'add', indent: 1, text: 'if pai[u] ≠ ⊥: T ← T ∪ {(pai[u], u)}' },
    { key: 'for', indent: 1, text: 'for each edge (u, v) with v ∈ H:' },
    { key: 'if', indent: 2, text: 'if w(u, v) < key[v]:' },
    { key: 'update', indent: 3, text: 'pai[v] ← u; key[v] ← w(u, v)' },
    { key: 'decrease', indent: 3, text: 'DecreaseKey(H, v, key[v])' },
    { key: 'return', indent: 0, text: 'return T' }
  ];

  const KRUSKAL_PSEUDO = [
    { key: 'init-t', indent: 0, text: 'T ← ∅' },
    { key: 'sort', indent: 0, text: 'sort E by increasing cost' },
    { key: 'initialize', indent: 0, text: 'Initialize(V)   // pai[v] ← v; rank[v] ← 0' },
    { key: 'for', indent: 0, text: 'for each (u, v) ∈ E in sorted order:' },
    { key: 'if', indent: 1, text: 'if Find(u) ≠ Find(v):' },
    { key: 'add', indent: 2, text: 'T ← T ∪ {(u, v)}' },
    { key: 'union', indent: 2, text: 'Union(u, v)' },
    { key: 'check', indent: 2, text: 'if |T| = |V| − 1: return T' },
    { key: 'return', indent: 0, text: 'return T' }
  ];

  const AUTO_RUN_DELAY_MS = 700;

  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('viewHost');
    const edgeLayer = document.getElementById('edgeLayer');
    const stepBtn = document.getElementById('stepBtn');
    const autoBtn = document.getElementById('autoBtn');
    const resetBtn = document.getElementById('resetBtn');
    const newGraphBtn = document.getElementById('newGraphBtn');
    const statusBanner = document.getElementById('statusBanner');
    const liveBadge = document.getElementById('liveBadge');
    const appSubtitle = document.getElementById('appSubtitle');
    const algorithmSelect = document.getElementById('algorithmSelect');
    const startSelect = document.getElementById('startSelect');
    const startField = document.getElementById('startField');
    const stateMetrics = document.getElementById('stateMetrics');
    const stateTable = document.getElementById('stateTable');
    const tableTitle = document.getElementById('tableTitle');
    const pseudoCode = document.getElementById('pseudoCode');
    const forestPanel = document.getElementById('forestPanel');
    const forestView = document.getElementById('forestView');
    const explainTitle = document.getElementById('explainTitle');
    const explainContent = document.getElementById('explainContent');
    const legendRow = document.getElementById('legendRow');
    const exampleGraphSelect = document.getElementById('exampleGraphSelect');
    const loadExampleBtn = document.getElementById('loadExampleBtn');
    const exportGraphBtn = document.getElementById('exportGraphBtn');
    const graphFileInput = document.getElementById('graphFileInput');
    const graphJsonInput = document.getElementById('graphJsonInput');
    const applyGraphBtn = document.getElementById('applyGraphBtn');
    const nodeCountInput = document.getElementById('nodeCountInput');
    const densityRange = document.getElementById('densityRange');
    const densityValue = document.getElementById('densityValue');
    const boardStack = document.getElementById('boardStack');
    const boardResizeHandle = boardStack?.querySelector('.resize-handle-x');

    let algo = 'prim';
    let startNode = null;
    let nodes = []; // {id, nx, ny} with normalized coordinates
    let edges = [];
    let nodeIndex = new Map();
    let trace = [];
    let stepIndex = -1; // -1 = idle (not started)
    let autoTimer = null;
    let lastSize = { width: 0, height: 0 };

    /* --------------------------- helpers ------------------------------ */

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function getContainerSize() {
      return {
        width: container.clientWidth || 700,
        height: container.clientHeight || 430
      };
    }

    const PAD_X = 40;
    const PAD_TOP = 48;
    const PAD_BOTTOM = 30;

    function toPixel(node) {
      const { width, height } = getContainerSize();
      return {
        x: PAD_X + node.nx * Math.max(1, width - 2 * PAD_X),
        y: PAD_TOP + node.ny * Math.max(1, height - PAD_TOP - PAD_BOTTOM)
      };
    }

    function fromPixel(x, y) {
      const { width, height } = getContainerSize();
      return {
        nx: clamp((x - PAD_X) / Math.max(1, width - 2 * PAD_X), 0, 1),
        ny: clamp((y - PAD_TOP) / Math.max(1, height - PAD_TOP - PAD_BOTTOM), 0, 1)
      };
    }

    function getRandomGraphOptions() {
      const rawNodeCount = parseInt(nodeCountInput?.value || '7', 10);
      const rawDensity = parseInt(densityRange?.value || '40', 10);
      const nodeCount = clamp(Number.isFinite(rawNodeCount) ? rawNodeCount : 7, 4, 24);
      const densityPercent = clamp(Number.isFinite(rawDensity) ? rawDensity : 40, 10, 90);
      if (nodeCountInput) nodeCountInput.value = String(nodeCount);
      return { nodeCount, density: densityPercent / 100, densityPercent };
    }

    function updateDensityDisplay() {
      if (!densityValue || !densityRange) return;
      densityValue.textContent = `${densityRange.value}%`;
    }

    function currentStep() {
      return stepIndex >= 0 ? trace[stepIndex] : null;
    }

    function algoName() {
      return algo === 'prim' ? "Prim's algorithm" : "Kruskal's algorithm";
    }

    function idleMessage() {
      return algo === 'prim'
        ? `Click "Run step" to start Prim's algorithm from ${startNode}.`
        : `Click "Run step" to start Kruskal's algorithm.`;
    }

    /* ------------------------ graph loading ---------------------------- */

    function rebuildTrace() {
      const graphDef = { start: startNode, nodes: nodes.map(n => ({ id: n.id })), edges };
      trace = algo === 'prim' ? Core.buildPrimTrace(graphDef) : Core.buildKruskalTrace(graphDef);
      stepIndex = -1;
    }

    function populateStartSelect() {
      if (!startSelect) return;
      startSelect.innerHTML = nodes
        .map(n => `<option value="${escapeHtml(n.id)}">${escapeHtml(n.id)}</option>`)
        .join('');
      startSelect.value = startNode;
    }

    function syncGraphEditor() {
      if (!graphJsonInput) return;
      const serialized = {
        start: startNode,
        nodes: nodes.map(node => {
          const p = toPixel(node);
          return { id: node.id, x: Math.round(p.x), y: Math.round(p.y) };
        }),
        edges: edges.map(edge => ({ source: edge.source, target: edge.target, weight: edge.weight }))
      };
      graphJsonInput.value = JSON.stringify(serialized, null, 2);
    }

    function loadGraphDefinition(definition, sourceLabel) {
      stopAuto();
      const normalized = Core.normalizeGraphDefinition(definition);
      const positions = Core.computeNormalizedPositions(normalized);
      startNode = normalized.start;
      nodes = normalized.nodes.map(n => ({ id: n.id, nx: positions[n.id].x, ny: positions[n.id].y }));
      nodeIndex = new Map(nodes.map((n, i) => [n.id, i]));
      edges = normalized.edges;
      populateStartSelect();
      rebuildTrace();

      let message = `${sourceLabel} ${idleMessage()}`;
      if (!Core.isConnected(normalized)) {
        message += ' Note: this graph is disconnected, so the result will be a minimum spanning forest.';
      }
      statusBanner.textContent = message;

      renderGraph();
      updateUI();
      syncGraphEditor();
    }

    function setAlgorithm(next, { announce = true } = {}) {
      algo = next === 'kruskal' ? 'kruskal' : 'prim';
      if (algorithmSelect) algorithmSelect.value = algo;
      if (startField) startField.classList.toggle('is-disabled', algo !== 'prim');
      if (startSelect) startSelect.disabled = algo !== 'prim';
      if (appSubtitle) {
        appSubtitle.textContent = algo === 'prim'
          ? "Prim's algorithm: grow one tree from a start vertex, always adding the lightest edge leaving it."
          : "Kruskal's algorithm: scan edges by increasing weight, keeping those that join two different components.";
      }
      if (nodes.length > 0) {
        stopAuto();
        rebuildTrace();
        renderGraph();
        updateUI();
        if (announce) statusBanner.textContent = `Switched to ${algoName()}. ${idleMessage()}`;
      }
    }

    /* --------------------------- rendering ----------------------------- */

    function renderGraph() {
      Array.from(container.querySelectorAll('.node, .edge-weight, .graph-overlay')).forEach(el => el.remove());
      edgeLayer.innerHTML = '';
      const { width, height } = getContainerSize();
      lastSize = { width, height };
      edgeLayer.setAttribute('viewBox', `0 0 ${width} ${height}`);

      const svgNS = 'http://www.w3.org/2000/svg';
      edges.forEach((edge, index) => {
        const p1 = toPixel(nodes[nodeIndex.get(edge.source)]);
        const p2 = toPixel(nodes[nodeIndex.get(edge.target)]);
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', p1.x);
        line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x);
        line.setAttribute('y2', p2.y);
        line.setAttribute('class', 'mst-edge');
        line.id = `edge-${index}`;
        edgeLayer.appendChild(line);

        const label = document.createElement('div');
        label.className = 'edge-weight';
        label.id = `weight-${index}`;
        label.textContent = edge.weight;
        label.style.left = `${(p1.x + p2.x) / 2}px`;
        label.style.top = `${(p1.y + p2.y) / 2}px`;
        container.appendChild(label);
      });

      nodes.forEach((node, index) => {
        const p = toPixel(node);
        const el = document.createElement('div');
        el.className = 'node';
        el.id = `node-${index}`;
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        el.appendChild(document.createTextNode(node.id));

        const keyLabel = document.createElement('div');
        keyLabel.className = 'node-key';
        keyLabel.id = `key-${index}`;
        el.appendChild(keyLabel);

        el.addEventListener('pointerdown', event => startNodeDrag(event, node, el));
        container.appendChild(el);
      });

      const overlay = document.createElement('div');
      overlay.className = 'graph-overlay';
      overlay.id = 'graphOverlay';
      container.appendChild(overlay);
    }

    function startNodeDrag(event, node, el) {
      event.preventDefault();
      try {
        el.setPointerCapture(event.pointerId);
      } catch (error) {
        // Ignore: pointer capture is optional.
      }

      const onMove = moveEvent => {
        const rect = container.getBoundingClientRect();
        const pos = fromPixel(moveEvent.clientX - rect.left, moveEvent.clientY - rect.top);
        node.nx = pos.nx;
        node.ny = pos.ny;
        renderGraph();
        updateUI();
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        syncGraphEditor();
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp, { once: true });
    }

    function setNodeClasses(index, classes) {
      const el = document.getElementById(`node-${index}`);
      if (el) el.className = ['node', ...classes].join(' ');
    }

    function setEdgeClasses(index, classes) {
      const line = document.getElementById(`edge-${index}`);
      const label = document.getElementById(`weight-${index}`);
      if (line) line.setAttribute('class', ['mst-edge', ...classes].join(' '));
      if (label) label.className = ['edge-weight', ...classes].join(' ');
    }

    function updateGraphView(step) {
      const overlay = document.getElementById('graphOverlay');

      if (algo === 'prim') {
        const X = new Set(step ? step.X : []);
        const treeEdges = new Set(step ? step.T : []);
        const candidateEdges = new Set();
        if (step) {
          step.inHeap.forEach(v => {
            if (step.paiEdge[v] !== null && step.paiEdge[v] !== undefined) candidateEdges.add(step.paiEdge[v]);
          });
        }

        nodes.forEach((node, index) => {
          const classes = [];
          if (node.id === startNode && !X.has(node.id)) classes.push('start');
          if (X.has(node.id)) classes.push('in-tree');
          if (step && step.current === node.id && step.type !== 'done') classes.push('current');
          if (step && step.examV === node.id) classes.push('examined');
          setNodeClasses(index, classes);
          const keyEl = document.getElementById(`key-${index}`);
          if (keyEl) keyEl.textContent = step ? `key ${formatValue(step.key[node.id])}` : '';
        });

        edges.forEach((edge, index) => {
          const classes = [];
          const inX = (X.has(edge.source) ? 1 : 0) + (X.has(edge.target) ? 1 : 0);
          if (step && step.examEdge === index) classes.push('examining');
          else if (treeEdges.has(index)) classes.push('tree');
          else if (step && inX === 1 && candidateEdges.has(index)) classes.push('candidate');
          else if (step && inX === 1) classes.push('cut');
          else if (step && inX === 2) classes.push('discarded');
          setEdgeClasses(index, classes);
        });
      } else {
        const status = step ? step.status : edges.map(() => 'pending');
        const paiMap = step && step.pai ? step.pai : null;
        const colorOf = step ? step.colorOf : {};
        const currentEdge = step ? step.currentEdge : null;
        const endpoints = new Set();
        if (currentEdge !== null && currentEdge !== undefined) {
          endpoints.add(edges[currentEdge].source);
          endpoints.add(edges[currentEdge].target);
        }

        nodes.forEach((node, index) => {
          const classes = [];
          if (paiMap) {
            const root = Core.findRootNoCompress(paiMap, node.id);
            if (colorOf[root] !== undefined) classes.push('comp', `comp-${colorOf[root] + 1}`);
          }
          if (endpoints.has(node.id)) classes.push('examined');
          setNodeClasses(index, classes);
          const keyEl = document.getElementById(`key-${index}`);
          if (keyEl) keyEl.textContent = '';
        });

        edges.forEach((edge, index) => {
          const classes = [];
          if (index === currentEdge) classes.push('examining');
          else if (status[index] === 'accepted') classes.push('tree');
          else if (status[index] === 'rejected') classes.push('rejected');
          else if (status[index] === 'skipped') classes.push('skipped');
          setEdgeClasses(index, classes);
        });
      }

      if (overlay) {
        const tSize = step ? step.T.length : 0;
        const total = step ? step.total : 0;
        const label = algo === 'prim' ? `Prim (s = ${startNode})` : 'Kruskal';
        overlay.textContent = `${label} · w(T) = ${total} · |T| = ${tSize}/${nodes.length - 1}`;
      }
    }

    function renderLegend() {
      if (!legendRow) return;
      const items = algo === 'prim'
        ? [
          ['line-tree', 'T'],
          ['line-examining', 'examined'],
          ['line-candidate', '(pai[v], v)'],
          ['line-cut', 'cut edge']
        ]
        : [
          ['line-tree', 'accepted'],
          ['line-examining', 'current'],
          ['line-rejected', 'rejected']
        ];
      legendRow.innerHTML = items
        .map(([cls, text]) => `<span><i class="legend-line ${cls}"></i>${escapeHtml(text)}</span>`)
        .join('');
    }

    function renderPseudoCode(step) {
      if (!pseudoCode) return;
      const lines = algo === 'prim' ? PRIM_PSEUDO : KRUSKAL_PSEUDO;
      const active = new Set(step ? step.lines : []);
      const html = lines
        .map((line, index) => {
          const isActive = active.has(line.key) ? 'active' : '';
          const [code, comment] = line.text.split('//');
          const text = escapeHtml(code.trimEnd()) + (comment ? ` <span class="pseudo-comment">//${escapeHtml(comment)}</span>` : '');
          return `<li class="${isActive}"><span class="pseudo-line-no">${index + 1}</span><span class="pseudo-line-text" style="--indent:${line.indent}">${text}</span></li>`;
        })
        .join('');
      pseudoCode.innerHTML = `<ol class="pseudo-list">${html}</ol>`;
    }

    function formatEdgeSet(edgeIndices, orientFrom) {
      if (edgeIndices.length === 0) return '∅';
      return `{ ${edgeIndices.map(e => {
        const edge = edges[e];
        return orientFrom ? orientFrom(edge) : edgeLabel(edge);
      }).join(', ')} }`;
    }

    function metricRow(label, value) {
      return `<div class="state-metric"><strong>${label}</strong> <span class="metric-value">${value}</span></div>`;
    }

    function renderPrimState(step) {
      const primOrient = edge => {
        if (!step) return edgeLabel(edge);
        // Show tree edges as (pai[u], u).
        if (step.pai[edge.target] === edge.source) return `${edge.source}–${edge.target}`;
        if (step.pai[edge.source] === edge.target) return `${edge.target}–${edge.source}`;
        return edgeLabel(edge);
      };

      const heapOrder = step ? Core.primHeapOrder(step.inHeap, step.key) : [];
      const X = step ? step.X : [];
      let html = '';
      html += metricRow('Extracted (X):', X.length === 0 ? '∅' : `{ ${X.map(escapeHtml).join(', ')} }`);
      html += metricRow('Heap H:', step
        ? (heapOrder.length === 0 ? '[ ]' : `[ ${heapOrder.map(v => `(${escapeHtml(v)}: ${formatValue(step.key[v])})`).join(', ')} ]`)
        : '—');
      html += metricRow('Tree T:', step ? escapeHtml(formatEdgeSet(step.T, primOrient)) : '∅');
      html += metricRow('Total:', `w(T) = ${step ? step.total : 0} &nbsp;·&nbsp; |T| = ${step ? step.T.length : 0} / ${nodes.length - 1}`);
      stateMetrics.innerHTML = html;

      tableTitle.textContent = 'Vertex Table';
      let table = '<table class="dist-table"><thead><tr><th>v</th><th>key[v]</th><th>pai[v]</th><th>in H</th></tr></thead><tbody>';
      nodes.forEach(n => {
        const id = n.id;
        const key = step ? formatValue(step.key[id]) : '–';
        const pai = step ? formatValue(step.pai[id]) : '–';
        const inHeap = step ? step.inHeap.includes(id) : null;
        let rowClass = '';
        if (step && step.current === id && step.type !== 'done') rowClass = 'dist-row-current';
        else if (step && step.examV === id) rowClass = 'dist-row-examined';
        else if (step && step.X.includes(id)) rowClass = 'dist-row-visited';
        const changed = step && step.changed.includes(id) && step.type !== 'extract';
        if (changed) rowClass += ' dist-row-changed';
        const heapCell = inHeap === null ? '<td>–</td>' : (inHeap ? '<td class="in-heap-yes">yes</td>' : '<td class="in-heap-no">no</td>');
        table += `<tr class="${rowClass}"><td><strong>${escapeHtml(id)}</strong></td><td class="${changed ? 'changed-cell' : ''}">${key}</td><td class="${changed ? 'changed-cell' : ''}">${escapeHtml(pai)}</td>${heapCell}</tr>`;
      });
      table += '</tbody></table>';
      stateTable.innerHTML = table;
      forestPanel.hidden = true;
    }

    function componentsOf(step) {
      const groups = new Map();
      nodes.forEach(n => {
        const root = step && step.pai ? Core.findRootNoCompress(step.pai, n.id) : n.id;
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root).push(n.id);
      });
      return groups;
    }

    function renderKruskalState(step) {
      const groups = componentsOf(step);
      let html = '';
      html += metricRow('Tree T:', step ? escapeHtml(formatEdgeSet(step.T)) : '∅');
      html += metricRow('Total:', `w(T) = ${step ? step.total : 0} &nbsp;·&nbsp; |T| = ${step ? step.T.length : 0} / ${nodes.length - 1}`);
      html += metricRow('Components:', step && step.pai
        ? `${groups.size}: ${Array.from(groups.values()).map(g => `{${g.map(escapeHtml).join(', ')}}`).join(' ')}`
        : '—');
      stateMetrics.innerHTML = html;

      tableTitle.textContent = 'Union-Find Table';
      const finds = step ? step.finds : null;
      const endpoints = finds ? new Set([finds.u, finds.v]) : new Set();
      let table = '<table class="dist-table"><thead><tr><th>v</th><th>pai[v]</th><th>rank[v]</th><th>root</th></tr></thead><tbody>';
      nodes.forEach(n => {
        const id = n.id;
        const has = step && step.pai;
        const root = has ? Core.findRootNoCompress(step.pai, id) : null;
        const color = has && step.colorOf[root] !== undefined ? `comp-${step.colorOf[root] + 1}` : '';
        let rowClass = endpoints.has(id) ? 'dist-row-examined' : '';
        const changed = has && step.changed.includes(id) && step.type !== 'initialize';
        if (changed) rowClass += ' dist-row-changed';
        table += `<tr class="${rowClass}"><td><span class="comp-dot ${color}"></span><strong>${escapeHtml(id)}</strong></td>`
          + `<td class="${changed ? 'changed-cell' : ''}">${has ? escapeHtml(step.pai[id]) : '–'}</td>`
          + `<td class="${changed ? 'changed-cell' : ''}">${has ? step.rank[id] : '–'}</td>`
          + `<td>${has ? escapeHtml(root) : '–'}</td></tr>`;
      });
      table += '</tbody></table>';
      stateTable.innerHTML = table;

      forestPanel.hidden = false;
      renderForest(step);
    }

    function renderForest(step) {
      if (!step || !step.pai) {
        forestView.innerHTML = '<p class="forest-empty">The forest appears after Initialize(V).</p>';
        return;
      }

      const children = {};
      const roots = [];
      nodes.forEach(n => {
        children[n.id] = [];
      });
      nodes.forEach(n => {
        const p = step.pai[n.id];
        if (p === n.id) roots.push(n.id);
        else children[p].push(n.id);
      });
      Object.values(children).forEach(list => list.sort(compareLabels));

      const leaves = id => (children[id].length === 0 ? 1 : children[id].reduce((s, c) => s + leaves(c), 0));
      const depthOf = id => (children[id].length === 0 ? 0 : 1 + Math.max(...children[id].map(depthOf)));

      const unitW = 54;
      const unitH = 56;
      const radius = 15;
      const positions = {};
      let cursor = 0;
      let maxDepth = 0;
      const place = (id, depth, left) => {
        const w = leaves(id);
        positions[id] = { x: (left + w / 2) * unitW, y: 22 + depth * unitH };
        let offset = left;
        children[id].forEach(c => {
          place(c, depth + 1, offset);
          offset += leaves(c);
        });
      };
      roots.forEach(r => {
        place(r, 0, cursor);
        cursor += leaves(r);
        maxDepth = Math.max(maxDepth, depthOf(r));
      });

      const width = Math.max(cursor * unitW, unitW) + 26;
      const height = 22 + maxDepth * unitH + 32;
      const highlight = new Set(step.finds ? [step.finds.u, step.finds.v] : []);

      let svg = `<svg class="forest-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Union-Find forest">`;
      nodes.forEach(n => {
        const p = step.pai[n.id];
        if (p !== n.id) {
          const a = positions[n.id];
          const b = positions[p];
          svg += `<line class="forest-link" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"></line>`;
        }
      });
      nodes.forEach(n => {
        const pos = positions[n.id];
        const root = Core.findRootNoCompress(step.pai, n.id);
        const colorIdx = step.colorOf[root];
        const colorClass = colorIdx !== undefined ? `comp-${colorIdx + 1}` : '';
        const hl = highlight.has(n.id) ? 'highlight' : '';
        svg += `<circle class="forest-node ${colorClass} ${hl}" cx="${pos.x}" cy="${pos.y}" r="${radius}"></circle>`;
        svg += `<text class="forest-label ${colorClass ? 'on-color' : ''}" x="${pos.x}" y="${pos.y}">${escapeHtml(n.id)}</text>`;
        if (step.pai[n.id] === n.id) {
          svg += `<text class="forest-rank" x="${pos.x + radius + 3}" y="${pos.y - radius + 6}">r=${step.rank[n.id]}</text>`;
        }
      });
      svg += '</svg>';
      forestView.innerHTML = svg;
    }

    function renderExplain(step) {
      if (algo === 'prim') {
        explainTitle.textContent = step && step.current ? `Edges scanned from u = ${step.current}` : 'Edges scanned from u';
        if (!step) {
          explainContent.textContent = 'Run a step to see, for each edge (u, v) with v ∈ H, the comparison w(u, v) < key[v].';
          return;
        }

        let html = '';
        if (step.type === 'init') {
          html += `<p class="explain-note">Heap initialized. The first ExtractMin will return ${escapeHtml(startNode)} (key 0).</p>`;
        } else if (step.type === 'done') {
          html += `<p class="explain-note"><strong>Done.</strong> MST weight w(T) = ${step.total} with ${step.T.length} edges.</p>`;
        } else if (step.checks.length === 0) {
          html += `<p class="explain-note">u = ${escapeHtml(step.current)} was extracted. ${step.type === 'extract' ? 'Its edges to vertices still in H are scanned in the next steps.' : ''}</p>`;
        } else {
          html += '<table class="relaxation-table"><thead><tr><th>u</th><th>v</th><th>w(u,v)</th><th>key[v] before</th><th>result</th></tr></thead><tbody>';
          step.checks.forEach(check => {
            const result = check.updated
              ? `<td class="relax-updated">key[${escapeHtml(check.v)}] ← ${check.w}, pai[${escapeHtml(check.v)}] ← ${escapeHtml(check.u)}</td>`
              : '<td class="relax-kept">kept</td>';
            html += `<tr><td>${escapeHtml(check.u)}</td><td>${escapeHtml(check.v)}</td><td>${check.w}</td><td>${formatValue(check.before)}</td>${result}</tr>`;
          });
          html += '</tbody></table>';
        }

        // Cut property: lightest edge crossing (X, V − X).
        if (step.type !== 'done' && step.X.length > 0 && step.inHeap.length > 0) {
          const X = new Set(step.X);
          let best = null;
          edges.forEach((edge, index) => {
            const crosses = X.has(edge.source) !== X.has(edge.target);
            if (!crosses) return;
            if (best === null || edge.weight < edges[best].weight) best = index;
          });
          if (best !== null) {
            const edge = edges[best];
            const inside = X.has(edge.source) ? edge.source : edge.target;
            const outside = inside === edge.source ? edge.target : edge.source;
            html += `<p class="explain-note">Lightest edge crossing the cut (X, V − X): <strong>${escapeHtml(inside)}–${escapeHtml(outside)} (${edge.weight})</strong>.</p>`;
          }
        }
        explainContent.innerHTML = html;
      } else {
        explainTitle.textContent = 'Edges in sorted order';
        const order = step ? step.order : Core.kruskalSortedOrder(edges);
        const status = step ? step.status : edges.map(() => 'pending');
        const labels = { pending: 'pending', accepted: 'accepted', rejected: 'rejected', skipped: 'not examined' };
        let html = '<div class="edge-chip-list">';
        order.forEach(e => {
          const isCurrent = step && step.currentEdge === e;
          const st = status[e];
          const label = isCurrent ? `current · ${labels[st]}` : labels[st];
          html += `<span class="edge-chip ${st} ${isCurrent ? 'current' : ''}">${escapeHtml(edgeLabel(edges[e]))} · ${edges[e].weight} <small>${label}</small></span>`;
        });
        html += '</div>';
        if (!step) {
          html += '<p class="explain-note">This is the order in which Kruskal will consider the edges (stable sort by weight).</p>';
        } else {
          const counts = { accepted: 0, rejected: 0, pending: 0, skipped: 0 };
          status.forEach(s => {
            counts[s] += 1;
          });
          html += `<p class="explain-note">Accepted: <strong>${counts.accepted}</strong> · Rejected: <strong>${counts.rejected}</strong> · Pending: <strong>${counts.pending}</strong>${counts.skipped ? ` · Not examined: <strong>${counts.skipped}</strong>` : ''}</p>`;
        }
        explainContent.innerHTML = html;
      }
    }

    function updateUI() {
      const step = currentStep();
      updateGraphView(step);
      renderLegend();
      renderPseudoCode(step);
      if (algo === 'prim') renderPrimState(step);
      else renderKruskalState(step);
      renderExplain(step);

      if (!step) {
        liveBadge.textContent = 'Ready';
        liveBadge.className = 'live-badge';
      } else if (step.type === 'done') {
        liveBadge.textContent = 'Done';
        liveBadge.className = 'live-badge live-complete';
      } else {
        liveBadge.textContent = `Step ${stepIndex + 1}/${trace.length}`;
        liveBadge.className = 'live-badge live-running';
      }
      stepBtn.disabled = !!(step && step.type === 'done');
    }

    /* --------------------------- controls ------------------------------ */

    function stepAlgorithm() {
      if (stepIndex >= trace.length - 1) {
        stopAuto();
        return;
      }
      stepIndex += 1;
      const step = currentStep();
      statusBanner.textContent = step.message;
      if (step.type === 'done') stopAuto();
      updateUI();
    }

    function toggleAuto() {
      if (autoTimer) {
        stopAuto();
        return;
      }
      if (stepIndex >= trace.length - 1) {
        stepIndex = -1;
      }
      autoBtn.textContent = 'Stop Auto';
      autoBtn.classList.add('active');
      stepAlgorithm();
      autoTimer = setInterval(() => {
        stepAlgorithm();
      }, AUTO_RUN_DELAY_MS);
    }

    function stopAuto() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
      autoBtn.textContent = 'Auto run';
      autoBtn.classList.remove('active');
    }

    function initRandomGraph() {
      const options = getRandomGraphOptions();
      loadGraphDefinition(
        Core.generateRandomGraph(options.nodeCount, options.density),
        `Random connected graph generated (${options.nodeCount} nodes, ${options.densityPercent}% density).`
      );
    }

    function setupBoardResizeHandle() {
      if (!boardStack || !boardResizeHandle) return;

      const minLeft = 280;
      const minRight = 330;

      const clearInlineSplitOnSmallScreens = () => {
        if (window.matchMedia('(max-width: 1200px)').matches) {
          boardStack.style.gridTemplateColumns = '';
        }
      };

      clearInlineSplitOnSmallScreens();
      window.addEventListener('resize', clearInlineSplitOnSmallScreens);

      boardResizeHandle.addEventListener('pointerdown', event => {
        if (window.matchMedia('(max-width: 1200px)').matches) return;

        event.preventDefault();
        boardResizeHandle.setPointerCapture(event.pointerId);
        boardResizeHandle.classList.add('is-active');
        document.body.classList.add('is-resizing');

        const stackRect = boardStack.getBoundingClientRect();
        const leftPanel = boardStack.querySelector('.main-visual-panel');
        const handleRect = boardResizeHandle.getBoundingClientRect();
        const initialLeft = leftPanel ? leftPanel.getBoundingClientRect().width : stackRect.width * 0.5;
        const handleWidth = handleRect.width || 14;
        const startX = event.clientX;

        const onMove = moveEvent => {
          const deltaX = moveEvent.clientX - startX;
          const maxLeft = Math.max(minLeft, stackRect.width - handleWidth - minRight);
          const nextLeft = clamp(initialLeft + deltaX, minLeft, maxLeft);
          const nextRight = Math.max(minRight, stackRect.width - handleWidth - nextLeft);
          boardStack.style.gridTemplateColumns = `${Math.round(nextLeft)}px ${Math.round(handleWidth)}px ${Math.round(nextRight)}px`;
        };

        const onUp = () => {
          boardResizeHandle.classList.remove('is-active');
          document.body.classList.remove('is-resizing');
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp, { once: true });
      });
    }

    stepBtn.addEventListener('click', () => {
      stopAuto();
      stepAlgorithm();
    });

    autoBtn.addEventListener('click', toggleAuto);

    resetBtn.addEventListener('click', () => {
      stopAuto();
      stepIndex = -1;
      statusBanner.textContent = `Reset. ${idleMessage()}`;
      updateUI();
    });

    newGraphBtn.addEventListener('click', () => {
      stopAuto();
      initRandomGraph();
    });

    nodeCountInput?.addEventListener('change', () => {
      getRandomGraphOptions();
    });

    densityRange?.addEventListener('input', updateDensityDisplay);

    algorithmSelect?.addEventListener('change', () => setAlgorithm(algorithmSelect.value));

    startSelect?.addEventListener('change', () => {
      if (!nodeIndex.has(startSelect.value)) return;
      stopAuto();
      startNode = startSelect.value;
      rebuildTrace();
      updateUI();
      syncGraphEditor();
      statusBanner.textContent = `Start vertex set to ${startNode}. ${idleMessage()}`;
    });

    function populateExampleSelect(selectedKey) {
      if (!exampleGraphSelect) return;
      exampleGraphSelect.innerHTML = Object.entries(exampleGraphs)
        .map(([key, value]) => `<option value="${key}">${escapeHtml(value.label)}</option>`)
        .join('');
      exampleGraphSelect.value = selectedKey;
    }

    loadExampleBtn?.addEventListener('click', () => {
      const selected = exampleGraphSelect?.value;
      if (!selected || !exampleGraphs[selected]) return;
      loadGraphDefinition(exampleGraphs[selected].graph, `Loaded example: ${exampleGraphs[selected].label}.`);
    });

    applyGraphBtn?.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(graphJsonInput.value);
        loadGraphDefinition(parsed, 'Custom graph applied.');
      } catch (error) {
        statusBanner.textContent = `Could not apply graph: ${error.message}`;
      }
    });

    exportGraphBtn?.addEventListener('click', () => {
      syncGraphEditor();
      statusBanner.textContent = 'Current graph exported to the JSON editor.';
    });

    graphFileInput?.addEventListener('change', async event => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        loadGraphDefinition(JSON.parse(text), `Loaded graph file: ${file.name}.`);
      } catch (error) {
        statusBanner.textContent = `Could not load file: ${error.message}`;
      } finally {
        event.target.value = '';
      }
    });

    // Modals
    const helpBtn = document.getElementById('helpBtn');
    const helpOverlay = document.getElementById('helpOverlay');
    const helpCloseBtn = document.getElementById('helpCloseBtn');
    const referencesBtn = document.getElementById('referencesBtn');
    const referencesOverlay = document.getElementById('referencesOverlay');
    const referencesCloseBtn = document.getElementById('referencesCloseBtn');

    helpBtn.addEventListener('click', () => {
      helpOverlay.hidden = false;
    });
    helpCloseBtn.addEventListener('click', () => {
      helpOverlay.hidden = true;
    });
    referencesBtn.addEventListener('click', () => {
      referencesOverlay.hidden = false;
    });
    referencesCloseBtn.addEventListener('click', () => {
      referencesOverlay.hidden = true;
    });
    [helpOverlay, referencesOverlay].forEach(overlay => {
      overlay.addEventListener('click', event => {
        if (event.target === overlay) overlay.hidden = true;
      });
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        helpOverlay.hidden = true;
        referencesOverlay.hidden = true;
      }
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const readTheme = () => {
      try {
        return localStorage.getItem('theme');
      } catch (error) {
        return null;
      }
    };
    const saveTheme = value => {
      try {
        localStorage.setItem('theme', value);
      } catch (error) {
        // Storage may be unavailable (e.g. sandboxed iframe); ignore.
      }
    };
    if (readTheme() === 'dark') {
      document.body.dataset.theme = 'dark';
    }
    themeToggle.addEventListener('click', () => {
      if (document.body.dataset.theme === 'dark') {
        document.body.dataset.theme = '';
        saveTheme('light');
      } else {
        document.body.dataset.theme = 'dark';
        saveTheme('dark');
      }
    });

    // Re-render when the graph area changes size (window resize, split handle, iframe resize).
    const handleContainerResize = () => {
      const { width, height } = getContainerSize();
      if (nodes.length === 0 || (width === lastSize.width && height === lastSize.height)) return;
      renderGraph();
      updateGraphView(currentStep());
    };
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(handleContainerResize).observe(container);
    } else {
      window.addEventListener('resize', handleContainerResize);
    }

    // URL parameters: ?algo=prim|kruskal and ?example=<key>
    const params = new URLSearchParams(window.location.search);
    const algoParam = (params.get('algo') || '').trim().toLowerCase();
    const exampleParam = (params.get('example') || '').trim();
    const initialAlgo = algoParam === 'kruskal' ? 'kruskal' : 'prim';
    const initialExample = Object.prototype.hasOwnProperty.call(exampleGraphs, exampleParam) ? exampleParam : DEFAULT_EXAMPLE;

    populateExampleSelect(initialExample);
    updateDensityDisplay();
    setupBoardResizeHandle();
    setAlgorithm(initialAlgo, { announce: false });

    // Small delay to ensure container dimensions are set
    setTimeout(() => {
      loadGraphDefinition(exampleGraphs[initialExample].graph, `Loaded example: ${exampleGraphs[initialExample].label}.`);
    }, 60);
  });
})();
