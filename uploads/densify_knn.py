"""Add missing K-NN edges to existing data.

K=2 turned out to be too tight for sparse regions: Loukhi's 2 nearest
were Paozero + Ruchi Karelskie (both Kola Line north spurs), but the
real next-step station south on the main line (Kem at 143 km) wasn't
picked. Result: from Murmansk you only reach Belomorsk/Kem/Kochkoma
*after* going all the way down to Petrozavodsk (18 h) and back north
(another 4 h) — a 6-12 h plateau.

This script *adds* missing edges to bring every station up to K=5 nearest
neighbours within 200 km, without removing any existing edges.
"""
import re, math, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

stations = []  # list of {id, lat, lng, country}
edges = set()  # canonical (a,b) tuples
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'id:\s*"([a-zA-Z0-9_]+)",[^}]*?country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        stations.append({"id": m.group(1), "country": m.group(2),
                         "lat": float(m.group(3)), "lng": float(m.group(4))})
    for m in re.finditer(r'from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)"', s):
        edges.add(tuple(sorted([m.group(1), m.group(2)])))

by_id = {s["id"]: s for s in stations}
print(f"stations: {len(stations)} edges: {len(edges)}")

def hv(a, b, c, d):
    R = 6371.0
    p1, p2 = math.radians(a), math.radians(c)
    dp = math.radians(c - a); dl = math.radians(d - b)
    h = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(h))

# Target: every OSM/gpkg-imported station (id starts with osm_ or ru_)
# gets ≥5 neighbours within 200 km. Skip curated nodes — those have hand-
# curated long routes that shouldn't be polluted with great-circle hops.

TARGET_K = 5
MAX_KM = 200.0

# Only fix Russia (RU) + Far East / Caucasus / Siberia, which is where the
# plateaus are. Doing it globally would explode the graph and risk
# creating shortcuts that don't reflect real rail topology.
focus_country = "RU"

# For speed, bucket Russian stations into a coarse spatial grid
ru = [s for s in stations if s["country"] == focus_country]
print(f"focus stations: {len(ru)}")

# Existing neighbours per station
neigh = {}
for a, b in edges:
    neigh.setdefault(a, set()).add(b)
    neigh.setdefault(b, set()).add(a)

added_ru = []
for s in ru:
    sid = s["id"]
    if not (sid.startswith("ru_") or sid.startswith("osm_ru_")):
        continue
    have = neigh.get(sid, set())
    # Skip if station already has enough close neighbours
    close_have = sum(1 for n in have if n in by_id
                     and hv(s["lat"], s["lng"], by_id[n]["lat"], by_id[n]["lng"]) <= MAX_KM)
    if close_have >= TARGET_K: continue
    # Find candidates
    cand = []
    for t in ru:
        if t["id"] == sid: continue
        d = hv(s["lat"], s["lng"], t["lat"], t["lng"])
        if d > MAX_KM: continue
        cand.append((d, t["id"]))
    cand.sort()
    need = TARGET_K - close_have
    for d, tid in cand:
        if need <= 0: break
        if tid in have: continue
        key = tuple(sorted([sid, tid]))
        if key in edges: continue
        edges.add(key)
        added_ru.append((key[0], key[1], round(d/70.0, 2)))
        neigh.setdefault(sid, set()).add(tid)
        neigh.setdefault(tid, set()).add(sid)
        need -= 1

print(f"new RU bridge edges: {len(added_ru)}")

# Append to data_ru.js
def quote(x): return '"' + (x or "").replace('\\','\\\\').replace('"','\\"') + '"'

target = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js'
s = open(target, encoding='utf-8').read()
block = ["  // K-NN densification — May 2026 — fill K=5 gap for sparse spurs"]
for f, t, h in added_ru:
    block.append(f'  {{ from: {quote(f)}, to: {quote(t)}, h: {h}, type: "conv", line: "K-NN bridge", op: "OSM/gpkg" }},')
m = re.search(r'(window\.EXTRA_ROUTES_RU\s*=\s*\[[\s\S]*?)(\n\];)', s)
s = s[:m.end(1)] + "\n" + "\n".join(block) + m.group(2) + s[m.end():]
open(target, 'w', encoding='utf-8').write(s)
print("wrote data_ru.js")
