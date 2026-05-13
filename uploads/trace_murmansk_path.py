"""Trace why Murmansk plateaus at 6-12h. List all stations within 12 h
in order, showing what's reachable and what gaps remain."""
import re, heapq, sys, io, math
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

stations = {}
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'id:\s*"([a-zA-Z0-9_]+)",[^}]*?name:\s*"([^"]+)",[^}]*?country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        stations[m.group(1)] = (m.group(2), m.group(3), float(m.group(4)), float(m.group(5)))

routes = []
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)",\s*h:\s*([0-9\.]+)', s):
        routes.append((m.group(1), m.group(2), float(m.group(3))))

adj = {}; seen = set()
for f, t, h in routes:
    k = tuple(sorted([f, t]))
    if k in seen: continue
    seen.add(k)
    adj.setdefault(f, []).append((t, h))
    adj.setdefault(t, []).append((f, h))

# Dijkstra from murmansk
dist = {"murmansk": 0}
prev = {}
pq = [(0, "murmansk")]
while pq:
    d, u = heapq.heappop(pq)
    if d > dist.get(u, 1e18): continue
    for v, w in adj.get(u, []):
        nd = d + w
        if nd < dist.get(v, 1e18):
            dist[v] = nd
            prev[v] = u
            heapq.heappush(pq, (nd, v))

# All RU stations within 12h
print("RU stations reachable within 12h from Murmansk (sorted by time):")
items = []
for sid, d in dist.items():
    if d > 12: continue
    nm, cc, lat, lng = stations[sid]
    if cc != "RU": continue
    items.append((d, sid, nm, lat, lng))
items.sort()
for d, sid, nm, lat, lng in items:
    pid = prev.get(sid, "")
    pnm = stations[pid][0] if pid else ""
    print(f"  {d:5.2f}h  {sid:25} {nm:30} ({lat:.2f}N, {lng:.2f}E) via {pnm}")

# All gpkg-imported stations between Loukhi (66.07) and Petrozavodsk (61.79)
print("\nAll stations between Petrozavodsk (61.8N) and Loukhi (66.1N), east of Karelia (30-40E):")
for sid, (nm, cc, lat, lng) in stations.items():
    if cc != "RU": continue
    if not (61.7 <= lat <= 66.2): continue
    if not (30.0 <= lng <= 40.0): continue
    d = dist.get(sid)
    print(f"  {sid:25} {nm:35} ({lat:.2f}N, {lng:.2f}E) dist={d}")
