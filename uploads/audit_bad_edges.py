"""Hunt for bad edges left by ingest: implausible distances, cross-sea
gaps without a curated bridge label, very long auto-ingest hops, and
station-level smells like duplicates, stations in ocean, etc."""
import re, sys, io, math, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

stations = {}
station_line_source = {}  # sid -> file
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*id:\s*"([a-zA-Z0-9_]+)",\s*name:\s*"([^"]*)",\s*native:\s*"([^"]*)",\s*country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        sid = m.group(1)
        stations[sid] = {"name": m.group(2), "native": m.group(3), "country": m.group(4),
                         "lat": float(m.group(5)), "lng": float(m.group(6))}

routes = []
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)",\s*h:\s*([0-9\.]+),[^}]*?line:\s*"([^"]*)"', s):
        routes.append({"from": m.group(1), "to": m.group(2), "h": float(m.group(3)),
                       "line": m.group(4), "file": path.split('\\')[-1]})

print(f"stations: {len(stations)} routes: {len(routes)}")

def hv(a, b, c, d):
    R = 6371.0
    p1, p2 = math.radians(a), math.radians(c)
    dp = math.radians(c - a); dl = math.radians(d - b)
    h = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(h))

# === Check 1: edges where great-circle distance is far longer than 70 km/h would imply ===
# h * 70 should be roughly the great-circle distance. If h is way smaller
# than gc_km/120 (impossible without HSR), it's a phantom short edge.
# If h is huge but distance is small, it's an arbitrary curated long route.

# Specifically look at auto K-NN edges (line "K=1 chain" or known auto labels) that span > 200 km.
AUTO_LABELS = {"K=1 chain", "Overpass live ingest", "RZD trunk (Overpass live)",
               "HOTOSM OSM ingest", "K-NN bridge", "OSM connector (fallback)",
               "OSM connector (extended)", "OSM rail corridor", "OSM last-resort",
               "RZD trunk (Trolleway gpkg, K-NN)", "RZD trunk (Trolleway dataset)"}

very_long_auto = []
for r in routes:
    if r["line"] not in AUTO_LABELS: continue
    f, t = r["from"], r["to"]
    if f not in stations or t not in stations: continue
    sa, sb = stations[f], stations[t]
    km = hv(sa["lat"], sa["lng"], sb["lat"], sb["lng"])
    if km > 200:
        very_long_auto.append((km, r, sa, sb))
very_long_auto.sort(reverse=True)
print(f"\n=== Auto-ingest edges >200 km (suspect K-NN over-reach): {len(very_long_auto)} ===")
for km, r, sa, sb in very_long_auto[:20]:
    print(f"  {km:6.0f} km  h={r['h']:>5.2f}  {sa['name']:>22} ({sa['country']}) ↔ {sb['name']:<22} ({sb['country']})  [{r['line']}]")

# === Check 2: edges that cross >100 km of sea (using a coarse heuristic — pure visual proxy) ===
# We don't have land/sea data. Skip — would need a basemap lookup.

# === Check 3: duplicate stations (within 100 m of each other) ===
print(f"\n=== Coincident stations (<150 m apart): ===")
ids = list(stations.keys())
dups = []
# Build a coarse grid for fast neighbour lookup
grid = {}
GR = 0.05  # ~5 km
for sid, s in stations.items():
    key = (int(s["lat"]/GR), int(s["lng"]/GR))
    for dy in (-1,0,1):
        for dx in (-1,0,1):
            grid.setdefault((key[0]+dy, key[1]+dx), []).append(sid)
seen_pairs = set()
for sid, s in stations.items():
    key = (int(s["lat"]/GR), int(s["lng"]/GR))
    for nid in grid.get(key, ()):
        if nid <= sid: continue
        if (sid, nid) in seen_pairs: continue
        seen_pairs.add((sid, nid))
        ns = stations[nid]
        d = hv(s["lat"], s["lng"], ns["lat"], ns["lng"])
        if d < 0.15:  # <150 m
            dups.append((d * 1000, sid, nid))
dups.sort()
print(f"  total <150 m apart: {len(dups)}")
for m, a, b in dups[:15]:
    sa, sb = stations[a], stations[b]
    print(f"  {m:5.0f} m  {sa['name']:>22}({a}) {sa['country']} ↔ {sb['name']:<22}({b}) {sb['country']}")

# === Check 4: stations with same name + same country very close (<3 km) — likely duplicates from different ingests ===
print(f"\n=== Same-name same-country near-duplicates (<3 km): ===")
name_groups = {}
for sid, s in stations.items():
    key = (s["country"], (s["name"] or "").strip().lower())
    if not key[1]: continue
    name_groups.setdefault(key, []).append(sid)
near_dups_by_name = []
for (cc, nm), ids_ in name_groups.items():
    if len(ids_) < 2: continue
    for i in range(len(ids_)):
        for j in range(i+1, len(ids_)):
            a, b = ids_[i], ids_[j]
            sa, sb = stations[a], stations[b]
            d = hv(sa["lat"], sa["lng"], sb["lat"], sb["lng"])
            if d < 3:
                near_dups_by_name.append((d, a, b, nm))
near_dups_by_name.sort()
print(f"  total: {len(near_dups_by_name)}")
for d, a, b, nm in near_dups_by_name[:15]:
    print(f"  {d:5.2f} km  '{nm}'  ({a}) ↔ ({b})  cc={stations[a]['country']}")

# === Check 5: stations >10 km in the wrong country (probably mis-bbox'd) ===
# Without reverse-geocoding, hard. But we can spot RU stations physically inside CN/MN bbox etc.
ROUGH_BBOX = {
    "CN": (15, 73, 54, 135),   # rough mainland China
    "MN": (41, 87,  53, 120),
    "JP": (24, 122, 46, 146),
    "KR": (33, 124, 39, 132),
    "KP": (37, 124, 43, 131),
    "IN": (6,  68,  37, 97),
    "RU": (41, 19,  82, 180),  # huge — includes Kaliningrad
}
out_of_bbox = []
for sid, s in stations.items():
    bb = ROUGH_BBOX.get(s["country"])
    if not bb: continue
    if not (bb[0] <= s["lat"] <= bb[2] and bb[1] <= s["lng"] <= bb[3]):
        out_of_bbox.append((sid, s))
print(f"\n=== Stations physically outside their country's rough bbox: {len(out_of_bbox)} ===")
for sid, s in out_of_bbox[:15]:
    print(f"  {sid} {s['name']} (claimed {s['country']}) at [{s['lat']:.2f},{s['lng']:.2f}]")
