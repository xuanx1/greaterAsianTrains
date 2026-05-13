"""Find major TW stations in HOTOSM that aren't in curated data.js."""
import json, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

CURATED_TW = {
    "taipei": (25.05,121.52), "banqiao": (25.01,121.46), "taoyuan_tw":(25.01,121.21),
    "hsinchu":(24.81,121.04), "taichung":(24.11,120.62), "chiayi":(23.46,120.32),
    "tainan":(22.92,120.29), "kaohsiung":(22.69,120.31), "hualien":(23.99,121.60),
    "taitung":(22.79,121.10),
}

# Major TW cities on TRA (intercity, not MRT) we might want
TARGETS = [
    "Yilan", "Suao", "Keelung", "Zhongli", "Miaoli", "Changhua",
    "Yuanlin", "Douliu", "Toufen", "Hsinchu", "Fangliao",
    "Pingtung", "Su'ao", "Luodong",
]

d = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\hotosm_twn_railways_points_geojson.geojson', encoding='utf-8'))
feats = d['features']
print(f"total TW features: {len(feats)}")

for tgt in TARGETS:
    matches = [f for f in feats if (f['properties'].get('name:en') or '').lower().strip() == tgt.lower()]
    if not matches:
        # try partial match
        matches = [f for f in feats if tgt.lower() in (f['properties'].get('name:en') or '').lower()]
    print(f"\n{tgt}: {len(matches)} match(es)")
    for f in matches[:3]:
        p = f['properties']
        c = f['geometry']['coordinates']
        print(f"  '{p.get('name:en')}' / '{p.get('name:zh')}' / '{p.get('name')}' [{c[1]:.3f},{c[0]:.3f}]")
