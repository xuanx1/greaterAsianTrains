"""Peek at the 92MB global railways.geojson — what features does it have?"""
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from collections import Counter

# Stream-read to avoid loading 92MB into memory if avoidable
# (no streaming; full load is fine for 92MB)

p = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\railways.geojson'
# Quick load — 92MB is fine for modern machines
print("Loading 92MB file…")
d = json.load(open(p, encoding='utf-8'))
print(f"top-level keys: {list(d.keys())}")
print(f"features: {len(d['features'])}")

types = Counter(f['geometry']['type'] for f in d['features'])
print(f"\ngeometry types: {types}")

# Sample point features (stations)
points = [f for f in d['features'] if f['geometry']['type'] == 'Point']
print(f"\nPoint features: {len(points)}")
if points:
    # Group by some country-identifying property
    props_keys = Counter()
    for p in points:
        props_keys.update(p['properties'].keys())
    print(f"\ntop point property keys:")
    for k, c in props_keys.most_common(20):
        print(f"  {k}: {c}")
    print(f"\nsample points:")
    for p in points[:5]:
        print(f"  props: {p['properties']}")
        print(f"  coords: {p['geometry']['coordinates']}")
