"""Add HOTOSM-derived stations for 10 countries to data_extra.js.

Strategy (per country):
  1. Load HOTOSM points file (railway=station).
  2. Drop unnamed entries.
  3. Drop if normalised name matches a curated station of the same country
     (catches transliteration variants).
  4. Drop if within MIN_KM of any pre-existing station (curated + earlier
     OSM imports). Per-country MIN_KM tuned to network density:
       JP, KR — 15 km   (dense Shinkansen + TRA-style network)
       CN, TH, VN — 20 km
       IR, IN, PK, ID, KZ, MN, TR — 25 km
  5. Connectivity per imported station: nearest curated hub of the same
     country, plus up to 2 nearest pool-wide neighbours (curated +
     OSM-imported) within MAX_KM=300 km. Edges canonicalised.
"""
import json, math, re, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def normalize(s):
    if not s: return ""
    s = s.strip().lower()
    s = s.replace("ё","е").replace("å","a").replace("ä","a").replace("ö","o").replace("ü","u")
    return re.sub(r"[\s\-\.\(\),']+", "", s)

def hv(a, b, c, d):
    R = 6371.0
    p1, p2 = math.radians(a), math.radians(c)
    dp = math.radians(c - a); dl = math.radians(d - b)
    h = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(h))

# ---- Load existing curated + extras + ru ----
def parse_stations(path):
    out = []
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*id:\s*"([a-zA-Z0-9_]+)"[^}]*?name:\s*"([^"]+)"[^}]*?(?:native:\s*"([^"]*)"[^}]*?)?country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        out.append({
            "id": m.group(1), "name": m.group(2), "native": m.group(3) or "",
            "country": m.group(4), "lat": float(m.group(5)), "lng": float(m.group(6)),
        })
    return out

existing = []
for p in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
          r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
          r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    existing.extend(parse_stations(p))
print(f"existing stations loaded: {len(existing)}")

# ---- Per-country config ----
CONFIG = [
    ("IDN", "idn", 25, "ID"),
    ("IRN", "irn", 25, "IR"),
    ("JPN", "jpn", 15, "JP"),
    ("KAZ", "kaz", 25, "KZ"),
    ("KOR", "kor", 15, "KR"),
    ("MNG", "mng", 25, "MN"),
    ("PAK", "pak", 25, "PK"),
    ("THA", "tha", 20, "TH"),
    ("TUR", "tur", 25, "TR"),
    ("VNM", "vnm", 20, "VN"),
]

# Per-country caps so a single file can't dominate.
CAP = {"JP": 200, "KR": 150, "CN": 0, "TW": 0,
       "ID": 60, "IR": 60, "KZ": 30, "MN": 20,
       "PK": 60, "TH": 60, "TR": 60, "VN": 50, "IN": 0}

MAX_KM = 300.0
NN_K = 2

# Per-country curated name index (for name-dedup against curated)
curated_names_per_cc = {}
for s in existing:
    curated_names_per_cc.setdefault(s["country"], set()).add(normalize(s["name"]))
    if s["native"]:
        curated_names_per_cc.setdefault(s["country"], set()).add(normalize(s["native"]))

# Pool for K-NN: starts with all existing
pool = [(s["id"], s["lat"], s["lng"], s["country"]) for s in existing]

new_stations = []
new_routes = []
edges_seen = set()

# Pre-seed edges with existing routes so we never duplicate an existing edge.
def load_existing_edges():
    s = ""
    for p in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
              r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
              r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
        s += open(p, encoding='utf-8').read()
    for m in re.finditer(r'from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)"', s):
        a, b = m.group(1), m.group(2)
        edges_seen.add(tuple(sorted([a, b])))
load_existing_edges()
print(f"pre-existing canonical edges loaded: {len(edges_seen)}")

def add_edge(a, b, km):
    if a == b: return
    key = tuple(sorted([a, b]))
    if key in edges_seen: return
    edges_seen.add(key)
    new_routes.append({"from": key[0], "to": key[1], "h": round(km/70.0, 2)})

print("\n=== per-country ingest ===")
for tag, code, MIN_KM, cc in CONFIG:
    path = rf'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\hotosm_{code}_railways_points_geojson.geojson'
    if not os.path.exists(path):
        print(f"{tag}: file not found — skipping")
        continue
    d = json.load(open(path, encoding='utf-8'))
    feats = d['features']
    raw = len(feats)
    # Filter to railway=station with a name
    feats = [f for f in feats
             if (f['properties'].get('railway') == 'station')
             and (f['properties'].get('name') or f['properties'].get('name:en'))]
    named = len(feats)

    curated_n = curated_names_per_cc.get(cc, set())
    # Local pool (combined: existing + already-added-from-this-batch)
    kept = []
    cap = CAP.get(cc, 60)
    for f in feats:
        p = f['properties']
        c = f['geometry']['coordinates']
        if not c or len(c) < 2: continue
        lng, lat = c[0], c[1]
        name_en = p.get('name:en') or ""
        name_local = p.get('name') or p.get('name:en') or ""
        if not name_en and not name_local: continue
        n_en = normalize(name_en); n_loc = normalize(name_local)
        # Name dedup vs curated of this country
        if (n_en and n_en in curated_n) or (n_loc and n_loc in curated_n):
            continue
        # Distance dedup vs all pool
        too_close = False
        for pid, plat, plng, pcc in pool:
            if hv(lat, lng, plat, plng) < MIN_KM:
                too_close = True; break
        if too_close: continue
        kept.append((p.get('osm_id'), name_en or name_local, name_local, lat, lng))
        # Add to pool immediately so subsequent candidates also dedup against this one
        pool.append((f"osm_{cc.lower()}_{p.get('osm_id')}", lat, lng, cc))
        if curated_n is not None:
            curated_n.add(n_en); curated_n.add(n_loc)
        if len(kept) >= cap: break

    print(f"{tag}({cc}): raw={raw} named={named} kept={len(kept)} (cap={cap}, min={MIN_KM}km)")

    # Now generate edges for each kept station
    cur_hubs_cc = [(p["id"], p["lat"], p["lng"]) for p in existing if p["country"] == cc]
    for osm_id, name_en, name_local, lat, lng in kept:
        sid = f"osm_{cc.lower()}_{osm_id}"
        new_stations.append({
            "id": sid, "name": name_en, "native": name_local if name_local != name_en else "",
            "country": cc, "lat": lat, "lng": lng,
        })
        # nearest curated hub in same country
        if cur_hubs_cc:
            nh = min(cur_hubs_cc, key=lambda h: hv(lat, lng, h[1], h[2]))
            add_edge(sid, nh[0], hv(lat, lng, nh[1], nh[2]))
        # K nearest pool-wide (any country, capped)
        cand = []
        for pid, plat, plng, pcc in pool:
            if pid == sid: continue
            dd = hv(lat, lng, plat, plng)
            if dd > MAX_KM: continue
            cand.append((dd, pid))
        cand.sort()
        for dd, pid in cand[:NN_K]:
            add_edge(sid, pid, dd)

print(f"\ntotal new stations: {len(new_stations)}")
print(f"total new routes:   {len(new_routes)}")

# Append to data_extra.js (insert before the closing ];)
target = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js'
s = open(target, encoding='utf-8').read()

def quote(x):
    return '"' + (x or "").replace('\\','\\\\').replace('"','\\"') + '"'

# Build new station + route lines
st_block = ["  // HOTOSM ingest — 10 additional countries (May 2026)"]
for s_ in new_stations:
    st_block.append(f'  {{ id: {quote(s_["id"])}, name: {quote(s_["name"])}, native: {quote(s_["native"])}, country: "{s_["country"]}", lat: {round(s_["lat"],4)}, lng: {round(s_["lng"],4)} }},')

rt_block = ["  // HOTOSM ingest — May 2026 — nearest curated hub + K=2 NN within 300 km"]
for r in new_routes:
    rt_block.append(f'  {{ from: {quote(r["from"])}, to: {quote(r["to"])}, h: {r["h"]}, type: "conv", line: "HOTOSM OSM ingest", op: "OpenStreetMap" }},')

# Inject before the closing ']; for EXTRA_STATIONS and EXTRA_ROUTES'
# Find the closing ] of EXTRA_STATIONS first.
m1 = re.search(r'(window\.EXTRA_STATIONS\s*=\s*\[[\s\S]*?)(\n\];)', s)
if not m1:
    raise SystemExit("EXTRA_STATIONS block not found")
s = s[:m1.end(1)] + "\n" + "\n".join(st_block) + m1.group(2) + s[m1.end():]

m2 = re.search(r'(window\.EXTRA_ROUTES\s*=\s*\[[\s\S]*?)(\n\];)', s)
if not m2:
    raise SystemExit("EXTRA_ROUTES block not found")
s = s[:m2.end(1)] + "\n" + "\n".join(rt_block) + m2.group(2) + s[m2.end():]

open(target, 'w', encoding='utf-8').write(s)
print("\nwrote data_extra.js")
