"""Verify the user's specific complaints are now fixed."""
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

# Find specific origins
def find(name_substr, cc=None):
    matches = []
    for sid, (nm, c, lat, lng) in stations.items():
        if name_substr.lower() in nm.lower() and (cc is None or c == cc):
            matches.append((sid, nm, c, lat, lng))
    return matches

# Check Mandalay → India reach
print("\n=== MANDALAY (MM) reachable countries ===")
mand = find("Mandalay", "MM")
print(f"Mandalay candidates: {mand}")
if mand:
    dist = dijk(mand[0][0])
    from collections import Counter
    cc_count = Counter(stations[sid][1] for sid in dist if sid in stations)
    print(f"Reachable countries from Mandalay: {dict(cc_count)}")

# Check Mary → Uzbekistan
print("\n=== MARY (TM) reachable countries ===")
mary = find("Mary", "TM")
print(f"Mary candidates: {mary}")
if mary:
    dist = dijk(mary[0][0])
    from collections import Counter
    cc_count = Counter(stations[sid][1] for sid in dist if sid in stations)
    print(f"Reachable countries from Mary: {dict(cc_count)}")

# Check Korsakov (Sakhalin) → Hokkaido
print("\n=== KORSAKOV / SAKHALIN (RU) ===")
kors = find("Korsakov", "RU")
print(f"Korsakov candidates: {kors}")
# Also try generic Sakhalin
for nm in ("Sakhalin", "Yuzhno-Sakhalinsk", "Yuzno-Sakhalinsk", "Южно-Сахалинск"):
    matches = find(nm, "RU")
    if matches:
        print(f"  {nm}: {matches[:2]}")

yusno = [s for s in stations if s.startswith("ru_56")]  # ru_56 = Yuzno-Sakhalinsk in earlier data
if yusno:
    dist = dijk(yusno[0])
    from collections import Counter
    cc_count = Counter(stations[sid][1] for sid in dist if sid in stations)
    print(f"Reachable countries from Yuzhno-Sakhalinsk: {dict(cc_count)}")
    # Show Hokkaido routes
    print("Sample reachable JP stations (should be 0 — Sakhalin has no rail to Hokkaido):")
    for sid, d in sorted(((s, d) for s, d in dist.items() if stations[s][1] == "JP"), key=lambda x: x[1])[:5]:
        print(f"  {d:5.1f}h  {sid} {stations[sid][0]}")
