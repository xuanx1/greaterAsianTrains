"""Ingest IRN (HOTOSM points) + India (railways.geojson) into data_extra.js.

Both files were previously unprocessed:
  - hotosm_irn_railways_points_geojson.geojson — 706 features → ~100 cap.
  - railways.geojson — 8,947 India points → ~250 cap.

Applies the shared name_quality.is_acceptable() filter plus a per-country
distance floor of 25 km. Routes: nearest curated hub of same country
+ K=2 nearest pool-wide neighbours within 300 km, edges canonicalised.
"""
import json, math, re, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads')
from name_quality import is_acceptable

def normalize(s):
    if not s: return ""
    s = s.strip().lower().replace("ё","е")
    return re.sub(r"[\s\-\.\(\),']+", "", s)

def hv(a, b, c, d):
    R = 6371.0
    p1, p2 = math.radians(a), math.radians(c)
    dp = math.radians(c - a); dl = math.radians(d - b)
    h = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(h))

# Load existing
existing = []
edges_seen = set()
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*id:\s*"([a-zA-Z0-9_]+)"[^}]*?name:\s*"([^"]+)"[^}]*?(?:native:\s*"([^"]*)"[^}]*?)?country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        existing.append({
            "id": m.group(1), "name": m.group(2), "native": m.group(3) or "",
            "country": m.group(4), "lat": float(m.group(5)), "lng": float(m.group(6)),
        })
    for m in re.finditer(r'from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)"', s):
        edges_seen.add(tuple(sorted([m.group(1), m.group(2)])))
print(f"existing stations: {len(existing)}, edges: {len(edges_seen)}")

pool = [(e["id"], e["lat"], e["lng"], e["country"]) for e in existing]
curated_by_cc = {}
for e in existing:
    curated_by_cc.setdefault(e["country"], set()).add(normalize(e["name"]))
    if e["native"]:
        curated_by_cc.setdefault(e["country"], set()).add(normalize(e["native"]))

new_stations = []
new_routes = []

def add_edge(a, b, km):
    if a == b: return
    key = tuple(sorted([a, b]))
    if key in edges_seen: return
    edges_seen.add(key)
    new_routes.append({"from": key[0], "to": key[1], "h": round(km/70.0, 2)})

def ingest(path, cc, cap, min_km, source_label):
    print(f"\n== {cc} ({source_label}) ==")
    d = json.load(open(path, encoding='utf-8'))
    feats = d['features']
    feats = [f for f in feats if f['geometry']['type'] == 'Point']
    feats = [f for f in feats if f['properties'].get('railway') == 'station']
    raw = len(feats)
    cur_names = curated_by_cc.setdefault(cc, set())
    kept = []
    for f in feats:
        p = f['properties']
        c = f['geometry']['coordinates']
        if not c or len(c) < 2: continue
        lng, lat = c[0], c[1]
        # Field names differ: HOTOSM uses name:en, the India global uses
        # name_en (underscore). Handle both. name (always-on) is the local
        # primary, often the same as name:en in many HOTOSM exports.
        name_en = p.get('name:en') or p.get('name_en') or ""
        name_loc = p.get('name') or name_en
        if not is_acceptable(name_en, name_loc):
            continue
        # Country filter for the India global file (8,947 features, all India,
        # but defensive)
        adm0 = p.get('adm0_pcode') or p.get('adm0_name')
        if adm0 and cc == 'IN' and adm0 not in ('IND', 'India'):
            continue
        n_en, n_loc = normalize(name_en), normalize(name_loc)
        if n_en in cur_names or n_loc in cur_names: continue
        too_close = False
        for pid, plat, plng, pcc in pool:
            if hv(lat, lng, plat, plng) < min_km:
                too_close = True; break
        if too_close: continue
        osm_id = p.get('osm_id') or p.get('id', '').replace('node/', '')
        if not osm_id: continue
        sid = f"osm_{cc.lower()}_{osm_id}"
        kept.append((sid, name_en or name_loc, name_loc, lat, lng))
        pool.append((sid, lat, lng, cc))
        cur_names.add(n_en); cur_names.add(n_loc)
        if len(kept) >= cap: break
    print(f"  raw={raw} kept={len(kept)} (cap={cap}, min={min_km}km)")
    cur_hubs = [(e["id"], e["lat"], e["lng"]) for e in existing if e["country"] == cc]
    for sid, name, name_loc, lat, lng in kept:
        new_stations.append({"id": sid, "name": name, "native": name_loc if name_loc != name else "",
                             "country": cc, "lat": lat, "lng": lng})
        if cur_hubs:
            nh = min(cur_hubs, key=lambda h: hv(lat, lng, h[1], h[2]))
            add_edge(sid, nh[0], hv(lat, lng, nh[1], nh[2]))
        # K=2 NN
        cand = []
        for pid, plat, plng, pcc in pool:
            if pid == sid: continue
            dd = hv(lat, lng, plat, plng)
            if dd > 300.0: continue
            cand.append((dd, pid))
        cand.sort()
        for dd, pid in cand[:2]:
            add_edge(sid, pid, dd)

ingest(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\hotosm_irn_railways_points_geojson.geojson',
       'IR', cap=100, min_km=25, source_label='HOTOSM IR points')
ingest(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\railways.geojson',
       'IN', cap=250, min_km=25, source_label='HOTOSM IN global')

print(f"\ntotal new stations: {len(new_stations)}")
print(f"total new routes:   {len(new_routes)}")

# Append to data_extra.js
target = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js'
s = open(target, encoding='utf-8').read()
def quote(x): return '"' + (x or "").replace('\\','\\\\').replace('"','\\"') + '"'

st_block = ["  // HOTOSM IR + IN ingest — May 2026"]
for s_ in new_stations:
    st_block.append(f'  {{ id: {quote(s_["id"])}, name: {quote(s_["name"])}, native: {quote(s_["native"])}, country: "{s_["country"]}", lat: {round(s_["lat"],4)}, lng: {round(s_["lng"],4)} }},')
rt_block = ["  // HOTOSM IR + IN ingest — May 2026"]
for r in new_routes:
    rt_block.append(f'  {{ from: {quote(r["from"])}, to: {quote(r["to"])}, h: {r["h"]}, type: "conv", line: "HOTOSM OSM ingest", op: "OpenStreetMap" }},')

m1 = re.search(r'(window\.EXTRA_STATIONS\s*=\s*\[[\s\S]*?)(\n\];)', s)
s = s[:m1.end(1)] + "\n" + "\n".join(st_block) + m1.group(2) + s[m1.end():]
m2 = re.search(r'(window\.EXTRA_ROUTES\s*=\s*\[[\s\S]*?)(\n\];)', s)
s = s[:m2.end(1)] + "\n" + "\n".join(rt_block) + m2.group(2) + s[m2.end():]
open(target, 'w', encoding='utf-8').write(s)
print("wrote data_extra.js")
