"""See what countries the global railways.geojson covers."""
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from collections import Counter

p = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\railways.geojson'
print("Loading…")
d = json.load(open(p, encoding='utf-8'))
points = [f for f in d['features'] if f['geometry']['type'] == 'Point']
print(f"point features: {len(points)}")
by_country = Counter()
for f in points:
    c = f['properties'].get('adm0_name') or f['properties'].get('adm0_pcode') or 'UNKNOWN'
    by_country[c] += 1
print("\nstations per country:")
for c, n in by_country.most_common(40):
    print(f"  {c:30} {n}")

# Also check Iran points file
import json
p2 = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\hotosm_irn_railways_points_geojson.geojson'
d2 = json.load(open(p2, encoding='utf-8'))
print(f"\nIRN points file: {len(d2['features'])} features")
station_count = sum(1 for f in d2['features'] if f['properties'].get('railway') == 'station' and (f['properties'].get('name') or f['properties'].get('name:en')))
print(f"  with railway=station and name: {station_count}")
for f in d2['features'][:3]:
    p = f['properties']
    print(f"  sample: name='{p.get('name')}' name:en='{p.get('name:en')}' railway='{p.get('railway')}'")
