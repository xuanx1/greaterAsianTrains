"""Use the Natural Earth countries-50m.json to detect stations whose
coordinates don't fall inside their claimed country's polygon."""
import json, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load the basemap, convert topojson countries to plain GeoJSON-style polygons.
basemap_path = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\assets\countries-50m.json'
data = json.load(open(basemap_path, encoding='utf-8'))

# Topojson decoder (minimal): expand arcs into coords using transform.
def decode_topojson(topo):
    if topo['type'] != 'Topology':
        raise ValueError('not topology')
    t = topo['transform']
    sx, sy = t['scale']
    tx, ty = t['translate']
    arcs = []
    for arc in topo['arcs']:
        x, y = 0, 0
        out = []
        for dx, dy in arc:
            x += dx; y += dy
            out.append((x * sx + tx, y * sy + ty))
        arcs.append(out)
    return arcs

arcs = decode_topojson(data)

def expand_ring(arc_idxs):
    coords = []
    for i in arc_idxs:
        idx = i if i >= 0 else ~i
        ring = arcs[idx]
        if i < 0:
            ring = list(reversed(ring))
        if coords:
            coords.extend(ring[1:])
        else:
            coords.extend(ring)
    return coords

def expand_polygon(poly):
    return [expand_ring(r) for r in poly]

def feature_to_polygons(feat):
    # topojson features have geometry inlined at the top level
    if feat['type'] == 'Polygon':
        return [expand_polygon(feat['arcs'])]
    elif feat['type'] == 'MultiPolygon':
        return [expand_polygon(p) for p in feat['arcs']]
    return []

# Build mapping ISO_A2 → list of polygons
# countries-50m features have properties: name, id (numeric M49). We need name → ISO-2.
ISO2_BY_NAME = {
    "Russia": "RU", "China": "CN", "Mongolia": "MN", "Japan": "JP",
    "South Korea": "KR", "North Korea": "KP", "Vietnam": "VN", "Thailand": "TH",
    "Cambodia": "KH", "Laos": "LA", "Myanmar": "MM", "Malaysia": "MY",
    "Singapore": "SG", "Indonesia": "ID", "Philippines": "PH",
    "India": "IN", "Bangladesh": "BD", "Bhutan": "BT", "Nepal": "NP",
    "Sri Lanka": "LK", "Pakistan": "PK", "Afghanistan": "AF",
    "Iran": "IR", "Iraq": "IQ", "Syria": "SY", "Lebanon": "LB",
    "Israel": "IL", "Palestine": "PS", "Jordan": "JO",
    "Saudi Arabia": "SA", "Yemen": "YE", "Oman": "OM", "United Arab Emirates": "AE",
    "Qatar": "QA", "Kuwait": "KW", "Bahrain": "BH", "Turkey": "TR",
    "Georgia": "GE", "Armenia": "AM", "Azerbaijan": "AZ",
    "Kazakhstan": "KZ", "Uzbekistan": "UZ", "Turkmenistan": "TM",
    "Tajikistan": "TJ", "Kyrgyzstan": "KG",
    "Taiwan": "TW",
}
# Hong Kong is part of CN in Natural Earth at 50m. Treat 'cn' subregion match
# as 'HK' if within HK bbox.

polygons_by_cc = {}
for feat in data['objects']['countries']['geometries']:
    name = feat.get('properties', {}).get('name', '')
    cc = ISO2_BY_NAME.get(name)
    if not cc: continue
    polygons_by_cc.setdefault(cc, []).extend(feature_to_polygons(feat))

print(f"loaded polygons for {len(polygons_by_cc)} countries")

# Ray-cast point-in-polygon
def in_ring(x, y, ring):
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]; xj, yj = ring[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi):
            inside = not inside
        j = i
    return inside

def in_polygon(x, y, poly):
    # First ring is outer, rest are holes
    if not poly: return False
    if not in_ring(x, y, poly[0]): return False
    for hole in poly[1:]:
        if in_ring(x, y, hole): return False
    return True

def country_for_point(lng, lat):
    # Hong Kong / Singapore special-case (basemap may treat them as part of CN/MY)
    if 22.1 <= lat <= 22.6 and 113.8 <= lng <= 114.5: return "HK"
    if 1.2 <= lat <= 1.5 and 103.5 <= lng <= 104.1: return "SG"
    for cc, polys in polygons_by_cc.items():
        for poly in polys:
            if in_polygon(lng, lat, poly):
                return cc
    return None

# Load stations
stations = []
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*id:\s*"([a-zA-Z0-9_]+)",\s*name:\s*"([^"]*)",\s*native:\s*"([^"]*)",\s*country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        stations.append({"id": m.group(1), "name": m.group(2), "country": m.group(4),
                          "lat": float(m.group(5)), "lng": float(m.group(6))})
print(f"stations: {len(stations)}")

mismatched = []
for s in stations:
    actual = country_for_point(s["lng"], s["lat"])
    if actual and actual != s["country"]:
        mismatched.append((s, actual))

print(f"\nstations whose actual polygon country ≠ claimed: {len(mismatched)}")
from collections import Counter
print("by (claimed → actual):")
for k, n in Counter((s["country"], a) for s, a in mismatched).most_common(20):
    print(f"  {k[0]} → {k[1]}: {n}")
print("\nfirst 30:")
for s, a in mismatched[:30]:
    print(f"  {s['id']:>30}  {s['name']:>25} claimed={s['country']} actual={a} at [{s['lat']:.2f},{s['lng']:.2f}]")

# Save full list
open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\mismatched.json', 'w', encoding='utf-8').write(
    json.dumps([{"id": s["id"], "claimed": s["country"], "actual": a,
                 "name": s["name"], "lat": s["lat"], "lng": s["lng"]}
                for s, a in mismatched], ensure_ascii=False, indent=1))
