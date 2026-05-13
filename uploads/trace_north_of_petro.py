"""Trace what's reachable along the Kola corridor (Petrozavodsk →
Murmansk lat range 62-69, lng 28-40) from a Moscow origin. The user
reports contours plateau 'above Petrozavodsk' — i.e., north of it
along the Kola Line."""
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

def dijk(origin):
    dist = {origin: 0}
    pq = [(0, origin)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, 1e18): continue
        for v, w in adj.get(u, []):
            nd = d + w
            if nd < dist.get(v, 1e18):
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist

for origin in ("moscow", "stpetersburg", "petrozavodsk"):
    print(f"\n=== From {origin} ===")
    dist = dijk(origin)
    # Get all stations along Kola corridor (lng 28-40, lat 62-69)
    items = []
    for sid, (nm, cc, lat, lng) in stations.items():
        if cc != "RU": continue
        if not (28 <= lng <= 40 and 60 <= lat <= 69.5): continue
        d = dist.get(sid)
        if d is None: continue
        items.append((lat, d, sid, nm, lng))
    items.sort(reverse=True)
    # Show only those between 60-69N, with time
    print("Kola corridor stations (north→south) reachable from this origin:")
    print(f"  {'lat':>6}  {'time':>6}  name")
    last_d = None
    for lat, d, sid, nm, lng in items:
        if last_d is not None:
            diff = d - last_d
            flag = "  ← gap >1h" if diff > 1.0 else ""
        else:
            flag = ""
        print(f"  {lat:6.2f}N {d:6.2f}h  {nm}{flag}")
        last_d = d
