"""Find stations currently tagged RU but actually in FI/PL/LT/UA/BY etc.
+ Show all 'JO' stations to verify they're really in Jordan."""
import json, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Reuse the polygon checker logic from check_country_polygons.py
basemap = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\assets\countries-50m.json', encoding='utf-8'))
t = basemap['transform']
sx, sy = t['scale']; tx, ty = t['translate']
arcs = []
for arc in basemap['arcs']:
    x = y = 0; out = []
    for dx, dy in arc:
        x += dx; y += dy
        out.append((x*sx + tx, y*sy + ty))
    arcs.append(out)
def expand_ring(arc_idxs):
    coords = []
    for i in arc_idxs:
        idx = i if i >= 0 else ~i
        ring = arcs[idx]
        if i < 0: ring = list(reversed(ring))
        if coords: coords.extend(ring[1:])
        else: coords.extend(ring)
    return coords
def expand_poly(p): return [expand_ring(r) for r in p]
def feat_polys(f):
    if f['type']=='Polygon': return [expand_poly(f['arcs'])]
    if f['type']=='MultiPolygon': return [expand_poly(p) for p in f['arcs']]
    return []

ISO2 = {"Russia":"RU","China":"CN","Mongolia":"MN","Japan":"JP","South Korea":"KR",
        "North Korea":"KP","Vietnam":"VN","Thailand":"TH","Cambodia":"KH","Laos":"LA",
        "Myanmar":"MM","Malaysia":"MY","Singapore":"SG","Indonesia":"ID","India":"IN",
        "Bangladesh":"BD","Bhutan":"BT","Nepal":"NP","Sri Lanka":"LK","Pakistan":"PK",
        "Afghanistan":"AF","Iran":"IR","Iraq":"IQ","Syria":"SY","Lebanon":"LB",
        "Israel":"IL","Palestine":"PS","Jordan":"JO","Saudi Arabia":"SA","Yemen":"YE",
        "Oman":"OM","United Arab Emirates":"AE","Qatar":"QA","Kuwait":"KW","Bahrain":"BH",
        "Turkey":"TR","Georgia":"GE","Armenia":"AM","Azerbaijan":"AZ","Kazakhstan":"KZ",
        "Uzbekistan":"UZ","Turkmenistan":"TM","Tajikistan":"TJ","Kyrgyzstan":"KG",
        "Taiwan":"TW","Finland":"FI","Poland":"PL","Lithuania":"LT","Latvia":"LV",
        "Estonia":"EE","Belarus":"BY","Ukraine":"UA","Romania":"RO","Moldova":"MD"}
polys = {}
for f in basemap['objects']['countries']['geometries']:
    cc = ISO2.get(f.get('properties',{}).get('name',''))
    if cc: polys.setdefault(cc, []).extend(feat_polys(f))

def in_ring(x,y,r):
    inside=False; n=len(r); j=n-1
    for i in range(n):
        xi,yi=r[i]; xj,yj=r[j]
        if ((yi>y)!=(yj>y)) and (x<(xj-xi)*(y-yi)/((yj-yi) or 1e-12)+xi):
            inside=not inside
        j=i
    return inside
def in_poly(x,y,p):
    if not p or not in_ring(x,y,p[0]): return False
    return not any(in_ring(x,y,h) for h in p[1:])
def cc_of(lng,lat):
    if 22.1<=lat<=22.6 and 113.8<=lng<=114.5: return "HK"
    if 1.2<=lat<=1.5 and 103.5<=lng<=104.1: return "SG"
    for cc,pp in polys.items():
        for p in pp:
            if in_poly(lng,lat,p): return cc
    return None

stations = []
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*id:\s*"([a-zA-Z0-9_]+)",\s*name:\s*"([^"]*)",\s*native:\s*"([^"]*)",\s*country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        stations.append({"id":m.group(1),"name":m.group(2),"country":m.group(4),
                         "lat":float(m.group(5)),"lng":float(m.group(6))})

# Russian stations actually in FI/PL/LT/UA/BY/LV/EE/MD
print("=== 'RU' stations actually in FI/PL/LT/UA/BY/LV/EE/MD ===")
spill_cc = {"FI","PL","LT","UA","BY","LV","EE","MD","RO"}
for s in stations:
    if s["country"] != "RU": continue
    actual = cc_of(s["lng"], s["lat"])
    if actual in spill_cc:
        print(f"  {s['id']:30}  {s['name']:>30}  actual={actual}  [{s['lat']:.2f},{s['lng']:.2f}]")

print("\n=== Jordan stations ===")
for s in stations:
    if s["country"] == "JO":
        actual = cc_of(s["lng"], s["lat"])
        print(f"  {s['id']:30}  {s['name']:>30}  polygon={actual}  [{s['lat']:.2f},{s['lng']:.2f}]")

# Also check if there are ANY stations whose polygon is a European country (FI/PL/LT/UA/BY)
print("\n=== ANY stations actually inside FI/PL/LT/UA/BY/LV/EE/MD/RO (regardless of claim) ===")
for s in stations:
    actual = cc_of(s["lng"], s["lat"])
    if actual in spill_cc:
        print(f"  {s['id']:30}  {s['name']:>30}  claim={s['country']}  actual={actual}  [{s['lat']:.2f},{s['lng']:.2f}]")
