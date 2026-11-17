/* global React, ReactDOM, d3, topojson */
// =============================================================
// Greater Asia — rail reachability.
//
// Source of truth for the network: data_net.js (window.NET), generated
// by scripts/build_network.cjs from the Transits of the World catalogue
// (OpenStreetMap route relations + published timetables). This file is
// transpiled to app.js by scripts/build_app.cjs — edit this, not app.js.
//
// Rendering: two stacked <canvas> layers (base map + contours / rails,
// stations, labels). Pan + zoom only re-paint cached Path2D objects; no
// React re-render happens per frame.
// =============================================================
const { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect, Fragment, memo } = React;

// =============================================================
// HELPERS
// =============================================================

function fmtH(h) {
  if (h == null || isNaN(h) || !isFinite(h)) return "—";
  if (h < 1) return Math.max(1, Math.round(h * 60)) + "m";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (mm === 60) return `${hh + 1}h`;
  return mm === 0 ? `${hh}h` : `${hh}h ${mm.toString().padStart(2, "0")}`;
}

function fmtKm(km) {
  if (km == null || !isFinite(km)) return "—";
  if (km < 10) return km.toFixed(1) + " km";
  return Math.round(km).toLocaleString("en-US") + " km";
}

function ConvTrainIcon() {
  return (
    <svg viewBox="0 0 24 14" width="20" height="12" aria-hidden="true"
         style={{ verticalAlign: "-2px", marginRight: 6 }} fill="currentColor">
      <rect x="3" y="3.2" width="14" height="6.6" rx="0.6" />
      <rect x="12.5" y="1.3" width="4.5" height="2.2" rx="0.4" />
      <rect x="17" y="5.7" width="3.5" height="2" rx="0.3" />
      <circle cx="6" cy="11" r="1.5" />
      <circle cx="13" cy="11" r="1.5" />
    </svg>
  );
}

function HsrTrainIcon() {
  return (
    <svg viewBox="0 0 24 14" width="20" height="12" aria-hidden="true"
         style={{ verticalAlign: "-2px", marginRight: 6 }} fill="currentColor">
      <path d="M2 4.2 H17 L21 7.2 Q22 7.6 21 8 L17 9.8 H2 Z" />
      <circle cx="6" cy="11" r="1.2" />
      <circle cx="13.5" cy="11" r="1.2" />
    </svg>
  );
}

function FerryIcon() {
  return (
    <svg viewBox="0 0 24 14" width="20" height="12" aria-hidden="true"
         style={{ verticalAlign: "-2px", marginRight: 6 }} fill="currentColor">
      <path d="M3 7.5 H21 L18.5 11 H5.5 Z" />
      <rect x="7" y="4.2" width="8" height="2.6" rx="0.4" />
      <rect x="9.5" y="2" width="2.2" height="2.4" />
    </svg>
  );
}

// Returns the native string if it adds information beyond `name`.
function nativeOrNull(name, native) {
  if (!native) return null;
  const norm = s => s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[\s'\-·.()\/]/g, "");
  return norm(name) === norm(native) ? null : native;
}

// Travel-time colour ramp. Deep forest green → pale celadon as t→1.
function timeColor(hours, maxH, theme) {
  const t = Math.max(0, Math.min(1, hours / maxH));
  if (theme === "night") {
    return `hsl(${148 - 14 * t}, ${78 - 25 * t}%, ${38 + 38 * t}%)`;
  }
  return `hsl(${142 - 8 * t}, ${58 - 22 * t}%, ${22 + 56 * t}%)`;
}

function lineWidthForTime(hours, maxH) {
  const t = Math.max(0, Math.min(1, hours / maxH));
  return 3.2 - 1.6 * t; // closer = thicker
}

function gcDist(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
}

const DISPLAY_NAMES = (() => {
  try { return new Intl.DisplayNames(["en"], { type: "region" }); } catch (e) { return null; }
})();
function countryName(cc) {
  if (!cc) return "";
  if (window.COUNTRY_NAMES[cc]) return window.COUNTRY_NAMES[cc];
  try { return (DISPLAY_NAMES && DISPLAY_NAMES.of(cc)) || cc; } catch (e) { return cc; }
}

// =============================================================
// NETWORK (data_net.js)
// =============================================================
const NET = window.NET;
const NS = NET.s.n.length;
const ASIA_A2 = new Set(("AF AM AZ BH BD BT BN KH CN CY GE HK IN ID IR IQ IL JP JO KZ KW KG LA LB MO MY MV " +
  "MN MM NP KP OM PK PS PH QA RU SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE").split(" "));

const STATIONS = new Array(NS);
for (let i = 0; i < NS; i++) {
  const cc = NET.meta.cc[NET.s.c[i]];
  STATIONS[i] = {
    id: i,
    name: NET.s.n[i],
    native: NET.s.nn[i] || "",
    country: cc,
    lng: NET.s.x[i] / 1e4,
    lat: NET.s.y[i] / 1e4,
    rank: NET.s.r[i],           // number of lines calling here
    pier: NET.s.r[i] === 0,     // a ferry pier with no railway
    asia: ASIA_A2.has(cc),
  };
}

const KIND_NAME = { h: "High-speed", i: "Intercity", n: "Night", c: "Commuter", b: "Branch" };
const LINES = NET.l.map(([title, native, kind, op, freq, v10, est, stops, km10]) => ({
  title, native, kind, op: op >= 0 ? NET.meta.ops[op] : "", freq: freq || "",
  kmh: v10 / 10, est: !!est, stops, km: km10,
}));
const FERRIES = NET.f.map(([a, b, km10, dur, est, int, name, geo]) => ({
  a, b, km: km10 / 10, dur, est: !!est, headway: int, name, geo,
}));

// station → lines through it (CSR): for leg grouping
const ST_LINE_OFF = new Int32Array(NS + 1);
const ST_LINE = (() => {
  for (const L of LINES) for (const p of L.stops) ST_LINE_OFF[p + 1]++;
  for (let i = 0; i < NS; i++) ST_LINE_OFF[i + 1] += ST_LINE_OFF[i];
  const fill = ST_LINE_OFF.slice(0, NS);
  const li = new Int32Array(ST_LINE_OFF[NS]), pos = new Int32Array(ST_LINE_OFF[NS]);
  LINES.forEach((L, k) => L.stops.forEach((p, j) => { const at = fill[p]++; li[at] = k; pos[at] = j; }));
  return { li, pos };
})();

// countries the rail network (not just ferries / commuter lines) serves
const RAIL_COUNTRIES = new Set();
for (const L of LINES) if (L.kind !== "c") for (const p of L.stops) RAIL_COUNTRIES.add(STATIONS[p].country);

// decoded edge courses: key (lo * NS + hi) → Float64Array [lon,lat,...] (lo→hi)
const decode = (arr) => {
  const out = new Float64Array(arr.length);
  let x = 0, y = 0;
  for (let i = 0; i < arr.length; i += 2) { x += arr[i]; y += arr[i + 1]; out[i] = x / 1000; out[i + 1] = y / 1000; }
  return out;
};
const EDGE_COURSE = new Map();
for (const [a, b, g] of NET.e) EDGE_COURSE.set(a * NS + b, decode(g));
const FERRY_COURSE = FERRIES.map(f => decode(f.geo));

// =============================================================
// GRAPH — one per (HSR-only, ferries) mode, built on first use.
// Edge types: 0 HSR rail · 1 conventional rail · 2 ferry · 3 drive
// (pier ↔ station) · 4 walk · 5 cross-town transfer.
// =============================================================
const T_HSR = 0, T_CONV = 1, T_FERRY = 2, T_DRIVE = 3, T_WALK = 4, T_CITY = 5;
const FERRY_BOARD_H = 0.5;       // check-in + waiting at the pier
const GRAPHS = new Map();

function getGraph(hsrOnly, ferriesOn) {
  const key = (hsrOnly ? "h" : "a") + (ferriesOn ? "f" : "");
  if (GRAPHS.has(key)) return GRAPHS.get(key);
  const eA = [], eB = [], eH = [], eT = [], eRef = [], eKm = [];
  const railIdx = new Map();
  const add = (a, b, h, t, ref, km) => {
    eA.push(a); eB.push(b); eH.push(h); eT.push(t); eRef.push(ref); eKm.push(km);
  };
  LINES.forEach((L, li) => {
    if (hsrOnly && L.kind !== "h") return;
    const t = L.kind === "h" ? T_HSR : T_CONV;
    for (let j = 0; j + 1 < L.stops.length; j++) {
      let a = L.stops[j], b = L.stops[j + 1];
      if (a === b) continue;
      const km = Math.max(0.1, Math.abs(L.km[j + 1] - L.km[j]) / 10);
      const h = Math.max(1 / 60, km / L.kmh);
      if (a > b) { const tmp = a; a = b; b = tmp; }
      const k = a * NS + b;
      const at = railIdx.get(k);
      if (at === undefined) { railIdx.set(k, eA.length); add(a, b, h, t, li, km); }
      else if (h < eH[at]) { eH[at] = h; eT[at] = t; eRef[at] = li; eKm[at] = km; }
    }
  });
  for (const [a, b, d10, kind] of NET.x) {
    const km = d10 / 10;
    if (kind === 1) add(a, b, 0.5 + km / 25, T_CITY, -1, km);
    else add(a, b, km <= 1.5 ? 1 / 12 + km / 4.5 : 0.25 + km / 25, T_WALK, -1, km);
  }
  if (ferriesOn) {
    FERRIES.forEach((f, fi) => add(f.a, f.b, f.dur / 60 + FERRY_BOARD_H, T_FERRY, fi, f.km));
    for (const [a, b, d10] of NET.d) add(a, b, 0.25 + d10 / 10 / 40, T_DRIVE, -1, d10 / 10);
  }
  const m = eA.length;
  const off = new Int32Array(NS + 1);
  for (let e = 0; e < m; e++) { off[eA[e] + 1]++; off[eB[e] + 1]++; }
  for (let i = 0; i < NS; i++) off[i + 1] += off[i];
  const fill = off.slice(0, NS);
  const to = new Int32Array(2 * m), ed = new Int32Array(2 * m);
  for (let e = 0; e < m; e++) {
    let at = fill[eA[e]]++; to[at] = eB[e]; ed[at] = e;
    at = fill[eB[e]]++; to[at] = eA[e]; ed[at] = e;
  }
  const G = {
    key, hsrOnly, ferriesOn, m,
    eA: Int32Array.from(eA), eB: Int32Array.from(eB), eH: Float64Array.from(eH),
    eT: Uint8Array.from(eT), eRef: Int32Array.from(eRef), eKm: Float64Array.from(eKm),
    off, to, ed,
  };
  GRAPHS.set(key, G);
  return G;
}

// Binary-heap Dijkstra on typed arrays. `w` is the per-edge weight.
function dijkstra(G, src, w, target = -1, extra = null) {
  const dist = new Float64Array(NS).fill(Infinity);
  const pe = new Int32Array(NS).fill(-1);   // edge used to arrive (or -2 - extraIdx)
  let cap = 1024, hn = new Int32Array(cap), hd = new Float64Array(cap), size = 0;
  const push = (n, d) => {
    if (size === cap) {
      cap *= 2;
      const a = new Int32Array(cap); a.set(hn); hn = a;
      const b = new Float64Array(cap); b.set(hd); hd = b;
    }
    let i = size++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (hd[p] <= d) break;
      hn[i] = hn[p]; hd[i] = hd[p]; i = p;
    }
    hn[i] = n; hd[i] = d;
  };
  const pop = () => {
    const n = hn[0];
    const ln = hn[--size], ld = hd[size];
    let i = 0;
    for (;;) {
      let c = 2 * i + 1;
      if (c >= size) break;
      if (c + 1 < size && hd[c + 1] < hd[c]) c++;
      if (hd[c] >= ld) break;
      hn[i] = hn[c]; hd[i] = hd[c]; i = c;
    }
    hn[i] = ln; hd[i] = ld;
    return n;
  };
  dist[src] = 0; push(src, 0);
  const { off, to, ed } = G;
  while (size) {
    const d0 = hd[0], u = pop();
    if (d0 > dist[u]) continue;
    if (u === target) break;
    for (let k = off[u]; k < off[u + 1]; k++) {
      const e = ed[k], v = to[k], nd = d0 + w[e];
      if (nd < dist[v]) { dist[v] = nd; pe[v] = e; push(v, nd); }
    }
    if (extra) {
      const xs = extra.get(u);
      if (xs) for (let j = 0; j < xs.length; j += 3) {
        const v = xs[j], nd = d0 + xs[j + 1];
        if (nd < dist[v]) { dist[v] = nd; pe[v] = -2 - xs[j + 2]; push(v, nd); }
      }
    }
  }
  return { dist, pe };
}

function pathTo(G, target, pe, src) {
  const nodes = [target], edges = [];
  let cur = target, guard = 0;
  while (cur !== src && pe[cur] >= 0 && guard++ < NS) {
    const e = pe[cur];
    edges.unshift(e);
    cur = G.eA[e] === cur ? G.eB[e] : G.eA[e];
    nodes.unshift(cur);
  }
  return { nodes, edges };
}

// Group a station-by-station path into rides. The fastest path hops between
// trains freely (changes are not timed), so a ride is the line from the
// current station that reaches FURTHEST along the path — by its own stops,
// not necessarily calling at every station of the path — without being much
// slower than the path itself. Ferries, drives and walks are their own legs.
function legsFromPath(G, nodes, edges) {
  const idxOf = new Map();
  nodes.forEach((n, j) => idxOf.set(n, j));
  const cumH = new Float64Array(nodes.length), cumK = new Float64Array(nodes.length);
  for (let j = 0; j < edges.length; j++) { cumH[j + 1] = cumH[j] + G.eH[edges[j]]; cumK[j + 1] = cumK[j] + G.eKm[edges[j]]; }
  const legs = [];
  let i = 0;
  while (i < edges.length) {
    const e = edges[i], t = G.eT[e];
    if (t >= T_FERRY) {
      legs.push({ kind: t === T_FERRY ? "ferry" : t === T_DRIVE ? "drive" : t === T_CITY ? "city" : "walk",
        from: nodes[i], to: nodes[i + 1], h: G.eH[e], km: G.eKm[e], ref: G.eRef[e], stops: 1 });
      i++; continue;
    }
    let limit = i;
    while (limit < edges.length && G.eT[edges[limit]] < T_FERRY) limit++;
    const u = nodes[i];
    let best = null;
    for (let k = ST_LINE_OFF[u]; k < ST_LINE_OFF[u + 1]; k++) {
      const li = ST_LINE.li[k], L = LINES[li];
      if (G.hsrOnly && L.kind !== "h") continue;
      const p0 = ST_LINE.pos[k];
      for (const dir of [1, -1]) {
        for (let q = p0 + dir; q >= 0 && q < L.stops.length; q += dir) {
          const j = idxOf.get(L.stops[q]);
          if (j === undefined || j <= i || j > limit) continue;
          const lkm = Math.abs(L.km[q] - L.km[p0]) / 10, lh = lkm / L.kmh;
          if (lh > (cumH[j] - cumH[i]) * 1.25 + 1 / 6 || lkm > (cumK[j] - cumK[i]) * 1.3 + 5) continue;
          if (!best || j > best.j || (j === best.j && lh < best.h)) best = { li, j, h: lh, km: lkm, stops: Math.abs(q - p0) };
        }
      }
    }
    if (!best) best = { li: G.eRef[e], j: i + 1, h: G.eH[e], km: G.eKm[e], stops: 1 };
    legs.push({ kind: "rail", line: best.li, from: u, to: nodes[best.j], h: best.h, km: best.km, stops: best.stops });
    i = best.j;
  }
  return legs;
}
const legsTime = (legs) => legs.reduce((s, l) => s + l.h, 0);

// ---------- components + bridge candidates (disconnected journeys) ----------
function componentsOf(G) {
  if (G._comp) return G._comp;
  const comp = new Int32Array(NS).fill(-1);
  let c = 0;
  const stack = new Int32Array(NS);
  for (let s = 0; s < NS; s++) {
    if (comp[s] >= 0) continue;
    let sp = 0; stack[sp++] = s; comp[s] = c;
    while (sp) {
      const u = stack[--sp];
      for (let k = G.off[u]; k < G.off[u + 1]; k++) {
        const v = G.to[k];
        if (comp[v] < 0) { comp[v] = c; stack[sp++] = v; }
      }
    }
    c++;
  }
  G._comp = comp;
  return comp;
}

const BRIDGE_PENALTY = 3.0;
const MAX_BRIDGE_KM = 1600;
// For every pair of networks, their few closest station pairs (great-circle)
// within MAX_BRIDGE_KM — candidates for a "missing link". Reps are thinned
// to one station per network per 1° cell to keep this fast.
function bridgeCandidates(G, alsoNode) {
  const comp = componentsOf(G);
  if (!G._reps) {
    const repSt = [], seen = new Set();
    for (let i = 0; i < NS; i++) {
      if (G.off[i + 1] === G.off[i]) continue;          // isolated in this mode
      const s = STATIONS[i];
      const k = comp[i] + ":" + Math.floor(s.lat) + ":" + Math.floor(s.lng);
      if (seen.has(k)) continue;
      seen.add(k); repSt.push(i);
    }
    G._reps = repSt;
  }
  const reps = alsoNode >= 0 && G.off[alsoNode + 1] === G.off[alsoNode] ? G._reps.concat([alsoNode]) : G._reps;
  // a 3-D grid on the sphere (100 km cells): each rep's K nearest reps of
  // OTHER networks by an expanding shell search
  const CELL = 100, K = 6, R_EARTH = 6371;
  const key3 = (x, y, z) => ((x + 128) * 256 + (y + 128)) * 256 + (z + 128);
  const XYZ = new Float64Array(reps.length * 3);
  const grid = new Map();
  reps.forEach((st, r) => {
    const s = STATIONS[st], la = s.lat * Math.PI / 180, lo = s.lng * Math.PI / 180;
    const x = R_EARTH * Math.cos(la) * Math.cos(lo), y = R_EARTH * Math.cos(la) * Math.sin(lo), z = R_EARTH * Math.sin(la);
    XYZ[r * 3] = x; XYZ[r * 3 + 1] = y; XYZ[r * 3 + 2] = z;
    const k = key3(Math.floor(x / CELL), Math.floor(y / CELL), Math.floor(z / CELL));
    (grid.get(k) || grid.set(k, []).get(k)).push(r);
  });
  const RMAX = Math.ceil(MAX_BRIDGE_KM / CELL);
  const seen = new Set(), list = [];
  for (let r = 0; r < reps.length; r++) {
    const a = reps[r], ca = comp[a];
    const cx = Math.floor(XYZ[r * 3] / CELL), cy = Math.floor(XYZ[r * 3 + 1] / CELL), cz = Math.floor(XYZ[r * 3 + 2] / CELL);
    const top = [];   // [km, q]
    for (let ring = 0; ring <= RMAX; ring++) {
      if (top.length >= K && (ring - 1) * CELL > top[top.length - 1][0]) break;
      for (let dx = -ring; dx <= ring; dx++) for (let dy = -ring; dy <= ring; dy++) for (let dz = -ring; dz <= ring; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) !== ring) continue;   // shell only
        const cell = grid.get(key3(cx + dx, cy + dy, cz + dz));
        if (!cell) continue;
        for (const q of cell) {
          if (comp[reps[q]] === ca) continue;
          const km = Math.hypot(XYZ[q * 3] - XYZ[r * 3], XYZ[q * 3 + 1] - XYZ[r * 3 + 1], XYZ[q * 3 + 2] - XYZ[r * 3 + 2]);
          if (km > MAX_BRIDGE_KM) continue;
          if (top.length < K) { top.push([km, q]); top.sort((u, v) => u[0] - v[0]); }
          else if (km < top[K - 1][0]) { top[K - 1] = [km, q]; top.sort((u, v) => u[0] - v[0]); }
        }
      }
    }
    for (const [, q] of top) {
      const b = reps[q], pk = a < b ? a * NS + b : b * NS + a;
      if (seen.has(pk)) continue;
      seen.add(pk);
      list.push([gcDist(STATIONS[a], STATIONS[b]), a, b]);
    }
  }
  return list;
}

// Journey to an unreachable station: minimise rail km + 3 × bridge km over
// the network plus candidate bridges, then re-time each rail section.
function planJourney(G, origin, dest) {
  const cands = bridgeCandidates(G, dest);
  const extra = new Map();
  cands.forEach(([km, a, b], i) => {
    const w = km * BRIDGE_PENALTY;
    (extra.get(a) || extra.set(a, []).get(a)).push(b, w, i);
    (extra.get(b) || extra.set(b, []).get(b)).push(a, w, i);
  });
  const { dist, pe } = dijkstra(G, origin, G.eKm, dest, extra);
  if (!isFinite(dist[dest])) return null;
  // walk back: rail edges (≥0) and bridges (≤ -2)
  const steps = [];
  let cur = dest, guard = 0;
  while (cur !== origin && guard++ < NS) {
    const e = pe[cur];
    if (e >= 0) {
      const prev = G.eA[e] === cur ? G.eB[e] : G.eA[e];
      steps.unshift({ rail: true, from: prev, to: cur });
      cur = prev;
    } else if (e <= -2) {
      const [km, a, b] = cands[-2 - e];
      const prev = a === cur ? b : a;
      steps.unshift({ rail: false, from: prev, to: cur, km });
      cur = prev;
    } else return null;
  }
  // the candidates are thinned reps: move each bridge's ends to the
  // closest pair of stations of the two networks
  const comp = componentsOf(G);
  const nearestIn = (c, to) => {
    let best = -1, bd = Infinity;
    for (let i = 0; i < NS; i++) {
      if (comp[i] !== c) continue;
      const d = gcDist(STATIONS[i], STATIONS[to]);
      if (d < bd) { bd = d; best = i; }
    }
    return [best, bd];
  };
  const sections = [];
  let railStart = origin;
  const flush = (railEnd) => {
    if (railEnd < 0 || railStart === railEnd) return;
    const sp = dijkstra(G, railStart, G.eH, railEnd);
    if (!isFinite(sp.dist[railEnd])) return;
    const p = pathTo(G, railEnd, sp.pe, railStart);
    const legs = legsFromPath(G, p.nodes, p.edges);
    sections.push({ kind: "rail", from: railStart, to: railEnd, time: legsTime(legs),
      nodes: p.nodes, edges: p.edges, legs });
  };
  for (const s of steps) {
    if (s.rail) continue;
    const [a] = nearestIn(comp[s.from], s.to);
    const [b, km] = nearestIn(comp[s.to], a);
    flush(a);
    sections.push({ kind: "bridge", from: a, to: b, km });
    railStart = b;
  }
  flush(dest);
  return sections;
}

function buildJourney(G, sp, origin, dest) {
  if (origin == null || dest == null || !sp) return null;
  if (isFinite(sp.dist[dest])) {
    const p = pathTo(G, dest, sp.pe, origin);
    const legs = legsFromPath(G, p.nodes, p.edges);
    return {
      type: "reachable",
      sections: [{ kind: "rail", from: origin, to: dest, time: legsTime(legs), nodes: p.nodes, edges: p.edges, legs }],
      totalRailTime: legsTime(legs), totalBridgeKm: 0, componentsTraversed: 1,
    };
  }
  let sections = planJourney(G, origin, dest);
  if (!sections) {
    // last resort: the nearest station this origin reaches, then one bridge
    let best = -1, bd = Infinity;
    const t = STATIONS[dest];
    for (let i = 0; i < NS; i++) {
      if (!isFinite(sp.dist[i])) continue;
      const d = gcDist(STATIONS[i], t);
      if (d < bd) { bd = d; best = i; }
    }
    if (best < 0) return { type: "orphan", sections: [], totalRailTime: 0, totalBridgeKm: 0, componentsTraversed: 0 };
    sections = [];
    if (best !== origin) {
      const p = pathTo(G, best, sp.pe, origin);
      const legs = legsFromPath(G, p.nodes, p.edges);
      sections.push({ kind: "rail", from: origin, to: best, time: legsTime(legs), nodes: p.nodes, edges: p.edges, legs });
    }
    sections.push({ kind: "bridge", from: best, to: dest, km: bd });
  }
  const rails = sections.filter(s => s.kind === "rail");
  const bridges = sections.filter(s => s.kind === "bridge");
  return {
    type: "disconnected", sections,
    totalRailTime: rails.reduce((s, x) => s + x.time, 0),
    totalBridgeKm: bridges.reduce((s, x) => s + x.km, 0),
    componentsTraversed: bridges.length + 1,
  };
}

// =============================================================
// MAP CONSTANTS
// =============================================================
const ASIAN_COUNTRY_IDS = new Set([
  "004","031","048","050","051","064","096","104","116","144",
  "156","158","196","268","275","344","356","360","364","368","376",
  "392","398","400","408","410","414","417","418","422","446","458",
  "462","496","512","524","586","608","626","634","643","682","702",
  "704","760","762","764","784","792","795","860","887",
]);
const ASIA_NAMES = new Set(["N. Cyprus"]);
const HATCH_NAMES = new Set(["N. Cyprus"]);

const REGION_FILL = {};
const REGION_ORDER = ["North Asia", "East Asia", "Southeast Asia", "South Asia", "Central Asia", "West Asia"];
const REGION_COUNTRY_IDS = {
  "North Asia":     ["643"],
  "East Asia":      ["156","344","446","158","496","408","410","392"],
  "Southeast Asia": ["704","418","116","764","104","458","702","360","608","096","626"],
  "South Asia":     ["356","050","586","144","524","064","462","004"],
  "Central Asia":   ["398","860","795","762","417"],
  "West Asia":      ["364","368","792","268","051","031","376","275","682","784",
                     "512","048","634","414","887","400","422","760","196"],
};
for (const region of REGION_ORDER) for (const id of REGION_COUNTRY_IDS[region]) REGION_FILL[id] = region;
const REGION_VAR = {
  "North Asia": "--region-north", "East Asia": "--region-east", "Southeast Asia": "--region-southeast",
  "South Asia": "--region-south", "Central Asia": "--region-central", "West Asia": "--region-west",
};

const DISPUTED_LINES = window.DISPUTED_LINES || [];
const CONTINENT_DIVIDE_LINES = window.CONTINENT_DIVIDE_LINES || [];
const DISPUTED_HOST_TINT = {
  "Abkhazia (Self admin., claimed by Georgia)": "--region-west",
  "South Ossetia (Self admin., claimed by Georgia)": "--region-west",
  "Nagorno-Karabakh (Artsakh)": "--region-west",
  "Northern Cyprus (TRNC)": "--region-west",
  "Cyprus UN Buffer Zone": "--region-west",
  "Gaza Strip": "--region-west",
  "West Bank": "--region-west",
  "Golan Heights (Admin. Israel, claimed Syria)": "--region-west",
  "Golan UNDOF Zone": "--region-west",
  "Shebaa Farms (Admin. Israel, claimed Lebanon)": "--region-west",
  "Jammu & Kashmir (Admin. India, claimed Pakistan)": "--region-south",
  "Azad Kashmir": "--region-south",
  "Gilgit-Baltistan (Admin. Pakistan, claimed India)": "--region-south",
  "Siachen Glacier (India/Pakistan)": "--region-south",
  "Arunachal Pradesh (Admin. India, claimed China)": "--region-south",
  "Om Parvat sector": "--region-south",
  "Demchok sector": "--region-south",
  "Samdu Valleys": "--region-south",
  "Tirpani Valleys": "--region-south",
  "Bara Hotii Valleys": "--region-south",
  "Bhutan NW valleys (claimed China)": "--region-south",
  "Bhutan – Chumbi salient (claimed China)": "--region-south",
  "Aksai Chin (Admin. China, claimed India)": "--region-east",
  "Shaksgam Valley (Admin. China, claimed India)": "--region-east",
  "Korean DMZ (south side)": "--region-east",
  "Korean DMZ (north side)": "--region-east",
  "Kuril Is.": "--region-north",
  "Paracel Is.": "--region-southeast",
  "Spratly Is.": "--region-southeast",
};

const COUNTRY_LABELS = [
  { text: "CHINA",       lat: 36.0,  lng: 100.0, size: 34, ls: 14 },
  { text: "RUSSIA",      lat: 56.0,  lng: 95.0,  size: 30, ls: 14 },
  { text: "MONGOLIA",    lat: 46.5,  lng: 102.0, size: 18, ls: 8 },
  { text: "JAPAN",       lat: 36.5,  lng: 138.0, size: 18, ls: 8 },
  { text: "KOREA",       lat: 36.8,  lng: 128.1, size: 12, ls: 5 },
  { text: "TAIWAN",      lat: 23.7,  lng: 121.0, size: 11, ls: 4 },
  { text: "VIETNAM",     lat: 15.5,  lng: 107.2, size: 14, ls: 5 },
  { text: "LAOS",        lat: 19.5,  lng: 103.6, size: 10, ls: 3 },
  { text: "THAILAND",    lat: 15.5,  lng: 100.3, size: 14, ls: 5 },
  { text: "MYANMAR",     lat: 21.5,  lng: 95.5,  size: 14, ls: 5 },
  { text: "CAMBODIA",    lat: 12.3,  lng: 104.8, size: 11, ls: 3 },
  { text: "MALAYSIA",    lat: 3.8,   lng: 102.4, size: 12, ls: 4 },
  { text: "INDONESIA",   lat: -3.0,  lng: 110.0, size: 16, ls: 6 },
  { text: "PHILIPPINES", lat: 12.0,  lng: 122.0, size: 12, ls: 5 },
  { text: "INDIA",       lat: 22.0,  lng: 79.0,  size: 30, ls: 14 },
  { text: "BANGLADESH",  lat: 24.0,  lng: 90.3,  size: 10, ls: 3 },
  { text: "PAKISTAN",    lat: 29.5,  lng: 69.5,  size: 16, ls: 6 },
  { text: "SRI LANKA",   lat: 7.5,   lng: 80.9,  size: 10, ls: 3 },
  { text: "NEPAL",       lat: 28.4,  lng: 84.1,  size: 9,  ls: 3 },
  { text: "AFGHANISTAN", lat: 34.0,  lng: 66.0,  size: 13, ls: 4 },
  { text: "IRAN",        lat: 33.0,  lng: 54.0,  size: 22, ls: 10 },
  { text: "TÜRKIYE", lat: 39.0, lng: 35.0,  size: 18, ls: 8 },
  { text: "KAZAKHSTAN",  lat: 49.0,  lng: 67.0,  size: 22, ls: 10 },
  { text: "UZBEKISTAN",  lat: 42.0,  lng: 63.5,  size: 12, ls: 5 },
  { text: "TURKMENISTAN",lat: 39.5,  lng: 59.0,  size: 11, ls: 4 },
  { text: "KYRGYZSTAN",  lat: 41.6,  lng: 74.8,  size: 9,  ls: 3 },
  { text: "TAJIKISTAN",  lat: 39.0,  lng: 71.5,  size: 9,  ls: 3 },
  { text: "SAUDI ARABIA",lat: 24.0,  lng: 45.0,  size: 18, ls: 8 },
  { text: "IRAQ",        lat: 33.0,  lng: 44.0,  size: 11, ls: 4 },
  { text: "SYRIA",       lat: 35.0,  lng: 38.5,  size: 9,  ls: 3 },
  { text: "OMAN",        lat: 21.0,  lng: 56.5,  size: 11, ls: 4 },
  { text: "YEMEN",       lat: 15.5,  lng: 47.5,  size: 11, ls: 4 },
  { text: "UAE",         lat: 23.8,  lng: 54.5,  size: 9,  ls: 3 },
  { text: "JORDAN",      lat: 31.0,  lng: 36.5,  size: 9,  ls: 3 },
  { text: "ISRAEL",      lat: 31.5,  lng: 35.0,  size: 8,  ls: 2 },
  { text: "LEBANON",     lat: 33.9,  lng: 35.7,  size: 8,  ls: 2 },
  { text: "GEORGIA",     lat: 42.0,  lng: 43.5,  size: 9,  ls: 3 },
  { text: "ARMENIA",     lat: 40.2,  lng: 45.0,  size: 8,  ls: 2 },
  { text: "AZERBAIJAN",  lat: 40.4,  lng: 48.0,  size: 9,  ls: 3 },
  { text: "BHUTAN",      lat: 27.5,  lng: 90.4,  size: 8,  ls: 2 },
];

// =============================================================
// PROJECTION + PRE-PROJECTED GEOMETRY (computed once)
// =============================================================
const W = 1280, H = 880;
const MAX_HOURS_BOUND = 48;

const PROJ = (() => {
  const coords = [];
  for (const s of STATIONS) if (s.asia) coords.push([s.lng, s.lat]);
  const projection = d3.geoMercator().fitExtent([[24, 40], [W - 24, H - 40]],
    { type: "Feature", geometry: { type: "MultiPoint", coordinates: coords } });
  const PX = new Float32Array(NS), PY = new Float32Array(NS);
  for (let i = 0; i < NS; i++) { const [x, y] = projection([STATIONS[i].lng, STATIONS[i].lat]); PX[i] = x; PY[i] = y; }
  const projArr = (arr) => {
    const out = new Float32Array(arr.length);
    for (let i = 0; i < arr.length; i += 2) { const p = projection([arr[i], arr[i + 1]]); out[i] = p[0]; out[i + 1] = p[1]; }
    return out;
  };
  const edgeCourse = new Map();
  for (const [k, arr] of EDGE_COURSE) edgeCourse.set(k, projArr(arr));
  const ferryCourse = FERRY_COURSE.map(projArr);
  // Hubs: always-on dots + labels. The busiest stations, thinned so no two
  // sit within 26 map units (a city keeps one).
  const order = Array.from({ length: NS }, (_, i) => i).filter(i => STATIONS[i].asia && STATIONS[i].rank >= 4 && STATIONS[i].name !== "Unnamed stop")
    .sort((a, b) => STATIONS[b].rank - STATIONS[a].rank);
  const hub = new Uint8Array(NS);
  const taken = [];
  for (const i of order) {
    if (taken.length >= 420) break;
    let ok = true;
    for (const j of taken) { const dx = PX[i] - PX[j], dy = PY[i] - PY[j]; if (dx * dx + dy * dy < 26 * 26) { ok = false; break; } }
    if (ok) { taken.push(i); hub[i] = 1; }
  }
  return { projection, PX, PY, edgeCourse, ferryCourse, hub };
})();

// Each edge's projected course (map units), a→b: station, track vertices,
// station. Built once per graph mode.
function edgePts(G, e) {
  if (!G._pts) G._pts = new Array(G.m);
  let pts = G._pts[e];
  if (pts) return pts;
  const a = G.eA[e], b = G.eB[e], t = G.eT[e];
  const { PX, PY } = PROJ;
  let mid = null, rev = false;
  if (t === T_FERRY) {
    const c = PROJ.ferryCourse[G.eRef[e]];
    if (c && c.length >= 4) {
      mid = c;
      const d0 = (c[0] - PX[a]) ** 2 + (c[1] - PY[a]) ** 2;
      const d1 = (c[c.length - 2] - PX[a]) ** 2 + (c[c.length - 1] - PY[a]) ** 2;
      rev = d1 < d0;
    }
  } else if (t <= T_CONV) {
    const lo = Math.min(a, b);
    mid = PROJ.edgeCourse.get(lo * NS + Math.max(a, b)) || null;
    rev = lo !== a;
  }
  const n = mid ? mid.length : 0;
  pts = new Float32Array(n + 4);
  pts[0] = PX[a]; pts[1] = PY[a];
  for (let i = 0; i < n; i += 2) {
    const j = rev ? n - 2 - i : i;
    pts[2 + i] = mid[j]; pts[3 + i] = mid[j + 1];
  }
  pts[n + 2] = PX[b]; pts[n + 3] = PY[b];
  G._pts[e] = pts;
  return pts;
}

// Level of detail: vertices snapped to a grid of `q` map units (about half a
// screen pixel at the zoom the level serves); a hop that collapses to one
// point is skipped. At full extent most hops between halts are sub-pixel.
const LOD_Q = [0.5, 0.25, 0.12, 0.06];
const lodFor = (k) => Math.max(0, Math.min(LOD_Q.length - 1, Math.floor(Math.log2(Math.max(1, k)))));
function tracePts(path, pts, q) {
  let lx = 1e9, ly = 1e9, n = 0, fx = 0, fy = 0;
  for (let i = 0; i < pts.length; i += 2) {
    const X = Math.round(pts[i] / q), Y = Math.round(pts[i + 1] / q);
    if (X === lx && Y === ly) continue;
    if (n === 0) { fx = X; fy = Y; }
    else { if (n === 1) path.moveTo(fx * q, fy * q); path.lineTo(X * q, Y * q); }
    lx = X; ly = Y; n++;
  }
}
// exact course (journey highlight)
function traceEdge(path, G, e) {
  const pts = edgePts(G, e);
  path.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) path.lineTo(pts[i], pts[i + 1]);
}

// Background (faint) network per graph mode + level of detail, cached.
const BG_CACHE = new Map();
function backgroundPaths(G, lod) {
  const key = G.key + ":" + lod;
  if (BG_CACHE.has(key)) return BG_CACHE.get(key);
  const q = LOD_Q[lod];
  const hsr = new Path2D(), conv = new Path2D(), ferry = new Path2D();
  for (let e = 0; e < G.m; e++) {
    const t = G.eT[e];
    if (t > T_FERRY) continue;
    tracePts(t === T_HSR ? hsr : t === T_CONV ? conv : ferry, edgePts(G, e), q);
  }
  const r = { hsr, conv, ferry };
  BG_CACHE.set(key, r);
  return r;
}

// =============================================================
// Reachability isochrone grid + marching squares
// =============================================================
const GRID_STEP = 0.18;
const OFF_RAIL_SPEED = 10;
const OFF_RAIL_CAP_KM = 280;
const GRID_CEIL = 9999;
const BLUR_PASSES = 5;
const GRID = (() => {
  let x0 = 180, x1 = -180, y0 = 90, y1 = -90;
  for (const s of STATIONS) {
    if (!s.asia) continue;
    if (s.lng < x0) x0 = s.lng; if (s.lng > x1) x1 = s.lng;
    if (s.lat < y0) y0 = s.lat; if (s.lat > y1) y1 = s.lat;
  }
  const LNG_MIN = Math.floor(x0 - 3), LNG_MAX = Math.ceil(x1 + 3);
  const LAT_MIN = Math.floor(y0 - 3), LAT_MAX = Math.min(84, Math.ceil(y1 + 3));
  const cols = Math.round((LNG_MAX - LNG_MIN) / GRID_STEP) + 1;
  const rows = Math.round((LAT_MAX - LAT_MIN) / GRID_STEP) + 1;
  // Mercator is separable: x depends on lng only, y on lat only
  const colX = new Float64Array(cols), rowY = new Float64Array(rows);
  for (let i = 0; i < cols; i++) colX[i] = PROJ.projection([LNG_MIN + i * GRID_STEP, 0])[0];
  for (let j = 0; j < rows; j++) rowY[j] = PROJ.projection([0, LAT_MIN + j * GRID_STEP])[1];
  return { LNG_MIN, LAT_MIN, cols, rows, colX, rowY };
})();

function buildContourGrid(dist) {
  const { LNG_MIN, LAT_MIN, cols, rows } = GRID;
  const grid = new Float32Array(cols * rows).fill(GRID_CEIL);
  // Thin: the earliest-reached station per grid cell seeds the field — the
  // network has ~50 k stops, most of them halts a few km apart.
  const seedT = new Float32Array(cols * rows).fill(Infinity);
  const seedS = new Int32Array(cols * rows).fill(-1);
  for (let i = 0; i < NS; i++) {
    const t = dist[i];
    if (!isFinite(t)) continue;
    const s = STATIONS[i];
    const ci = Math.round((s.lng - LNG_MIN) / GRID_STEP), cj = Math.round((s.lat - LAT_MIN) / GRID_STEP);
    if (ci < 0 || cj < 0 || ci >= cols || cj >= rows) continue;
    const idx = cj * cols + ci;
    if (t < seedT[idx]) { seedT[idx] = t; seedS[idx] = i; }
  }
  const range = OFF_RAIL_CAP_KM / 111;
  for (let idx = 0; idx < seedS.length; idx++) {
    const si = seedS[idx];
    if (si < 0) continue;
    const s = STATIONS[si], t0 = seedT[idx];
    const cosS = Math.cos(s.lat * Math.PI / 180);
    const lngRange = range / Math.max(cosS, 0.2);
    const i0 = Math.max(0, Math.floor((s.lng - lngRange - LNG_MIN) / GRID_STEP));
    const i1 = Math.min(cols - 1, Math.ceil((s.lng + lngRange - LNG_MIN) / GRID_STEP));
    const j0 = Math.max(0, Math.floor((s.lat - range - LAT_MIN) / GRID_STEP));
    const j1 = Math.min(rows - 1, Math.ceil((s.lat + range - LAT_MIN) / GRID_STEP));
    for (let j = j0; j <= j1; j++) {
      const lat = LAT_MIN + j * GRID_STEP;
      const dyKm = (lat - s.lat) * 110.57;
      const kx = 111.32 * Math.cos(((lat + s.lat) / 2) * Math.PI / 180);
      const row = j * cols;
      for (let i = i0; i <= i1; i++) {
        const dxKm = (LNG_MIN + i * GRID_STEP - s.lng) * kx;
        const km = Math.sqrt(dxKm * dxKm + dyKm * dyKm);
        if (km > OFF_RAIL_CAP_KM) continue;
        const tt = t0 + km / OFF_RAIL_SPEED;
        if (tt < grid[row + i]) grid[row + i] = tt;
      }
    }
  }
  return { grid: blurGrid(grid, cols, rows, BLUR_PASSES), cols, rows };
}

// Separable 3×3 box blur (edge cells average their in-bounds neighbours).
function blurGrid(grid, cols, rows, passes) {
  let cur = grid;
  const tmp = new Float32Array(cur.length);
  for (let p = 0; p < passes; p++) {
    for (let j = 0; j < rows; j++) {
      const r = j * cols;
      for (let i = 0; i < cols; i++) {
        let s = cur[r + i], n = 1;
        if (i > 0) { s += cur[r + i - 1]; n++; }
        if (i < cols - 1) { s += cur[r + i + 1]; n++; }
        tmp[r + i] = s / n;
      }
    }
    const next = new Float32Array(cur.length);
    for (let j = 0; j < rows; j++) {
      const r = j * cols;
      for (let i = 0; i < cols; i++) {
        let s = tmp[r + i], n = 1;
        if (j > 0) { s += tmp[r - cols + i]; n++; }
        if (j < rows - 1) { s += tmp[r + cols + i]; n++; }
        next[r + i] = s / n;
      }
    }
    cur = next;
  }
  return cur;
}

function marchingSquaresPolylines(gridInfo, threshold) {
  const { grid, cols, rows } = gridInfo;
  const { colX, rowY } = GRID;
  const segments = [];
  const lerp = (i0, j0, i1, j1, v0, v1) => {
    const f = v0 === v1 ? 0.5 : (threshold - v0) / (v1 - v0);
    return [colX[i0] + (colX[i1] - colX[i0]) * f, rowY[j0] + (rowY[j1] - rowY[j0]) * f];
  };
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const v0 = grid[j * cols + i], v1 = grid[j * cols + i + 1];
      const v2 = grid[(j + 1) * cols + i + 1], v3 = grid[(j + 1) * cols + i];
      const c = (v0 < threshold ? 1 : 0) | (v1 < threshold ? 2 : 0) | (v2 < threshold ? 4 : 0) | (v3 < threshold ? 8 : 0);
      if (c === 0 || c === 15) continue;
      const e0 = () => lerp(i, j, i + 1, j, v0, v1);
      const e1 = () => lerp(i + 1, j, i + 1, j + 1, v1, v2);
      const e2 = () => lerp(i, j + 1, i + 1, j + 1, v3, v2);
      const e3 = () => lerp(i, j, i, j + 1, v0, v3);
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
  const key = ([x, y]) => `${Math.round(x * 4)}|${Math.round(y * 4)}`;
  const ends = new Map();
  segments.forEach((seg, idx) => {
    const ka = key(seg[0]), kb = key(seg[1]);
    (ends.get(ka) || ends.set(ka, []).get(ka)).push({ idx, end: 0 });
    (ends.get(kb) || ends.set(kb, []).get(kb)).push({ idx, end: 1 });
  });
  const used = new Uint8Array(segments.length);
  const polylines = [];
  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const poly = [segments[i][0], segments[i][1]];
    for (const dir of [1, 0]) {
      let curKey = key(dir ? segments[i][1] : segments[i][0]);
      for (;;) {
        const next = (ends.get(curKey) || []).find(c => !used[c.idx]);
        if (!next) break;
        used[next.idx] = 1;
        const other = segments[next.idx][1 - next.end];
        if (dir) poly.push(other); else poly.unshift(other);
        curKey = key(other);
      }
    }
    polylines.push(poly);
  }
  return polylines;
}

const CONTOUR_LEVELS = [0.5, 1, 2, 3, 5, 7, 10, 14, 18, 24, 32, 40, 48];
function computeContours(dist) {
  const gridInfo = buildContourGrid(dist);
  const smooth = d3.line().x(p => p[0]).y(p => p[1]).curve(d3.curveCatmullRomClosed.alpha(0.5));
  return CONTOUR_LEVELS.map(th => {
    const polys = marchingSquaresPolylines(gridInfo, th);
    if (!polys.length) return null;
    return new Path2D(polys.map(p => smooth(p)).join(" "));
  });
}

// =============================================================
// CANVAS HELPERS
// =============================================================
const COLOR_PROBE = document.createElement("canvas").getContext("2d");
function rgba(color, a) {
  COLOR_PROBE.fillStyle = "#000";
  COLOR_PROBE.fillStyle = color;
  const c = COLOR_PROBE.fillStyle;
  if (c[0] === "#") {
    const n = parseInt(c.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return color;
  const p = m[1].split(",").map(s => parseFloat(s));
  return `rgba(${p[0]},${p[1]},${p[2]},${(p.length > 3 ? p[3] : 1) * a})`;
}
function readColors() {
  const cs = getComputedStyle(document.body);
  const v = (n) => cs.getPropertyValue(n).trim();
  const names = ["--sea", "--grid", "--land", "--land-outside", "--border-line", "--continent-line", "--accent",
    "--ink", "--ink-2", "--paper", "--region-north", "--region-east", "--region-southeast", "--region-south",
    "--region-central", "--region-west"];
  const c = {};
  for (const n of names) c[n] = v(n) || "#888";
  return c;
}

// =============================================================
// WORLD GEOGRAPHY → Path2D groups (once)
// =============================================================
function useWorldPaths() {
  const [world, setWorld] = useState(null);
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const res = await fetch("assets/countries-50m.json");
        if (!res.ok) throw new Error("countries-50m fetch failed");
        const topo = await res.json();
        if (dead) return;
        const features = topojson.feature(topo, topo.objects.countries).features;
        const gen = d3.geoPath(PROJ.projection);
        const groups = new Map();   // fill key → Path2D
        const regionGroups = new Map();
        const strokeAsia = new Path2D(), strokeOut = new Path2D(), hatch = new Path2D();
        for (const f of features) {
          const d = gen(f);
          if (!d) continue;
          const p = new Path2D(d);
          const id = f.id != null ? String(f.id).padStart(3, "0") : "";
          const name = (f.properties && f.properties.name) || "";
          const isAsia = (id && ASIAN_COUNTRY_IDS.has(id)) || ASIA_NAMES.has(name);
          const plain = isAsia ? "--land" : "--land-outside";
          (groups.get(plain) || groups.set(plain, new Path2D()).get(plain)).addPath(p);
          const reg = isAsia ? (REGION_FILL[id] ? REGION_VAR[REGION_FILL[id]] : "--land") : "--land-outside";
          (regionGroups.get(reg) || regionGroups.set(reg, new Path2D()).get(reg)).addPath(p);
          (isAsia ? strokeAsia : strokeOut).addPath(p);
          const a2 = window.ISO_NUM_TO_A2[id];
          const listed = id && window.HATCH_COUNTRY_IDS.has(id);
          // hatched: no intercity rail in the network (the hand list only
          // decides for countries outside it, e.g. Papua New Guinea)
          const hatched = HATCH_NAMES.has(name) ||
            (a2 ? (isAsia || listed) && !RAIL_COUNTRIES.has(a2) : listed);
          if (hatched) hatch.addPath(p);
        }
        const toD = (seg) => "M" + seg.map(c => PROJ.projection(c).join(",")).join("L");
        const divide = new Path2D(CONTINENT_DIVIDE_LINES.filter(s => s.length >= 2).map(toD).join(" "));
        const disputed = DISPUTED_LINES.map(area => ({
          tint: DISPUTED_HOST_TINT[area.name] || "--land",
          path: new Path2D(area.rings.filter(r => r.length).map(r => toD(r) + "Z").join(" ")),
        }));
        const disputedAll = new Path2D();
        for (const d of disputed) disputedAll.addPath(d.path);
        setWorld({ groups, regionGroups, strokeAsia, strokeOut, hatch, divide, disputed, disputedAll });
      } catch (e) {
        console.warn("Could not load world geography:", e);
      }
    })();
    return () => { dead = true; };
  }, []);
  return world;
}

// ASIA / EUROPE callouts along the divide (map units)
const CONTINENT_ANCHORS = (() => {
  const SAMPLE = 50, out = [];
  for (const seg of CONTINENT_DIVIDE_LINES) {
    if (seg.length < 2) continue;
    const ps = seg.map(c => PROJ.projection(c));
    let walked = SAMPLE * 0.5;
    for (let i = 0; i < ps.length - 1; i++) {
      const [x0, y0] = ps[i], [x1, y1] = ps[i + 1];
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
      if (L < 1) continue;
      while (walked < L) {
        const t = walked / L;
        let ang = Math.atan2(dy, dx);
        if (ang > Math.PI / 2) ang -= Math.PI;
        if (ang < -Math.PI / 2) ang += Math.PI;
        const pA = [-dy / L, dx / L], pB = [dy / L, -dx / L];
        const eu = -pA[0] - pA[1] > -pB[0] - pB[1] ? pA : pB;
        const as = eu === pA ? pB : pA;
        out.push({ x: x0 + dx * t, y: y0 + dy * t, ang, eu, as });
        walked += SAMPLE;
      }
      walked -= L;
    }
  }
  return out;
})();
const COUNTRY_LABEL_PTS = COUNTRY_LABELS.map(l => ({ ...l, p: PROJ.projection([l.lng, l.lat]) }));

// dot visibility by zoom: the busier the station, the earlier it shows
function dotMinZoom(i) {
  const r = STATIONS[i].rank;
  if (r === 0) return 3.2;       // pier
  if (r >= 12) return 1;
  if (r >= 6) return 1.7;
  if (r >= 3) return 2.8;
  if (r >= 2) return 4.2;
  return 6.5;
}
const DOT_MIN_ZOOM = (() => { const a = new Float32Array(NS); for (let i = 0; i < NS; i++) a[i] = dotMinZoom(i); return a; })();

// =============================================================
// MAP (three stacked canvases)
//   base — land, borders, hatching, faint network (a cached bitmap, redrawn
//          only when the view settles) + isochrones
//   mid  — the reachable network coloured by time, the selected journey
//   top  — station dots, labels, bridges, country names (cheap; redrawn on hover)
// While panning / zooming, base and mid are only shifted and scaled as
// bitmaps; everything is re-rendered sharp once the gesture ends.
// =============================================================
const FG_STEP = 0.5;                       // hours per colour bucket (= the slider step)
const FG_BUCKETS = 96;                     // up to MAX_HOURS_BOUND
const newCanvas = () => document.createElement("canvas");

const MapCanvas = memo(function MapCanvas({
  G, sp, origin, journey, maxHours, theme, contoursOn, regionsOn,
  hoverDest, selectedDest, setHoverDest, onStationClick, narrow,
}) {
  const wrapRef = useRef(null), baseRef = useRef(null), midRef = useRef(null), topRef = useRef(null);
  const world = useWorldPaths();
  const view = useRef({ t: d3.zoomIdentity, cw: 1, ch: 1, dpr: 1, s: 1, ox: 0, oy: 0 });
  const hit = useRef({ cells: new Map(), labels: [] });
  const R = useRef(null);
  if (!R.current) R.current = {
    id: 0, base: false, mid: false, top: false, interacting: false,
    stat: newCanvas(), statKey: "", snaps: [newCanvas(), newCanvas(), newCanvas()], snapT: null, settledT: null,
    fg: null, topMs: 0, hatch: null,
  };
  const colors = useRef(null);

  // per-edge arrival time (the later of its two ends)
  const edgeT = useMemo(() => {
    const t = new Float32Array(G.m).fill(Infinity);
    if (!sp) return t;
    for (let e = 0; e < G.m; e++) {
      const da = sp.dist[G.eA[e]], db = sp.dist[G.eB[e]];
      if (isFinite(da) && isFinite(db)) t[e] = Math.max(da, db);
    }
    return t;
  }, [G, sp]);

  const journeyPath = useMemo(() => {
    if (!journey) return null;
    const p = new Path2D();
    let any = false;
    for (const sec of journey.sections) {
      if (sec.kind !== "rail") continue;
      for (const e of sec.edges) { traceEdge(p, G, e); any = true; }
    }
    return any ? p : null;
  }, [journey, G]);

  const journeyNodes = useMemo(() => {
    const s = new Set();
    if (!journey) return s;
    for (const sec of journey.sections) {
      if (sec.kind === "rail") for (const leg of sec.legs) { s.add(leg.from); s.add(leg.to); }
      else { s.add(sec.from); s.add(sec.to); }
    }
    return s;
  }, [journey]);

  const contours = useMemo(() => (sp && origin != null ? computeContours(sp.dist) : null), [sp, origin]);

  const P = useRef({});
  P.current = { G, sp, origin, journey, maxHours, theme, contoursOn, regionsOn, hoverDest, selectedDest,
    world, edgeT, journeyPath, journeyNodes, contours, narrow };

  // ---- view helpers ----
  const fit = () => {
    const v = view.current;
    v.s = Math.min(v.cw / W, v.ch / H);
    v.ox = (v.cw - W * v.s) / 2;
    v.oy = (v.ch - H * v.s) / 2;
  };
  const setMapTransform = (ctx) => {
    const v = view.current, k = v.t.k, sc = v.dpr * k * v.s;
    ctx.setTransform(sc, 0, 0, sc, v.dpr * (v.t.x + k * v.ox), v.dpr * (v.t.y + k * v.oy));
  };
  const toScreen = (x, y) => {
    const v = view.current, k = v.t.k;
    return [v.t.x + k * (v.ox + v.s * x), v.t.y + k * (v.oy + v.s * y)];
  };
  const clear = (cv) => { const c = cv.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); return c; };

  // ---- static layer: land + faint network, for one view ----
  const paintStatic = () => {
    const r = R.current, v = view.current, p = P.current, C = colors.current, k = v.t.k;
    const cv = r.stat;
    if (cv.width !== baseRef.current.width || cv.height !== baseRef.current.height) {
      cv.width = baseRef.current.width; cv.height = baseRef.current.height;
    }
    const ctx = clear(cv);
    setMapTransform(ctx);
    const unit = 1 / (k * v.s);
    ctx.fillStyle = C["--sea"]; ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    for (let x = 0; x <= W; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y <= H; y += 50) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.strokeStyle = C["--grid"]; ctx.lineWidth = 0.5 * unit * Math.sqrt(k); ctx.stroke();
    // vignette over the sea (under the land, as before)
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(W, H);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.75);
    g.addColorStop(0.6, rgba(C["--ink"], 0)); g.addColorStop(1, rgba(C["--ink"], 0.12));
    ctx.fillStyle = g; ctx.fillRect(-0.5, -0.5, 1, 1);
    ctx.restore();
    const w = p.world;
    if (w) {
      const groups = p.regionsOn ? w.regionGroups : w.groups;
      for (const [key, path] of groups) { ctx.fillStyle = C[key] || C["--land"]; ctx.fill(path); }
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.strokeStyle = C["--border-line"];
      ctx.lineWidth = 0.7 / Math.pow(k, 0.7);
      ctx.globalAlpha = 0.45; ctx.stroke(w.strokeOut);
      ctx.globalAlpha = 0.8; ctx.stroke(w.strokeAsia);
      ctx.globalAlpha = 1;
      // hatch: screen-space stripes 6 px apart at any zoom
      const hk = v.dpr + C["--border-line"];
      if (!r.hatch || r.hatch.key !== hk) {
        const pc = newCanvas(), ps = Math.max(1, Math.round(6 * v.dpr));
        pc.width = ps; pc.height = ps;
        const pctx = pc.getContext("2d");
        pctx.strokeStyle = rgba(C["--border-line"], 0.55); pctx.lineWidth = 0.9 * v.dpr;
        pctx.beginPath(); pctx.moveTo(0, 0); pctx.lineTo(0, ps); pctx.stroke();
        r.hatch = { key: hk, canvas: pc };
      }
      const pat = ctx.createPattern(r.hatch.canvas, "repeat");
      if (pat && pat.setTransform) pat.setTransform(new DOMMatrix().scale(1 / (v.dpr * k * v.s)).rotate(45));
      ctx.fillStyle = pat; ctx.fill(w.hatch);
      ctx.setLineDash([4 / Math.sqrt(k), 3.5 / Math.sqrt(k)]);
      ctx.strokeStyle = C["--continent-line"]; ctx.lineWidth = 1.65 / Math.pow(k, 0.7);
      ctx.stroke(w.divide);
      ctx.setLineDash([]);
      ctx.lineWidth = 2.4 / Math.pow(k, 0.7);
      for (const d of w.disputed) { ctx.strokeStyle = C[p.regionsOn ? d.tint : "--land"] || C["--land"]; ctx.stroke(d.path); }
      ctx.setLineDash([2 / Math.sqrt(k), 2.5 / Math.sqrt(k)]);
      ctx.strokeStyle = C["--border-line"]; ctx.globalAlpha = 0.75; ctx.lineWidth = 0.9 / Math.pow(k, 0.7);
      ctx.stroke(w.disputedAll);
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    // the whole network, faint
    const bg = backgroundPaths(p.G, lodFor(k));
    const zw = 1 / Math.sqrt(k);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.strokeStyle = C["--ink"];
    ctx.globalAlpha = 0.10;
    ctx.lineWidth = 0.9 * zw; ctx.stroke(bg.conv);
    ctx.lineWidth = 1.6 * zw; ctx.stroke(bg.hsr);
    ctx.globalAlpha = 0.16;
    ctx.setLineDash([3 * zw, 3 * zw]); ctx.lineWidth = 0.8 * zw; ctx.stroke(bg.ferry); ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  };

  const drawBase = () => {
    const r = R.current, p = P.current, k = view.current.t.k;
    const ctx = clear(baseRef.current);
    ctx.drawImage(r.stat, 0, 0);
    if (p.contoursOn && p.contours) {
      setMapTransform(ctx);
      const lv = [];
      CONTOUR_LEVELS.forEach((th, i) => { if (th <= p.maxHours && p.contours[i]) lv.push([th, p.contours[i]]); });
      ctx.globalCompositeOperation = p.theme === "day" ? "multiply" : "screen";
      ctx.globalAlpha = 0.13;
      for (let i = lv.length - 1; i >= 0; i--) { ctx.fillStyle = timeColor(lv[i][0], p.maxHours, p.theme); ctx.fill(lv[i][1]); }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.92;
      ctx.lineWidth = 1.2 / Math.sqrt(k); ctx.lineJoin = "round";
      for (let i = 0; i < lv.length - 1; i++) { ctx.strokeStyle = timeColor(lv[i][0], p.maxHours, p.theme); ctx.stroke(lv[i][1]); }
      ctx.globalAlpha = 1;
    }
  };

  // reachable network in fixed half-hour buckets of arrival time (rebuilt only
  // when the origin, network or level of detail changes; the slider then just
  // strokes the buckets within budget, each in its colour)
  const fgPaths = () => {
    const r = R.current, p = P.current, lod = lodFor(view.current.t.k);
    const f = r.fg;
    if (f && f.G === p.G && f.edgeT === p.edgeT && f.lod === lod) return f.paths;
    const q = LOD_Q[lod];
    const paths = Array.from({ length: FG_BUCKETS }, () => ({ hsr: null, conv: null, ferry: null }));
    const { G, edgeT } = p;
    for (let e = 0; e < G.m; e++) {
      const t = edgeT[e];
      if (!(t <= MAX_HOURS_BOUND)) continue;
      const ty = G.eT[e];
      if (ty > T_FERRY) continue;
      const b = Math.max(0, Math.ceil(t / FG_STEP) - 1);
      const key = ty === T_HSR ? "hsr" : ty === T_CONV ? "conv" : "ferry";
      tracePts(paths[b][key] || (paths[b][key] = new Path2D()), edgePts(G, e), q);
    }
    r.fg = { G, edgeT, lod, paths };
    return paths;
  };

  const drawMid = () => {
    const p = P.current, C = colors.current, k = view.current.t.k;
    const ctx = clear(midRef.current);
    setMapTransform(ctx);
    const zw = 1 / Math.sqrt(k);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (p.sp && !p.contoursOn) {
      const fg = fgPaths();
      const nb = Math.min(FG_BUCKETS, Math.round(p.maxHours / FG_STEP));
      for (let b = nb - 1; b >= 0; b--) {
        const L = fg[b], th = (b + 1) * FG_STEP;
        const lw = lineWidthForTime(th, p.maxHours) * zw;
        ctx.strokeStyle = timeColor(th, p.maxHours, p.theme);
        if (L.conv) { ctx.lineWidth = lw * 0.55; ctx.stroke(L.conv); }
        if (L.hsr) { ctx.lineWidth = lw; ctx.stroke(L.hsr); }
        if (L.ferry) { ctx.setLineDash([2.5 * zw, 2.5 * zw]); ctx.lineWidth = lw * 0.55; ctx.stroke(L.ferry); ctx.setLineDash([]); }
      }
    }
    if (p.journeyPath) {
      ctx.strokeStyle = rgba(C["--accent"], 0.25); ctx.lineWidth = 5 * zw; ctx.stroke(p.journeyPath);
      ctx.strokeStyle = C["--accent"]; ctx.globalAlpha = 0.9; ctx.lineWidth = 1.6 * zw; ctx.stroke(p.journeyPath);
      ctx.globalAlpha = 1;
    }
  };

  const drawTop = () => {
    const t0 = performance.now();
    const v = view.current, p = P.current, C = colors.current, k = v.t.k;
    const { PX, PY, hub } = PROJ;
    const ctx = clear(topRef.current);
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    const cw = v.cw, ch = v.ch;
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    // bridges
    const bridges = p.journey ? p.journey.sections.filter(s => s.kind === "bridge") : [];
    bridges.forEach((br, bi) => {
      const [ax, ay] = toScreen(PX[br.from], PY[br.from]);
      const [bx, by] = toScreen(PX[br.to], PY[br.to]);
      ctx.strokeStyle = rgba(C["--accent"], 0.18); ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      ctx.strokeStyle = C["--accent"]; ctx.lineWidth = 1.6; ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(ax, ay, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const lx = (ax + bx) / 2 - ((by - ay) / len) * 14, ly = (ay + by) / 2 + ((bx - ax) / len) * 14;
      ctx.fillStyle = C["--paper"]; ctx.globalAlpha = 0.96; ctx.fillRect(lx - 38, ly - 9, 76, 18); ctx.globalAlpha = 1;
      ctx.strokeStyle = C["--accent"]; ctx.lineWidth = 0.6; ctx.strokeRect(lx - 38, ly - 9, 76, 18);
      ctx.fillStyle = C["--accent"]; ctx.font = "500 10.5px 'DM Mono', monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText((bi + 1) + "·" + fmtKm(br.km), lx, ly + 0.5);
    });

    // station dots
    const dist = p.sp ? p.sp.dist : null;
    const hasOrigin = p.origin != null;
    const pad = 40, CELL = 16;
    const cells = new Map(), drawn = [];
    const jn = p.journeyNodes;
    const special = (i) => i === p.origin || i === p.selectedDest || i === p.hoverDest || jn.has(i);
    const a = v.t.k * v.s, bx0 = v.t.x + k * v.ox, by0 = v.t.y + k * v.oy;
    for (let i = 0; i < NS; i++) {
      const isHub = hub[i] === 1;
      if (!isHub && k < DOT_MIN_ZOOM[i] && !special(i)) continue;
      const sx = bx0 + a * PX[i], sy = by0 + a * PY[i];
      if (sx < -pad || sy < -pad || sx > cw + pad || sy > ch + pad) continue;
      const t = dist ? dist[i] : Infinity;
      const reach = hasOrigin && t <= p.maxHours;
      const st = STATIONS[i];
      const r = i === p.origin ? 7 : isHub ? 3.6 : st.pier ? 1.8 : reach ? (st.rank >= 3 ? 2.8 : 1.8) : (st.rank >= 3 ? 2 : 1.2);
      let fill = C["--ink-2"], alpha = hasOrigin ? 0.25 : 0.85;
      if (hasOrigin) {
        if (i === p.origin) { fill = C["--accent"]; alpha = 1; }
        else if (reach) { fill = timeColor(t, p.maxHours, p.theme); alpha = 1; }
        else alpha = 0.18;
      }
      if (!isHub && !special(i)) alpha *= Math.min(1, 0.35 + (k - DOT_MIN_ZOOM[i]) / 0.6);
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill();
      ctx.globalAlpha = Math.min(1, alpha + 0.2);
      ctx.strokeStyle = C["--paper"]; ctx.lineWidth = i === p.origin ? 1.4 : 0.8; ctx.stroke();
      if (st.pier) {   // a pier: a little waterline under the dot
        ctx.globalAlpha = alpha; ctx.strokeStyle = fill; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(sx - r - 1.5, sy + r + 1.2); ctx.lineTo(sx + r + 1.5, sy + r + 1.2); ctx.stroke();
      }
      drawn.push(i, sx, sy, r);
      const ck = Math.floor(sx / CELL) + "," + Math.floor(sy / CELL);
      (cells.get(ck) || cells.set(ck, []).get(ck)).push(i, sx, sy);
    }
    ctx.globalAlpha = 1;
    for (let j = 0; j < drawn.length; j += 4) {
      const i = drawn[j], sx = drawn[j + 1], sy = drawn[j + 2];
      if (i === p.origin) {
        ctx.strokeStyle = C["--accent"]; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 0.4; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      } else if (jn.has(i)) {
        ctx.strokeStyle = C["--accent"]; ctx.globalAlpha = 0.9; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      }
    }

    // labels: by priority, skipping any that would overlap one already placed
    const cand = [];
    for (let j = 0; j < drawn.length; j += 4) {
      const i = drawn[j], st = STATIONS[i];
      const t = dist ? dist[i] : Infinity, reach = hasOrigin && t <= p.maxHours;
      let prio;
      if (i === p.origin) prio = 1e7;
      else if (i === p.selectedDest) prio = 9e6;
      else if (jn.has(i)) prio = 8e6;
      else if (i === p.hoverDest) prio = 7e6;
      else if (hub[i]) prio = (reach ? 6e5 : 5e5) + st.rank;
      else { if (k < 1.6) continue; prio = (reach ? 2e5 : 1e5) + st.rank * 10 - (reach ? t : 0); }
      cand.push([prio, i, drawn[j + 1], drawn[j + 2], drawn[j + 3]]);
    }
    cand.sort((x, y) => y[0] - x[0]);
    const grid = new Map(), GC = 64;
    const overlaps = (x0, y0, x1, y1) => {
      for (let gx = Math.floor(x0 / GC); gx <= Math.floor(x1 / GC); gx++)
        for (let gy = Math.floor(y0 / GC); gy <= Math.floor(y1 / GC); gy++)
          for (const b of grid.get(gx + "," + gy) || []) if (x0 < b[2] && x1 > b[0] && y0 < b[3] && y1 > b[1]) return true;
      return false;
    };
    const place = (box) => {
      for (let gx = Math.floor(box[0] / GC); gx <= Math.floor(box[2] / GC); gx++)
        for (let gy = Math.floor(box[1] / GC); gy <= Math.floor(box[3] / GC); gy++) {
          const kk = gx + "," + gy; (grid.get(kk) || grid.set(kk, []).get(kk)).push(box);
        }
    };
    const labels = [];
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    let budget = 260;
    const fade = Math.max(0, Math.min(1, (k - 1.6) / 0.5));
    for (const [prio, i, sx, sy, r] of cand) {
      const big = i === p.origin || i === p.selectedDest;
      const forced = prio >= 7e6;
      if (!forced && budget <= 0) break;
      const font = `${big ? 700 : hub[i] ? 600 : 500} ${big ? 13 : 10.5}px 'DM Sans', sans-serif`;
      if (ctx.font !== font) ctx.font = font;
      const name = STATIONS[i].name;
      const tw = ctx.measureText(name).width;
      const box = [sx + r + 2, sy - 7, sx + r + 6 + tw, sy + 7];
      if (!forced && overlaps(box[0], box[1], box[2], box[3])) continue;
      place(box);
      labels.push([i, box[0], box[1], box[2], box[3]]);
      budget--;
      const vis = forced ? 1 : hub[i] ? 0.9 : fade * 0.85;
      ctx.globalAlpha = vis * 0.9;
      ctx.strokeStyle = C["--paper"]; ctx.lineWidth = 3; ctx.strokeText(name, sx + r + 4, sy + 0.5);
      ctx.globalAlpha = vis;
      ctx.fillStyle = C["--ink"]; ctx.fillText(name, sx + r + 4, sy + 0.5);
    }
    ctx.globalAlpha = 1;
    hit.current = { cells, labels };

    // country names
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C["--ink"];
    for (const l of COUNTRY_LABEL_PTS) {
      const [x, y] = toScreen(l.p[0], l.p[1]);
      if (x < -200 || x > cw + 200 || y < -50 || y > ch + 50) continue;
      ctx.font = `500 ${l.size}px 'Space Grotesk', 'DM Sans', sans-serif`;
      ctx.globalAlpha = l.size > 22 ? 0.34 : 0.5;
      drawSpaced(ctx, l.text, x, y, l.ls || (l.size > 24 ? 12 : 4));
    }
    ctx.globalAlpha = 1;
    // EUROPE / ASIA along the divide
    if (k > 1.4) {
      const f2 = Math.max(0, Math.min(1, (k - 1.4) / 0.6));
      ctx.font = "italic 700 10px 'Space Grotesk', 'DM Sans', sans-serif";
      ctx.textBaseline = "middle";
      for (const an of CONTINENT_ANCHORS) {
        const [sx, sy] = toScreen(an.x, an.y);
        if (sx < -60 || sx > cw + 60 || sy < -60 || sy > ch + 60) continue;
        for (const [txt, d] of [["EUROPE", an.eu], ["ASIA", an.as]]) {
          ctx.save();
          ctx.translate(sx + d[0] * 22, sy + d[1] * 22); ctx.rotate(an.ang);
          ctx.globalAlpha = f2;
          ctx.strokeStyle = C["--paper"]; ctx.lineWidth = 3;
          drawSpaced(ctx, txt, 0, 0, 4, true);
          ctx.fillStyle = C["--ink"];
          drawSpaced(ctx, txt, 0, 0, 4);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }
    R.current.topMs = performance.now() - t0;
  };

  // mid-gesture: shift + scale the last sharp frames
  const blit = () => {
    const r = R.current, v = view.current, s0 = r.snapT;
    if (!s0) return;
    const sc = v.t.k / s0.k, dx = v.dpr * (v.t.x - sc * s0.x), dy = v.dpr * (v.t.y - sc * s0.y);
    const layers = [baseRef.current, midRef.current];
    if (r.topMs > 12) layers.push(topRef.current);
    layers.forEach((cv, i) => {
      const ctx = clear(cv);
      ctx.setTransform(sc, 0, 0, sc, dx, dy);
      ctx.drawImage(r.snaps[i], 0, 0);
    });
    if (r.topMs <= 12) drawTop();
  };

  const frame = () => {
    const r = R.current, p = P.current;
    r.id = 0;
    if (!colors.current || colors.current._theme !== p.theme) {
      colors.current = readColors(); colors.current._theme = p.theme;
      r.base = r.mid = r.top = true; r.statKey = "";
    }
    if (r.interacting) { blit(); return; }
    const v = view.current, t = v.t;
    const perf = {};
    let t0 = performance.now();
    const sk = [p.theme, p.regionsOn, !!p.world, p.G.key, t.k, t.x, t.y, v.cw, v.ch, v.dpr].join("|");
    if (sk !== r.statKey) { paintStatic(); r.statKey = sk; r.base = true; perf.static = performance.now() - t0; }
    t0 = performance.now();
    if (r.base) { drawBase(); perf.base = performance.now() - t0; }
    t0 = performance.now();
    if (r.mid) { drawMid(); perf.mid = performance.now() - t0; }
    if (r.top) { drawTop(); perf.top = r.topMs; }
    r.base = r.mid = r.top = false;
    r.settledT = { k: t.k, x: t.x, y: t.y };
    window.__mapPerf = perf;
  };

  const schedule = useCallback((base, mid, top) => {
    const r = R.current;
    r.base = r.base || base; r.mid = r.mid || mid; r.top = r.top || top;
    if (!r.id) r.id = requestAnimationFrame(frame);
  }, []);

  // ---- size + zoom ----
  useLayoutEffect(() => {
    const wrap = wrapRef.current, top = topRef.current, r = R.current;
    const zoom = d3.zoom().scaleExtent([1, 14]);
    const resize = () => {
      const v = view.current;
      v.cw = wrap.clientWidth || 1; v.ch = wrap.clientHeight || 1;
      v.dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const cv of [baseRef.current, midRef.current, topRef.current]) {
        cv.width = Math.round(v.cw * v.dpr); cv.height = Math.round(v.ch * v.dpr);
      }
      for (const cv of r.snaps) { cv.width = baseRef.current.width; cv.height = baseRef.current.height; }
      fit();
      // pan within the map itself (on a tall phone screen the map is a band)
      zoom.extent([[0, 0], [v.cw, v.ch]])
        .translateExtent([[Math.min(v.ox, 0), v.oy], [Math.max(v.ox + W * v.s, v.cw), v.oy + H * v.s]]);
      r.interacting = false;
      schedule(true, true, true);
      // first layout on a narrow screen: zoom in so the map fills the space
      // between the top bar and the bottom sheet, centred on the origin
      if (!r.framed) {
        r.framed = true;
        const bar = document.querySelector(".m-top"), sh = document.querySelector(".m-sheet");
        if (P.current.narrow && bar) {
          const topH = bar.offsetHeight, botH = sh ? sh.offsetHeight : 0;
          const availH = Math.max(100, v.ch - topH - botH);
          const k0 = Math.max(1, Math.min(6, availH / (H * v.s)));
          if (k0 > 1.05) {
            const o = P.current.origin;
            const px = o != null ? v.ox + v.s * PROJ.PX[o] : v.cw / 2;
            const py = o != null ? v.oy + v.s * PROJ.PY[o] : v.ch / 2;
            d3.select(top).call(zoom.transform,
              d3.zoomIdentity.translate(v.cw / 2 - k0 * px, topH + availH / 2 - k0 * py).scale(k0));
          }
        }
      }
    };
    zoom
      .on("start", () => {
        // freeze the current sharp frames for the gesture
        [baseRef.current, midRef.current, topRef.current].forEach((cv, i) => {
          const c = clear(r.snaps[i]); c.drawImage(cv, 0, 0);
        });
        r.snapT = r.settledT || { k: view.current.t.k, x: view.current.t.x, y: view.current.t.y };
        r.interacting = true;
      })
      .on("zoom", (ev) => { view.current.t = ev.transform; schedule(false, false, false); })
      .on("end", () => {
        r.interacting = false;
        const t = view.current.t, s = r.settledT;
        const moved = !s || s.k !== t.k || s.x !== t.x || s.y !== t.y;
        if (moved) { schedule(true, true, true); return; }
        // nothing moved (a click): put the sharp frames back, then any redraw
        // that was held while the pointer was down
        [baseRef.current, midRef.current, topRef.current].forEach((cv, i) => {
          const c = clear(cv); c.drawImage(r.snaps[i], 0, 0);
        });
        if (r.base || r.mid || r.top) schedule(false, false, false);
      });
    d3.select(top).call(zoom).on("dblclick.zoom", null);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => schedule(false, false, true));
    return () => { ro.disconnect(); d3.select(top).on(".zoom", null); };
  }, [schedule]);

  // redraw what each input affects
  useEffect(() => { schedule(true, false, false); }, [world, contours, contoursOn, maxHours, regionsOn, theme, G, schedule]);
  useEffect(() => { schedule(false, true, false); }, [edgeT, maxHours, contoursOn, journeyPath, theme, G, schedule]);
  useEffect(() => { schedule(false, false, true); },
    [hoverDest, selectedDest, origin, sp, maxHours, theme, journey, journeyNodes, schedule]);

  // ---- hover + click ----
  const touchRef = useRef(false);
  const pick = (ev) => {
    const rect = topRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    const { cells, labels } = hit.current;
    const rad = touchRef.current ? 22 : 10, span = Math.ceil(rad / 16);   // a finger is wider than a pointer
    let best = -1, bd = rad * rad;
    const cx = Math.floor(x / 16), cy = Math.floor(y / 16);
    for (let dx = -span; dx <= span; dx++) for (let dy = -span; dy <= span; dy++) {
      const c = cells.get((cx + dx) + "," + (cy + dy));
      if (!c) continue;
      for (let j = 0; j < c.length; j += 3) {
        const d = (c[j + 1] - x) ** 2 + (c[j + 2] - y) ** 2;
        if (d < bd) { bd = d; best = c[j]; }
      }
    }
    if (best < 0) for (const [i, x0, y0, x1, y1] of labels) if (x >= x0 && x <= x1 && y >= y0 && y <= y1) { best = i; break; }
    return best;
  };
  const hoverRef = useRef(null);
  const onMove = (ev) => {
    if (ev.buttons || R.current.interacting) return;
    const i = pick(ev);
    const id = i >= 0 ? i : null;
    topRef.current.style.cursor = id != null ? "pointer" : "";
    if (id !== hoverRef.current) { hoverRef.current = id; setHoverDest(id); }
  };
  const onLeave = () => { if (hoverRef.current != null) { hoverRef.current = null; setHoverDest(null); } };
  const onClick = (ev) => {
    const i = pick(ev);
    if (i >= 0) onStationClick(i, ev);
  };

  return (
    <div className="map-wrap" ref={wrapRef}>
      <canvas className="map-canvas" ref={baseRef} aria-hidden="true" />
      <canvas className="map-canvas" ref={midRef} aria-hidden="true" />
      <canvas className="map-canvas map-top" ref={topRef} role="img"
              aria-label="Map of the rail network across Asia, coloured by travel time from the origin"
              onPointerDown={(ev) => { touchRef.current = ev.pointerType !== "mouse"; }}
              onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick} />
    </div>
  );
});

// letter-spaced text (canvas letterSpacing is not everywhere yet)
function drawSpaced(ctx, text, x, y, spacing, stroke = false) {
  const align = ctx.textAlign;
  const widths = [...text].map(ch => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  ctx.textAlign = "left";
  [...text].forEach((ch, i) => {
    if (stroke) ctx.strokeText(ch, cx, y); else ctx.fillText(ch, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = align;
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

const SEARCH_KEY = STATIONS.map(s => (s.name + " " + s.native).toLowerCase());
const HUB_LIST = (() => {
  const out = [];
  for (let i = 0; i < NS; i++) if (PROJ.hub[i]) out.push(i);
  return out;
})();
const REGION_OF = {};
for (const r of window.REGIONS) for (const c of r.codes) REGION_OF[c] = r.name;

// Origin picker: hubs when the search is empty, otherwise the best matches.
function StationSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  const groups = useMemo(() => {
    if (!open) return [];
    const q = query.toLowerCase().trim();
    let ids;
    if (!q) ids = HUB_LIST;
    else {
      const hits = [];
      for (let i = 0; i < NS; i++) {
        const at = SEARCH_KEY[i].indexOf(q);
        if (at < 0) continue;
        hits.push([(at === 0 ? 1000 : 0) + Math.min(STATIONS[i].rank, 99) + (STATIONS[i].asia ? 0 : -500), i]);
      }
      hits.sort((a, b) => b[0] - a[0]);
      ids = hits.slice(0, 150).map(h => h[1]);
    }
    const byCc = new Map();
    for (const i of ids) {
      const cc = STATIONS[i].country;
      (byCc.get(cc) || byCc.set(cc, []).get(cc)).push(i);
    }
    const out = [];
    const order = window.REGIONS.flatMap(r => r.codes);
    const ccs = [...byCc.keys()].sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
    for (const cc of ccs) {
      const stns = byCc.get(cc).map(i => STATIONS[i]);
      if (!q) stns.sort((a, b) => a.name.localeCompare(b.name));
      out.push({ code: cc, country: countryName(cc), region: REGION_OF[cc] || "", stns });
    }
    return out;
  }, [query, open]);

  const selected = value != null ? STATIONS[value] : null;
  const triggerLabel = selected
    ? selected.name + (nativeOrNull(selected.name, selected.native) ? " · " + nativeOrNull(selected.name, selected.native) : "")
    : "Select origin…";

  return (
    <div className={`mselect ${open ? "open" : ""}`} ref={rootRef}>
      <button type="button" className="mselect-trigger" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        <span className="mselect-value">{triggerLabel}</span>
        <span className="mselect-caret" aria-hidden="true" />
      </button>
      {open && (
        <div className="mselect-pop">
          <input ref={inputRef} type="text" className="mselect-search" value={query}
                 onChange={e => setQuery(e.target.value)}
                 placeholder={`Search ${NS.toLocaleString("en-US")} stations…`} />
          <div className="mselect-list">
            {groups.length === 0 && <div className="mselect-empty">No matches</div>}
            {groups.map(g => (
              <div key={g.code} className="mselect-group">
                <div className="mselect-group-head">
                  <span>{g.country}</span>
                  <span className="mselect-group-region">{g.region}</span>
                </div>
                {g.stns.map(s => {
                  const nat = nativeOrNull(s.name, s.native);
                  return (
                    <button type="button" key={s.id} className={`mselect-item ${s.id === value ? "sel" : ""}`}
                            onClick={() => { onChange(s.id); setOpen(false); setQuery(""); }}>
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

const LegendDashes = () => (
  <div className="legend-dashes">
    <div><span className="dash hsr" /> High-speed</div>
    <div><span className="dash conv" /> Conventional</div>
    <div><span className="dash ferry" /> Ferry</div>
    <div><span className="dash hatched" /> No passenger rail</div>
    <div><span className="dash bridge" /> Disconnected gap</div>
  </div>
);

function BudgetSlider({ hours, setHours, maxHoursBound, theme }) {
  return (
    <>
      <input type="range" min={1} max={maxHoursBound} step={0.5} value={hours}
             onChange={e => setHours(parseFloat(e.target.value))} className="slider"
             aria-label="Time budget in hours"
             style={{ background: makeRampGradient(maxHoursBound, theme) }} />
      <div className="slider-ticks">
        {[1, 12, 24, 36, 48].filter(t => t <= maxHoursBound).map(t => <span key={t}>{t}h</span>)}
      </div>
    </>
  );
}

// The four network switches + region key (desktop panel III; mobile "Network" tab)
function NetworkToggles({ hsrOnly, setHsrOnly, ferriesOn, setFerriesOn, theme, setTheme,
  contoursOn, setContoursOn, regionsOn, setRegionsOn }) {
  return (
    <>
      <div className="toggle-row">
        <button className="toggle on toggle-swap" onClick={() => setHsrOnly(v => !v)}>
          {hsrOnly ? <HsrTrainIcon /> : <ConvTrainIcon />}
          {hsrOnly ? "HSR Only" : "All Trains"}
        </button>
        <button className="toggle on toggle-swap" onClick={() => setFerriesOn(v => !v)}
                aria-pressed={ferriesOn} title="Include scheduled ferries (and the drive from pier to station)">
          <FerryIcon />{ferriesOn ? "+ Ferries" : "No Ferries"}
        </button>
      </div>
      <div className="toggle-row" style={{ marginTop: 8 }}>
        <button className="toggle on toggle-swap" onClick={() => setRegionsOn(v => !v)}>
          {regionsOn ? "◑ Regional" : "○ Continental"}
        </button>
        <button className="toggle on toggle-swap" onClick={() => setTheme(t => t === "day" ? "night" : "day")}>
          {theme === "day" ? "☀ Day" : "☾ Night"}
        </button>
      </div>
      <div className="toggle-row" style={{ marginTop: 8 }}>
        <button className="toggle on toggle-swap" onClick={() => setContoursOn(v => !v)}>
          {contoursOn ? "◉ Contours" : "━ Lines"}
        </button>
      </div>
      <div className={`legend-regions-wrap ${regionsOn ? "show" : ""}`}>
        <div className="legend-regions">
          <div><span className="swatch" style={{ background: "var(--region-north)" }} /> North Asia</div>
          <div><span className="swatch" style={{ background: "var(--region-east)" }} /> East Asia</div>
          <div><span className="swatch" style={{ background: "var(--region-southeast)" }} /> Southeast Asia</div>
          <div><span className="swatch" style={{ background: "var(--region-south)" }} /> South Asia</div>
          <div><span className="swatch" style={{ background: "var(--region-central)" }} /> Central Asia</div>
          <div><span className="swatch" style={{ background: "var(--region-west)" }} /> West Asia</div>
        </div>
      </div>
    </>
  );
}

const ControlPanel = memo(function ControlPanel(props) {
  const { origin, setOrigin, hours, setHours, maxHoursBound, theme, setSelectedDest } = props;
  return (
    <div className="panel control-panel">
      <div className="panel-head">
        <span className="panel-num">I.</span>
        <span className="panel-title">Origin</span>
      </div>
      <StationSelect value={origin} onChange={(id) => { setOrigin(id); setSelectedDest(null); }} />
      <div className="hint">
        Click a station to set as origin · click a second to draw the
        route · click a third to start over.
      </div>

      <div className="panel-head" style={{ marginTop: 22 }}>
        <span className="panel-num">II.</span>
        <span className="panel-title">Time budget</span>
        <span className="panel-value">{fmtH(hours)}</span>
      </div>
      <div className="slider-wrap">
        <BudgetSlider hours={hours} setHours={setHours} maxHoursBound={maxHoursBound} theme={theme} />
        <LegendDashes />
      </div>

      <div className="panel-head" style={{ marginTop: 22 }}>
        <span className="panel-num">III.</span>
        <span className="panel-title">Network</span>
      </div>
      <NetworkToggles {...props} />
    </div>
  );
});

function makeRampGradient(maxH, theme) {
  const stops = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    stops.push(`${timeColor(t * maxH, maxH, theme)} ${(t * 100).toFixed(0)}%`);
  }
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

const SHOW_ROWS = 200;

function StationRow({ s, right, dotStyle, cls, isSel, isHov, setHoverDest, setSelectedDest }) {
  const nat = nativeOrNull(s.name, s.native);
  return (
    <div className={`list-row ${cls} ${isSel ? "sel" : ""} ${isHov ? "hov" : ""}`}
         onMouseEnter={() => setHoverDest(s.id)} onMouseLeave={() => setHoverDest(null)}
         onClick={() => setSelectedDest(isSel ? null : s.id)}>
      <span className={`list-dot ${dotStyle ? "" : cls === "broken" ? "list-dot-broken" : "list-dot-empty"}`} style={dotStyle} />
      <div className="list-name">
        <div className="lr-name">{s.pier ? "⛴ " : ""}{s.name}{nat ? <span className="lr-cn"> · {nat}</span> : null}</div>
        <div className="lr-meta">{countryName(s.country)}</div>
      </div>
      <div className={`list-time ${cls === "broken" ? "list-km" : ""}`}>{right}</div>
    </div>
  );
}

const ReachableList = memo(function ReachableList({
  origin, hours, sp, selectedDest, setSelectedDest, theme, setHoverDest, hoverDest,
}) {
  const origStation = origin != null ? STATIONS[origin] : null;
  // sorted once per origin / network; the slider only moves a cut-off
  const sorted = useMemo(() => {
    if (!sp || origin == null) return null;
    const reach = [], disc = [];
    for (let i = 0; i < NS; i++) {
      if (i === origin || !STATIONS[i].asia) continue;
      if (isFinite(sp.dist[i])) reach.push(i); else disc.push(i);
    }
    reach.sort((a, b) => sp.dist[a] - sp.dist[b]);
    const o = STATIONS[origin];
    const dk = new Float64Array(NS);
    for (const i of disc) dk[i] = gcDist(o, STATIONS[i]);
    disc.sort((a, b) => dk[a] - dk[b]);
    return { reach, disc, dk };
  }, [sp, origin]);

  const cut = useMemo(() => {
    if (!sorted) return 0;
    let lo = 0, hi = sorted.reach.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (sp.dist[sorted.reach[mid]] <= hours) lo = mid + 1; else hi = mid; }
    return lo;
  }, [sorted, hours, sp]);

  if (!origStation || !sorted) return null;
  const items = sorted.reach.slice(0, Math.min(cut, SHOW_ROWS));
  const over = sorted.reach.slice(cut, cut + 8);
  const overN = sorted.reach.length - cut;
  const rowProps = { setHoverDest, setSelectedDest };

  return (
    <div className="panel list-panel">
      <div className="panel-head">
        <span className="panel-num">IV.</span>
        <span className="panel-title">Reachable</span>
        <span className="panel-value">{cut.toLocaleString("en-US")} stations</span>
      </div>
      <div className="list-sub">
        from <strong>{origStation.name}</strong>{nativeOrNull(origStation.name, origStation.native) ? ` · ${nativeOrNull(origStation.name, origStation.native)}` : ""} within {fmtH(hours)}
      </div>
      <div className="list-scroll">
        {cut === 0 && <div className="empty">No stations within this time budget.</div>}
        {items.map(i => (
          <StationRow key={i} s={STATIONS[i]} cls="" right={fmtH(sp.dist[i])}
                      dotStyle={{ background: timeColor(sp.dist[i], hours, theme) }}
                      isSel={i === selectedDest} isHov={i === hoverDest} {...rowProps} />
        ))}
        {cut > SHOW_ROWS && <div className="ls-more">+ {(cut - SHOW_ROWS).toLocaleString("en-US")} more within {fmtH(hours)} — zoom the map to explore</div>}

        {overN > 0 && (
          <div className="list-section">
            <div className="ls-head">
              <span className="ls-dot ls-dot-amber" />
              <span>Over budget · {overN.toLocaleString("en-US")}</span>
              <span className="ls-hint">extend the slider to reach</span>
            </div>
            {over.map(i => (
              <StationRow key={i} s={STATIONS[i]} cls="dim" right={fmtH(sp.dist[i])}
                          isSel={i === selectedDest} isHov={i === hoverDest} {...rowProps} />
            ))}
            {overN > 8 && <div className="ls-more">+ {(overN - 8).toLocaleString("en-US")} more beyond {fmtH(hours)}</div>}
          </div>
        )}

        {sorted.disc.length > 0 && (
          <div className="list-section">
            <div className="ls-head">
              <span className="ls-dot ls-dot-broken" />
              <span>Disconnected · {sorted.disc.length.toLocaleString("en-US")}</span>
              <span className="ls-hint">no rail path — gap from origin</span>
            </div>
            {sorted.disc.slice(0, 40).map(i => (
              <StationRow key={i} s={STATIONS[i]} cls="broken" right={fmtKm(sorted.dk[i])}
                          isSel={i === selectedDest} isHov={i === hoverDest} {...rowProps} />
            ))}
            {sorted.disc.length > 40 && (
              <div className="ls-more">+ {(sorted.disc.length - 40).toLocaleString("en-US")} more disconnected stations</div>
            )}
          </div>
        )}
      </div>
      <div className="list-foot">Click any row to draw the route or bridge. Tap again to clear.</div>
    </div>
  );
});

function legBadge(leg) {
  if (leg.kind === "ferry") return { cls: "ferry", text: "Ferry" };
  if (leg.kind === "drive") return { cls: "link", text: "Drive" };
  if (leg.kind === "walk") return { cls: "link", text: "Walk" };
  if (leg.kind === "city") return { cls: "link", text: "Transfer" };
  const L = LINES[leg.line];
  return L && L.kind === "h" ? { cls: "hsr", text: "HSR" } : { cls: "conv", text: "Conv" };
}
function legInfo(leg) {
  if (leg.kind === "rail") {
    const L = LINES[leg.line];
    if (!L) return { title: "Rail", op: "", freq: "" };
    return {
      title: L.title,
      op: L.op,
      freq: L.freq || (L.est ? `≈ ${Math.round(L.kmh)} km/h est.` : ""),
      stops: leg.stops,
    };
  }
  if (leg.kind === "ferry") {
    const f = FERRIES[leg.ref];
    return {
      title: f ? f.name : "Ferry",
      op: f && f.est ? "time estimated at 30 km/h" : "",
      freq: f && f.headway ? `every ${fmtH(f.headway / 60)}` : "check sailings",
    };
  }
  if (leg.kind === "drive") return { title: "Drive to the pier (taxi)", op: fmtKm(leg.km), freq: "" };
  if (leg.kind === "city") return { title: "Cross-town transfer", op: fmtKm(leg.km), freq: "" };
  return { title: "Walk between stations", op: fmtKm(leg.km), freq: "" };
}

function RouteCard({ origin, selectedDest, journey }) {
  if (origin == null || selectedDest == null || !journey) return null;
  const orig = STATIONS[origin];
  const tgt = STATIONS[selectedDest];
  if (!tgt) return null;

  if (journey.type === "reachable") {
    const sec = journey.sections[0];
    const rides = sec.legs.filter(l => l.kind === "rail" || l.kind === "ferry");
    const transfers = Math.max(0, rides.length - 1);
    const allHsr = rides.length > 0 && rides.every(l => l.kind === "rail" && LINES[l.line].kind === "h");
    const hasFerry = rides.some(l => l.kind === "ferry");
    return (
      <div className="panel route-card">
        <div className="rc-head">
          <span className="rc-eyebrow">Route</span>
          <span className="rc-total">{fmtH(sec.time)}</span>
        </div>
        <div className="rc-endpoints">
          <span>{orig.name}</span><span className="rc-arrow">→</span><span>{tgt.name}</span>
        </div>
        <div className="rc-meta">
          {rides.length} ride{rides.length === 1 ? "" : "s"} · {transfers} change{transfers === 1 ? "" : "s"} ·{" "}
          {allHsr ? "all HSR" : hasFerry ? "rail + ferry" : "mixed"}
        </div>
        <RailSectionDetail section={sec} expandable={false} />
      </div>
    );
  }

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
        <span>{orig.name}</span><span className="rc-arrow bc-arrow">⤙⤚</span><span>{tgt.name}</span>
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

function RailJourneyRow({ section, index, sections }) {
  const [open, setOpen] = useState(false);
  const sFrom = STATIONS[section.from];
  const sTo = STATIONS[section.to];
  const railIdx = sections.slice(0, index + 1).filter(x => x.kind === "rail").length;
  const n = section.legs.length;
  return (
    <li className="jrow jrow-rail">
      <div className="jrow-marker jrow-marker-rail">▤</div>
      <div className="jrow-body">
        <div className="jrow-head" onClick={() => setOpen(o => !o)} style={{ cursor: n > 0 ? "pointer" : "default" }}>
          <span className="jrow-label">Rail · network {railIdx}</span>
          <span className="jrow-time">{fmtH(section.time)}</span>
        </div>
        <div className="jrow-route">
          <span>{sFrom.name}</span><span className="jrow-dash">→</span><span>{sTo.name}</span>
          <span className="jrow-legs">
            {n} leg{n === 1 ? "" : "s"}
            {n > 0 && <button className="jrow-toggle" onClick={() => setOpen(o => !o)}>{open ? "▾ hide" : "▸ show"}</button>}
          </span>
        </div>
        {open && n > 0 && <RailSectionDetail section={section} expandable={true} />}
      </div>
    </li>
  );
}

function BridgeJourneyRow({ section, index, sections }) {
  const bIdx = sections.slice(0, index + 1).filter(x => x.kind === "bridge").length;
  const a = STATIONS[section.from], b = STATIONS[section.to];
  return (
    <li className="jrow jrow-bridge">
      <div className="jrow-marker jrow-marker-bridge">{bIdx}</div>
      <div className="jrow-body">
        <div className="jrow-head">
          <span className="jrow-label jrow-label-bridge">Bridge · missing link</span>
          <span className="jrow-time jrow-time-bridge">{fmtKm(section.km)}</span>
        </div>
        <div className="jrow-route">
          <span>{a.name}</span><span className="jrow-dash jrow-dash-bridge">⤳</span><span>{b.name}</span>
        </div>
        <div className="jrow-meta">{countryName(a.country)} → {countryName(b.country)}</div>
      </div>
    </li>
  );
}

function RailSectionDetail({ section, expandable }) {
  return (
    <ol className={`rc-legs ${expandable ? "rc-legs-nested" : ""}`}>
      {section.legs.map((leg, i) => {
        const from = STATIONS[leg.from], to = STATIONS[leg.to];
        const badge = legBadge(leg), info = legInfo(leg);
        return (
          <li key={i} className="rc-leg">
            <div className={`rc-badge ${badge.cls}`}>{badge.text}</div>
            <div className="rc-leg-body">
              <div className="rc-leg-route">
                <span>{from.name}</span><span className="rc-arrow">→</span><span>{to.name}</span>
                <span className="rc-leg-time">{fmtH(leg.h)}</span>
              </div>
              <div className="rc-leg-line">{info.title}</div>
              <div className="rc-leg-op">
                {info.op}{info.stops > 1 ? `${info.op ? " · " : ""}${info.stops} stops` : ""}
                {info.freq && <span className="rc-leg-freq">{info.freq}</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// =============================================================
// HOVER CARD
// =============================================================
function HoverCard({ hoverDest, origin, G, sp, hours, theme, hsrOnly }) {
  if (hoverDest == null) return null;
  const s = STATIONS[hoverDest];
  if (!s) return null;
  const t = origin != null && sp ? sp.dist[s.id] : Infinity;
  const reachable = t <= hours;
  const isOrigin = s.id === origin;
  let last = null;
  if (origin != null && sp && sp.pe[s.id] >= 0) {
    const e = sp.pe[s.id];
    last = legInfo({ kind: G.eT[e] === T_FERRY ? "ferry" : G.eT[e] >= T_DRIVE ? (G.eT[e] === T_DRIVE ? "drive" : G.eT[e] === T_CITY ? "city" : "walk") : "rail",
      line: G.eRef[e], ref: G.eRef[e], km: G.eKm[e] });
  }
  const nat = nativeOrNull(s.name, s.native);
  return (
    <div className="hover-card">
      <div className="hc-name">{s.name}{nat ? <span className="hc-cn"> · {nat}</span> : ""}</div>
      <div className="hc-country">{countryName(s.country)}{s.pier ? " · ferry pier" : s.rank > 1 ? ` · ${s.rank} lines` : ""}</div>
      {isOrigin ? (
        <div className="hc-row hc-origin">⌑ Origin</div>
      ) : origin == null ? (
        <div className="hc-row hc-dim">Click to set as origin</div>
      ) : !isFinite(t) ? (
        <div className="hc-row hc-dim">Not connected by rail{hsrOnly ? " (HSR-only)" : ""}</div>
      ) : (
        <div className="hc-stack">
          <div className="hc-row">
            <span className="hc-dot" style={{ background: timeColor(t, hours, theme) }} />
            <span className="hc-time">{fmtH(t)}</span>
            <span className="hc-tag">{reachable ? "within reach" : `over budget by ${fmtH(t - hours)}`}</span>
          </div>
          {last && (
            <div className="hc-leg">
              <div className="hc-leg-line">arr. via {last.title}</div>
              <div className="hc-leg-op">
                {last.op}{last.freq && <span className="hc-leg-freq"> · {last.freq}</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================
// SOURCES
// =============================================================
const NET_STATS = (() => {
  const timed = LINES.filter(l => !l.est).length;
  const ccs = new Set();
  for (const L of LINES) for (const p of L.stops) if (STATIONS[p].asia) ccs.add(STATIONS[p].country);
  return { timed, lines: LINES.length, countries: ccs.size };
})();

function Sources() {
  const sections = [
    {
      key: "Rail network",
      items: [
        <>Transits of the World intercity catalogue (built {NET.meta.built}): {NET_STATS.lines.toLocaleString("en-US")} passenger lines, {NS.toLocaleString("en-US")} stations and piers across {NET_STATS.countries} countries — OpenStreetMap <span className="mono">route=train</span> relations; freight-only and closed lines left out</>,
        "Every line is drawn along its OpenStreetMap track, cut at each stop",
        "Stations a short walk apart, and a city's terminals (Moscow, Beijing…), are joined by a transfer",
      ],
    },
    {
      key: "Times",
      items: [
        `${NET_STATS.timed.toLocaleString("en-US")} lines timed from a published journey time (operators, Yandex Raspisaniya, 12306, NTES, Wikipedia…)`,
        "Other lines run at the median published speed of the same kind of train in the same country (marked ≈ est.)",
        "Ferries: published crossing times where known, else 30 km/h; plus 30 min boarding",
      ],
    },
    {
      key: "Ferries",
      items: [
        <>OpenStreetMap <span className="mono">route=ferry</span> courses ({FERRIES.length.toLocaleString("en-US")} in scope); a pier with no railway is joined to the nearest station within 30 km by a drive</>,
        "Toggle Ferries off for rail only",
      ],
    },
    {
      key: "Base map",
      items: [
        <>Natural Earth (public domain) via <span className="mono">world-atlas</span> <span className="mono">countries-50m</span></>,
        <>Disputed-area outlines from Natural Earth <span className="mono">ne_10m_admin_0_disputed_areas</span></>,
        <>Europe ↔ Asia divide from the published <span className="mono">asia_europe_border</span> geojson</>,
      ],
    },
    {
      key: "Algorithm",
      items: [
        "Reachability: time-weighted Dijkstra over every station-to-station hop (fastest line on each hop)",
        "Route card: the hops grouped into rides — the line covering the longest run of consecutive stops",
        "Disconnected destinations: rail-km Dijkstra plus candidate great-circle bridges between networks (≤ 1,600 km, 3× penalty), each rail section then re-timed",
        "Isochrones: earliest arrival per 0.18° cell, 10 km/h off-rail spread, marching squares + Catmull-Rom",
      ],
    },
    {
      key: "Caveats",
      items: [
        "Changes between trains are not timed; times are in-vehicle estimates, not a timetable",
        "Suspended services are excluded where the catalogue marks them; borders closed to passengers (Korean DMZ, Armenia–Türkiye/Azerbaijan, Israel–Lebanon/Syria) are never crossed by a transfer",
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
      <div className="src-foot"><span>Greater Asia · v0.20 · {new Date().getFullYear()}</span></div>
    </div>
  );
}

// =============================================================
// APP
// =============================================================

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

const DEFAULT_ORIGIN = (() => {
  let best = -1;
  for (let i = 0; i < NS; i++) {
    const s = STATIONS[i];
    if (s.country === "CN" && /^kunming/i.test(s.name) && (best < 0 || s.rank > STATIONS[best].rank)) best = i;
  }
  return best >= 0 ? best : HUB_LIST[0];
})();

function useMedia(query) {
  const [m, setM] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query), f = () => setM(mq.matches);
    f();
    mq.addEventListener ? mq.addEventListener("change", f) : mq.addListener(f);
    return () => { mq.removeEventListener ? mq.removeEventListener("change", f) : mq.removeListener(f); };
  }, [query]);
  return m;
}

// phones + tablets in portrait: map full-screen, a compact top bar, a bottom sheet
const NARROW_QUERY = "(max-width: 1023px)";
const SHEET_TABS = [["reach", "Reachable"], ["route", "Route"], ["network", "Network"], ["about", "About"]];

function App() {
  const narrow = useMedia(NARROW_QUERY);
  const [sheet, setSheet] = useState({ tab: "reach", open: false });
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [hours, setHoursRaw] = useState(24);
  const setHours = useRafThrottledSetter(setHoursRaw);
  const [hsrOnly, setHsrOnly] = useState(false);
  const [ferriesOn, setFerriesOn] = useState(true);
  const [theme, setTheme] = useState("day");
  const [selectedDest, setSelectedDest] = useState(null);
  const [hoverDest, setHoverDest] = useState(null);
  const [contoursOn, setContoursOn] = useState(true);
  const [regionsOn, setRegionsOn] = useState(false);

  // theme class first, so the canvas reads the right CSS colours
  useLayoutEffect(() => { document.body.classList.toggle("theme-night", theme === "night"); }, [theme]);

  const G = useMemo(() => getGraph(hsrOnly, ferriesOn), [hsrOnly, ferriesOn]);
  const sp = useMemo(() => (origin != null ? dijkstra(G, origin, G.eH) : null), [G, origin]);
  const journey = useMemo(
    () => (selectedDest != null ? buildJourney(G, sp, origin, selectedDest) : null),
    [G, sp, origin, selectedDest]
  );

  const onStationClick = useCallback((id, e) => {
    if (e.altKey || e.shiftKey || origin == null) { setOrigin(id); setSelectedDest(null); return; }
    if (id === origin) return;
    if (selectedDest != null) { setOrigin(id); setSelectedDest(null); }
    else setSelectedDest(id);
  }, [origin, selectedDest]);

  // a picked destination opens the Route tab; clearing it goes back to the list
  useEffect(() => {
    if (selectedDest != null) setSheet({ tab: "route", open: true });
    else setSheet(s => (s.tab === "route" ? { ...s, tab: "reach" } : s));
  }, [selectedDest]);

  const mapStage = (
    <div className="map-stage">
      <MapCanvas
        G={G} sp={sp} origin={origin} journey={journey} maxHours={hours} theme={theme}
        contoursOn={contoursOn} regionsOn={regionsOn} hoverDest={hoverDest} selectedDest={selectedDest}
        setHoverDest={setHoverDest} onStationClick={onStationClick} narrow={narrow}
      />
    </div>
  );
  const toggles = { hsrOnly, setHsrOnly, ferriesOn, setFerriesOn, theme, setTheme,
    contoursOn, setContoursOn, regionsOn, setRegionsOn };

  if (narrow) {
    const tabBody = {
      reach: (
        <ReachableList
          origin={origin} hours={hours} sp={sp}
          selectedDest={selectedDest} setSelectedDest={setSelectedDest}
          theme={theme} setHoverDest={setHoverDest} hoverDest={null}
        />
      ),
      route: selectedDest != null
        ? <RouteCard origin={origin} selectedDest={selectedDest} journey={journey} />
        : <div className="m-empty">Tap a station on the map — or a row under Reachable — to draw the route there.</div>,
      network: (
        <div className="m-network">
          <NetworkToggles {...toggles} />
          <LegendDashes />
          <div className="hint">Tap a station to make it the destination · tap a third to make it the new origin. Pinch to zoom.</div>
        </div>
      ),
      about: (
        <div className="m-about">
          <div className="mh-sub">How far you can travel by rail from any station across <em>Asia</em></div>
          <Sources />
        </div>
      ),
    };
    return (
      <div className="app mobile">
        {mapStage}
        <div className="m-top">
          <div className="m-brand">
            <span className="m-title">Greater Asia</span>
            <span className="m-eyebrow">Rail reachability</span>
          </div>
          <StationSelect value={origin} onChange={(id) => { setOrigin(id); setSelectedDest(null); }} />
          <div className="m-budget">
            <span className="m-budget-label">Within</span>
            <div className="m-slider">
              <BudgetSlider hours={hours} setHours={setHours} maxHoursBound={MAX_HOURS_BOUND} theme={theme} />
            </div>
            <span className="m-budget-value">{fmtH(hours)}</span>
          </div>
        </div>
        <div className={`m-sheet ${sheet.open ? "open" : ""}`}>
          <div className="m-tabs" role="tablist">
            {SHEET_TABS.map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={sheet.open && sheet.tab === id}
                      className={`m-tab ${sheet.open && sheet.tab === id ? "on" : ""}`}
                      onClick={() => setSheet(s => ({ tab: id, open: !(s.open && s.tab === id) }))}>
                {label}{id === "route" && selectedDest != null ? " •" : ""}
              </button>
            ))}
            <button type="button" className="m-handle" aria-label={sheet.open ? "Collapse panel" : "Expand panel"}
                    onClick={() => setSheet(s => ({ ...s, open: !s.open }))}>{sheet.open ? "▾" : "▴"}</button>
          </div>
          {sheet.open && <div className={`m-body m-body-${sheet.tab}`}>{tabBody[sheet.tab]}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {mapStage}
      <div className="corner-ornaments" aria-hidden="true">
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
          ferriesOn={ferriesOn} setFerriesOn={setFerriesOn}
          theme={theme} setTheme={setTheme}
          setSelectedDest={setSelectedDest}
          contoursOn={contoursOn} setContoursOn={setContoursOn}
          regionsOn={regionsOn} setRegionsOn={setRegionsOn}
        />
        <Sources />
      </div>

      <div className="right-stack">
        <ReachableList
          origin={origin} hours={hours} sp={sp}
          selectedDest={selectedDest} setSelectedDest={setSelectedDest}
          theme={theme} setHoverDest={setHoverDest} hoverDest={hoverDest}
        />
        {selectedDest != null && <RouteCard origin={origin} selectedDest={selectedDest} journey={journey} />}
      </div>

      <HoverCard hoverDest={hoverDest} origin={origin} G={G} sp={sp} hours={hours} theme={theme} hsrOnly={hsrOnly} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
