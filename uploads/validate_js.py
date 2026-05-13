"""Crude JS validation: parse station ids and route from-ids by regex.
Verify every route.from exists in stations, no dup ids, route.to either
exists in extras or is a curated RU id (from data.js)."""
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

text = open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js', encoding='utf-8').read()
st_ids = re.findall(r'id:\s*"(ru_\d+)"', text)
rt_pairs = re.findall(r'from:\s*"(ru_\d+)",\s*to:\s*"([^"]+)"', text)
print(f"stations: {len(st_ids)}, unique: {len(set(st_ids))}")
print(f"routes:   {len(rt_pairs)}")
st_set = set(st_ids)
orphans = [p for p in rt_pairs if p[0] not in st_set]
print(f"orphan from: {len(orphans)}")

# Verify each route.to is either a curated RU id or another ru_*
curated_text = open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js', encoding='utf-8').read()
curated_ids = set(re.findall(r'id:\s*"([a-z_]+)"', curated_text))
bad_targets = [p for p in rt_pairs if p[1] not in curated_ids and p[1] not in st_set]
print(f"routes with invalid 'to' target: {len(bad_targets)}")
for p in bad_targets[:10]:
    print("  ", p)

# every station has exactly one route?
from_counts = {}
for f, _ in rt_pairs:
    from_counts[f] = from_counts.get(f, 0) + 1
unconnected = [s for s in st_ids if s not in from_counts]
multi = [(s, c) for s, c in from_counts.items() if c > 1]
print(f"stations without any route: {len(unconnected)}")
for s in unconnected[:10]:
    print("  ", s)
print(f"stations with multiple routes: {len(multi)}")
