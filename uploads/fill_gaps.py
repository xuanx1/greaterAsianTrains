"""Two surgical fixes:

(1) Murmansk railway gap above Petrozavodsk
    Earlier Overpass ingest sorted by OSM id and capped at 1,000 across
    Kola+Komi+Volga. Kondopoga / Medvezhyegorsk / Segezha (OSM ids in
    the 4–11 billion range) fell past the cap. From Moscow you'd hit
    Petrozavodsk at ~9 h then jump straight to Belomorsk at ~13 h with
    nothing in between — the 4-hour plateau the user is seeing.

(2) Kaliningrad exclave
    Zero curated stations. RZD runs a daily Moscow → Kaliningrad
    sleeper via Smolensk → Minsk → Vilnius (transit). We model it as a
    single 22 h Moscow ↔ Kaliningrad link plus the local oblast spurs.

Both ingest from already-cached Overpass JSONs. Same K-NN connectivity
rule (nearest curated hub of own country + up to 5 nearest pool
neighbours within 200 km).
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
print(f"existing stations: {len(existing)}")

pool = [(e["id"], e["lat"], e["lng"], e["country"]) for e in existing]
ru_names = set()
for e in existing:
    if e["country"] == "RU":
        ru_names.add(normalize(e["name"]))
        if e["native"]: ru_names.add(normalize(e["native"]))

new_stations = []
new_routes = []
def add_edge(a, b, km):
    if a == b: return
    key = tuple(sorted([a, b]))
    if key in edges_seen: return
    edges_seen.add(key)
    new_routes.append({"from": key[0], "to": key[1], "h": round(km/70.0, 2)})

# === (1) Re-ingest Kola/Komi/Volga with NO cap, MIN_KM=15 ===
nodes = {}
for tag in ("ru_kola", "ru_komi", "ru_volga"):
    p = rf'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\overpass_{tag}.json'
    if not os.path.exists(p): continue
    d = json.load(open(p, encoding='utf-8'))
    for el in d.get('elements', []):
        if el.get('type') == 'node':
            nodes[el['id']] = el
# Skip ones already imported (would have sid osm_ru_<id>)
already_imported = {e["id"] for e in existing if e["id"].startswith("osm_ru_")}
print(f"\nKola/Komi/Volga overpass: {len(nodes)} nodes, {len(already_imported)} already imported")

ordered = sorted(nodes.values(), key=lambda e: e['id'])
MIN_KM = 15.0
kept_kkv = []
for el in ordered:
    sid = f"osm_ru_{el['id']}"
    if sid in already_imported: continue
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
    kept_kkv.append((sid, name_en or name_ru, name_ru, lat, lng))
    pool.append((sid, lat, lng, "RU"))
    if n_en: ru_names.add(n_en)
    if n_ru: ru_names.add(n_ru)
print(f"new Kola/Komi/Volga stations (cap removed): {len(kept_kkv)}")

# === (2) Kaliningrad ===
kgd_data = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\overpass_ru_kgd.json', encoding='utf-8'))
kgd_nodes = sorted([e for e in kgd_data.get('elements', []) if e.get('type') == 'node'],
                    key=lambda e: e['id'])
kept_kgd = []
MIN_KM_KGD = 8.0  # Kaliningrad oblast is small (15,000 km²)
for el in kgd_nodes:
    sid = f"osm_ru_{el['id']}"
    if sid in already_imported: continue
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
        if pcc != "RU": continue
        if hv(lat, lng, plat, plng) < MIN_KM_KGD:
            too_close = True; break
    if too_close: continue
    kept_kgd.append((sid, name_en or name_ru, name_ru, lat, lng))
    pool.append((sid, lat, lng, "RU"))
    if n_en: ru_names.add(n_en)
    if n_ru: ru_names.add(n_ru)
print(f"new Kaliningrad stations: {len(kept_kgd)}")

# Output stations
for sid, name, name_loc, lat, lng in kept_kkv + kept_kgd:
    new_stations.append({"id": sid, "name": name, "native": name_loc if name_loc != name else "",
                         "country": "RU", "lat": lat, "lng": lng})

# === Edges: nearest curated RU hub + K=5 NN within 200 km ===
cur_hubs_ru = [(e["id"], e["lat"], e["lng"]) for e in existing if e["country"] == "RU"]
for sid, name, name_loc, lat, lng in kept_kkv + kept_kgd:
    nh = min(cur_hubs_ru, key=lambda h: hv(lat, lng, h[1], h[2]))
    nh_d = hv(lat, lng, nh[1], nh[2])
    # For Kaliningrad, the nearest curated hub is far (Smolensk ~700km),
    # so don't auto-edge it — we add explicit Moscow→Kaliningrad sleeper below.
    if 54 <= lat <= 55.5 and 19 <= lng <= 23.5:
        pass  # skip auto-hub
    else:
        add_edge(sid, nh[0], nh_d)
    cand = []
    for pid, plat, plng, pcc in pool:
        if pid == sid: continue
        d = hv(lat, lng, plat, plng)
        if d > 200.0: continue
        cand.append((d, pid))
    cand.sort()
    for d, pid in cand[:5]:
        add_edge(sid, pid, d)

# === Anchor route: Moscow ↔ Kaliningrad sleeper (Strizh #29/30, ~22 h via Belarus+Lithuania) ===
# Pick the Kaliningrad node nearest 54.71N, 20.52E (city centre)
kgd_main = None
best_d = 1e9
for sid, name, name_loc, lat, lng in kept_kgd:
    d = hv(54.71, 20.52, lat, lng)
    if d < best_d:
        best_d = d; kgd_main = sid
if kgd_main:
    print(f"anchor Moscow ↔ {kgd_main} sleeper, h=22.0")
    key = tuple(sorted(["moscow", kgd_main]))
    if key not in edges_seen:
        edges_seen.add(key)
        new_routes.append({"from": key[0], "to": key[1], "h": 22.0,
                           "line": "Strizh sleeper #29/30 (via BY/LT transit)", "op": "RZD"})
    # Also Saint Petersburg has a daily Kaliningrad sleeper (~26 h via BY/LT)
    key = tuple(sorted(["stpetersburg", kgd_main]))
    if key not in edges_seen:
        edges_seen.add(key)
        new_routes.append({"from": key[0], "to": key[1], "h": 26.0,
                           "line": "St P ↔ Kaliningrad sleeper", "op": "RZD"})

print(f"\ntotal new stations: {len(new_stations)}")
print(f"total new routes:   {len(new_routes)}")

target = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js'
s = open(target, encoding='utf-8').read()
def quote(x): return '"' + (x or "").replace('\\','\\\\').replace('"','\\"') + '"'

st_block = ["  // Overpass fill — Kola gap (Kondopoga/Medvezhyegorsk/Segezha) + Kaliningrad oblast (May 2026)"]
for s_ in new_stations:
    st_block.append(f'  {{ id: {quote(s_["id"])}, name: {quote(s_["name"])}, native: {quote(s_["native"])}, country: "RU", lat: {round(s_["lat"],4)}, lng: {round(s_["lng"],4)} }},')
rt_block = ["  // Overpass fill — Kola gap + Kaliningrad sleeper anchors (May 2026)"]
for r in new_routes:
    line = r.get("line", "RZD trunk (Overpass live)")
    op = r.get("op", "RZD/OSM")
    rt_block.append(f'  {{ from: {quote(r["from"])}, to: {quote(r["to"])}, h: {r["h"]}, type: "conv", line: {quote(line)}, op: {quote(op)} }},')

m1 = re.search(r'(window\.EXTRA_STATIONS_RU\s*=\s*\[[\s\S]*?)(\n\];)', s)
s = s[:m1.end(1)] + "\n" + "\n".join(st_block) + m1.group(2) + s[m1.end():]
m2 = re.search(r'(window\.EXTRA_ROUTES_RU\s*=\s*\[[\s\S]*?)(\n\];)', s)
s = s[:m2.end(1)] + "\n" + "\n".join(rt_block) + m2.group(2) + s[m2.end():]
open(target, 'w', encoding='utf-8').write(s)
print("wrote data_ru.js")
