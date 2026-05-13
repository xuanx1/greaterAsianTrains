"""List all stations reachable from Murmansk by 18 h, sorted by lat
(north-to-south), to see if there are geographic gaps along the Kola
line corridor between Petrozavodsk and Murmansk."""
import re, heapq, sys, io
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

dist = {"murmansk": 0}
pq = [(0, "murmansk")]
while pq:
    d, u = heapq.heappop(pq)
    if d > dist.get(u, 1e18): continue
    for v, w in adj.get(u, []):
        nd = d + w
        if nd < dist.get(v, 1e18):
            dist[v] = nd
            heapq.heappush(pq, (nd, v))

print("Kola Line corridor stations (lng 28-40, lat 60-70) by lat descending:")
print("Format: lat | d_from_murmansk | name (id)")
items = []
for sid, d in dist.items():
    if d > 24: continue
    nm, cc, lat, lng = stations[sid]
    if cc != "RU": continue
    if not (28 <= lng <= 40 and 60 <= lat <= 70): continue
    items.append((lat, d, sid, nm, lng))
items.sort(reverse=True)
for lat, d, sid, nm, lng in items:
    print(f"  {lat:6.2f}N {lng:6.2f}E  {d:5.2f}h  {nm:35} ({sid})")

# Also show what's between Loukhi (66.07°N) and Petrozavodsk (61.79°N) — the 4.3° gap
print("\nStations between Loukhi (66.07) and Petrozavodsk (61.79), any reachability:")
between = []
for sid, (nm, cc, lat, lng) in stations.items():
    if cc != "RU": continue
    if not (28 <= lng <= 40 and 61.5 <= lat <= 66.1): continue
    d = dist.get(sid, None)
    between.append((lat, d, sid, nm, lng))
between.sort(reverse=True)
for lat, d, sid, nm, lng in between:
    ds = f"{d:5.2f}h" if d is not None else "  unr"
    print(f"  {lat:6.2f}N {lng:6.2f}E  {ds}  {nm:35} ({sid})")
