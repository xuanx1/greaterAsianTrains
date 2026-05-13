"""Rebuild K-NN connectivity as CHAINS, not stars.

Old rule: each station gets nearest hub + K=2 (later densified to K=5)
nearest pool members. That gave Moscow 49 edges and turned Saratov,
Petrozavodsk, etc. into starbursts — every spur in a 250 km radius
picked them as the nearest hub, plus the K=5 pool fill bolted on more
neighbours from every direction. Real rail networks are chains, not
stars.

New rule (per OSM/gpkg-imported station, same-country only):
  1. ONE edge to nearest other same-country station within MAX_KM.
     Reciprocal symmetry means a station's neighbours' picks may also
     connect back, so junctions still get 3+ edges organically.
  2. ONE edge to nearest curated hub of same country, BUT only if the
     hub edge is < 6× the K=1 edge — otherwise the hub is too far to
     model as a single-leg express. Keeps Vladivostok-region spurs
     from all radiating 700 km to Khabarovsk.

All existing automated-ingest edges are wiped first. Curated and
hand-edited edges (anything not in AUTO_LINE_LABELS) are kept.
"""
import re, sys, io, math
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

AUTO_LINE_LABELS = {
    "Overpass live ingest",
    "RZD trunk (Overpass live)",
    "HOTOSM OSM ingest",
    "K-NN bridge",
    "K=1 chain",
    "OSM connector (fallback)",
    "OSM connector (extended)",
    "OSM rail corridor",
    "OSM last-resort",
    "RZD trunk (Trolleway gpkg, K-NN)",
    "RZD trunk (Trolleway dataset)",
}

stations = {}
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*id:\s*"([a-zA-Z0-9_]+)",[^}]*?country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        stations[m.group(1)] = {"country": m.group(2), "lat": float(m.group(3)), "lng": float(m.group(4))}

ROUTE_RE = re.compile(r'^\s*\{\s*from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)",[^}]*?line:\s*"([^"]*)"[^}]*\},\s*$')

# Step 1: strip automated edges from data_extra.js + data_ru.js
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    lines = open(path, encoding='utf-8').read().splitlines(keepends=True)
    out = []
    dropped = 0
    for line in lines:
        m = ROUTE_RE.match(line)
        if m and m.group(3) in AUTO_LINE_LABELS:
            dropped += 1; continue
        out.append(line)
    open(path, 'w', encoding='utf-8').write("".join(out))
    print(f"{path.split(chr(92))[-1]}: dropped {dropped} auto edges")

# Step 2: build set of kept edges and curated hubs
edges_seen = set()
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)"', s):
        edges_seen.add(tuple(sorted([m.group(1), m.group(2)])))
print(f"surviving curated edges: {len(edges_seen)}")

# Curated stations = those without an 'osm_' or 'ru_' prefix
curated_ids = {sid for sid in stations if not (sid.startswith("osm_") or re.fullmatch(r"ru_\d+", sid))}
curated_by_cc = {}
for sid in curated_ids:
    cc = stations[sid]["country"]
    curated_by_cc.setdefault(cc, []).append(sid)

# Step 3: rebuild K-NN with new rule
def hv(a, b, c, d):
    R = 6371.0
    p1, p2 = math.radians(a), math.radians(c)
    dp = math.radians(c - a); dl = math.radians(d - b)
    h = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(h))

# Per-country MAX_KM = furthest a single chain step is allowed to span.
# Tuned so genuine railway gaps span (Siberia 300 km gaps) but ocean
# spurs don't pick island stations as 'nearest'. RU is large so 400 km;
# Mongolia 300; central Asia 250.
def max_km_for(cc):
    return {"JP": 25, "KR": 30, "CN": 60, "TW": 30, "IN": 80, "TH": 60, "VN": 60,
            "ID": 80, "PK": 80, "IR": 100, "TR": 80, "KZ": 250, "MN": 300,
            "RU": 400, "BD": 50, "LK": 50, "MY": 80, "MM": 80, "SA": 250,
            "IL": 50, "KH": 80, "NP": 80, "GE": 50, "AM": 50, "AZ": 80,
            "UZ": 150, "TM": 250, "KP": 60}.get(cc, 150)

# Anchor cap — orphan chain → nearest hub edge only added if the hub is
# within this many km. Beyond that the component stays disconnected
# (the app already handles "disconnected" stations via the bridge card).
ANCHOR_MAX_KM = 500.0

# Stations to wire: OSM/gpkg imports (non-curated)
imports_by_cc = {}
for sid, s in stations.items():
    if sid in curated_ids: continue
    imports_by_cc.setdefault(s["country"], []).append(sid)

new_edges_ru = []
new_edges_extra = []

# Build adjacency including the SURVIVING curated edges so we can do
# component analysis after laying down K=1 chains.
adj = {sid: set() for sid in stations}
for a, b in edges_seen:
    if a in adj and b in adj:
        adj[a].add(b); adj[b].add(a)

def add_edge(a, b, km, cc):
    key = tuple(sorted([a, b]))
    if key in edges_seen: return
    edges_seen.add(key)
    adj[a].add(b); adj[b].add(a)
    target = new_edges_ru if cc == "RU" else new_edges_extra
    target.append({"from": key[0], "to": key[1], "h": round(km/70.0, 2)})

# Bearing between two lat/lng points (degrees, 0=N, 90=E).
def bearing(lat1, lng1, lat2, lng2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lng2 - lng1)
    y = math.sin(dl) * math.cos(p2)
    x = math.cos(p1)*math.sin(p2) - math.sin(p1)*math.cos(p2)*math.cos(dl)
    return (math.degrees(math.atan2(y, x)) + 360) % 360

def angle_diff(a, b):
    d = abs(a - b) % 360
    return min(d, 360 - d)

for cc, sids in imports_by_cc.items():
    same_cc_all = [(sid, stations[sid]["lat"], stations[sid]["lng"])
                   for sid in stations if stations[sid]["country"] == cc]
    MAX_KM = max_km_for(cc)
    # === Pass 1: predecessor + successor — pick the nearest neighbour,
    # then the nearest neighbour at least 90° apart in bearing (so the
    # chain extends both ways instead of clustering on one side). ===
    for sid in sids:
        s = stations[sid]
        # All candidates within MAX_KM, sorted by distance.
        cand = []
        for oid, lat, lng in same_cc_all:
            if oid == sid: continue
            d = hv(s["lat"], s["lng"], lat, lng)
            if d > MAX_KM: continue
            cand.append((d, oid, lat, lng))
        cand.sort()
        if not cand: continue
        # N1: nearest
        d1, n1, n1_lat, n1_lng = cand[0]
        add_edge(sid, n1, d1, cc)
        b1 = bearing(s["lat"], s["lng"], n1_lat, n1_lng)
        # N2: closest with bearing ≥ 90° from N1
        for d, oid, lat, lng in cand[1:]:
            b = bearing(s["lat"], s["lng"], lat, lng)
            if angle_diff(b, b1) >= 90:
                add_edge(sid, oid, d, cc)
                break

# === Pass 2: per-country component analysis. ===
# Find connected components inside each country's subgraph. Components
# that already include a curated hub need no anchor. Components with no
# hub get ONE hub edge from whichever component-member is closest to a
# hub. This caps hub fan-out at "number of disjoint orphan chains in
# this country", typically a handful — instead of "every spur".
def components_for_country(cc):
    pop = {sid for sid, s in stations.items() if s["country"] == cc}
    seen = set()
    comps = []
    for sid in pop:
        if sid in seen: continue
        stack = [sid]; comp = set()
        while stack:
            u = stack.pop()
            if u in comp: continue
            comp.add(u); seen.add(u)
            for v in adj.get(u, ()):
                if v in pop and v not in comp:
                    stack.append(v)
        comps.append(comp)
    return comps

anchored_total = 0
for cc in imports_by_cc:
    hubs = [(sid, stations[sid]["lat"], stations[sid]["lng"]) for sid in curated_by_cc.get(cc, [])]
    if not hubs: continue
    hub_ids = {h[0] for h in hubs}
    for comp in components_for_country(cc):
        if comp & hub_ids: continue  # already anchored via existing edges
        # Pick the comp member with shortest distance to any hub
        best_pair = None; best_d = float('inf')
        for sid in comp:
            s = stations[sid]
            nh = min(hubs, key=lambda h: hv(s["lat"], s["lng"], h[1], h[2]))
            d = hv(s["lat"], s["lng"], nh[1], nh[2])
            if d < best_d:
                best_d = d; best_pair = (sid, nh[0])
        if best_pair and best_d <= ANCHOR_MAX_KM:
            add_edge(best_pair[0], best_pair[1], best_d, cc)
            anchored_total += 1
print(f"orphan chains anchored to hubs: {anchored_total}")

print(f"new chain edges — RU: {len(new_edges_ru)}, others: {len(new_edges_extra)}")

# Step 4: append edges to the two files (in-place before window.EXTRA_ROUTES_*'s closing ])
def quote(x): return '"' + (x or "").replace('\\','\\\\').replace('"','\\"') + '"'

def inject_routes(path, varname, edges, label):
    s = open(path, encoding='utf-8').read()
    block = [f"  // {label} — May 2026 K-NN rebuild (K=1 chain + nearest hub if ≤6× chain leg)"]
    for r in edges:
        block.append(f'  {{ from: {quote(r["from"])}, to: {quote(r["to"])}, h: {r["h"]}, type: "conv", line: "K=1 chain", op: "OSM/gpkg" }},')
    m = re.search(rf'(window\.{varname}\s*=\s*\[[\s\S]*?)(\n\];)', s)
    if not m: raise SystemExit(f"{varname} not found in {path}")
    s = s[:m.end(1)] + "\n" + "\n".join(block) + m.group(2) + s[m.end():]
    open(path, 'w', encoding='utf-8').write(s)

inject_routes(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js',
              'EXTRA_ROUTES_RU', new_edges_ru, 'Russia K=1 chain')
inject_routes(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
              'EXTRA_ROUTES', new_edges_extra, 'All-country K=1 chain')

print("done")
