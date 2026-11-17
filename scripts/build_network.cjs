#!/usr/bin/env node
// =============================================================
// build_network.cjs — rebuild data_net.js from the Transits of the World
// ("metroman") intercity + ferry catalogue.
//
//   node scripts/build_network.cjs ["path/to/metroman 31oct"]
//
// Reads (from the metroman project, never written to):
//   assets/route_graph.js         every line's stations in order + km, the
//                                 transfers, ferries, ferry courses, drives
//   assets/cities.js (ILINES)     line metadata: name, kind, operator
//   assets/intercity_overview.js  each line's OpenStreetMap track (thinned)
//   assets/hidden_lines.js        freight / closed lines (left out)
//   assets/ferry_lines.js         ferry durations + headways
//   maps/intercity/schedule/*.js  published journey times + frequencies
//   assets/line_names.js (+ latin_names, station_names_en, title_en, …)
//                                 metroman's own English naming rules
//
// Writes data_net.js:  window.NET = { s, l, e, f, d, x, meta }
// =============================================================
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.resolve(process.argv[2] || process.env.METROMAN || path.join(ROOT, "..", "metroman 31oct"));
const A = (...p) => path.join(SRC, ...p);
if (!fs.existsSync(A("assets", "route_graph.js"))) {
  console.error("metroman catalogue not found at " + SRC);
  process.exit(1);
}

// Scope: the countries the map treats as Asia (ISO 3166-1 alpha-2). Russia
// is whole (the app has always covered European Russia + Kaliningrad).
const ASIA = new Set(("AF AM AZ BH BD BT BN KH CN CY GE HK IN ID IR IQ IL JP JO KZ KW KG LA LB MO MY MV " +
  "MN MM NP KP OM PK PS PH QA RU SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE").split(" "));
// The map's frame: a station outside it is out of scope whatever its country
// (Chukotka's piers across the date line would stretch the map round the globe).
const BOX = { w: 17.5, e: 150.5, s: -12, n: 72 };
const inBox = (p) => { const x = S[p][2] / 1e4, y = S[p][3] / 1e4; return x >= BOX.w && x <= BOX.e && y >= BOX.s && y <= BOX.n; };
const scoped = (p) => ASIA.has(S[p][4]) && inBox(p);
// A line may leave the scope in its middle (Moscow – Kaliningrad crosses
// Belarus and Lithuania); only its ends outside the scope are cut off.

// ---------- loaders ----------
const readJs = (f) => fs.readFileSync(f, "utf8");
const jsonAfter = (txt, marker) => {
  const i = txt.indexOf(marker);
  if (i < 0) throw new Error("marker not found: " + marker);
  let s = txt.slice(i + marker.length).trim();
  if (s.endsWith(";")) s = s.slice(0, -1);
  return JSON.parse(s);
};
const winCtx = { console };
winCtx.window = winCtx;
vm.createContext(winCtx);
for (const f of ["latin_names.js", "station_names_en.js", "title_en.js", "native_titles.js", "title_from_stops.js", "line_names.js"]) {
  const p = A("assets", f);
  if (fs.existsSync(p)) vm.runInContext(readJs(p), winCtx, { filename: f });
}
const W = winCtx;

console.time("load");
const RG = jsonAfter(readJs(A("assets", "route_graph.js")), "window.ROUTE_GRAPH=");
const citiesTxt = readJs(A("assets", "cities.js"));
const ILINES = JSON.parse(citiesTxt.match(/const ILINES = (\[.*?\]);\s*\n/s)[1]);
const META = Object.fromEntries(ILINES.map((c) => [c.slug, c]));
const HIDDEN = jsonAfter(readJs(A("assets", "hidden_lines.js")), "window.HIDDEN_LINES=");
const FL = jsonAfter(readJs(A("assets", "ferry_lines.js")), "window.FERRY_LINES=");
const FL_BY_FI = new Map(FL.map((f) => [f.fi, f]));
console.timeEnd("load");

const S = RG.s; // [name, native, lon*1e4, lat*1e4, cc]
const lonOf = (i) => S[i][2] / 1e4, latOf = (i) => S[i][3] / 1e4;
function km(a, b) { // equirectangular, fine at station spacing
  const la = ((a[1] + b[1]) / 2) * Math.PI / 180;
  const dx = (((a[0] - b[0] + 540) % 360) - 180) * 111.32 * Math.cos(la);
  return Math.hypot(dx, (a[1] - b[1]) * 110.57);
}
const P = (i) => [lonOf(i), latOf(i)];

// ---------- names ----------
const NONLATIN = /[^\u0000-ʯḀ-ỿ -⁯←-⇿«»„“”‘’]/;
const NATIVE_FIRST = new Set("IL PK IR IQ SA SY AF JO LB BD MM TH LK NP".split(" "));
function stationName(i) {
  const [n, nat, , , cc] = S[i];
  const en = (t) => {
    if (!t) return "";
    let r = W.latinName ? W.latinName(t) : t;
    if (W.ruCountry && W.ruCountry(cc) && W.ruEnglish) r = W.ruEnglish(r);
    if (W.localEnglish) r = W.localEnglish(r, [cc]);
    return r;
  };
  const good = (t) => t && !NONLATIN.test(t) && !t.includes("`");
  let name = en(n);
  if (!good(name) && nat) { const r = en(nat); if (good(r)) name = r; }
  if (!good(name) && good(n)) name = n;
  let native = nat || (NONLATIN.test(n) ? n : "");
  // A machine transliteration that drops vowels or case ("tl Abyb hAvnybrsyTh",
  // "njr rylwy sttyshn"): in abjad / Brahmic-script countries the native name
  // is shown instead; elsewhere ("gongdeog") it is only title-cased.
  const garbled = name && (/\p{Ll}\p{Lu}/u.test(name) || name.includes("`") ||
    (!/\p{Lu}/u.test(name) && !/^\d/.test(name)));
  if (garbled) {
    if (NATIVE_FIRST.has(cc) && native && NONLATIN.test(native)) { name = native; native = ""; }
    else name = name.replace(/`/g, "").replace(/(^|[\s\-(])(\p{Ll})/gu, (m, a, b) => a + b.toUpperCase());
  }
  name = name.replace(/\s*\((?:railway station|station)\)\s*$/i, "")
    .replace(/\s+(?:railway station|rail station|rylwy sttyshn|sttyshn)$/i, "").trim();
  if (native === name) native = "";
  return [name || native || "Unnamed stop", name ? native : ""];
}

// ---------- schedules → per-line speed + frequency ----------
function readSchedule(slug) {
  const p = A("maps", "intercity", "schedule", slug + ".js");
  if (!fs.existsSync(p)) return null;
  try { return jsonAfter(readJs(p), "window.__SCHEDULE="); } catch { return null; }
}
function shortFreq(t) {
  if (!t) return "";
  // English only: a source quote in another script ("…动车组26对") is dropped
  let s = String(t).replace(/[^\u0000-ʯḀ-ỿ -⁯]+/g, " ").replace(/\s+/g, " ");
  s = s.split(/\s+[—–]\s+|;\s|\s\(/)[0].trim().replace(/[\s,:·-]+$/, "");
  if (!/[a-z]{3}/i.test(s) || /listed calling/i.test(s)) return "";
  s = s.replace(/\b1 trains\b/g, "1 train").replace(/^(\w)/, (m) => m.toUpperCase());
  s = s.replace(/\s*,?\s*\d+ train numbers?.*$/i, "");
  if (s.length > 48) s = s.slice(0, 46).replace(/\s+\S*$/, "") + "…";
  return s;
}

// ---------- lines in scope ----------
const KIND_CODE = { hsr: "h", intercity: "i", night: "n", commuter: "c", branch: "b" };
const lines = []; // {slug, kind, stops:[place], km:[km]}
for (const [slug, seq] of Object.entries(RG.l)) {
  if (HIDDEN[slug]) continue;
  const m = META[slug];
  if (!m) continue;
  let st = [], kk = [];
  for (let i = 0; i < seq.length; i += 2) { st.push(seq[i]); kk.push(seq[i + 1] / 10); }
  let a = 0, b = st.length - 1;
  while (a <= b && !scoped(st[a])) a++;
  while (b >= a && !scoped(st[b])) b--;
  if (b - a < 1) continue;
  st = st.slice(a, b + 1); kk = kk.slice(a, b + 1);
  lines.push({ slug, kind: m.kind || "intercity", m, stops: st, km: kk });
}
console.log("lines in scope:", lines.length);

// speed: published journey time ÷ its km; else the median published speed
// of the same kind in the same country; else of the kind; else a default.
const DEFAULT_KMH = { hsr: 180, intercity: 60, night: 55, commuter: 40, branch: 35 };
const samples = {};
for (const L of lines) {
  const sc = readSchedule(L.slug);
  L.sched = sc;
  const jt = sc && sc.journey_time;
  const len = L.km[L.km.length - 1] - L.km[0];
  if (jt && jt.minutes > 0) {
    const dist = jt.km && jt.km > 5 ? jt.km : len;
    const v = dist / (jt.minutes / 60);
    if (v >= 12 && v <= 340 && dist > 3) {
      L.kmh = v;
      const cc = S[L.stops[0]][4];
      (samples[L.kind + "|" + cc] = samples[L.kind + "|" + cc] || []).push(v);
      (samples[L.kind] = samples[L.kind] || []).push(v);
    }
  }
  const fq = sc && sc.frequency;
  L.freq = fq ? shortFreq(fq.text) : "";
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
let fromSched = 0;
for (const L of lines) {
  if (L.kmh) { fromSched++; continue; }
  const cc = S[L.stops[0]][4];
  const a = samples[L.kind + "|" + cc], b = samples[L.kind];
  L.kmh = a && a.length >= 5 ? median(a) : b && b.length >= 5 ? median(b) : DEFAULT_KMH[L.kind] || 60;
  L.est = 1;
}
console.log("lines timed from a published schedule:", fromSched);

// ---------- station set ----------
const used = new Map(); // place -> new index
const order = [];
const use = (p) => { if (!used.has(p)) { used.set(p, order.length); order.push(p); } return used.get(p); };
for (const L of lines) for (const p of L.stops) use(p);

// ---------- ferries / drives / transfers ----------
const inScope = scoped;
const ferries = [];
(RG.f || []).forEach(([a, b, d10, n], fi) => {
  if (!inScope(a) || !inScope(b)) return;
  const fl = FL_BY_FI.get(n);
  const kmv = d10 / 10;
  if (kmv < 0.3) return;
  const dur = fl && fl.dur ? fl.dur : Math.round((kmv / 30) * 60); // metroman: a typical 30 km/h
  ferries.push({ a, b, km: kmv, dur, est: fl && fl.dur ? 0 : 1, int: fl && fl.int || 0,
    name: (fl && (fl.nn || fl.n)) || (RG.fn || [])[n] || "Ferry", g: (RG.fg || [])[fi] || [] });
});
for (const F of ferries) { use(F.a); use(F.b); }
const drives = (RG.d || []).filter(([a, b]) => used.has(a) && used.has(b));
const xfers = (RG.x || []).filter(([a, b]) => used.has(a) && used.has(b));
console.log("ferries:", ferries.length, "drives:", drives.length, "transfers:", xfers.length);

// ---------- names, ranks ----------
const N = order.length;
const names = new Array(N), natives = new Array(N);
for (let i = 0; i < N; i++) { const [n, nat] = stationName(order[i]); names[i] = n; natives[i] = nat; }
const lineCount = new Int32Array(N);
for (const L of lines) for (const p of new Set(L.stops)) lineCount[used.get(p)]++;
const termini = new Uint8Array(N);
for (const L of lines) { termini[used.get(L.stops[0])] = 1; termini[used.get(L.stops[L.stops.length - 1])] = 1; }
const hsrServed = new Uint8Array(N);
for (const L of lines) if (L.kind === "hsr") for (const p of L.stops) hsrServed[used.get(p)] = 1;

// city transfers: stations of one city that no line joins (Moscow's
// terminals, Beijing West / South) — same leading word within 25 km
const STOP = new Set(("novyi novaya novy novo staryi stary bolshoi bolshaya malyi malaya nizhnii verkhnii ust park road " +
  "junction city new old north south east west central halt bazar nagar shin higashi nishi kita minami kami shimo naka " +
  "sri new port").split(" "));
const firstWord = (t) => {
  const w = (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[\s\-–(,/]+/)[0];
  return w.length >= 4 && !STOP.has(w) ? w : "";
};
const cjkBase = (t) => {
  if (!/^[㐀-鿿]{2,}/.test(t || "")) return "";
  const b = t.replace(/站$/, "").replace(/[东西南北]$/, "");
  return b.length >= 2 ? b : "";
};
const cityX = new Map();
{
  const grid = new Map();
  const CELL = 0.15;
  for (let i = 0; i < N; i++) {
    if (lineCount[i] < 2) continue;
    const p = order[i], k = Math.floor(lonOf(p) / CELL) + "," + Math.floor(latOf(p) / CELL);
    (grid.get(k) || grid.set(k, []).get(k)).push(i);
  }
  const fw = names.map(firstWord), cj = order.map((p, i) => cjkBase(natives[i] || S[p][1] || S[p][0]));
  for (let i = 0; i < N; i++) {
    if (lineCount[i] < 2 || (!fw[i] && !cj[i])) continue;
    const p = order[i], gx = Math.floor(lonOf(p) / CELL), gy = Math.floor(latOf(p) / CELL);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      for (const j of grid.get(gx + dx + "," + (gy + dy)) || []) {
        if (j <= i) continue;
        const sameName = (fw[i] && fw[i] === fw[j]) || (cj[i] && cj[i] === cj[j]);
        if (!sameName || S[p][4] !== S[order[j]][4]) continue;
        const d = km(P(p), P(order[j]));
        if (d > 0.8 && d <= 15) cityX.set(i + "," + j, d);
      }
    }
  }
}
console.log("city transfers:", cityX.size);

// ---------- Douglas–Peucker ----------
function simplify(pts, tol) {
  if (pts.length <= 2) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [i0, i1] = st.pop();
    const [x0, y0] = pts[i0], [x1, y1] = pts[i1];
    const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1e-12;
    let md = 0, mi = -1;
    for (let i = i0 + 1; i < i1; i++) {
      const t = Math.max(0, Math.min(1, ((pts[i][0] - x0) * dx + (pts[i][1] - y0) * dy) / L2));
      const ex = x0 + t * dx - pts[i][0], ey = y0 + t * dy - pts[i][1];
      const d = ex * ex + ey * ey;
      if (d > md) { md = d; mi = i; }
    }
    if (mi >= 0 && md > tol * tol) { keep[mi] = 1; st.push([i0, mi], [mi, i1]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// delta-encoded integer coordinates (1e-3°, ~100 m): [x0,y0,dx,dy,...]
const Q = 1000;
const enc = (pts) => {
  const out = []; let px = 0, py = 0;
  for (const [x, y] of pts) {
    const X = Math.round(x * Q), Y = Math.round(y * Q);
    if (out.length && X === px && Y === py) continue;
    out.push(X - px, Y - py); px = X; py = Y;
  }
  return out;
};

// ---------- track geometry per station-to-station edge ----------
// Each line's full OpenStreetMap track (maps/intercity/geo/<slug>.geo.js) is
// stitched into chains, and cut at its stops: a stop takes the nearest track
// vertex, and the track between two consecutive stops becomes that edge's
// course. A stop far from the track, stops on different chains, or a course
// much longer than the line's own km fall back to a straight hop (which, at
// station spacing of a few km, is the track to within a pixel anyway).
const SNAP_KM = 2.5, TOL = 0.004;
const edgeGeo = new Map(); // "a,b" (a<b) -> [[lon,lat],...] interior, oriented a→b
const edgeKey = (a, b) => (a < b ? a + "," + b : b + "," + a);
function loadTrack(slug) {
  const f = A("maps", "intercity", "geo", slug + ".geo.js");
  if (!fs.existsSync(f)) return [];
  let g;
  try { g = jsonAfter(readJs(f), "window.__GEO="); } catch { return []; }
  const parts = [];
  for (const ft of g.features || []) {
    const gm = ft.geometry || {};
    if (gm.type === "LineString") parts.push(gm.coordinates);
    else if (gm.type === "MultiLineString") parts.push(...gm.coordinates);
  }
  return stitch(parts.filter((q) => q && q.length >= 2));
}
// join ways end to end wherever exactly two meet (a junction stays a break)
function stitch(parts) {
  const k = (p) => Math.round(p[0] * 2e4) + "," + Math.round(p[1] * 2e4);
  const ends = new Map();
  parts.forEach((q, i) => {
    for (const [e, p] of [[0, q[0]], [1, q[q.length - 1]]]) {
      const kk = k(p); (ends.get(kk) || ends.set(kk, []).get(kk)).push([i, e]);
    }
  });
  const usedP = new Uint8Array(parts.length), chains = [];
  const extend = (chain, tailKey) => {
    for (;;) {
      const c = (ends.get(tailKey) || []).filter(([i]) => !usedP[i]);
      if (c.length !== 1 || (ends.get(tailKey) || []).length > 2) return;
      const [i, e] = c[0]; usedP[i] = 1;
      const q = e === 0 ? parts[i] : parts[i].slice().reverse();
      for (let j = 1; j < q.length; j++) chain.push(q[j]);
      tailKey = k(q[q.length - 1]);
    }
  };
  const order_ = parts.map((_, i) => i).sort((a, b) => {
    const da = (ends.get(k(parts[a][0])) || []).length, db = (ends.get(k(parts[b][0])) || []).length;
    return da - db; // start from loose ends
  });
  for (const i of order_) {
    if (usedP[i]) continue;
    usedP[i] = 1;
    const chain = parts[i].slice();
    extend(chain, k(chain[chain.length - 1]));
    chain.reverse();
    extend(chain, k(chain[chain.length - 1]));
    chains.push(chain);
  }
  return chains;
}
let geoHit = 0, geoMiss = 0;
const tries = new Map(); // edge -> lines that failed to give it a course
console.time("track");
const byKindFirst = [...lines].sort((a, b) => (a.kind === "hsr" ? 0 : 1) - (b.kind === "hsr" ? 0 : 1));
for (const L of byKindFirst) {
  // only read the track when this line brings an edge not yet drawn
  const todo = [];
  for (let i = 0; i + 1 < L.stops.length; i++) {
    const a = used.get(L.stops[i]), b = used.get(L.stops[i + 1]);
    if (a === b) continue;
    const kk = edgeKey(a, b);
    if (edgeGeo.has(kk)) continue;
    // a hop of a few km is drawn straight: no track needed
    if (km(P(L.stops[i]), P(L.stops[i + 1])) < 3) { edgeGeo.set(kk, []); continue; }
    if ((tries.get(kk) || 0) < 3) todo.push(i);
  }
  if (!todo.length) continue;
  const chains = loadTrack(L.slug);
  // vertex grid for snapping
  const CELL = 0.03, grid = new Map();
  chains.forEach((q, ci) => q.forEach((v, vi) => {
    const kk = Math.floor(v[0] / CELL) + "," + Math.floor(v[1] / CELL);
    (grid.get(kk) || grid.set(kk, []).get(kk)).push(ci, vi);
  }));
  const snapCache = new Map();
  const snap = (si) => {
    if (snapCache.has(si)) return snapCache.get(si);
    const pt = P(L.stops[si]);
    const gx = Math.floor(pt[0] / CELL), gy = Math.floor(pt[1] / CELL);
    let best = null, bd = SNAP_KM;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const c = grid.get(gx + dx + "," + (gy + dy)); if (!c) continue;
      for (let j = 0; j < c.length; j += 2) {
        const d = km(pt, chains[c[j]][c[j + 1]]);
        if (d < bd) { bd = d; best = [c[j], c[j + 1]]; }
      }
    }
    snapCache.set(si, best);
    return best;
  };
  for (const i of todo) {
    const a = used.get(L.stops[i]), b = used.get(L.stops[i + 1]);
    const key = edgeKey(a, b);
    if (edgeGeo.has(key)) continue;
    const sa = snap(i), sb = snap(i + 1);
    let inner = [];
    if (sa && sb && sa[0] === sb[0] && Math.abs(sa[1] - sb[1]) >= 2) {
      const q = chains[sa[0]];
      const lo = Math.min(sa[1], sb[1]), hi = Math.max(sa[1], sb[1]);
      inner = q.slice(lo + 1, hi);
      if (sa[1] > sb[1]) inner.reverse();
      const want = Math.abs(L.km[i + 1] - L.km[i]);
      let len = 0, prev = P(L.stops[i]);
      for (const v of inner) { len += km(prev, v); prev = v; }
      len += km(prev, P(L.stops[i + 1]));
      if (want > 0 && len > want * 1.5 + 2) inner = [];
      if (inner.length) {
        const full = simplify([P(L.stops[i]), ...inner, P(L.stops[i + 1])], TOL);
        inner = full.slice(1, -1);
      }
    }
    if (!inner.length) { tries.set(key, (tries.get(key) || 0) + 1); continue; }
    geoHit++;
    if (a > b) inner = inner.slice().reverse(); // stored in key order
    edgeGeo.set(key, inner);
  }
}
for (const k of tries.keys()) if (!edgeGeo.has(k)) geoMiss++;
console.timeEnd("track");
console.log("edges with a track course:", geoHit, "straight (dense stops / no track):", geoMiss);

// ---------- output ----------
const ccList = [...new Set(order.map((p) => S[p][4]))].sort();
const ccIdx = Object.fromEntries(ccList.map((c, i) => [c, i]));
const ops = [];
const opIdx = new Map();
const opOf = (o) => {
  if (!o) return -1;
  let r = W.opName ? W.opName(o) : o;
  if (W.enText) r = W.enText(r);
  if (W.latinName && NONLATIN.test(r)) r = W.latinName(r);
  if (!opIdx.has(r)) { opIdx.set(r, ops.length); ops.push(r); }
  return opIdx.get(r);
};
const lineTitle = (L) => {
  try {
    const lab = W.lineLabel ? W.lineLabel(L.m) : null;
    if (lab) {
      let t = lab.title || L.m.name;
      if (lab.brand && !t.includes(lab.brand)) t = lab.brand + " · " + t;
      if (lab.ref && !t.includes(lab.ref)) t = lab.ref + " " + t;
      return [t, lab.native || ""];
    }
  } catch (e) { /* fall through */ }
  return [L.m.name, L.m.native || ""];
};

// Which metroman snapshot this was built from: the folder, and each input's
// date + content fingerprint (sha256, first 16 hex), so a later rebuild can
// be told apart from this one.
const crypto = require("crypto");
const SNAP_FILES = ["assets/route_graph.js", "assets/cities.js", "assets/hidden_lines.js", "assets/ferry_lines.js", "assets/line_names.js"];
const snapshot = {
  folder: path.basename(SRC),
  files: Object.fromEntries(SNAP_FILES.filter((f) => fs.existsSync(A(f))).map((f) => {
    const buf = fs.readFileSync(A(f));
    return [f, {
      modified: fs.statSync(A(f)).mtime.toISOString().slice(0, 10),
      sha256: crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16),
    }];
  })),
};
const latest = Object.values(snapshot.files).map((x) => x.modified).sort().pop();
snapshot.catalogue_date = latest;

const out = {
  meta: {
    built: new Date().toISOString().slice(0, 10),
    snapshot,
    source: "Transits of the World intercity + ferry catalogue (OpenStreetMap route relations, published timetables)",
    cc: ccList, ops,
  },
  // stations: column arrays
  s: {
    n: names,
    nn: natives,
    x: order.map((p) => S[p][2]), // lon * 1e4
    y: order.map((p) => S[p][3]), // lat * 1e4
    c: order.map((p) => ccIdx[S[p][4]]),
    r: Array.from(lineCount), // lines serving the station
    t: Array.from(termini),
    h: Array.from(hsrServed),
  },
  // lines: [title, native, kind, op, freq, km/h(x10), est, [stops], [km x10]]
  l: lines.map((L) => {
    const [t, nat] = lineTitle(L);
    return [t, nat === t ? "" : nat, KIND_CODE[L.kind] || "i", opOf(L.m.operator), L.freq, Math.round(L.kmh * 10), L.est ? 1 : 0,
      L.stops.map((p) => used.get(p)), L.km.map((k) => Math.round((k - L.km[0]) * 10))];
  }),
  // edge courses: [a, b, enc(interior)] for edges whose track is known
  e: [...edgeGeo.entries()].filter(([, g]) => g.length).map(([k, g]) => {
    const [a, b] = k.split(",").map(Number);
    return [a, b, enc(g)];
  }),
  // ferries: [a, b, km x10, minutes, est, headway min, name, enc(course)]
  f: ferries.map((F) => [used.get(F.a), used.get(F.b), Math.round(F.km * 10), F.dur, F.est, F.int, F.name,
    enc(simplify(F.g.map(([x, y]) => [x / 1e4, y / 1e4]), 0.01))]),
  // drives pier ↔ station, km x10
  d: drives.map(([a, b, d]) => [used.get(a), used.get(b), d]),
  // walks / local links between stations, km x10 (k: 1 = same-city transfer)
  x: xfers.map(([a, b, d]) => [used.get(a), used.get(b), d, 0])
    .concat([...cityX.entries()].map(([k, d]) => { const [a, b] = k.split(",").map(Number); return [a, b, Math.round(d * 10), 1]; })),
};

const body = "// GENERATED by scripts/build_network.cjs from the Transits of the World catalogue — do not edit.\n" +
  `// Snapshot: "${snapshot.folder}" (catalogue files up to ${latest}), built ${out.meta.built}.\n` +
  "// Standalone: the site needs nothing from metroman at runtime; meta.snapshot holds the input fingerprints.\n" +
  "window.NET=" + JSON.stringify(out) + ";\n";
fs.writeFileSync(path.join(ROOT, "data_net.js"), body);
console.log(`stations ${N}, lines ${out.l.length}, edge courses ${out.e.length}, ferries ${out.f.length}, file ${(body.length / 1048576).toFixed(2)} MB`);
