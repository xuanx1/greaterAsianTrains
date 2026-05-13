"""Sample several Russian origins. Flag the ones with large empty
time-buckets — those are the residual plateaus."""
import re, heapq, sys, io, math, os
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

adj = {}
seen = set()
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

# Sample origins across Russia
ORIGINS = [
    "murmansk", "moscow", "stpetersburg", "vladivostok", "khabarovsk",
    "irkutsk", "novosibirsk", "krasnoyarsk", "yekaterinburg", "kazan",
    "rostov_don", "sochi", "tynda", "severobaikalsk", "bratsk",
    "komsomolsk", "sov_gavan", "tomsk", "barnaul", "perm",
]

buckets = [0,2,4,6,9,12,15,18,24,30,36,48]
for orig in ORIGINS:
    if orig not in stations:
        print(f"{orig}: NOT FOUND"); continue
    d = dijk(orig)
    # Bucket distribution
    counts = [0]*(len(buckets)-1)
    for v in d.values():
        for i in range(len(buckets)-1):
            if buckets[i] <= v < buckets[i+1]:
                counts[i] += 1; break
    # Identify the biggest empty/low bucket
    flat_runs = []
    cur_start = None
    cur_len = 0
    for i in range(len(buckets)-1):
        if counts[i] < 3:
            if cur_start is None:
                cur_start = buckets[i]
            cur_len = buckets[i+1] - cur_start
        else:
            if cur_start is not None and cur_len >= 6:
                flat_runs.append((cur_start, cur_start + cur_len))
            cur_start = None; cur_len = 0
    if cur_start is not None and cur_len >= 6:
        flat_runs.append((cur_start, cur_start + cur_len))
    line = " ".join(f"{c:>3}" for c in counts)
    flag = "  PLATEAU " + str(flat_runs) if flat_runs else ""
    print(f"{orig:20} {line}{flag}")

print(f"\nbuckets: {' '.join(f'{buckets[i]:>2}-{buckets[i+1]:>2}h' for i in range(len(buckets)-1))}")
