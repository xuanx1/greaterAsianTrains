"""Inspect freshly loaded HOTOSM files: CN/TW points & TW lines.
Focus on stations relevant for passenger rail (filter by railway tag)."""
import json, sys, io
from collections import Counter
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

for path, label in [
    (r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\hotosm_chn_railways_points_geojson.geojson', 'CN points'),
    (r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\hotosm_twn_railways_points_geojson.geojson', 'TW points'),
]:
    print(f"\n=== {label} ===")
    d = json.load(open(path, encoding='utf-8'))
    feats = d['features']
    print(f"features: {len(feats)}")
    rail_tags = Counter(f['properties'].get('railway') for f in feats)
    print(f"railway tag counts (top 15):")
    for t, c in rail_tags.most_common(15):
        print(f"  {t}: {c}")
    # sample station / stop tag
    stations_only = [f for f in feats if f['properties'].get('railway') == 'station']
    print(f"railway=station: {len(stations_only)}")
    if stations_only:
        print("sample stations:")
        for f in stations_only[:6]:
            p = f['properties']
            geom = f['geometry']
            coords = geom.get('coordinates', [None, None])
            print(f"  name='{p.get('name')}' name:en='{p.get('name:en')}' name:zh='{p.get('name:zh')}' [{coords[1]:.3f},{coords[0]:.3f}]")
