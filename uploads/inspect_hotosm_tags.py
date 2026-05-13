"""Look at all property tags on stations to find intercity-only filters."""
import json, sys, io
from collections import Counter
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

for path, label in [
    (r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\hotosm_chn_railways_points_geojson.geojson', 'CN'),
    (r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\hotosm_twn_railways_points_geojson.geojson', 'TW'),
]:
    print(f"\n=== {label} ===")
    d = json.load(open(path, encoding='utf-8'))
    feats = d['features']
    keys = Counter()
    for f in feats:
        keys.update(f['properties'].keys())
    print(f"prop key freq (top 20):")
    for k, c in keys.most_common(20):
        print(f"  {k}: {c}")
    # potential filter tags
    for tag in ('station', 'usage', 'service', 'subway', 'light_rail', 'operator', 'network'):
        vals = Counter(f['properties'].get(tag) for f in feats)
        if any(v for k,v in vals.items() if k):
            print(f"  >> {tag} values:")
            for k,v in vals.most_common(10):
                if k: print(f"     {k}: {v}")
