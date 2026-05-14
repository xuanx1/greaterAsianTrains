/* global React, ReactDOM, d3, topojson, STATIONS, ROUTES, STATIONS_BY_ID, COUNTRY_NAMES */
const { useState, useEffect, useMemo, useRef, useCallback, Fragment } = React;

// =============================================================
// HELPERS
// =============================================================

function fmtH(h) {
  if (h == null || isNaN(h)) return "—";
  if (h < 1) return Math.round(h * 60) + "m";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm === 0 ? `${hh}h` : `${hh}h ${mm.toString().padStart(2,"0")}`;
}

// Inline monochrome train icons for the Network toggle. They inherit
// `currentColor` from the surrounding button text so they flip between
// paper-on-ink (active) and ink-on-paper (hover) without any per-icon
// styling. Side profiles so the silhouette reads at a glance.
function ConvTrainIcon() {
  return (
    <svg viewBox="0 0 24 14" width="20" height="12" aria-hidden="true"
         style={{ verticalAlign: "-2px", marginRight: 6 }}
         fill="currentColor">
      {/* boxy locomotive body */}
      <rect x="3" y="3.2" width="14" height="6.6" rx="0.6" />
      {/* cab roof */}
      <rect x="12.5" y="1.3" width="4.5" height="2.2" rx="0.4" />
      {/* coupler stub */}
      <rect x="17" y="5.7" width="3.5" height="2" rx="0.3" />
      {/* wheels */}
      <circle cx="6" cy="11" r="1.5" />
      <circle cx="13" cy="11" r="1.5" />
    </svg>
  );
}

function HsrTrainIcon() {
  return (
    <svg viewBox="0 0 24 14" width="20" height="12" aria-hidden="true"
         style={{ verticalAlign: "-2px", marginRight: 6 }}
         fill="currentColor">
      {/* streamlined bullet nose pointing right */}
      <path d="M2 4.2 H17 L21 7.2 Q22 7.6 21 8 L17 9.8 H2 Z" />
      {/* tiny wheels at base */}
      <circle cx="6" cy="11" r="1.2" />
      <circle cx="13.5" cy="11" r="1.2" />
    </svg>
  );
}

// Best-effort frequency label for a route. Honours an explicit
// `r.freq` override when present, otherwise infers from the line name
// and train type. Reflects published timetables c. 2024–26:
//   • HSR services run roughly hourly or better on most corridors.
//   • Named conventional intercity (Reunification, Stadler, ETS, etc.)
//     runs multiple times a day.
//   • Sleepers / overnight services are usually one departure per day.
//   • Trans-Mongolian K3/K23 + Trans-Manchurian K19 are weekly.
//   • The Issyk-Kul / Caucasus heritage / Hejaz lines are seasonal.
function freqLabel(r) {
  if (r && r.freq) return r.freq;
  const line = ((r && r.line) || "").toLowerCase();
  const op = ((r && r.op) || "").toLowerCase();
  if (/trans[- ]?mongolian|trans[- ]?manchurian|\bk3\b|\bk4\b|\bk19\b|\bk20\b|\bk23\b|\bk24\b/.test(line)) {
    return "1–2×/week";
  }
  if (/seasonal|tourist|issyk-kul|hejaz/.test(line)) {
    return "Seasonal";
  }
  if (/heritage/.test(line)) {
    return "Heritage / limited";
  }
  if (/btk|baku.*tbilisi.*kars|kars.*tbilisi/.test(line)) {
    return "1–2×/week";
  }
  if (/yerevan express|tbilisi.*yerevan/.test(line)) {
    return "Every other day";
  }
  if (/overnight|sleeper|night express|do[ğg]u express|güney express|toros express/.test(line)) {
    return "Daily (overnight)";
  }
  if (/border|crossing|frontier/.test(line)) {
    return "Limited";
  }
  if (r && r.type === "hsr") {
    // Chinese / Korean / Japanese HSR corridors are extremely frequent;
    // Etihad / Haramain / Afrosiyob are scheduled multiple times daily.
    if (/etihad|haramain|afrosiyob|hafeet/.test(line) || /etihad rail/.test(op)) {
      return "Several daily";
    }
    return "Frequent (hourly+)";
  }
  return "Multiple daily";
}

// Returns the native string if it adds information beyond `name`, else null.
// Strips case, diacritics, punctuation, and whitespace before comparing — so
// "Bandung"/"Bandung", "Hue"/"Huế", "Tai'an"/"泰安" handle correctly. Multi-
// language natives (Singapore: "新加坡 · Singapura · சிங்கப்பூர்") survive
// because the joined string differs from the English name.
function nativeOrNull(name, native) {
  if (!native) return null;
  const norm = s => s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s'\-·.()\/]/g, "");
  return norm(name) === norm(native) ? null : native;
}

// Travel-time color ramp. Deep forest green → pale celadon as t→1.
function timeColor(hours, maxH, theme) {
  const t = Math.max(0, Math.min(1, hours / maxH));
  if (theme === "night") {
    // luminous on dark
    const lit = 38 + 38 * t;
    const sat = 78 - 25 * t;
    const hue = 148 - 14 * t;
    return `hsl(${hue}, ${sat}%, ${lit}%)`;
  }
  // warm-paper day
  const lit = 22 + 56 * t;
  const sat = 58 - 22 * t;
  const hue = 142 - 8 * t;
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

function lineWidthForTime(hours, maxH) {
  const t = Math.max(0, Math.min(1, hours / maxH));
  return 3.2 - 1.6 * t; // closer = thicker
}

// =============================================================
// GRAPH + DIJKSTRA
// =============================================================

function buildAdjacency(routes, hsrOnly) {
  const adj = {};
  const seen = new Set();
  for (const r of routes) {
    if (hsrOnly && r.type !== "hsr") continue;
    // Dedupe: same station pair (either direction) ignored on second occurrence.
    const k1 = `${r.from}|${r.to}`;
    const k2 = `${r.to}|${r.from}`;
    if (seen.has(k1) || seen.has(k2)) continue;
    seen.add(k1);
    (adj[r.from] = adj[r.from] || []).push({ to: r.to, h: r.h, r });
    (adj[r.to]   = adj[r.to]   || []).push({ to: r.from, h: r.h, r });
  }
  return adj;
}

function dijkstra(adj, origin) {
  const dist = { [origin]: 0 };
  const prev = {};
  const prevRoute = {};
  // Binary min-heap. Replaces the old `pq.sort()` surrogate, which was
  // O(N log N) per pop and made Dijkstra O(V²·log V) — ~230 M ops on a
  // 4 k-station graph and very noticeable when toggling HSR-only.
  const heap = [];
  const swap = (i, j) => { const t = heap[i]; heap[i] = heap[j]; heap[j] = t; };
  const push = (id, d) => {
    heap.push({ id, d });
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p].d <= heap[i].d) break;
      swap(p, i); i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0; const n = heap.length;
      while (true) {
        const l = 2*i + 1, r = 2*i + 2;
        let s = i;
        if (l < n && heap[l].d < heap[s].d) s = l;
        if (r < n && heap[r].d < heap[s].d) s = r;
        if (s === i) break;
        swap(s, i); i = s;
      }
    }
    return top;
  };
  push(origin, 0);
  const visited = new Set();
  while (heap.length) {
    const cur = pop();
    if (visited.has(cur.id)) continue;
    visited.add(cur.id);
    for (const n of (adj[cur.id] || [])) {
      const nd = cur.d + n.h;
      if (dist[n.to] === undefined || nd < dist[n.to]) {
        dist[n.to] = nd;
        prev[n.to] = cur.id;
        prevRoute[n.to] = n.r;
        push(n.to, nd);
      }
    }
  }
  return { dist, prev, prevRoute };
}

function pathTo(target, prev, prevRoute) {
  if (target == null) return { nodes: [], routes: [] };
  const nodes = [target];
  const routes = [];
  let cur = target;
  while (prev[cur] !== undefined) {
    routes.unshift(prevRoute[cur]);
    cur = prev[cur];
    nodes.unshift(cur);
  }
  return { nodes, routes };
}

// =============================================================
// GEOGRAPHY HELPERS
// =============================================================

// Great-circle distance in km between two stations.
function gcDist(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function fmtKm(km) {
  if (km == null) return "—";
  if (km < 10) return km.toFixed(1) + " km";
  return Math.round(km).toLocaleString("en-US") + " km";
}

// For an unreachable target, find its nearest reachable counterpart
// (= the single obvious bridge to build, by great-circle proximity).
function findBridge(target, reachableIds, stations) {
  const tgt = stations.find((s) => s.id === target);
  if (!tgt) return null;
  let best = null;
  let bestD = Infinity;
  for (const s of stations) {
    if (!reachableIds.has(s.id)) continue;
    if (s.id === target) continue;
    const d = gcDist(s, tgt);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best ? { from: best, to: tgt, km: bestD } : null;
}

// Identify routes that are visually redundant: a direct A→B edge where
// a chain A→…→B already exists through intermediate stations along the
// same geographic corridor. The dataset deliberately carries both
// (express through-services like Beijing→Shanghai 4.25h plus the chain
// of intermediates) so Dijkstra can pick the faster express; on the
// map this produces a straight chord on top of the wiggly chain. We
// keep all edges in the routing graph and only suppress the chord at
// render time. Returns a Set of indices into `routes`.
function computeRedundantRouteIndices(routes, stations) {
  const stById = Object.fromEntries(stations.map(s => [s.id, s]));
  const adj = {};
  for (let i = 0; i < routes.length; i++) {
    const r = routes[i];
    (adj[r.from] = adj[r.from] || []).push({ to: r.to, idx: i });
    (adj[r.to]   = adj[r.to]   || []).push({ to: r.from, idx: i });
  }
  const redundant = new Set();
  const MAX_HOPS = 14;
  for (let i = 0; i < routes.length; i++) {
    const r = routes[i];
    const a = stById[r.from], b = stById[r.to];
    if (!a || !b) continue;
    // Equirectangular projection around the segment's mid-latitude so
    // perpendicular-distance comparisons are roughly metric.
    const midLat = (a.lat + b.lat) / 2;
    const cos = Math.cos(midLat * Math.PI / 180);
    const ax = a.lng * cos, ay = a.lat;
    const bx = b.lng * cos, by = b.lat;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx*dx + dy*dy;
    const len = Math.sqrt(len2);
    if (len < 0.4) continue; // too short for an intermediate to fit
    const tol = Math.min(len * 0.15, 1.4); // ~155 km cap

    // BFS from r.from to r.to inside the corridor, skipping the direct
    // edge `i` and requiring at least one intermediate hop.
    const visited = new Set([r.from]);
    const hops = { [r.from]: 0 };
    const queue = [r.from];
    let qi = 0;
    let found = false;
    while (qi < queue.length && !found) {
      const cur = queue[qi++];
      const h = hops[cur];
      if (h >= MAX_HOPS) continue;
      for (const n of (adj[cur] || [])) {
        if (n.idx === i) continue;
        if (n.to === r.to) {
          if (cur !== r.from) { found = true; break; }
          continue; // a parallel direct edge isn't a chain — ignore
        }
        if (visited.has(n.to)) continue;
        const pt = stById[n.to];
        if (!pt) continue;
        const xx = pt.lng * cos, xy = pt.lat;
        const t = ((xx - ax) * dx + (xy - ay) * dy) / len2;
        if (t < -0.05 || t > 1.05) continue;
        const px = ax + t * dx, py = ay + t * dy;
        const pdx = xx - px, pdy = xy - py;
        if (pdx*pdx + pdy*pdy > tol*tol) continue;
        visited.add(n.to);
        hops[n.to] = h + 1;
        queue.push(n.to);
      }
    }
    if (found) redundant.add(i);
  }
  return redundant;
}

// Chain consecutive route segments of the same named rail line into
// continuous polylines so the map renders one smooth path per service
// instead of N individual line segments butted end-to-end (which look
// like dots-connecting-lines once a round stroke cap blooms at every
// station endpoint). Routes are grouped by `line` (the named service);
// inside each group we BFS-walk the adjacency, starting from degree-1
// nodes so endpoints come out as honest path termini, then mop up any
// remaining loop interior. Returns [{ stations: [id, ...], type }, …].
function chainRoutesIntoPolylines(routes) {
  const groups = new Map();
  for (const r of routes) {
    const k = r.line || r.op || "_";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const polylines = [];
  for (const [, es] of groups) {
    if (es.length === 0) continue;
    const adj = {};
    for (const r of es) {
      (adj[r.from] = adj[r.from] || []).push(r.to);
      (adj[r.to]   = adj[r.to]   || []).push(r.from);
    }
    const used = new Set(); // canonical edge keys
    const ek = (a, b) => a < b ? `${a}|${b}` : `${b}|${a}`;
    const nodes = Object.keys(adj);
    // Prefer starting from degree-1 endpoints — those produce a clean
    // walk to the far end of the chain. Fall back to any remaining
    // node so closed loops still get traversed.
    const starts = nodes.filter(n => adj[n].length === 1).concat(nodes);
    const type = es[0].type;
    for (const start of starts) {
      let cur = start;
      let walked = false;
      const stations = [start];
      while (true) {
        let next = null;
        for (const n of adj[cur]) {
          if (used.has(ek(cur, n))) continue;
          next = n;
          break;
        }
        if (next == null) break;
        used.add(ek(cur, next));
        stations.push(next);
        cur = next;
        walked = true;
      }
      if (walked && stations.length >= 2) {
        polylines.push({ stations, type });
      }
    }
  }
  return polylines;
}

// =============================================================
// Min-heap (for the bridge planner Dijkstra)
// =============================================================
class MinHeap {
  constructor() { this.a = []; }
  push(item) {
    this.a.push(item);
    let i = this.a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.a[p].d <= this.a[i].d) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
      i = p;
    }
  }
  pop() {
    if (!this.a.length) return null;
    const top = this.a[0];
    const last = this.a.pop();
    if (this.a.length) {
      this.a[0] = last;
      let i = 0;
      const n = this.a.length;
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let m = i;
        if (l < n && this.a[l].d < this.a[m].d) m = l;
        if (r < n && this.a[r].d < this.a[m].d) m = r;
        if (m === i) break;
        [this.a[m], this.a[i]] = [this.a[i], this.a[m]];
        i = m;
      }
    }
    return top;
  }
  get length() { return this.a.length; }
}

// =============================================================
// Bridge planner — minimises TOTAL journey distance (great-circle of
// rail-leg-sums + bridge gc). Uses a station-level Dijkstra over a
// graph that contains every rail edge plus top-K nearest cross-
// component pairs as candidate "bridges". The path is then split at
// each bridge edge into alternating rail / bridge sections.
// =============================================================
function planJourney(originId, destId, routes, hsrOnly, stations) {
  // 1. Build adjacency from routes
  const railAdj = {};
  const railEdges = [];
  for (const r of routes) {
    if (hsrOnly && r.type !== "hsr") continue;
    railEdges.push(r);
    (railAdj[r.from] = railAdj[r.from] || []).push({ to: r.to, r });
    (railAdj[r.to]   = railAdj[r.to]   || []).push({ to: r.from, r });
  }

  // 2. Components (undirected BFS on rail graph)
  const comp = {};
  let nextId = 0;
  for (const s of stations) {
    if (comp[s.id] !== undefined) continue;
    const stack = [s.id];
    while (stack.length) {
      const v = stack.pop();
      if (comp[v] !== undefined) continue;
      comp[v] = nextId;
      for (const n of (railAdj[v] || [])) {
        if (comp[n.to] === undefined) stack.push(n.to);
      }
    }
    nextId++;
  }

  // 3. Build a station-level weighted graph for the journey planner.
  //    - Rail edges: weight = gc(from, to), type "rail"
  //    - Inter-component edges: weight = gc(from, to) * BRIDGE_PENALTY,
  //      so the planner prefers many short bridges + existing rail over
  //      a single long bridge that skips countries.
  //      We also discard any pair > MAX_BRIDGE_KM (no transcontinental
  //      single hops).
  const BRIDGE_PENALTY = 3.0;
  const MAX_BRIDGE_KM = 1600;
  const stationById = Object.fromEntries(stations.map(s => [s.id, s]));
  const edges = {};
  for (const r of railEdges) {
    const a = stationById[r.from], b = stationById[r.to];
    if (!a || !b) continue;
    const km = gcDist(a, b);
    (edges[r.from] = edges[r.from] || []).push({ to: r.to, km, weight: km, type: "rail", route: r });
    (edges[r.to]   = edges[r.to]   || []).push({ to: r.from, km, weight: km, type: "rail", route: r });
  }

  // Group stations by component
  const byComp = {};
  for (const s of stations) {
    const c = comp[s.id];
    (byComp[c] = byComp[c] || []).push(s);
  }
  const compIds = Object.keys(byComp);
  const K_NEAREST = 14; // candidate bridge endpoints per component pair

  for (let i = 0; i < compIds.length; i++) {
    for (let j = i + 1; j < compIds.length; j++) {
      const a = compIds[i], b = compIds[j];
      const pairs = [];
      for (const sa of byComp[a]) {
        for (const sb of byComp[b]) {
          const km = gcDist(sa, sb);
          if (km > MAX_BRIDGE_KM) continue;
          pairs.push({ from: sa, to: sb, km });
        }
      }
      pairs.sort((x, y) => x.km - y.km);
      const top = pairs.slice(0, K_NEAREST);
      for (const p of top) {
        const w = p.km * BRIDGE_PENALTY;
        (edges[p.from.id] = edges[p.from.id] || []).push({ to: p.to.id, km: p.km, weight: w, type: "bridge" });
        (edges[p.to.id]   = edges[p.to.id]   || []).push({ to: p.from.id, km: p.km, weight: w, type: "bridge" });
      }
    }
  }

  // 3b. Fallback: for any component pair with no edges <= MAX_BRIDGE_KM,
  // include the SHORTEST pair anyway so very-isolated networks (e.g.
  // Bandung→Tokyo direct) can still be patched if needed.
  for (let i = 0; i < compIds.length; i++) {
    for (let j = i + 1; j < compIds.length; j++) {
      const a = compIds[i], b = compIds[j];
      // Check if any inter-component edge already exists for any station of a -> any station of b.
      let any = false;
      outer:
      for (const sa of byComp[a]) {
        for (const e of (edges[sa.id] || [])) {
          if (e.type === "bridge" && comp[e.to] === Number(b)) { any = true; break outer; }
        }
      }
      if (any) continue;
      // Find the absolute shortest pair (without distance cap)
      let best = null;
      for (const sa of byComp[a]) {
        for (const sb of byComp[b]) {
          const km = gcDist(sa, sb);
          if (!best || km < best.km) best = { from: sa, to: sb, km };
        }
      }
      if (best) {
        const w = best.km * BRIDGE_PENALTY;
        (edges[best.from.id] = edges[best.from.id] || []).push({ to: best.to.id, km: best.km, weight: w, type: "bridge" });
        (edges[best.to.id]   = edges[best.to.id]   || []).push({ to: best.from.id, km: best.km, weight: w, type: "bridge" });
      }
    }
  }

  // 4. Dijkstra on the unified graph (using `weight`, not `km`)
  const dist = { [originId]: 0 };
  const prev = {};
  const prevEdge = {};
  const visited = new Set();
  const pq = new MinHeap();
  pq.push({ id: originId, d: 0 });
  while (pq.length) {
    const cur = pq.pop();
    if (visited.has(cur.id)) continue;
    visited.add(cur.id);
    if (cur.id === destId) break;
    for (const e of (edges[cur.id] || [])) {
      const nd = cur.d + e.weight;
      if (dist[e.to] === undefined || nd < dist[e.to]) {
        dist[e.to] = nd;
        prev[e.to] = cur.id;
        prevEdge[e.to] = e;
        pq.push({ id: e.to, d: nd });
      }
    }
  }
  if (dist[destId] === undefined) return null;

  // 5. Walk back the path and split into alternating rail / bridge sections
  const path = [];
  let cur = destId;
  while (prev[cur] !== undefined) {
    path.unshift({ ...prevEdge[cur], from: prev[cur], to: cur });
    cur = prev[cur];
  }
  return { path, comp };
}

// Given a path of {from, to, type, route?, km}, group consecutive rails
// into a rail-section and emit bridges as their own section. For each
// rail section, we re-run a time-weighted Dijkstra inside its
// component to pick the fastest service for the leg.
function sectionsFromPath(path, origin, routes, hsrOnly, stations) {
  const stationById = Object.fromEntries(stations.map(s => [s.id, s]));
  const adj = (function () {
    const a = {};
    for (const r of routes) {
      if (hsrOnly && r.type !== "hsr") continue;
      (a[r.from] = a[r.from] || []).push({ to: r.to, h: r.h, r });
      (a[r.to]   = a[r.to]   || []).push({ to: r.from, h: r.h, r });
    }
    return a;
  })();

  const sections = [];
  let railStart = origin;
  let railEnd = null;
  let bridgeKmSum = 0;

  function flushRail(start, end) {
    if (!start || !end || start === end) return;
    const { dist, prev, prevRoute } = dijkstra(adj, start);
    if (dist[end] === undefined) return;
    const railPath = pathTo(end, prev, prevRoute);
    sections.push({
      kind: "rail",
      from: start, to: end,
      time: dist[end],
      routes: railPath.routes,
      nodes: railPath.nodes,
    });
  }

  for (const e of path) {
    if (e.type === "rail") {
      // Just track the end of the rail run
      railEnd = e.to;
    } else {
      // Bridge — flush any rail run first
      if (railEnd && railStart !== railEnd) {
        flushRail(railStart, railEnd);
      }
      sections.push({
        kind: "bridge",
        from: stationById[e.from],
        to: stationById[e.to],
        km: e.km,
      });
      bridgeKmSum += e.km;
      railStart = e.to;
      railEnd = null;
    }
  }
  // Trailing rail run
  if (railEnd && railStart !== railEnd) {
    flushRail(railStart, railEnd);
  }
  return { sections, totalBridgeKm: bridgeKmSum };
}

// =============================================================
// Build a full journey description: alternating rail sections (intra-
// component) and bridge segments (inter-component missing links). For
// a reachable destination, returns a single rail section. For a
// disconnected one, the chain origin → bridge_from → bridge_to →
// next_bridge_from → ... → destination.
// =============================================================
function buildJourney(origin, dest, adj, dist, prev, prevRoute, stations, hsrOnly) {
  if (!origin || !dest) return null;
  // Reachable — one rail section.
  if (dist[dest] !== undefined) {
    const railPath = pathTo(dest, prev, prevRoute);
    return {
      type: "reachable",
      sections: [{
        kind: "rail",
        from: origin, to: dest,
        time: dist[dest],
        routes: railPath.routes,
        nodes: railPath.nodes,
      }],
      totalRailTime: dist[dest],
      totalBridgeKm: 0,
      componentsTraversed: 1,
    };
  }
  // Disconnected — total-distance-optimised journey.
  const plan = planJourney(origin, dest, ROUTES, hsrOnly, stations);
  if (!plan) {
    return { type: "orphan", sections: [], totalRailTime: 0, totalBridgeKm: 0, componentsTraversed: 0 };
  }
  const { sections, totalBridgeKm } = sectionsFromPath(plan.path, origin, ROUTES, hsrOnly, stations);
  const totalRailTime = sections.filter(s => s.kind === "rail").reduce((s, sec) => s + sec.time, 0);
  const bridgeCount = sections.filter(s => s.kind === "bridge").length;
  return {
    type: "disconnected",
    sections,
    totalRailTime,
    totalBridgeKm,
    componentsTraversed: bridgeCount + 1,
  };
}

// =============================================================
// Major hubs — get persistent labels by default. Everything else is
// only labelled when on a drawn route, hovered, or is origin/destination.
// =============================================================
const MAJOR_STATIONS = new Set([
  // China
  "beijing","shanghai","guangzhou","chengdu","xian","wuhan","kunming",
  "lanzhou","urumqi","kashgar","shenyang","harbin","hongkong","shenzhen","chongqing",
  "hangzhou","nanjing","qingdao","jinan","zhengzhou","nanning","guiyang",
  "lhasa","fuzhou","xiamen",
  // Japan
  "tokyo","kyoto","shin_osaka","nagoya","hiroshima","hakata","sapporo","sendai",
  // Korea
  "seoul","busan",
  // Taiwan
  "taipei","kaohsiung","taichung",
  // North Korea + Mongolia + Russia
  "pyongyang","ulaanbaatar",
  "moscow","stpetersburg","vladivostok","irkutsk","krasnoyarsk","novosibirsk",
  "yekaterinburg","khabarovsk","volgograd","sochi","rostov_don","kazan","samara","nnovgorod",
  // SE Asia
  "hanoi","hcmc","danang","vientiane","luangprabang","phnompenh",
  "bangkok","chiangmai","yangon","mandalay","naypyidaw",
  "kualalumpur","singapore","jakarta","bandung","surabaya","yogyakarta",
  // South Asia
  "delhi","mumbai","chennai","howrah","bangalore","hyderabad_in","ahmedabad",
  "pune","trivandrum","lucknow","varanasi","patna","guwahati",
  "dhaka","chittagong","karachi","lahore","rawalpindi","peshawar","colombo",
  // West + Central Asia
  "tehran","mashhad","isfahan","tabriz","shiraz",
  "istanbul","ankara","izmir","tbilisi","baku","yerevan",
  "almaty","astana","tashkent","samarkand","ashgabat",
  "telaviv","jerusalem","riyadh","jeddah","mecca","medina","dammam",
]);

// Features in world-atlas that have no ISO `id` — match by name so we
// can still classify them. Northern Cyprus is the obvious one for Asia.
const ASIA_NAMES = new Set(["N. Cyprus"]);
const HATCH_NAMES = new Set(["N. Cyprus"]); // also no rail

// =============================================================
// DISPUTED BOUNDARY OUTLINES — loaded from data_disputed.js, which is
// generated from Natural Earth's ne_10m_admin_0_disputed_areas
// polygons (see uploads/build_disputed.py). Each entry has one or
// more rings; rings are drawn as closed dotted boundaries around the
// disputed territory. The dataset covers Asia-relevant disputes —
// Abkhazia, South Ossetia, Crimea, N. Cyprus, Kashmir/Aksai Chin/
// Arunachal, Nagorno-Karabakh, Korean DMZ, Donbas, Bhutan claims,
// etc. — at ~10m resolution rather than the prior ~6-vertex sketches.
const DISPUTED_LINES = (typeof window !== "undefined" && window.DISPUTED_LINES) || [];

const ASIAN_COUNTRY_IDS = new Set([
  "004","031","048","050","051","064","086","096","104","116","144",
  "156","158","196","268","275","344","356","360","364","368","376",
  "392","398","400","408","410","414","417","418","422","446","458",
  "462","496","512","524","586","608","626","634","643","682","702",
  "704","760","762","764","784","792","795","860","887",
]);

// Per-sub-region tints. Each country in our Asia set gets a slight
// fill bias matching its UN-style geographic sub-region — so the user
// can see at a glance which group a country belongs to without us
// having to draw a separate political-grouping overlay. ISO numeric
// codes match `feature.id` from world-atlas's countries-50m topojson.
const REGION_FILL = {};
const REGION_ORDER = ["North Asia", "East Asia", "Southeast Asia", "South Asia", "Central Asia", "West Asia"];
const REGION_COUNTRY_IDS = {
  // Russia — its own band, the giant northern landmass that previously
  // sat awkwardly inside "East Asia".
  "North Asia":     ["643"],
  // CN, HK, MO, TW, MN, KP, KR, JP
  "East Asia":      ["156","344","446","158","496","408","410","392"],
  // VN, LA, KH, TH, MM, MY, SG, ID, PH, BN, TL
  "Southeast Asia": ["704","418","116","764","104","458","702","360","608","096","626"],
  // IN, BD, PK, LK, NP, BT, MV, AF
  "South Asia":     ["356","050","586","144","524","064","462","004"],
  // KZ, UZ, TM, TJ, KG
  "Central Asia":   ["398","860","795","762","417"],
  // IR, IQ, TR, GE, AM, AZ, IL, PS, SA, AE, OM, BH, QA, KW, YE, JO, LB, SY, CY
  "West Asia":      ["364","368","792","268","051","031","376","275","682","784",
                     "512","048","634","414","887","400","422","760","196"],
};
for (const region of REGION_ORDER) {
  for (const id of REGION_COUNTRY_IDS[region]) REGION_FILL[id] = region;
}
const REGION_VAR = {
  "North Asia":     "var(--region-north)",
  "East Asia":      "var(--region-east)",
  "Southeast Asia": "var(--region-southeast)",
  "South Asia":     "var(--region-south)",
  "Central Asia":   "var(--region-central)",
  "West Asia":      "var(--region-west)",
};

// Europe ↔ Asia divide line. Loaded from data_continents.js, which
// is generated by uploads/build_continents.py from the published
// asia_europe_border geojson (Urals, Ural River, Caspian, Caucasus,
// Bosphorus, Aegean) and Douglas-Peucker-simplified for runtime
// size. Each entry is one LineString segment.
const CONTINENT_DIVIDE_LINES =
  (typeof window !== "undefined" && window.CONTINENT_DIVIDE_LINES) || [];

// Each disputed-area outline gets its own "eraser" stroke under the
// dotted overlay; the eraser must match the host country's regional
// fill or it shows up as a wrong-coloured ribbon across the tinted
// land. Map disputed-area names → the colour variable for the
// country that administers (or claims) them. Areas outside our Asian
// tint set (Ukraine, Moldova) fall back to the base --land cream.
const DISPUTED_HOST_TINT = {
  "Abkhazia (Self admin., claimed by Georgia)": "var(--region-west)",
  "South Ossetia (Self admin., claimed by Georgia)": "var(--region-west)",
  "Nagorno-Karabakh (Artsakh)":                 "var(--region-west)",
  "Northern Cyprus (TRNC)":                     "var(--region-west)",
  "Cyprus UN Buffer Zone":                      "var(--region-west)",
  "Gaza Strip":                                 "var(--region-west)",
  "West Bank":                                  "var(--region-west)",
  "Golan Heights (Admin. Israel, claimed Syria)": "var(--region-west)",
  "Golan UNDOF Zone":                           "var(--region-west)",
  "Shebaa Farms (Admin. Israel, claimed Lebanon)": "var(--region-west)",
  "Jammu & Kashmir (Admin. India, claimed Pakistan)": "var(--region-south)",
  "Azad Kashmir":                               "var(--region-south)",
  "Gilgit-Baltistan (Admin. Pakistan, claimed India)": "var(--region-south)",
  "Siachen Glacier (India/Pakistan)":           "var(--region-south)",
  "Arunachal Pradesh (Admin. India, claimed China)": "var(--region-south)",
  "Om Parvat sector":                           "var(--region-south)",
  "Demchok sector":                             "var(--region-south)",
  "Samdu Valleys":                              "var(--region-south)",
  "Tirpani Valleys":                            "var(--region-south)",
  "Bara Hotii Valleys":                         "var(--region-south)",
  "Bhutan NW valleys (claimed China)":          "var(--region-south)",
  "Bhutan – Chumbi salient (claimed China)":    "var(--region-south)",
  "Aksai Chin (Admin. China, claimed India)":   "var(--region-east)",
  "Shaksgam Valley (Admin. China, claimed India)": "var(--region-east)",
  "Korean DMZ (south side)":                    "var(--region-east)",
  "Korean DMZ (north side)":                    "var(--region-east)",
  "Kuril Is.":                                  "var(--region-north)",
  "Paracel Is.":                                "var(--region-southeast)",
  "Spratly Is.":                                "var(--region-southeast)",
  // Ukraine / Moldova are not in our Asian tint set — fall back to --land
  "Crimea (Russia–Ukraine)":                    "var(--land)",
  "Donetsk PR (Self admin., claimed Ukraine)":  "var(--land)",
  "Luhansk PR (Self admin., claimed Ukraine)":  "var(--land)",
  "Transnistria (Self admin., claimed Moldova)": "var(--land)",
};

// =============================================================
// Reachability isochrone grid + marching-squares contour extraction
// =============================================================
// Contour grid bounds — MUST enclose every station, else contours stop
// rendering above the cap (the previous 62 °N ceiling left Murmansk,
// Vorkuta, the whole Kola Peninsula, Komi and Yakutia uncontoured, which
// looked like a permanent "plateau above Petrozavodsk" no matter how
// many intermediaries got added). Actual station envelope is
// (-8.4..69.5 lat, 19.0..145.6 lng) at time of writing; pad by ~2°.
const GRID_LNG_MIN = 17, GRID_LNG_MAX = 148;
const GRID_LAT_MIN = -10, GRID_LAT_MAX = 72;
const GRID_STEP = 0.18;
const OFF_RAIL_FREE_KM = 0;
const OFF_RAIL_SPEED = 10;
const OFF_RAIL_CAP_KM = 280;
const GRID_CEIL = 9999;
const BLUR_PASSES = 5;

function buildContourGrid(origin, dist, stations) {
  if (!origin) return null;
  const cols = Math.round((GRID_LNG_MAX - GRID_LNG_MIN) / GRID_STEP) + 1;
  const rows = Math.round((GRID_LAT_MAX - GRID_LAT_MIN) / GRID_STEP) + 1;
  const grid = new Float32Array(cols * rows);
  grid.fill(GRID_CEIL);
  const reachable = [];
  for (const s of stations) {
    if (dist[s.id] === undefined) continue;
    reachable.push(s);
  }
  if (!reachable.length) return { grid, cols, rows };
  // Precompute a station bbox in grid cells for each station to prune
  const range = OFF_RAIL_CAP_KM / 111; // deg
  for (const s of reachable) {
    const t0 = dist[s.id];
    const cosL = Math.cos(s.lat * Math.PI / 180);
    const lngRange = range / Math.max(cosL, 0.2);
    const i0 = Math.max(0, Math.floor((s.lng - lngRange - GRID_LNG_MIN) / GRID_STEP));
    const i1 = Math.min(cols - 1, Math.ceil((s.lng + lngRange - GRID_LNG_MIN) / GRID_STEP));
    const j0 = Math.max(0, Math.floor((s.lat - range - GRID_LAT_MIN) / GRID_STEP));
    const j1 = Math.min(rows - 1, Math.ceil((s.lat + range - GRID_LAT_MIN) / GRID_STEP));
    for (let j = j0; j <= j1; j++) {
      const lat = GRID_LAT_MIN + j * GRID_STEP;
      for (let i = i0; i <= i1; i++) {
        const lng = GRID_LNG_MIN + i * GRID_STEP;
        const km = gcDist({ lat, lng }, s);
        if (km > OFF_RAIL_CAP_KM) continue;
        const walk = km <= OFF_RAIL_FREE_KM ? 0 : (km - OFF_RAIL_FREE_KM) / OFF_RAIL_SPEED;
        const t = t0 + walk;
        const idx = j * cols + i;
        if (t < grid[idx]) grid[idx] = t;
      }
    }
  }
  return { grid: blurGrid(grid, cols, rows, BLUR_PASSES), cols, rows };
}

// Lightweight in-place 3×3 box blur over finite cells. Smooths the
// "union of circles" look so marching squares yields curved contours
// rather than dotty boolean shapes. Ceiling-valued cells stay as cap.
function blurGrid(grid, cols, rows, passes) {
  let cur = grid;
  for (let p = 0; p < passes; p++) {
    const next = new Float32Array(cur.length);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        let sum = 0, n = 0;
        for (let dj = -1; dj <= 1; dj++) {
          const jj = j + dj;
          if (jj < 0 || jj >= rows) continue;
          for (let di = -1; di <= 1; di++) {
            const ii = i + di;
            if (ii < 0 || ii >= cols) continue;
            sum += cur[jj * cols + ii];
            n++;
          }
        }
        next[j * cols + i] = sum / n;
      }
    }
    cur = next;
  }
  return cur;
}

// Marching squares — emit ARRAY of polylines (each an array of [x,y]
// points). We then chain adjacent segments into continuous polylines and
// render them with d3.line(curveCatmullRom) for smooth curves.
function marchingSquaresPolylines(gridInfo, threshold, projection) {
  if (!gridInfo) return [];
  const { grid, cols, rows } = gridInfo;
  const segments = [];
  const lerpEdge = (i0, j0, i1, j1, v0, v1) => {
    const f = (v0 === v1) ? 0.5 : (threshold - v0) / (v1 - v0);
    const ci = i0 + (i1 - i0) * f;
    const cj = j0 + (j1 - j0) * f;
    return projection([GRID_LNG_MIN + ci * GRID_STEP, GRID_LAT_MIN + cj * GRID_STEP]);
  };
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const v0 = grid[j * cols + i];
      const v1 = grid[j * cols + (i + 1)];
      const v2 = grid[(j + 1) * cols + (i + 1)];
      const v3 = grid[(j + 1) * cols + i];
      const c = (v0 < threshold ? 1 : 0) |
                (v1 < threshold ? 2 : 0) |
                (v2 < threshold ? 4 : 0) |
                (v3 < threshold ? 8 : 0);
      if (c === 0 || c === 15) continue;
      const e0 = () => lerpEdge(i, j, i + 1, j, v0, v1);
      const e1 = () => lerpEdge(i + 1, j, i + 1, j + 1, v1, v2);
      const e2 = () => lerpEdge(i, j + 1, i + 1, j + 1, v3, v2);
      const e3 = () => lerpEdge(i, j, i, j + 1, v0, v3);
      switch (c) {
        case 1:  segments.push([e3(), e0()]); break;
        case 2:  segments.push([e0(), e1()]); break;
        case 3:  segments.push([e3(), e1()]); break;
        case 4:  segments.push([e1(), e2()]); break;
        case 5:  segments.push([e3(), e0()]); segments.push([e1(), e2()]); break;
        case 6:  segments.push([e0(), e2()]); break;
        case 7:  segments.push([e3(), e2()]); break;
        case 8:  segments.push([e2(), e3()]); break;
        case 9:  segments.push([e2(), e0()]); break;
        case 10: segments.push([e0(), e1()]); segments.push([e2(), e3()]); break;
        case 11: segments.push([e2(), e1()]); break;
        case 12: segments.push([e1(), e3()]); break;
        case 13: segments.push([e1(), e0()]); break;
        case 14: segments.push([e0(), e3()]); break;
      }
    }
  }
  if (!segments.length) return [];

  // Chain segments into continuous polylines by joining matching endpoints.
  const key = ([x, y]) => `${Math.round(x * 4)}|${Math.round(y * 4)}`;
  const ends = new Map();
  segments.forEach((seg, idx) => {
    const ka = key(seg[0]), kb = key(seg[1]);
    if (!ends.has(ka)) ends.set(ka, []);
    if (!ends.has(kb)) ends.set(kb, []);
    ends.get(ka).push({ idx, end: 0 });
    ends.get(kb).push({ idx, end: 1 });
  });
  const used = new Array(segments.length).fill(false);
  const polylines = [];
  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const poly = [segments[i][0], segments[i][1]];
    // forward
    let curKey = key(segments[i][1]);
    while (true) {
      const cands = ends.get(curKey) || [];
      const next = cands.find(c => !used[c.idx]);
      if (!next) break;
      used[next.idx] = true;
      const seg = segments[next.idx];
      const other = seg[1 - next.end];
      poly.push(other);
      curKey = key(other);
    }
    // backward
    curKey = key(segments[i][0]);
    while (true) {
      const cands = ends.get(curKey) || [];
      const next = cands.find(c => !used[c.idx]);
      if (!next) break;
      used[next.idx] = true;
      const seg = segments[next.idx];
      const other = seg[1 - next.end];
      poly.unshift(other);
      curKey = key(other);
    }
    polylines.push(poly);
  }
  return polylines;
}

// =============================================================
// MAP COMPONENT
// =============================================================

const W = 1280, H = 880;

function useProjection(stations) {
  return useMemo(() => {
    if (!window.d3) return null;
    const coords = stations.map(s => [s.lng, s.lat]);
    const fc = {
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: { type: "MultiPoint", coordinates: coords } }],
    };
    // Mercator. The high-latitude visual stretch is fine — what was
    // actually breaking the "plateau above Petrozavodsk" was the contour
    // GRID having a 62 °N ceiling, not the projection (now lifted to
    // 72 °N upstream).
    return d3.geoMercator().fitExtent([[24, 40], [W - 24, H - 40]], fc);
  }, [stations]);
}

function useWorldGeo() {
  const [world, setWorld] = useState(null);
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const url = "assets/countries-50m.json";
        const res = await fetch(url);
        if (!res.ok) throw new Error("countries-50m fetch failed");
        const topo = await res.json();
        if (dead) return;
        const collection = topojson.feature(topo, topo.objects.countries);
        const borders = topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b);
        // Each feature has .id = ISO numeric (string, e.g. "156" for China)
        setWorld({ features: collection.features, borders });
      } catch (e) {
        console.warn("Could not load world geography:", e);
      }
    })();
    return () => { dead = true; };
  }, []);
  return world;
}

// =============================================================
// COUNTRY LABEL POSITIONS (centroid-ish, hand-tuned)
// =============================================================
const COUNTRY_LABELS = [
  { code: "CN", text: "CHINA",       lat: 36.0,  lng: 100.0, size: 34, ls: 14 },
  { code: "RU", text: "RUSSIA",      lat: 56.0,  lng: 95.0,  size: 30, ls: 14 },
  { code: "MN", text: "MONGOLIA",    lat: 46.5,  lng: 102.0, size: 18, ls: 8 },
  { code: "JP", text: "JAPAN",       lat: 36.5,  lng: 138.0, size: 18, ls: 8 },
  { code: "KR", text: "KOREA",       lat: 36.8,  lng: 128.1, size: 12, ls: 5 },
  { code: "TW", text: "TAIWAN",      lat: 23.7,  lng: 121.0, size: 11, ls: 4 },
  { code: "VN", text: "VIETNAM",     lat: 15.5,  lng: 107.2, size: 14, ls: 5 },
  { code: "LA", text: "LAOS",        lat: 19.5,  lng: 103.6, size: 10, ls: 3 },
  { code: "TH", text: "THAILAND",    lat: 15.5,  lng: 100.3, size: 14, ls: 5 },
  { code: "MM", text: "MYANMAR",     lat: 21.5,  lng: 95.5,  size: 14, ls: 5 },
  { code: "KH", text: "CAMBODIA",    lat: 12.3,  lng: 104.8, size: 11, ls: 3 },
  { code: "MY", text: "MALAYSIA",    lat: 3.8,   lng: 102.4, size: 12, ls: 4 },
  { code: "ID", text: "INDONESIA",   lat: -3.0,  lng: 110.0, size: 16, ls: 6 },
  { code: "PH", text: "PHILIPPINES", lat: 12.0,  lng: 122.0, size: 12, ls: 5 },
  { code: "IN", text: "INDIA",       lat: 22.0,  lng: 79.0,  size: 30, ls: 14 },
  { code: "BD", text: "BANGLADESH",  lat: 24.0,  lng: 90.3,  size: 10, ls: 3 },
  { code: "PK", text: "PAKISTAN",    lat: 29.5,  lng: 69.5,  size: 16, ls: 6 },
  { code: "LK", text: "SRI LANKA",   lat: 7.5,   lng: 80.9,  size: 10, ls: 3 },
  { code: "NP", text: "NEPAL",       lat: 28.4,  lng: 84.1,  size: 9,  ls: 3 },
  { code: "AF", text: "AFGHANISTAN", lat: 34.0,  lng: 66.0,  size: 13, ls: 4 },
  { code: "IR", text: "IRAN",        lat: 33.0,  lng: 54.0,  size: 22, ls: 10 },
  { code: "TR", text: "T\u00DCRKIYE",lat: 39.0,  lng: 35.0,  size: 18, ls: 8 },
  { code: "KZ", text: "KAZAKHSTAN",  lat: 49.0,  lng: 67.0,  size: 22, ls: 10 },
  { code: "UZ", text: "UZBEKISTAN",  lat: 42.0,  lng: 63.5,  size: 12, ls: 5 },
  { code: "TM", text: "TURKMENISTAN",lat: 39.5,  lng: 59.0,  size: 11, ls: 4 },
  { code: "KG", text: "KYRGYZSTAN",  lat: 41.6,  lng: 74.8,  size: 9,  ls: 3 },
  { code: "TJ", text: "TAJIKISTAN",  lat: 39.0,  lng: 71.5,  size: 9,  ls: 3 },
  { code: "SA", text: "SAUDI ARABIA",lat: 24.0,  lng: 45.0,  size: 18, ls: 8 },
  { code: "IQ", text: "IRAQ",        lat: 33.0,  lng: 44.0,  size: 11, ls: 4 },
  { code: "SY", text: "SYRIA",       lat: 35.0,  lng: 38.5,  size: 9,  ls: 3 },
  { code: "OM", text: "OMAN",        lat: 21.0,  lng: 56.5,  size: 11, ls: 4 },
  { code: "YE", text: "YEMEN",       lat: 15.5,  lng: 47.5,  size: 11, ls: 4 },
  { code: "AE", text: "UAE",         lat: 23.8,  lng: 54.5,  size: 9,  ls: 3 },
  { code: "JO", text: "JORDAN",      lat: 31.0,  lng: 36.5,  size: 9,  ls: 3 },
  { code: "IL", text: "ISRAEL",      lat: 31.5,  lng: 35.0,  size: 8,  ls: 2 },
  { code: "LB", text: "LEBANON",     lat: 33.9,  lng: 35.7,  size: 8,  ls: 2 },
  { code: "GE", text: "GEORGIA",     lat: 42.0,  lng: 43.5,  size: 9,  ls: 3 },
  { code: "AM", text: "ARMENIA",     lat: 40.2,  lng: 45.0,  size: 8,  ls: 2 },
  { code: "AZ", text: "AZERBAIJAN",  lat: 40.4,  lng: 48.0,  size: 9,  ls: 3 },
  { code: "BT", text: "BHUTAN",      lat: 27.5,  lng: 90.4,  size: 8,  ls: 2 },
];

const SEA_LABELS = [
  { text: "SOUTH CHINA SEA",  lat: 14.0,  lng: 116.0, size: 14, italic: true },
  { text: "GULF OF THAILAND", lat: 9.5,   lng: 101.6, size: 10, italic: true },
  { text: "BAY OF BENGAL",    lat: 14.0,  lng: 89.0,  size: 13, italic: true },
  { text: "ARABIAN SEA",      lat: 14.0,  lng: 67.0,  size: 14, italic: true },
  { text: "EAST CHINA SEA",   lat: 30.0,  lng: 126.0, size: 12, italic: true },
  { text: "SEA OF JAPAN",     lat: 39.5,  lng: 134.5, size: 12, italic: true },
  { text: "PHILIPPINE SEA",   lat: 20.0,  lng: 132.5, size: 12, italic: true },
  { text: "YELLOW SEA",       lat: 35.2,  lng: 122.5, size: 11, italic: true },
  { text: "ARAL SEA",         lat: 45.0,  lng: 59.5,  size: 9,  italic: true },
  { text: "CASPIAN SEA",      lat: 41.0,  lng: 51.0,  size: 14, italic: true },
  { text: "BLACK SEA",        lat: 43.0,  lng: 35.0,  size: 12, italic: true },
  { text: "PERSIAN GULF",     lat: 26.5,  lng: 52.0,  size: 10, italic: true },
  { text: "RED SEA",          lat: 19.5,  lng: 38.5,  size: 11, italic: true },
  { text: "ANDAMAN SEA",      lat: 11.0,  lng: 95.5,  size: 11, italic: true },
];

// =============================================================
// MAP
// =============================================================
function MapView({
  theme, hsrOnly, origin, setOrigin, hoverDest, setHoverDest,
  selectedDest, setSelectedDest, maxHours, contoursOn, regionsOn,
  showSeaLabels, showCountryLabels
}) {
  const projection = useProjection(STATIONS);
  const world = useWorldGeo();
  const svgRef = useRef(null);
  const zoomGroupRef = useRef(null);
  const [zoomT, setZoomT] = useState({ k: 1, x: 0, y: 0 });

  useEffect(() => {
    if (!svgRef.current || !window.d3) return;
    const svg = d3.select(svgRef.current);
    // d3-zoom fires "zoom" once per pointer/wheel event — often many
    // times per frame on a trackpad pan. Coalesce to one setState per
    // animation frame so React only reconciles the SVG tree at most
    // 60 times/sec.
    let pending = null;
    let raf = 0;
    const flush = () => {
      raf = 0;
      if (pending) { setZoomT(pending); pending = null; }
    };
    const zoom = d3.zoom()
      .scaleExtent([1, 14])
      .translateExtent([[0, 0], [W, H]])
      .filter((event) => {
        if (event.type === "mousedown" || event.type === "touchstart") {
          const t = event.target;
          if (t && (t.closest(".station") || t.closest(".list-row"))) return false;
        }
        return !event.button;
      })
      .on("zoom", (event) => {
        const t = event.transform;
        pending = { k: t.k, x: t.x, y: t.y };
        if (!raf) raf = requestAnimationFrame(flush);
      });
    svg.call(zoom);
    return () => {
      svg.on(".zoom", null);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const adj = useMemo(() => buildAdjacency(ROUTES, hsrOnly), [hsrOnly]);
  const { dist, prev, prevRoute } = useMemo(
    () => origin ? dijkstra(adj, origin) : { dist: {}, prev: {}, prevRoute: {} },
    [adj, origin]
  );
  // Unified journey: single rail section for reachable, alternating
  // rail/bridge sections for disconnected.
  const journey = useMemo(
    () => buildJourney(origin, selectedDest, adj, dist, prev, prevRoute, STATIONS, hsrOnly),
    [origin, selectedDest, adj, dist, prev, prevRoute, hsrOnly]
  );

  // Routes that are part of any rail section of the journey, indexed by from|to.
  const journeyRouteSet = useMemo(() => {
    if (!journey) return new Set();
    const s = new Set();
    for (const sec of journey.sections) {
      if (sec.kind !== "rail") continue;
      for (const r of sec.routes) s.add(`${r.from}|${r.to}`);
    }
    return s;
  }, [journey]);

  // Set of station ids that appear in any rail-section node list.
  const journeyNodeSet = useMemo(() => {
    if (!journey) return new Set();
    const s = new Set();
    for (const sec of journey.sections) {
      if (sec.kind !== "rail") continue;
      for (const n of sec.nodes) s.add(n);
    }
    return s;
  }, [journey]);

  if (!projection) return null;
  const pathGen = world ? d3.geoPath(projection) : null;
  // Project once per projection change. Previously stationPts was
  // rebuilt on every render — that's ~4000 array allocations and
  // projection calls per pan/zoom/scrub frame, which dominates the
  // map's update cost.
  const stationPts = useMemo(() => {
    if (!projection) return [];
    return STATIONS.map(s => {
      const [x, y] = projection([s.lng, s.lat]);
      return { ...s, x, y };
    });
  }, [projection]);
  const ptById = useMemo(
    () => Object.fromEntries(stationPts.map(s => [s.id, s])),
    [stationPts]
  );

  // Determine which routes to draw based on filter
  const visibleRoutes = useMemo(
    () => ROUTES.filter(r => !hsrOnly || r.type === "hsr"),
    [hsrOnly]
  );
  // Indices into visibleRoutes whose direct line duplicates a chain
  // through intermediate stations — hidden from the map but kept in
  // the routing graph so Dijkstra still picks the faster express.
  const redundantIdx = useMemo(
    () => computeRedundantRouteIndices(visibleRoutes, STATIONS),
    [visibleRoutes]
  );
  // Non-redundant routes chained into continuous polylines by rail line —
  // drives the background underlay so each named service renders as one
  // smooth path rather than a string of butt-jointed segments.
  const chainedPolylines = useMemo(() => {
    const keep = visibleRoutes.filter((_, i) => !redundantIdx.has(i));
    return chainRoutesIntoPolylines(keep);
  }, [visibleRoutes, redundantIdx]);
  // Reachability isochrones — the slow part (grid build, marching
  // squares, d3 smoothing) only depends on origin/dist/projection,
  // not on maxHours. Precompute path data for every threshold once
  // and let scrubbing the time budget just filter the array.
  const contourAll = useMemo(() => {
    if (!origin || !projection) return null;
    const gridInfo = buildContourGrid(origin, dist, STATIONS);
    if (!gridInfo) return null;
    const allLevels = [0.5, 1, 2, 3, 5, 7, 10, 14, 18, 24, 32, 40, 48];
    const smoothLine = window.d3
      ? d3.line().x(p => p[0]).y(p => p[1]).curve(d3.curveCatmullRomClosed.alpha(0.5))
      : null;
    const fallbackPath = (poly) => {
      if (poly.length === 0) return "";
      return "M" + poly.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L") + "Z";
    };
    const dStrings = allLevels.map(th => {
      const polys = marchingSquaresPolylines(gridInfo, th, projection);
      if (!polys.length) return "";
      return polys.map(p => (smoothLine ? smoothLine(p) : fallbackPath(p))).join(" ");
    });
    return { allLevels, dStrings };
  }, [origin, dist, projection]);
  // Per-frame slice keyed by maxHours.
  const contourLayers = contourAll && {
    levels: contourAll.allLevels.filter(t => t <= maxHours),
    dStrings: contourAll.allLevels
      .map((t, i) => t <= maxHours ? contourAll.dStrings[i] : null)
      .filter(d => d !== null),
  };
  // Pre-projected Europe/Asia divide segments. Concatenated into one
  // multi-subpath `d` string — each segment is M…L…L…, no Z.
  const continentDivideD = useMemo(() => {
    if (!projection || !CONTINENT_DIVIDE_LINES.length) return "";
    return CONTINENT_DIVIDE_LINES.map(seg => {
      if (seg.length < 2) return "";
      return "M" + seg
        .map((c, j) => (j === 0 ? "" : "L") + projection(c).join(","))
        .join("");
    }).filter(s => s).join(" ");
  }, [projection]);
  // ASIA / EUROPE label anchors sampled along the divide line at a
  // fixed pixel interval, so labels repeat along the boundary like
  // country names on Google Maps. Each anchor carries the projected
  // base position, the local tangent angle (so labels run parallel
  // to the line), and pre-classified Europe / Asia perpendicular
  // unit vectors — Europe is the side whose perpendicular points
  // more "north-west" in screen coordinates (the heuristic works
  // for the Urals, Ural River, Caucasus, and Bosphorus all at once).
  const continentLabelAnchors = useMemo(() => {
    if (!projection || !CONTINENT_DIVIDE_LINES.length) return [];
    const SAMPLE_DIST = 50; // projection units between consecutive label pairs
    const anchors = [];
    for (const seg of CONTINENT_DIVIDE_LINES) {
      if (seg.length < 2) continue;
      const ps = seg.map(c => projection(c));
      let walked = SAMPLE_DIST * 0.5; // initial offset
      for (let i = 0; i < ps.length - 1; i++) {
        const [x0, y0] = ps[i], [x1, y1] = ps[i+1];
        const dx = x1 - x0, dy = y1 - y0;
        const segLen = Math.hypot(dx, dy);
        if (segLen < 1) continue;
        while (walked < segLen) {
          const t = walked / segLen;
          const baseX = x0 + dx * t;
          const baseY = y0 + dy * t;
          // Tangent angle, flipped so text is never upside-down.
          let angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
          if (angleDeg > 90)  angleDeg -= 180;
          if (angleDeg < -90) angleDeg += 180;
          // Two perpendicular candidates.
          const pAx = -dy / segLen, pAy = dx / segLen; // 90° CCW
          const pBx =  dy / segLen, pBy = -dx / segLen; // 90° CW
          // Europe direction in screen coords ≈ NW (negative X, negative Y).
          const scoreA = -pAx - pAy;
          const scoreB = -pBx - pBy;
          const europe = scoreA > scoreB ? [pAx, pAy] : [pBx, pBy];
          const asia   = scoreA > scoreB ? [pBx, pBy] : [pAx, pAy];
          anchors.push({
            baseX, baseY, angleDeg,
            ePerpX: europe[0], ePerpY: europe[1],
            aPerpX: asia[0],   aPerpY: asia[1],
          });
          walked += SAMPLE_DIST;
        }
        walked -= segLen;
      }
    }
    return anchors;
  }, [projection]);
  // Foreground colored route layer, chained per rail line and split
  // into runs of consecutive segments that share the same on-route
  // status and stay within the time budget. Each run is rendered as
  // ONE <path> downstream, so a long service like the Trans-Sib reads
  // as a single coloured polyline instead of fifty butt-jointed
  // segments with visible notches at every station.
  const foregroundRuns = useMemo(() => {
    if (!origin) return [];
    const out = [];
    for (const chain of chainedPolylines) {
      let cur = null;
      const flush = () => {
        if (cur && cur.stations.length >= 2 && cur.times.length) {
          let maxT = 0;
          for (const t of cur.times) if (t > maxT) maxT = t;
          cur.maxT = maxT;
          out.push(cur);
        }
        cur = null;
      };
      for (let i = 0; i < chain.stations.length - 1; i++) {
        const a = chain.stations[i], b = chain.stations[i + 1];
        const dA = dist[a], dB = dist[b];
        if (dA === undefined || dB === undefined) { flush(); continue; }
        const segT = Math.max(dA, dB);
        if (segT > maxHours) { flush(); continue; }
        const onRoute =
          journeyRouteSet.has(a + "|" + b) ||
          journeyRouteSet.has(b + "|" + a);
        if (cur && cur.onRoute !== onRoute) flush();
        if (!cur) cur = { stations: [a], times: [], onRoute, type: chain.type };
        cur.stations.push(b);
        cur.times.push(segT);
      }
      flush();
    }
    return out;
  }, [chainedPolylines, dist, maxHours, journeyRouteSet, origin]);
  // Journey halo chained the same way so the accent line on top of a
  // multi-leg trip also reads as one continuous stroke.
  const journeyHaloPaths = useMemo(() => {
    if (!journey) return [];
    const paths = [];
    for (const sec of journey.sections) {
      if (sec.kind !== "rail") continue;
      // sec.nodes is already an ordered station list along the journey path.
      paths.push(sec.nodes);
    }
    return paths;
  }, [journey]);
  // Disputed-area outline path data, projected once. The same string
  // also drives a clipPath that suppresses the de-jure country border
  // wherever it coincides with a disputed boundary (Abkhazia/SO,
  // Donetsk/Luhansk, Crimea, etc.) — otherwise the user sees both the
  // solid border and the dotted overlay stacked.
  const disputedPathD = useMemo(() => {
    if (!projection) return "";
    return DISPUTED_LINES.map(area => area.rings.map(ring => {
      if (!ring.length) return "";
      return "M" + ring
        .map((c, j) => (j === 0 ? "" : "L") + projection(c).join(","))
        .join("") + "Z";
    }).join(" ")).join(" ");
  }, [projection]);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="map-svg">
      <g ref={zoomGroupRef} transform={`translate(${zoomT.x},${zoomT.y}) scale(${zoomT.k})`}>
      {/* === paper / sea === */}
      <defs>
        <filter id="paper-noise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0.16  0 0 0 0 0.12  0 0 0 0 0.05  0 0 0 0.08 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M50,0 H0 V50" fill="none" stroke="var(--grid)" strokeWidth="0.5" />
        </pattern>
        <filter id="contour-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="contour-smooth" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        {/* Diagonal hatch for countries without passenger trains —
            transparent background so the per-country region tint
            underneath shows through (otherwise hatched countries lose
            their regional grouping). */}
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--border-line)" strokeWidth="0.9" strokeOpacity="0.55" />
        </pattern>
        <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
          <stop offset="60%" stopColor="var(--sea)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--ink)" stopOpacity="0.12" />
        </radialGradient>
      </defs>

      {/* sea */}
      <rect x="0" y="0" width={W} height={H} fill="var(--sea)" />
      <rect x="0" y="0" width={W} height={H} fill="url(#grid)" />
      <rect x="0" y="0" width={W} height={H} fill="url(#vignette)" pointerEvents="none" />

      {/* === land (per-country so we can hatch rail-less ones) === */}
      {world && pathGen && (
        <g>
          {/* Pass 1 — country fills (region tint or outside-Asia grey).
              Stroke is applied here so every country gets an outline
              including coastlines (world.borders is mesh-between-
              countries only, which excludes coasts). */}
          {world.features.map((feature, i) => {
            const id = feature.id != null ? String(feature.id).padStart(3, "0") : "";
            const name = feature.properties?.name || "";
            const isAsia =
              (id && ASIAN_COUNTRY_IDS.has(id)) || ASIA_NAMES.has(name);
            const region = id && REGION_FILL[id];
            const fill = isAsia
              ? (regionsOn && region ? REGION_VAR[region] : "var(--land)")
              : "var(--land-outside)";
            return (
              <path
                key={"land-" + i}
                d={pathGen(feature)}
                fill={fill}
                stroke="var(--border-line)"
                strokeWidth="0.7"
                strokeLinejoin="round"
                strokeOpacity={isAsia ? 0.8 : 0.45}
              />
            );
          })}
          {/* Pass 2 — diagonal hatch on rail-less countries, drawn on
              top of pass 1's regional tint so hatched countries keep
              their grouping colour. */}
          {world.features.map((feature, i) => {
            const id = feature.id != null ? String(feature.id).padStart(3, "0") : "";
            const name = feature.properties?.name || "";
            const hatched =
              (id && window.HATCH_COUNTRY_IDS && window.HATCH_COUNTRY_IDS.has(id)) ||
              HATCH_NAMES.has(name);
            if (!hatched) return null;
            return (
              <path
                key={"hatch-" + i}
                d={pathGen(feature)}
                fill="url(#hatch)"
                stroke="none"
              />
            );
          })}
          {/* Europe ↔ Asia continental divide — drawn from real
              geojson (data_continents.js, derived from Natural Earth
              geographic-region polygons) rather than a hand-curated
              polyline. Russia keeps its full North Asia tint; the
              divide just sits on top as a dashed reference line. */}
          {continentDivideD && (
            <path
              d={continentDivideD}
              fill="none"
              stroke="var(--continent-line)"
              strokeWidth="1.65"
              strokeDasharray="4 3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Europe ↔ Asia continental boundary</title>
            </path>
          )}
          {/* Disputed-area outlines — Natural Earth 10m disputed
              polygons (see data_disputed.js). We paint a wider
              land-coloured "eraser" stroke along the same path first
              to wipe out any de-jure country border that coincides
              with the disputed boundary (Abkhazia/SO north edge,
              Donetsk/Luhansk east edge, Crimea coast, etc.) — the
              earlier clip-path attempt failed because numerically the
              border line sits *on* the polygon edge and clipping
              treats edge points ambiguously. The dotted overlay then
              draws on the freshly cleared track. */}
          {/* Per-area eraser strokes — each in its host country's
              regional tint when Regions is on, otherwise plain --land
              so the stripe always blends with whatever the country fill
              currently is. */}
          {projection && DISPUTED_LINES.map((area, i) => {
            const eraserColor = regionsOn
              ? (DISPUTED_HOST_TINT[area.name] || "var(--land)")
              : "var(--land)";
            const d = area.rings.map(ring => {
              if (!ring.length) return "";
              return "M" + ring.map((c, j) => (j === 0 ? "" : "L") + projection(c).join(",")).join("") + "Z";
            }).join(" ");
            if (!d) return null;
            return (
              <path
                key={`erase-${i}`}
                d={d}
                fill="none"
                stroke={eraserColor}
                strokeWidth="2.4"
                strokeLinejoin="round"
                strokeLinecap="round"
                pointerEvents="none"
              />
            );
          })}
          {disputedPathD && (
            <path
              d={disputedPathD}
              fill="none"
              stroke="var(--border-line)"
              strokeWidth="0.9"
              strokeDasharray="2 2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.75"
            />
          )}
        </g>
      )}

      {/* sea labels & country labels moved to top-of-zoom-group layer further down */}

      {/* === reachability isochrone contours (filled gradient bands + smooth curve outlines) === */}
      {origin && contoursOn && contourLayers && (() => {
        const { levels, dStrings } = contourLayers;
        return (
          <g className="reach-contours" style={{ pointerEvents: "none" }}>
            {/* Filled gradient bands — largest threshold first, smaller on top.
                Each band is rendered at low fill-opacity so the stack of fills
                composites into a smooth gradient. */}
            {[...levels].map((th, k) => {
              const d = dStrings[k];
              if (!d) return null;
              return (
                <path
                  key={"fill-" + k}
                  d={d}
                  fill={timeColor(th, maxHours, theme)}
                  fillOpacity={0.13}
                  fillRule="nonzero"
                  stroke="none"
                  style={{ mixBlendMode: theme === "day" ? "multiply" : "screen" }}
                />
              );
            }).reverse()}
            {/* Outline strokes on top — strong nested rings, but skip
                the outermost one (its jagged edge is unsightly; the fill
                band gives the outer boundary instead). All strokes pulse
                gently to read as a live network. */}
            {levels.map((th, k) => {
              if (k === levels.length - 1) return null; // skip outermost
              const d = dStrings[k];
              if (!d) return null;
              return (
                <path
                  key={"iso-" + k}
                  d={d}
                  fill="none"
                  stroke={timeColor(th, maxHours, theme)}
                  strokeWidth={1.2}
                  strokeOpacity={0.92}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="contour-line"
                  style={{ animationDelay: `${k * -0.6}s` }}
                >
                  <title>{`Reach within ${fmtH(th)}`}</title>
                </path>
              );
            })}
          </g>
        );
      })()}

      {/* === all routes (faint background) === */}
      {/* Each named rail line is one continuous polyline so the
          underlay reads as smooth track rather than dots-and-dashes
          when zoomed in. */}
      <g className="routes-bg">
        {chainedPolylines.map((p, i) => {
          let d = "";
          for (let k = 0; k < p.stations.length; k++) {
            const pt = ptById[p.stations[k]];
            if (!pt) { d = ""; break; }
            d += (k === 0 ? "M" : "L") + pt.x + "," + pt.y;
          }
          if (!d) return null;
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="var(--ink)"
              strokeOpacity="0.10"
              strokeWidth={p.type === "hsr" ? 1.6 : 0.9}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* === reachable colored routes === */}
      {/* Drawn per-chain (rail-line group) and split into runs that
          share on-route status, so a service renders as ONE smooth
          polyline rather than a string of butt-jointed segments. The
          run's representative arrival time (its far-end max) drives
          both colour and stroke width. */}
      {origin && !contoursOn && (
        <g className="routes-fg">
          {foregroundRuns.map((run, i) => {
            let d = "";
            for (let k = 0; k < run.stations.length; k++) {
              const pt = ptById[run.stations[k]];
              if (!pt) { d = ""; break; }
              d += (k === 0 ? "M" : "L") + pt.x + "," + pt.y;
            }
            if (!d) return null;
            const w = run.onRoute
              ? 4.2
              : run.type === "hsr"
              ? lineWidthForTime(run.maxT, maxHours)
              : lineWidthForTime(run.maxT, maxHours) * 0.55;
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={timeColor(run.maxT, maxHours, theme)}
                strokeWidth={w}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={run.onRoute ? 1 : 0.95}
              />
            );
          })}

          {/* Selected-journey accent halo, also chained so a multi-
              leg trip reads as one continuous line. */}
          {journeyHaloPaths.map((nodes, i) => {
            let d = "";
            for (let k = 0; k < nodes.length; k++) {
              const pt = ptById[nodes[k]];
              if (!pt) { d = ""; break; }
              d += (k === 0 ? "M" : "L") + pt.x + "," + pt.y;
            }
            if (!d) return null;
            return (
              <path
                key={`halo-${i}`}
                d={d}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.2"
                strokeOpacity="0.85"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </g>
      )}

      {/* === bridge line(s) for disconnected destination === */}
      {journey?.sections.filter(s => s.kind === "bridge").map((bridge, bi) => {
        const a = ptById[bridge.from.id];
        const b = ptById[bridge.to.id];
        if (!a || !b) return null;
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const lx = midX + nx * 14;
        const ly = midY + ny * 14;
        return (
          <g key={`bridge-${bi}`} className="bridge-group">
            <line
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="var(--accent)"
              strokeOpacity="0.18"
              strokeWidth="9"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="var(--accent)"
              strokeWidth="1.6"
              strokeDasharray="2 5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {/* endpoint circles + badge counter-scaled so they stay constant
                size at any zoom — same trick the station dots use */}
            <g transform={`translate(${a.x},${a.y}) scale(${1/zoomT.k})`}>
              <circle r="6" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
            </g>
            <g transform={`translate(${b.x},${b.y}) scale(${1/zoomT.k})`}>
              <circle r="6" fill="none" stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="2 2" />
            </g>
            <g transform={`translate(${lx},${ly}) scale(${1/zoomT.k})`}>
              <rect x="-38" y="-9" width="76" height="18" rx="2"
                    fill="var(--paper)" stroke="var(--accent)" strokeWidth="0.6"
                    opacity="0.96" />
              <text
                x="0" y="3"
                textAnchor="middle"
                fontSize="10.5"
                fontFamily="'DM Mono', monospace"
                fill="var(--accent)"
                fontWeight="500"
                letterSpacing="0.5"
              >{(bi+1)+"·"+fmtKm(bridge.km)}</text>
            </g>
          </g>
        );
      })}

      {/* === stations === */}
      <g className="stations">
        {(() => {
          // Per-render label collision grid. Scaled to current zoom so we
          // get fewer labels when zoomed out (bigger cells) and more when
          // zoomed in (smaller cells).
          const cellSize = Math.max(28, 90 / zoomT.k);
          const grid = new Map();
          const ranked = stationPts.map(s => {
            const reach = origin ? dist[s.id] : undefined;
            const reachable = reach !== undefined && reach <= maxHours;
            const isMaj = MAJOR_STATIONS.has(s.id);
            const isOsm = s.id.startsWith("osm_");
            const onRoute = journeyNodeSet.has(s.id);
            let prio = 0;
            if (s.id === origin)         prio = 1e6;
            else if (s.id === selectedDest) prio = 9e5;
            else if (onRoute)            prio = 8e5;
            else if (s.id === hoverDest) prio = 7e5;
            else if (isMaj && reachable) prio = 600;
            else if (isMaj)              prio = 500;
            else if (!isOsm && reachable) prio = 200 + (reach != null ? -reach : 0);
            else if (!isOsm)             prio = 100;
            else if (reachable)          prio =  50;
            else                         prio =   5;
            return { s, prio };
          });
          ranked.sort((a, b) => b.prio - a.prio);
          const labelOK = new Set();
          for (const { s } of ranked) {
            const gx = Math.floor(s.x / cellSize);
            const gy = Math.floor(s.y / cellSize);
            const k = `${gx},${gy}`;
            if (grid.has(k)) continue;
            grid.set(k, s.id);
            labelOK.add(s.id);
          }

          return stationPts.map(s => {
          const reach = origin ? dist[s.id] : undefined;
          const reachable = reach !== undefined && reach <= maxHours;
          const isOrigin = s.id === origin;
          const isHover = s.id === hoverDest;
          const onRoutePath = journeyNodeSet.has(s.id);
          const isSelDest = s.id === selectedDest;
          const isMajor = MAJOR_STATIONS.has(s.id);
          const isOsm = s.id.startsWith("osm_");
          const isBridgeEnd = journey?.sections?.some(
            sec => sec.kind === "bridge" &&
              (sec.from.id === s.id || sec.to.id === s.id)
          );

          // Tiered visibility based on zoom level (zoomT.k).
          const alwaysOn = isOrigin || isSelDest || isHover || onRoutePath ||
                           isBridgeEnd || isMajor;
          let dotOpacityScale;
          if (alwaysOn) {
            dotOpacityScale = 1;
          } else if (!isOsm) {
            const t = (zoomT.k - 0.9) / 0.4;
            dotOpacityScale = Math.max(0, Math.min(1, t));
          } else {
            // OSM dots visible from default zoom but tiny & faint, so the
            // user can see the reach-network density without crowding.
            const t = (zoomT.k - 0.8) / 0.5;
            dotOpacityScale = Math.max(0.35, Math.min(1, t));
          }
          if (dotOpacityScale <= 0.01) return null;

          let dotColor = "var(--ink-2)";
          let dotOpacity = origin ? 0.25 : 0.85;
          if (origin) {
            if (isOrigin) dotColor = "var(--accent)";
            else if (reachable) {
              dotColor = timeColor(reach, maxHours, theme);
              dotOpacity = 1;
            } else dotOpacity = 0.12;
          }
          dotOpacity *= dotOpacityScale;

          const r0 = isOrigin ? 7 : (isMajor ? 3.6 : reachable ? (isOsm ? 1.8 : 2.8) : (isOsm ? 1.2 : 2.0));

          return (
            <g
              key={s.id}
              transform={`translate(${s.x},${s.y}) scale(${1/zoomT.k})`}
              className="station"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoverDest(s.id)}
              onMouseLeave={() => setHoverDest(null)}
              onClick={(e) => {
                // Alt/shift always sets origin
                if (e.altKey || e.shiftKey || !origin) {
                  setOrigin(s.id);
                  setSelectedDest(null);
                  return;
                }
                if (s.id === origin) return; // clicking origin: no-op
                if (selectedDest) {
                  // Already have origin + destination pair. Third click → new origin.
                  setOrigin(s.id);
                  setSelectedDest(null);
                } else {
                  // Just have origin. Second click → set destination.
                  setSelectedDest(s.id);
                }
              }}
            >
              {isOrigin && (
                <g>
                  <circle r="14" fill="none" stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="0.6">
                    <animate attributeName="r" values="10;22;10" dur="3.2s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.45;0;0.45" dur="3.2s" repeatCount="indefinite" />
                  </circle>
                  <circle r="9" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
                </g>
              )}
              {onRoutePath && !isOrigin && (
                <circle r="6" fill="none" stroke="var(--accent)" strokeOpacity="0.9" strokeWidth="1.2" />
              )}
              <circle
                r={r0}
                fill={dotColor}
                fillOpacity={dotOpacity}
                stroke={isOrigin ? "var(--paper)" : "var(--paper)"}
                strokeWidth={isOrigin ? 1.4 : 0.8}
              />
              {(() => {
                // Label gets shown only when (a) always-on, (b) reachable
                // and major hub, OR (c) the collision grid above selected
                // this station as the representative in its cell.
                let labelVis;
                if (isOrigin || isSelDest || isHover || onRoutePath || isBridgeEnd) {
                  labelVis = 1;
                } else if (isMajor && reachable) {
                  labelVis = 1;
                } else if (labelOK.has(s.id)) {
                  // Fade based on zoom for non-major collision winners
                  const tier = isOsm ? 2.0 : 1.3;
                  labelVis = Math.max(0, Math.min(1, (zoomT.k - tier) / 0.5));
                } else {
                  labelVis = 0;
                }
                if (labelVis <= 0.02) return null;
                const baseOp = isHover || isOrigin || isSelDest || onRoutePath ? 1 : 0.85;
                return (
                  <text
                    x={r0 + 4}
                    y={3}
                    fontSize={isOrigin || isSelDest ? 13 : 10.5}
                    fontFamily="'DM Sans', sans-serif"
                    fontWeight={isOrigin || isSelDest ? 700 : isMajor ? 600 : 500}
                    fill="var(--ink)"
                    opacity={baseOp * labelVis}
                    // pointerEvents enabled so the label is clickable —
                    // bubbles up to the parent <g>'s onClick which sets
                    // origin / destination. cursor: pointer inherits
                    // from the parent group.
                    style={{ pointerEvents: "auto", paintOrder: "stroke", transition: "opacity 0.25s ease" }}
                    stroke="var(--paper)"
                    strokeWidth="3"
                    strokeOpacity={0.9 * labelVis}
                    strokeLinejoin="round"
                  >{s.name}</text>
                );
              })()}
            </g>
          );
        });
        })()}
      </g>

      </g>
      <g className="labels-on-top" style={{ pointerEvents: "none" }}>
        {showSeaLabels && SEA_LABELS.map((l, i) => {
          const [zx, zy] = projection([l.lng, l.lat]);
          return (
            <text
              key={"sea-" + i}
              x={zx * zoomT.k + zoomT.x}
              y={zy * zoomT.k + zoomT.y}
              textAnchor="middle"
              fontSize={l.size}
              fontFamily="'Space Grotesk', 'DM Sans', sans-serif"
              fontStyle={l.italic ? "italic" : "normal"}
              fill="var(--ink-2)"
              opacity="0.55"
              letterSpacing="3"
            >{l.text}</text>
          );
        })}
        {showCountryLabels && COUNTRY_LABELS.map((l, i) => {
          const [zx, zy] = projection([l.lng, l.lat]);
          return (
            <text
              key={"ctry-" + i}
              x={zx * zoomT.k + zoomT.x}
              y={zy * zoomT.k + zoomT.y}
              textAnchor="middle"
              fontSize={l.size}
              fontFamily="'Space Grotesk', 'DM Sans', sans-serif"
              fontWeight="500"
              fill="var(--ink)"
              opacity={l.size > 22 ? 0.34 : 0.5}
              letterSpacing={l.ls || (l.size > 24 ? 12 : 4)}
            >{l.text}</text>
          );
        })}
      </g>
      {/* ASIA / EUROPE callouts tiled along the entire divide line —
          drawn LAST so they sit on top of every other layer (routes,
          stations, country labels). Bold with a paper-coloured stroke
          to stay legible against any underlying tint. */}
      {zoomT.k > 1.4 && continentLabelAnchors.length > 0 && (
        <g className="continent-labels" style={{ pointerEvents: "none" }}>
          {continentLabelAnchors.map((a, i) => {
            const sx = a.baseX * zoomT.k + zoomT.x;
            const sy = a.baseY * zoomT.k + zoomT.y;
            const OFFSET = 22; // px from the divide line
            const eX = sx + a.ePerpX * OFFSET;
            const eY = sy + a.ePerpY * OFFSET;
            const aX = sx + a.aPerpX * OFFSET;
            const aY = sy + a.aPerpY * OFFSET;
            const fade = Math.max(0, Math.min(1, (zoomT.k - 1.4) / 0.6));
            const common = {
              textAnchor: "middle",
              dominantBaseline: "middle",
              fontSize: 10,
              fontFamily: "'Space Grotesk', 'DM Sans', sans-serif",
              fontStyle: "italic",
              fontWeight: 700,
              fill: "var(--ink)",
              stroke: "var(--paper)",
              strokeWidth: 3,
              strokeLinejoin: "round",
              paintOrder: "stroke",
              letterSpacing: 4,
            };
            return (
              <Fragment key={"cont-" + i}>
                <text
                  {...common}
                  x={eX}
                  y={eY}
                  opacity={fade}
                  transform={`rotate(${a.angleDeg} ${eX} ${eY})`}
                >EUROPE</text>
                <text
                  {...common}
                  x={aX}
                  y={aY}
                  opacity={fade}
                  transform={`rotate(${a.angleDeg} ${aX} ${aY})`}
                >ASIA</text>
              </Fragment>
            );
          })}
        </g>
      )}
    </svg>
  );
}

// =============================================================
// SIDEBAR + CARDS
// =============================================================

function Masthead() {
  return (
    <div className="masthead">
      <div className="mh-rule" />
      <div className="mh-eyebrow">Rail Reachability within</div>
      <h1 className="mh-title">Greater Asia</h1>
      <div className="mh-sub">
        How far you can travel by rail from any station across <em>Asia</em>
      </div>
      <div className="mh-rule" />
    </div>
  );
}

// Minimalist origin picker — replaces the native <select> with a
// button + popover. Native selects don't allow custom styling of the
// dropdown panel (only the closed-state trigger), and with thousands
// of stations grouped by region the native list reads as a wall of
// text. This version gives us a search field, subtle country headers,
// and a tight visual palette consistent with the rest of the UI.
function StationSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    // Defer focus a frame so the popover is mounted before we grab it.
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  const groups = useMemo(() => {
    const q = query.toLowerCase().trim();
    return window.REGIONS.flatMap(region =>
      region.codes.flatMap(code => {
        const stns = STATIONS
          .filter(s => s.country === code)
          .filter(s => {
            if (!q) return true;
            return s.name.toLowerCase().includes(q) ||
                   (s.native || "").toLowerCase().includes(q);
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        if (stns.length === 0) return [];
        return [{ code, country: COUNTRY_NAMES[code], region: region.name, stns }];
      })
    );
  }, [query]);

  const selected = value ? STATIONS_BY_ID[value] : null;
  const triggerLabel = selected
    ? selected.name + (nativeOrNull(selected.name, selected.native) ? " · " + nativeOrNull(selected.name, selected.native) : "")
    : "Select origin…";

  return (
    <div className={`mselect ${open ? "open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="mselect-trigger"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="mselect-value">{triggerLabel}</span>
        <span className="mselect-caret" aria-hidden="true" />
      </button>
      {open && (
        <div className="mselect-pop">
          <input
            ref={inputRef}
            type="text"
            className="mselect-search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search stations…"
          />
          <div className="mselect-list">
            {groups.length === 0 && (
              <div className="mselect-empty">No matches</div>
            )}
            {groups.map(g => (
              <div key={g.code} className="mselect-group">
                <div className="mselect-group-head">
                  <span>{g.country}</span>
                  <span className="mselect-group-region">{g.region}</span>
                </div>
                {g.stns.map(s => {
                  const nat = nativeOrNull(s.name, s.native);
                  const sel = s.id === value;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      className={`mselect-item ${sel ? "sel" : ""}`}
                      onClick={() => {
                        onChange(s.id);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="mselect-item-name">{s.name}</span>
                      {nat && <span className="mselect-item-nat">{nat}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ControlPanel({
  origin, setOrigin, hours, setHours, maxHoursBound,
  hsrOnly, setHsrOnly, theme, setTheme,
  selectedDest, setSelectedDest,
  contoursOn, setContoursOn,
  regionsOn, setRegionsOn,
}) {
  return (
    <div className="panel control-panel">
      <div className="panel-head">
        <span className="panel-num">I.</span>
        <span className="panel-title">Origin</span>
      </div>
      <StationSelect
        value={origin}
        onChange={(id) => { setOrigin(id); setSelectedDest(null); }}
      />
      <div className="hint">
        Click a station to set as origin · click a second to draw the
        route · click a third to start over.
      </div>

      <div className="panel-head" style={{marginTop: 22}}>
        <span className="panel-num">II.</span>
        <span className="panel-title">Time budget</span>
        <span className="panel-value">{fmtH(hours)}</span>
      </div>
      <div className="slider-wrap">
        <input
          type="range" min={1} max={maxHoursBound} step={0.5}
          value={hours}
          onChange={e => setHours(parseFloat(e.target.value))}
          className="slider"
          style={{ background: makeRampGradient(maxHoursBound, theme) }}
        />
        <div className="slider-ticks">
          {[1, 12, 24, 36, 48].filter(t => t <= maxHoursBound).map(t => (
            <span key={t}>{t}h</span>
          ))}
        </div>
        {/* Line-type legend folded into the Time-budget section. The
            slider track already carries the time-colour ramp, so a
            separate gradient bar would be redundant. */}
        <div className="legend-dashes">
          <div><span className="dash hsr"/> High-speed</div>
          <div><span className="dash conv"/> Conventional</div>
          <div><span className="dash hatched"/> No passenger rail</div>
          <div><span className="dash bridge"/> Disconnected gap</div>
        </div>
      </div>

      <div className="panel-head" style={{marginTop: 22}}>
        <span className="panel-num">III.</span>
        <span className="panel-title">Network</span>
      </div>
      {/* Four binary controls, laid out 2×2. Each pill shows its
          current state; clicking flips. Train glyphs distinguish
          conventional (🚆) from HSR (🚄); the rest use simple geometric
          state cues. */}
      <div className="toggle-row">
        <button
          className="toggle on toggle-swap"
          onClick={() => setHsrOnly(v => !v)}
        >
          {hsrOnly ? <HsrTrainIcon /> : <ConvTrainIcon />}
          {hsrOnly ? "HSR Only" : "All Trains"}
        </button>
        <button
          className="toggle on toggle-swap"
          onClick={() => setRegionsOn(v => !v)}
        >{regionsOn ? "◑ Regional" : "○ Continental"}</button>
      </div>
      <div className="toggle-row" style={{marginTop: 8}}>
        <button
          className="toggle on toggle-swap"
          onClick={() => setTheme(t => t === "day" ? "night" : "day")}
        >{theme === "day" ? "☀ Day" : "☾ Night"}</button>
        <button
          className="toggle on toggle-swap"
          onClick={() => setContoursOn(v => !v)}
        >{contoursOn ? "◉ Contours" : "━ Lines"}</button>
      </div>
      {/* Sub-region tint key — appears below the Network section
          (not above) so the Network buttons stay anchored. Always
          mounted; the .show class toggles a max-height + opacity
          transition so it slides in/out instead of snapping. */}
      <div className={`legend-regions-wrap ${regionsOn ? "show" : ""}`}>
        <div className="legend-regions">
          <div><span className="swatch" style={{background:"var(--region-north)"}} /> North Asia</div>
          <div><span className="swatch" style={{background:"var(--region-east)"}} /> East Asia</div>
          <div><span className="swatch" style={{background:"var(--region-southeast)"}} /> Southeast Asia</div>
          <div><span className="swatch" style={{background:"var(--region-south)"}} /> South Asia</div>
          <div><span className="swatch" style={{background:"var(--region-central)"}} /> Central Asia</div>
          <div><span className="swatch" style={{background:"var(--region-west)"}} /> West Asia</div>
        </div>
      </div>
    </div>
  );
}

function makeRampGradient(maxH, theme) {
  const stops = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    stops.push(`${timeColor(t * maxH, maxH, theme)} ${(t * 100).toFixed(0)}%`);
  }
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

function ReachableList({
  origin, hours, hsrOnly, selectedDest, setSelectedDest, theme,
  setHoverDest, hoverDest,
}) {
  const adj = useMemo(() => buildAdjacency(ROUTES, hsrOnly), [hsrOnly]);
  const { dist, prev, prevRoute } = useMemo(
    () => origin ? dijkstra(adj, origin) : { dist: {}, prev: {}, prevRoute: {} },
    [adj, origin]
  );

  const origStation = origin ? STATIONS_BY_ID[origin] : null;

  // Memoise the three lists. Without this every hover/zoom/theme tick
  // re-walks all 4,000+ stations and reruns gcDist for the disconnected
  // set — and HSR-only mode disconnects ~99 % of the network.
  const { items, overBudget, disconnected } = useMemo(() => {
    if (!origStation) return { items: [], overBudget: [], disconnected: [] };
    const items = [], over = [], disc = [];
    for (const s of STATIONS) {
      if (s.id === origin) continue;
      const t = dist[s.id];
      if (t === undefined) {
        disc.push({ s, km: gcDist(origStation, s) });
      } else if (t <= hours) {
        items.push({ s, t });
      } else {
        over.push({ s, t });
      }
    }
    items.sort((a, b) => a.t - b.t);
    over.sort((a, b) => a.t - b.t);
    disc.sort((a, b) => a.km - b.km);
    return { items, overBudget: over, disconnected: disc };
  }, [origStation, origin, dist, hours]);

  if (!origin) return null;

  return (
    <div className="panel list-panel">
      <div className="panel-head">
        <span className="panel-num">IV.</span>
        <span className="panel-title">Reachable</span>
        <span className="panel-value">{items.length} stations</span>
      </div>
      <div className="list-sub">
        from <strong>{origStation.name}</strong>{nativeOrNull(origStation.name, origStation.native) ? ` · ${nativeOrNull(origStation.name, origStation.native)}` : ""} within {fmtH(hours)}
      </div>

      <div className="list-scroll">
        {items.length === 0 && <div className="empty">No stations within this time budget.</div>}
        {items.map(({s, t}) => {
          const isSel = s.id === selectedDest;
          const isHov = s.id === hoverDest;
          return (
            <div
              key={s.id}
              className={`list-row ${isSel ? "sel" : ""} ${isHov ? "hov" : ""}`}
              onMouseEnter={() => setHoverDest(s.id)}
              onMouseLeave={() => setHoverDest(null)}
              onClick={() => setSelectedDest(isSel ? null : s.id)}
            >
              <span className="list-dot" style={{ background: timeColor(t, hours, theme) }} />
              <div className="list-name">
                <div className="lr-name">{s.name}{nativeOrNull(s.name, s.native) ? <span className="lr-cn"> · {nativeOrNull(s.name, s.native)}</span> : null}</div>
                <div className="lr-meta">{COUNTRY_NAMES[s.country]}</div>
              </div>
              <div className="list-time">{fmtH(t)}</div>
            </div>
          );
        })}

        {overBudget.length > 0 && (
          <div className="list-section">
            <div className="ls-head">
              <span className="ls-dot ls-dot-amber" />
              <span>Over budget · {overBudget.length}</span>
              <span className="ls-hint">extend the slider to reach</span>
            </div>
            {overBudget.slice(0, 8).map(({s, t}) => {
              const isSel = s.id === selectedDest;
              const isHov = s.id === hoverDest;
              return (
                <div
                  key={s.id}
                  className={`list-row dim ${isSel ? "sel" : ""} ${isHov ? "hov" : ""}`}
                  onMouseEnter={() => setHoverDest(s.id)}
                  onMouseLeave={() => setHoverDest(null)}
                  onClick={() => setSelectedDest(isSel ? null : s.id)}
                >
                  <span className="list-dot list-dot-empty" />
                  <div className="list-name">
                    <div className="lr-name">{s.name}{nativeOrNull(s.name, s.native) ? <span className="lr-cn"> · {nativeOrNull(s.name, s.native)}</span> : null}</div>
                    <div className="lr-meta">{COUNTRY_NAMES[s.country]}</div>
                  </div>
                  <div className="list-time">{fmtH(t)}</div>
                </div>
              );
            })}
            {overBudget.length > 8 && (
              <div className="ls-more">+ {overBudget.length - 8} more beyond {fmtH(hours)}</div>
            )}
          </div>
        )}

        {disconnected.length > 0 && (
          <div className="list-section">
            <div className="ls-head">
              <span className="ls-dot ls-dot-broken" />
              <span>Disconnected · {disconnected.length}</span>
              <span className="ls-hint">no rail path — gap from origin</span>
            </div>
            {disconnected.slice(0, 40).map(({s, km}) => {
              const isSel = s.id === selectedDest;
              const isHov = s.id === hoverDest;
              return (
                <div
                  key={s.id}
                  className={`list-row broken ${isSel ? "sel" : ""} ${isHov ? "hov" : ""}`}
                  onMouseEnter={() => setHoverDest(s.id)}
                  onMouseLeave={() => setHoverDest(null)}
                  onClick={() => setSelectedDest(isSel ? null : s.id)}
                >
                  <span className="list-dot list-dot-broken" />
                  <div className="list-name">
                    <div className="lr-name">{s.name}{nativeOrNull(s.name, s.native) ? <span className="lr-cn"> · {nativeOrNull(s.name, s.native)}</span> : null}</div>
                    <div className="lr-meta">{COUNTRY_NAMES[s.country]}</div>
                  </div>
                  <div className="list-time list-km">{fmtKm(km)}</div>
                </div>
              );
            })}
            {disconnected.length > 40 && (
              <div className="ls-more">+ {disconnected.length - 40} more disconnected stations</div>
            )}
          </div>
        )}
      </div>
      <div className="list-foot">
        Click any row to draw the route or bridge. Tap again to clear.
      </div>
    </div>
  );
}

// Route / Bridge / Journey card — handles both reachable destinations
// and disconnected ones (where the journey alternates rail + bridge).
function RouteCard({ origin, selectedDest, hsrOnly, theme }) {
  const adj = useMemo(() => buildAdjacency(ROUTES, hsrOnly), [hsrOnly]);
  const { dist, prev, prevRoute } = useMemo(
    () => origin ? dijkstra(adj, origin) : { dist: {}, prev: {}, prevRoute: {} },
    [adj, origin]
  );
  const journey = useMemo(
    () => buildJourney(origin, selectedDest, adj, dist, prev, prevRoute, STATIONS, hsrOnly),
    [origin, selectedDest, adj, dist, prev, prevRoute, hsrOnly]
  );
  if (!origin || !selectedDest || !journey) return null;

  const orig = STATIONS_BY_ID[origin];
  const tgt = STATIONS_BY_ID[selectedDest];
  if (!tgt) return null;

  // ====== REACHABLE — single rail section ======
  if (journey.type === "reachable") {
    const sec = journey.sections[0];
    const transfers = sec.routes.length - 1;
    const allHsr = sec.routes.every(r => r.type === "hsr");
    return (
      <div className="panel route-card">
        <div className="rc-head">
          <span className="rc-eyebrow">Route</span>
          <span className="rc-total">{fmtH(sec.time)}</span>
        </div>
        <div className="rc-endpoints">
          <span>{orig.name}</span>
          <span className="rc-arrow">→</span>
          <span>{tgt.name}</span>
        </div>
        <div className="rc-meta">
          {sec.routes.length} leg{sec.routes.length === 1 ? "" : "s"} ·{" "}
          {transfers} transfer{transfers === 1 ? "" : "s"} ·{" "}
          {allHsr ? "all HSR" : "mixed"}
        </div>
        <RailSectionDetail section={sec} expandable={false} />
      </div>
    );
  }

  // ====== DISCONNECTED — chain ======
  const directKm = gcDist(orig, tgt);
  const sections = journey.sections;
  const bridgeCount = sections.filter(s => s.kind === "bridge").length;

  return (
    <div className="panel route-card bridge-card">
      <div className="rc-head">
        <span className="rc-eyebrow bc-eyebrow">⚠ Disconnected</span>
        <span className="rc-total bc-total">{fmtKm(directKm)}</span>
      </div>
      <div className="rc-endpoints">
        <span>{orig.name}</span>
        <span className="rc-arrow bc-arrow">⤙⤚</span>
        <span>{tgt.name}</span>
      </div>
      <div className="rc-meta">
        {fmtH(journey.totalRailTime)} on rail · {fmtKm(journey.totalBridgeKm)} missing across {bridgeCount}{" "}
        bridge{bridgeCount === 1 ? "" : "s"} · {journey.componentsTraversed} networks
      </div>

      <ol className="journey-list">
        {sections.map((s, i) => s.kind === "rail"
          ? <RailJourneyRow key={i} section={s} index={i} sections={sections} />
          : <BridgeJourneyRow key={i} section={s} index={i} sections={sections} />
        )}
      </ol>
    </div>
  );
}

// One rail section in a multi-hop journey — collapsible to show legs.
function RailJourneyRow({ section, index, sections }) {
  const [open, setOpen] = useState(false);
  const sFrom = STATIONS_BY_ID[section.from];
  const sTo = STATIONS_BY_ID[section.to];
  // Position label: which network is this?
  const railIdx = sections.slice(0, index + 1).filter(x => x.kind === "rail").length;
  return (
    <li className="jrow jrow-rail">
      <div className="jrow-marker jrow-marker-rail">▤</div>
      <div className="jrow-body">
        <div className="jrow-head"
             onClick={() => setOpen(o => !o)}
             style={{ cursor: section.routes.length > 0 ? "pointer" : "default" }}>
          <span className="jrow-label">Rail · network {railIdx}</span>
          <span className="jrow-time">{fmtH(section.time)}</span>
        </div>
        <div className="jrow-route">
          <span>{sFrom.name}</span>
          <span className="jrow-dash">→</span>
          <span>{sTo.name}</span>
          <span className="jrow-legs">
            {section.routes.length} leg{section.routes.length === 1 ? "" : "s"}
            {section.routes.length > 0 && (
              <button className="jrow-toggle" onClick={() => setOpen(o => !o)}>
                {open ? "▾ hide" : "▸ show"}
              </button>
            )}
          </span>
        </div>
        {open && section.routes.length > 0 && <RailSectionDetail section={section} expandable={true} />}
      </div>
    </li>
  );
}

function BridgeJourneyRow({ section, index, sections }) {
  // Bridge number = its 1-indexed position among bridges
  const bIdx = sections.slice(0, index + 1).filter(x => x.kind === "bridge").length;
  return (
    <li className="jrow jrow-bridge">
      <div className="jrow-marker jrow-marker-bridge">{bIdx}</div>
      <div className="jrow-body">
        <div className="jrow-head">
          <span className="jrow-label jrow-label-bridge">Bridge · missing link</span>
          <span className="jrow-time jrow-time-bridge">{fmtKm(section.km)}</span>
        </div>
        <div className="jrow-route">
          <span>{section.from.name}</span>
          <span className="jrow-dash jrow-dash-bridge">⤳</span>
          <span>{section.to.name}</span>
        </div>
        <div className="jrow-meta">
          {COUNTRY_NAMES[section.from.country]} → {COUNTRY_NAMES[section.to.country]}
        </div>
      </div>
    </li>
  );
}

function RailSectionDetail({ section, expandable }) {
  return (
    <ol className={`rc-legs ${expandable ? "rc-legs-nested" : ""}`}>
      {section.routes.map((r, i) => {
        const from = STATIONS_BY_ID[section.nodes[i]];
        const to = STATIONS_BY_ID[section.nodes[i + 1]];
        return (
          <li key={i} className="rc-leg">
            <div className={`rc-badge ${r.type}`}>{r.type === "hsr" ? "HSR" : "Conv"}</div>
            <div className="rc-leg-body">
              <div className="rc-leg-route">
                <span>{from.name}</span>
                <span className="rc-arrow">→</span>
                <span>{to.name}</span>
                <span className="rc-leg-time">{fmtH(r.h)}</span>
              </div>
              <div className="rc-leg-line">{r.line}</div>
              <div className="rc-leg-op">
                {r.op}
                <span className="rc-leg-freq">{freqLabel(r)}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// =============================================================
// HOVER TOOLTIP (for stations not in the list)
// =============================================================
function HoverCard({ hoverDest, origin, hsrOnly, hours, theme }) {
  const adj = useMemo(() => buildAdjacency(ROUTES, hsrOnly), [hsrOnly]);
  const { dist, prev, prevRoute } = useMemo(
    () => origin ? dijkstra(adj, origin) : { dist: {}, prev: {}, prevRoute: {} },
    [adj, origin]
  );
  if (!hoverDest) return null;
  const s = STATIONS_BY_ID[hoverDest];
  if (!s) return null;
  const t = origin ? dist[s.id] : undefined;
  const reachable = t !== undefined && t <= hours;
  const isOrigin = s.id === origin;

  let lastRoute = null;
  if (origin && prev[s.id] !== undefined) lastRoute = prevRoute[s.id];

  return (
    <div className="hover-card">
      <div className="hc-name">{s.name}{nativeOrNull(s.name, s.native) ? <span className="hc-cn"> · {nativeOrNull(s.name, s.native)}</span> : ""}</div>
      <div className="hc-country">{COUNTRY_NAMES[s.country]}</div>
      {isOrigin ? (
        <div className="hc-row hc-origin">⌑ Origin</div>
      ) : !origin ? (
        <div className="hc-row hc-dim">Click to set as origin</div>
      ) : t === undefined ? (
        <div className="hc-row hc-dim">Not connected by rail{hsrOnly ? " (HSR-only)" : ""}</div>
      ) : (
        <div className="hc-stack">
          <div className="hc-row">
            <span
              className="hc-dot"
              style={{background: timeColor(t, hours, theme)}}
            />
            <span className="hc-time">{fmtH(t)}</span>
            <span className="hc-tag">{reachable ? "within reach" : `over budget by ${fmtH(t - hours)}`}</span>
          </div>
          {lastRoute && (
            <div className="hc-leg">
              <div className="hc-leg-line">arr. via {lastRoute.line}</div>
              <div className="hc-leg-op">
                {lastRoute.op}
                <span className="hc-leg-freq">· {freqLabel(lastRoute)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================
// LEGEND
// =============================================================
function Sources() {
  const sections = [
    {
      key: "Schedules CN/HK",
      items: [
        "China Railway 12306 (G/D/Z/T/K series)",
        "MTR through-trains (GZ–KL XRL, Z97/Z99 Beijing/Shanghai–Kowloon)",
      ],
    },
    {
      key: "Schedules JP/KR/TW",
      items: [
        "JR East/Central/West/Kyushu/Hokkaido (Tōkaidō, San'yō, Tōhoku, Hokuriku, Jōetsu, Kyūshū, Hokkaidō Shinkansen)",
        "Korail KTX/SRT (Gyeongbu, Honam, Jeolla, Gangneung, Donghae)",
        "Taiwan HSR (THSR) + TRA (Puyuma, South-Link)",
      ],
    },
    {
      key: "Schedules SE Asia",
      items: [
        "KCIC Whoosh (Jakarta–Bandung HSR)",
        "PT KAI long-distance (Argo Wilis, Bima, Mutiara Timur)",
        "KTM Berhad ETS + South-Line",
        "SRT Northern/Northeastern/Southern/Eastern",
        "Vietnam Railways (Reunification Express, Hanoi–Lào Cai, Hanoi–Đồng Đăng, Hanoi–Hải Phòng)",
        "Royal Railway Cambodia",
        "Lao–China Railway / China–Laos Railway D87",
        "Myanmar Railways",
      ],
    },
    {
      key: "Schedules S Asia",
      items: [
        "Indian Railways NTES (Rajdhani, Vande Bharat, Shatabdi, Coromandel, GT, Mumbai Mail)",
        "Bangladesh Railway (Sonar Bangla, Sundarban, Maitree, Bandhan)",
        "Pakistan Railways (Green Line, Karakoram, Allama Iqbal)",
        "Sri Lanka Railways (Main Line, Coast, Hill, Trinco, Northern)",
      ],
    },
    {
      key: "Schedules W/C Asia",
      items: [
        "RAI Iran (Tehran–Mashhad / –Tabriz / –Isfahan / –Bandar Abbas)",
        "IRR Iraq (Baghdad–Basra sleeper, Baghdad–Mosul)",
        "TCDD YHT + Doğu / Güney / Toros Express",
        "KTZ Talgo (Tulpar, Saryarka)",
        "UTY Afrosiyob",
        "TDY Türkmenabat",
        "Kyrgyz Temir Joly (Issyk-Kul tourist)",
        "SCR (Yerevan Express)",
        "ADY + GR (Baku–Tbilisi–Kars, Stadler Tbilisi–Batumi)",
        "Israel Railways",
        "SAR (Haramain HSR, East Line, North Line / Saudi Land Bridge)",
        "Etihad Rail (UAE Hafeet Express)",
      ],
    },
    {
      key: "Long-haul / cross-border",
      items: [
        "Trans-Mongolian K23 (Beijing ↔ Ulaanbaatar ↔ Moscow)",
        "Trans-Manchurian K19 (via Manzhouli)",
        "Trans-Siberian Rossiya (Moscow ↔ Vladivostok)",
        "Baikal–Amur Mainline",
        "Beijing ↔ Pyongyang K27/28",
        "Khasan / Tumangang Friendship Bridge",
        "Yunnan–Vietnam Railway (Kunming–Hekou)",
      ],
    },
    {
      key: "Base map",
      items: [
        <>Natural Earth (public domain) via <span className="mono">world-atlas</span> <span className="mono">countries-50m</span></>,
        <>Disputed-area outlines from Natural Earth <span className="mono">ne_10m_admin_0_disputed_areas</span> (33 territories, Abkhazia ↔ Crimea ↔ Kashmir ↔ Korean DMZ ↔ Kuril / Paracel / Spratly Is.)</>,
        <>Europe ↔ Asia continental divide line from the published <span className="mono">asia_europe_border</span> geojson (464 source fragments merged into 3 chains along Urals + Ural River + Caspian + Caucasus + Bosphorus + Aegean, Douglas-Peucker-simplified)</>,
        <>Sub-region tints (North / East / Southeast / South / Central / West Asia) layered onto the country fills when <strong>Regional</strong> is toggled in the Network panel</>,
      ],
    },
    {
      key: "Rail network",
      items: [
        "Wikipedia",
        "OpenStreetMap",
        "OpenRailwayMap",
        "Seat 61 (M. Smith) — cross-checking corridors, operators, journey times",
      ],
    },
    {
      key: "Algorithm",
      items: [
        "Reachability: time-weighted Dijkstra over the rail graph",
        "Disconnected destinations: second station-level Dijkstra over rail edges + top-K cross-component great-circle bridges (capped at 1,600 km, 3× bridge penalty) to minimise total journey distance",
        "Per-section time re-optimisation for the actual rail legs after the bridge planner picks endpoints",
        "Per-named-line polyline chaining + redundant-edge dedup so each rail service renders as one smooth path instead of N butt-jointed segments",
        "Service frequency inferred from the line name + train type (Daily overnight, Frequent hourly+, 1–2×/week for K3/K23/K19, Seasonal for Issyk-Kul, etc.) with explicit `freq` override per route",
      ],
    },
    {
      key: "Caveats",
      items: [
        "Times rounded to half-hour",
        "Cross-border friction (gauge change at Erenhot / Zabaikalsk / Sarakhs / Khasan, customs at Pingxiang, Đồng Đăng, Padang Besar, Mekong shuttle) folded into adjacent segments",
        "Suspended services excluded: Samjhauta India–Pakistan, Trans-Asia Express Türkiye–Iran, Allegro SPb–Helsinki, Quetta–Zahedan (effectively freight)",
        "DMZ Dorasan–Kaesong reconnected but never carried passenger traffic — treated as disconnected",
        "Saudi Arabia (Haramain HSR + SAR East Line) and UAE (Etihad Rail Hafeet Express) are not yet linked to any external network — each is its own connected component",
      ],
    },
  ];
  return (
    <div className="sources">
      <div className="src-head">Sources &amp; notes</div>
      <ul className="src-list">
        {sections.map((sec, i) => (
          <li key={i}>
            <div className="src-key">{sec.key}</div>
            <ul className="src-sublist">
              {sec.items.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          </li>
        ))}
      </ul>
      <div className="src-foot">
        <span>Greater Asia · v0.11 · {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}

// =============================================================
// APP
// =============================================================

// Fixed display settings, previously exposed via a tweaks panel.
const MAX_HOURS_BOUND  = 48;
const SHOW_COUNTRY_LABELS = true;
const SHOW_SEA_LABELS     = false;

// Throttle a state setter to at most one update per animation frame.
// The slider for the time budget fires onChange continuously while
// dragging; without throttling, React reconciles thousands of route
// elements per pointer-move and the UI lags. Per-frame coalescing
// keeps scrubbing smooth.
function useRafThrottledSetter(setter) {
  const pendingRef = useRef(null);
  const rafRef = useRef(0);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  return useCallback((v) => {
    pendingRef.current = v;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      setter(pendingRef.current);
    });
  }, [setter]);
}

function App() {
  const [origin, setOrigin] = useState("kunming");
  const [hoursRaw, setHoursRaw] = useState(24);
  const setHours = useRafThrottledSetter(setHoursRaw);
  const hours = hoursRaw;
  const [hsrOnly, setHsrOnly] = useState(false);
  const [theme, setTheme] = useState("day");
  const [selectedDest, setSelectedDest] = useState(null);
  const [hoverDest, setHoverDest] = useState(null);
  const [contoursOn, setContoursOn] = useState(true);
  const [regionsOn, setRegionsOn] = useState(false);

  // Apply theme class on body
  useEffect(() => {
    document.body.classList.toggle("theme-night", theme === "night");
  }, [theme]);

  return (
    <div className="app">
      <div className="map-stage">
        <MapView
          theme={theme}
          hsrOnly={hsrOnly}
          origin={origin}
          setOrigin={setOrigin}
          hoverDest={hoverDest}
          setHoverDest={setHoverDest}
          selectedDest={selectedDest}
          setSelectedDest={setSelectedDest}
          maxHours={hours}
          contoursOn={contoursOn}
          regionsOn={regionsOn}
          showSeaLabels={SHOW_SEA_LABELS}
          showCountryLabels={SHOW_COUNTRY_LABELS}
        />
        {/* Decorative corner ornament */}
        <svg className="corner-ornament tl" viewBox="0 0 60 60" aria-hidden="true">
          <path d="M2,40 V2 H40" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M2,55 V20 M2,20 H20" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        <svg className="corner-ornament tr" viewBox="0 0 60 60" aria-hidden="true">
          <path d="M58,40 V2 H20" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg className="corner-ornament bl" viewBox="0 0 60 60" aria-hidden="true">
          <path d="M2,20 V58 H40" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg className="corner-ornament br" viewBox="0 0 60 60" aria-hidden="true">
          <path d="M58,20 V58 H20" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <div className="left-stack">
        <Masthead />
        <ControlPanel
          origin={origin} setOrigin={setOrigin}
          hours={hours} setHours={setHours} maxHoursBound={MAX_HOURS_BOUND}
          hsrOnly={hsrOnly} setHsrOnly={setHsrOnly}
          theme={theme} setTheme={setTheme}
          selectedDest={selectedDest} setSelectedDest={setSelectedDest}
          contoursOn={contoursOn} setContoursOn={setContoursOn}
          regionsOn={regionsOn} setRegionsOn={setRegionsOn}
        />
        <Sources />
      </div>

      <div className="right-stack">
        <ReachableList
          origin={origin}
          hours={hours}
          hsrOnly={hsrOnly}
          selectedDest={selectedDest}
          setSelectedDest={setSelectedDest}
          theme={theme}
          setHoverDest={setHoverDest}
          hoverDest={hoverDest}
        />
        {selectedDest && (
          <RouteCard
            origin={origin}
            selectedDest={selectedDest}
            hsrOnly={hsrOnly}
            theme={theme}
          />
        )}
      </div>

      <HoverCard hoverDest={hoverDest} origin={origin} hsrOnly={hsrOnly} hours={hours} theme={theme} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
