"""Simulate the app's Dijkstra from a chosen origin to debug reachability."""
import re, heapq, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import math

stations = {}
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'id:\s*"([a-zA-Z0-9_]+)",[^}]*?name:\s*"([^"]+)",[^}]*?country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        stations[m.group(1)] = (m.group(2), m.group(3), float(m.group(4)), float(m.group(5)))

print(f"stations loaded: {len(stations)}")

routes = []
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)",\s*h:\s*([0-9\.]+)', s):
        routes.append((m.group(1), m.group(2), float(m.group(3))))

print(f"routes loaded: {len(routes)}")

# Build adjacency matching the app's dedup logic
adj = {}
seen = set()
for f, t, h in routes:
    k1 = f"{f}|{t}"; k2 = f"{t}|{f}"
    if k1 in seen or k2 in seen:
        continue
    seen.add(k1)
    adj.setdefault(f, []).append((t, h))
    adj.setdefault(t, []).append((f, h))

# Dijkstra
def dijk(origin):
    dist = {origin: 0}
    prev = {}
    pq = [(0, origin)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, 1e18): continue
        for v, w in adj.get(u, []):
            nd = d + w
            if nd < dist.get(v, 1e18):
                dist[v] = nd
                prev[v] = u
                heapq.heappush(pq, (nd, v))
    return dist, prev

import os
origin = os.environ.get("ORIGIN", "murmansk")
dist, prev = dijk(origin)
print(f"\nFrom {origin} — {len(dist)} reachable nodes")

# Count by time bucket
buckets = [0,3,6,12,18,24,30,36,42,48,72,168]
counts = [0]*(len(buckets)-1)
for d in dist.values():
    for i in range(len(buckets)-1):
        if buckets[i] <= d < buckets[i+1]:
            counts[i] += 1; break
print("\ntime buckets:")
for i in range(len(buckets)-1):
    print(f"  {buckets[i]:>3}-{buckets[i+1]:>3}h: {counts[i]}")

print("\nSample reachable stations beyond 30h (further than Moscow corridor):")
shown = 0
for sid, d in sorted(dist.items(), key=lambda x: x[1]):
    if d < 30 or d > 48: continue
    nm, cc, _, _ = stations[sid]
    print(f"  {d:5.2f}h  {sid:25} {nm} ({cc})")
    shown += 1
    if shown >= 30: break

print(f"\nTotal reachable within 48h: {sum(1 for d in dist.values() if d <= 48)}")
print(f"Total reachable within 24h: {sum(1 for d in dist.values() if d <= 24)}")
