"""Extract OSM IDs + coords for the major TW intercity TRA stations
that are missing from curated + existing OSM extras."""
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Targets: (English name, expected Chinese for disambig)
TARGETS = [
    ("Yilan",     "宜蘭"),
    ("Luodong",   "羅東"),
    ("Su'ao",     "蘇澳"),
    ("Keelung",   "基隆"),
    ("Zhongli",   "中壢"),
    ("Miaoli",    "苗栗"),
    ("Changhua",  "彰化"),
    ("Yuanlin",   "員林"),
    ("Pingtung",  "屏東"),
]

d = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\hotosm_twn_railways_points_geojson.geojson', encoding='utf-8'))
feats = d['features']

for en, zh in TARGETS:
    candidates = [f for f in feats
                  if (f['properties'].get('name:en') or '') == en
                  and (f['properties'].get('name:zh') or '') == zh]
    if not candidates:
        print(f"# missing: {en} / {zh}")
        continue
    # Prefer the one with the higher osm_id (typically the more-maintained record),
    # or just the first. For Miaoli & Changhua there are two — pick the one closer
    # to the TRA mainline (~city centre).
    f = candidates[0]
    p = f['properties']
    c = f['geometry']['coordinates']
    print(f'  {{ id: "osm_tw_{p["osm_id"]}", name: "{en}", native: "{zh}", country: "TW", lat: {round(c[1],4)}, lng: {round(c[0],4)} }},  // {len(candidates)} cand')
