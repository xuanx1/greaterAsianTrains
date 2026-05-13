"""Ingest the new Kola/Komi/Volga Overpass batches.

Same rules as the earlier RU Overpass ingest:
  - is_acceptable(name_en, name_ru) name quality filter
  - Per-region distance floor: 15 km (denser intercity grid in European Russia)
  - Cap 1000 total across the 3 new regions
  - Each new station gets: nearest curated RU hub + K=5 nearest pool-wide
    within 200 km (matches the K=5 densification used elsewhere).
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

existing = []
edges_seen = set()
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*id:\s*"([a-zA-Z0-9_]+)"[^}]*?name:\s*"([^"]+)"[^}]*?(?:native:\s*"([^"]*)"[^}]*?)?country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        existing.append({"id": m.group(1), "name": m.group(2), "native": m.group(3) or "",
                         "country": m.group(4), "lat": float(m.group(5)), "lng": float(m.group(6))})
    for m in re.finditer(r'from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)"', s):
        edges_seen.add(tuple(sorted([m.group(1), m.group(2)])))
print(f"existing: {len(existing)} stations, {len(edges_seen)} edges")

pool = [(e["id"], e["lat"], e["lng"], e["country"]) for e in existing]
ru_names = set()
for e in existing:
    if e["country"] == "RU":
        ru_names.add(normalize(e["name"]))
        if e["native"]: ru_names.add(normalize(e["native"]))

nodes = {}
for tag in ("ru_kola", "ru_komi", "ru_volga"):
    p = rf'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\overpass_{tag}.json'
    if not os.path.exists(p): continue
    d = json.load(open(p, encoding='utf-8'))
    for el in d.get('elements', []):
        if el.get('type') != 'node': continue
        nodes[el['id']] = el
print(f"unique overpass nodes: {len(nodes)}")

ordered = sorted(nodes.values(), key=lambda e: e['id'])

new_stations = []
new_routes = []
def add_edge(a, b, km):
    if a == b: return
    key = tuple(sorted([a, b]))
    if key in edges_seen: return
    edges_seen.add(key)
    new_routes.append({"from": key[0], "to": key[1], "h": round(km/70.0, 2)})

MIN_KM = 15.0
CAP = 1000

kept = []
for el in ordered:
    if len(kept) >= CAP: break
    tags = el.get('tags', {})
    if tags.get('railway') != 'station': continue
    st = (tags.get('station') or '').lower()
    if st in ('subway', 'light_rail', 'tram', 'monorail'): continue
    name_en = tags.get('name:en') or ''
    name_ru = tags.get('name:ru') or tags.get('name') or ''
    if not is_acceptable(name_en, name_ru): continue
    lat = el.get('lat'); lng = el.get('lon')
    if lat is None or lng is None: continue
    n_en, n_ru = normalize(name_en), normalize(name_ru)
    if (n_en and n_en in ru_names) or (n_ru and n_ru in ru_names): continue
    too_close = False
    for pid, plat, plng, pcc in pool:
        if hv(lat, lng, plat, plng) < MIN_KM:
            too_close = True; break
    if too_close: continue
    sid = f"osm_ru_{el['id']}"
    kept.append((sid, name_en or name_ru, name_ru, lat, lng))
    pool.append((sid, lat, lng, "RU"))
    if n_en: ru_names.add(n_en)
    if n_ru: ru_names.add(n_ru)

print(f"kept: {len(kept)}")

cur_hubs_ru = [(e["id"], e["lat"], e["lng"]) for e in existing if e["country"] == "RU"]
for sid, name, name_loc, lat, lng in kept:
    new_stations.append({"id": sid, "name": name, "native": name_loc if name_loc != name else "",
                         "country": "RU", "lat": lat, "lng": lng})
    nh = min(cur_hubs_ru, key=lambda h: hv(lat, lng, h[1], h[2]))
    add_edge(sid, nh[0], hv(lat, lng, nh[1], nh[2]))
    cand = []
    for pid, plat, plng, pcc in pool:
        if pid == sid: continue
        d = hv(lat, lng, plat, plng)
        if d > 200.0: continue
        cand.append((d, pid))
    cand.sort()
    for d, pid in cand[:5]:
        add_edge(sid, pid, d)

print(f"new routes: {len(new_routes)}")

target = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js'
s = open(target, encoding='utf-8').read()
def quote(x): return '"' + (x or "").replace('\\','\\\\').replace('"','\\"') + '"'

st_block = ["  // Overpass live ingest — Kola/Komi/Volga (May 2026)"]
for s_ in new_stations:
    st_block.append(f'  {{ id: {quote(s_["id"])}, name: {quote(s_["name"])}, native: {quote(s_["native"])}, country: "RU", lat: {round(s_["lat"],4)}, lng: {round(s_["lng"],4)} }},')
rt_block = ["  // Overpass live ingest — Kola/Komi/Volga (May 2026)"]
for r in new_routes:
    rt_block.append(f'  {{ from: {quote(r["from"])}, to: {quote(r["to"])}, h: {r["h"]}, type: "conv", line: "RZD trunk (Overpass live)", op: "RZD/OSM" }},')

m1 = re.search(r'(window\.EXTRA_STATIONS_RU\s*=\s*\[[\s\S]*?)(\n\];)', s)
s = s[:m1.end(1)] + "\n" + "\n".join(st_block) + m1.group(2) + s[m1.end():]
m2 = re.search(r'(window\.EXTRA_ROUTES_RU\s*=\s*\[[\s\S]*?)(\n\];)', s)
s = s[:m2.end(1)] + "\n" + "\n".join(rt_block) + m2.group(2) + s[m2.end():]
open(target, 'w', encoding='utf-8').write(s)
print("wrote data_ru.js")
