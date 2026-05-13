"""Audit current edges: edges per station, fan-out distribution,
percentage of stations with no English name, etc."""
import re, sys, io, math
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from collections import Counter, defaultdict

stations = {}
no_en = []
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*id:\s*"([a-zA-Z0-9_]+)",\s*name:\s*"([^"]*)",\s*native:\s*"([^"]*)",\s*country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        sid, en, native, cc, lat, lng = m.group(1), m.group(2), m.group(3), m.group(4), float(m.group(5)), float(m.group(6))
        stations[sid] = {"name": en, "native": native, "country": cc, "lat": lat, "lng": lng}
        # Has English name if the `name` field is not Cyrillic / CJK / Arabic
        # Quick check: any ASCII letter present
        has_ascii = any('a' <= c.lower() <= 'z' for c in en)
        if not has_ascii:
            no_en.append((sid, en, native, cc))

print(f"total stations: {len(stations)}")
print(f"stations with no ASCII letter in name: {len(no_en)}")
print(f"by country:")
for cc, n in Counter(x[3] for x in no_en).most_common(15):
    print(f"  {cc}: {n}")
print(f"\nsamples (first 12):")
for sid, en, native, cc in no_en[:12]:
    print(f"  {cc} {sid:25} name='{en}' native='{native}'")

# Edges per station + line label breakdown
edges = defaultdict(list)  # sid -> list of (neighbor, line_label)
all_edges = []
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)",[^}]*?h:\s*([0-9\.]+),[^}]*?line:\s*"([^"]*)"', s):
        f, t, h, line = m.group(1), m.group(2), float(m.group(3)), m.group(4)
        edges[f].append((t, line))
        edges[t].append((f, line))
        all_edges.append((f, t, line))

print(f"\ntotal edges: {len(all_edges)}")
print(f"edges by line label (top 10):")
for line, n in Counter(e[2] for e in all_edges).most_common(10):
    print(f"  '{line}': {n}")

# Fan-out distribution
fanout = [len(v) for v in edges.values()]
print(f"\nfan-out distribution:")
for bucket in [0, 1, 2, 3, 5, 10, 20]:
    n = sum(1 for x in fanout if x >= bucket)
    print(f"  ≥{bucket} edges: {n}")
print(f"  max fan-out: {max(fanout)}")
hi = sorted(edges.items(), key=lambda x: -len(x[1]))[:5]
print("  highest fan-out stations:")
for sid, conns in hi:
    s = stations.get(sid, {})
    print(f"    {sid:25} {s.get('name', '?'):30} ({s.get('country','?')}) — {len(conns)} edges")
