"""Three fixes:
  (1) Drop auto-ingest edges spanning >300 km — those are K-NN over-reach
      across genuine geographic gaps where rail doesn't actually run.
  (2) Remove the duplicate osm_ru_1666471073 ('Chernyakhovsk') — the
      curated `chernyakhovsk` (added later) sits 50 m away.
  (3) Reassign osm_kp_1548856832 ('Quchaihe') from KP → CN — it's in
      Jilin, not North Korea.
After pruning, re-run the component-anchor pass so any newly-orphaned
chains get a fresh nearest-hub edge.
"""
import re, sys, io, math
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

AUTO_LABELS = {"K=1 chain", "Overpass live ingest", "RZD trunk (Overpass live)",
               "HOTOSM OSM ingest", "K-NN bridge", "OSM connector (fallback)",
               "OSM connector (extended)", "OSM rail corridor", "OSM last-resort",
               "RZD trunk (Trolleway gpkg, K-NN)", "RZD trunk (Trolleway dataset)"}

DROP_STATIONS = {"osm_ru_1666471073"}  # duplicate Chernyakhovsk
COUNTRY_REASSIGN = {"osm_kp_1548856832": "CN"}  # Quchaihe is in Jilin

# Load all stations for distance calc
stations = {}
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*id:\s*"([a-zA-Z0-9_]+)",\s*name:\s*"([^"]*)",\s*native:\s*"([^"]*)",\s*country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        stations[m.group(1)] = {"name": m.group(2), "native": m.group(3),
                                "country": m.group(4),
                                "lat": float(m.group(5)), "lng": float(m.group(6))}

def hv(a, b, c, d):
    R = 6371.0
    p1, p2 = math.radians(a), math.radians(c)
    dp = math.radians(c - a); dl = math.radians(d - b)
    h = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(h))

STATION_LINE_RE = re.compile(r'^(\s*\{\s*id:\s*")([a-zA-Z0-9_]+)("\s*,\s*name:\s*")([^"]*)("\s*,\s*native:\s*")([^"]*)("\s*,\s*country:\s*")([A-Z]{2})("[^}]*\},\s*)$')
ROUTE_LINE_RE = re.compile(r'^(\s*\{\s*from:\s*")([a-zA-Z0-9_]+)("\s*,\s*to:\s*")([a-zA-Z0-9_]+)(",[^}]*?line:\s*")([^"]*)(".*\},\s*)$')

stats = {"reassign": 0, "drop_station": 0, "drop_long_edge": 0,
         "drop_orphan_route": 0}

for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    lines = open(path, encoding='utf-8').read().splitlines(keepends=True)
    out = []
    for ln in lines:
        sm = STATION_LINE_RE.match(ln)
        if sm:
            sid = sm.group(2)
            if sid in DROP_STATIONS:
                stats["drop_station"] += 1
                continue
            if sid in COUNTRY_REASSIGN:
                stats["reassign"] += 1
                p1, _, p2, name, p3, native, p4, cc, suf = sm.groups()
                ln = f"{p1}{sid}{p2}{name}{p3}{native}{p4}{COUNTRY_REASSIGN[sid]}{suf}"
            out.append(ln); continue
        rm = ROUTE_LINE_RE.match(ln)
        if rm:
            f, t, line_label = rm.group(2), rm.group(4), rm.group(6)
            if f in DROP_STATIONS or t in DROP_STATIONS:
                stats["drop_orphan_route"] += 1
                continue
            if line_label in AUTO_LABELS and f in stations and t in stations:
                d = hv(stations[f]["lat"], stations[f]["lng"],
                       stations[t]["lat"], stations[t]["lng"])
                if d > 300:
                    stats["drop_long_edge"] += 1
                    continue
        out.append(ln)
    open(path, 'w', encoding='utf-8').write("".join(out))

print("=== fixes applied ===")
for k, v in stats.items():
    print(f"  {k}: {v}")
