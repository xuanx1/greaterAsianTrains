"""Ingest Overpass-fetched stations for 14 non-HOTOSM countries.

Per-country cap matches the size of the actual intercity network. Min-
distance floor is a flat 20 km — denser than the HOTOSM ingest (25 km)
because these networks are smaller and more strung-out.

Edges: nearest curated hub of same country (if any) + K=2 nearest
pool-wide neighbours within 300 km. Skip stations whose name fails
is_acceptable().
"""
import json, math, re, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads')
from name_quality import is_acceptable

CONFIG = [
    ("BD", 60, "Bangladesh"),
    ("LK", 40, "Sri Lanka"),
    ("MY", 60, "Malaysia"),
    ("MM", 50, "Myanmar"),
    ("SA", 30, "Saudi Arabia"),
    ("IL", 30, "Israel"),
    ("KH", 20, "Cambodia"),
    ("NP",  5, "Nepal"),
    ("GE", 30, "Georgia"),
    ("AM", 20, "Armenia"),
    ("AZ", 30, "Azerbaijan"),
    ("UZ", 50, "Uzbekistan"),
    ("TM", 40, "Turkmenistan"),
    ("KP", 50, "North Korea"),
]
MIN_KM = 20.0

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
        existing.append({"id": m.group(1), "name": m.group(2), "native": m.group(3) or "",
                         "country": m.group(4), "lat": float(m.group(5)), "lng": float(m.group(6))})
    for m in re.finditer(r'from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)"', s):
        edges_seen.add(tuple(sorted([m.group(1), m.group(2)])))
print(f"existing stations: {len(existing)}")

pool = [(e["id"], e["lat"], e["lng"], e["country"]) for e in existing]

new_stations = []
new_routes = []

def add_edge(a, b, km):
    if a == b: return
    key = tuple(sorted([a, b]))
    if key in edges_seen: return
    edges_seen.add(key)
    new_routes.append({"from": key[0], "to": key[1], "h": round(km/70.0, 2)})

for cc, cap, country_name in CONFIG:
    src = rf'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\overpass_{cc.lower()}.json'
    if not os.path.exists(src):
        print(f"{cc}: file missing — skip")
        continue
    d = json.load(open(src, encoding='utf-8'))
    elems = [e for e in d.get('elements', []) if e.get('type') == 'node']
    raw = len(elems)
    # Build country-local name set
    cur_names = set()
    for e in existing:
        if e['country'] == cc:
            cur_names.add(normalize(e['name']))
            if e['native']: cur_names.add(normalize(e['native']))
    cur_hubs = [(e["id"], e["lat"], e["lng"]) for e in existing if e['country'] == cc]
    elems.sort(key=lambda e: e['id'])
    kept = []
    for el in elems:
        if len(kept) >= cap: break
        tags = el.get('tags', {})
        if tags.get('railway') != 'station': continue
        st = (tags.get('station') or '').lower()
        if st in ('subway', 'light_rail', 'tram', 'monorail'): continue
        name_en = tags.get('name:en') or ''
        name_loc = tags.get('name') or name_en
        if not is_acceptable(name_en, name_loc): continue
        lat = el.get('lat'); lng = el.get('lon')
        if lat is None or lng is None: continue
        n_en, n_loc = normalize(name_en), normalize(name_loc)
        if n_en in cur_names or n_loc in cur_names: continue
        too_close = False
        for pid, plat, plng, pcc in pool:
            if hv(lat, lng, plat, plng) < MIN_KM:
                too_close = True; break
        if too_close: continue
        sid = f"osm_{cc.lower()}_{el['id']}"
        kept.append((sid, name_en or name_loc, name_loc, lat, lng))
        pool.append((sid, lat, lng, cc))
        if n_en: cur_names.add(n_en)
        if n_loc: cur_names.add(n_loc)
    print(f"{cc} {country_name:15} raw={raw:>5} kept={len(kept):>4} (cap={cap})")

    for sid, name, name_loc, lat, lng in kept:
        new_stations.append({"id": sid, "name": name, "native": name_loc if name_loc != name else "",
                             "country": cc, "lat": lat, "lng": lng})
        if cur_hubs:
            nh = min(cur_hubs, key=lambda h: hv(lat, lng, h[1], h[2]))
            add_edge(sid, nh[0], hv(lat, lng, nh[1], nh[2]))
        cand = []
        for pid, plat, plng, pcc in pool:
            if pid == sid: continue
            ddd = hv(lat, lng, plat, plng)
            if ddd > 300.0: continue
            cand.append((ddd, pid))
        cand.sort()
        for ddd, pid in cand[:2]:
            add_edge(sid, pid, ddd)

print(f"\ntotal new stations: {len(new_stations)}")
print(f"total new routes:   {len(new_routes)}")

target = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js'
s = open(target, encoding='utf-8').read()
def quote(x): return '"' + (x or "").replace('\\','\\\\').replace('"','\\"') + '"'

st_block = ["  // Overpass live ingest — 14 non-HOTOSM countries (May 2026)"]
for s_ in new_stations:
    st_block.append(f'  {{ id: {quote(s_["id"])}, name: {quote(s_["name"])}, native: {quote(s_["native"])}, country: "{s_["country"]}", lat: {round(s_["lat"],4)}, lng: {round(s_["lng"],4)} }},')
rt_block = ["  // Overpass live ingest — 14 non-HOTOSM countries (May 2026)"]
for r in new_routes:
    rt_block.append(f'  {{ from: {quote(r["from"])}, to: {quote(r["to"])}, h: {r["h"]}, type: "conv", line: "Overpass live ingest", op: "OpenStreetMap" }},')

m1 = re.search(r'(window\.EXTRA_STATIONS\s*=\s*\[[\s\S]*?)(\n\];)', s)
s = s[:m1.end(1)] + "\n" + "\n".join(st_block) + m1.group(2) + s[m1.end():]
m2 = re.search(r'(window\.EXTRA_ROUTES\s*=\s*\[[\s\S]*?)(\n\];)', s)
s = s[:m2.end(1)] + "\n" + "\n".join(rt_block) + m2.group(2) + s[m2.end():]
open(target, 'w', encoding='utf-8').write(s)
print("wrote data_extra.js")
