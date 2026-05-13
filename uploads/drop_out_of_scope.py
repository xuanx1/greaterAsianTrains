"""Drop stations that fall outside the Asia rail-reach atlas scope.

Two categories:
  1. RU-tagged stations whose actual polygon is in FI / PL / LT / UA /
     BY / LV / EE / MD / RO — Overpass bbox leak across Russia's
     western and Karelian borders. None of these countries are in the
     app's REGIONS list.
  2. JO-tagged stations (Jordan is explicitly in HATCH_COUNTRY_IDS as
     'Hejaz heritage only' — no scheduled passenger rail) and the lone
     'osm_il_10716097829 Aqaba' which is geographically in Jordan.

Also drop any incident routes so nothing dangles.
"""
import json, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Reuse polygon checker
basemap = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\assets\countries-50m.json', encoding='utf-8'))
t = basemap['transform']; sx,sy=t['scale']; tx,ty=t['translate']
arcs=[]
for arc in basemap['arcs']:
    x=y=0; out=[]
    for dx,dy in arc:
        x+=dx; y+=dy; out.append((x*sx+tx, y*sy+ty))
    arcs.append(out)
def expand_ring(idx):
    o=[]
    for i in idx:
        ar = arcs[i if i>=0 else ~i]
        if i<0: ar = list(reversed(ar))
        o.extend(ar[1:] if o else ar)
    return o
def feat_polys(f):
    if f['type']=='Polygon': return [[expand_ring(r) for r in f['arcs']]]
    if f['type']=='MultiPolygon': return [[expand_ring(r) for r in p] for p in f['arcs']]
    return []
NAMES = {"Finland":"FI","Poland":"PL","Lithuania":"LT","Latvia":"LV","Estonia":"EE",
         "Belarus":"BY","Ukraine":"UA","Moldova":"MD","Romania":"RO","Jordan":"JO"}
polys = {}
for f in basemap['objects']['countries']['geometries']:
    cc = NAMES.get(f.get('properties',{}).get('name',''))
    if cc: polys.setdefault(cc,[]).extend(feat_polys(f))

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
    for cc,pp in polys.items():
        for p in pp:
            if in_poly(lng,lat,p): return cc
    return None

# Load all stations
stations = {}
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*id:\s*"([a-zA-Z0-9_]+)",\s*name:\s*"([^"]*)",\s*native:\s*"([^"]*)",\s*country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        stations[m.group(1)] = {"name":m.group(2),"country":m.group(4),
                                 "lat":float(m.group(5)),"lng":float(m.group(6))}

OUT_OF_SCOPE = {"FI","PL","LT","UA","BY","LV","EE","MD","RO","JO"}
to_drop = set()
for sid, s in stations.items():
    actual = cc_of(s["lng"], s["lat"])
    if actual in OUT_OF_SCOPE:
        to_drop.add(sid)
    # also drop any station claimed as JO
    if s["country"] == "JO":
        to_drop.add(sid)

print(f"will drop {len(to_drop)} stations:")
from collections import Counter
print("by claimed→actual:")
for k, n in Counter((stations[sid]["country"], cc_of(stations[sid]["lng"], stations[sid]["lat"])) for sid in to_drop).most_common():
    print(f"  {k[0]} → {k[1]}: {n}")

# Apply: drop station lines + any route lines referencing dropped ids.
STATION_RE = re.compile(r'^\s*\{\s*id:\s*"([a-zA-Z0-9_]+)"')
ROUTE_RE  = re.compile(r'^\s*\{\s*from:\s*"([^"]+)",\s*to:\s*"([^"]+)"')

for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    lines = open(path, encoding='utf-8').read().splitlines(keepends=True)
    out = []
    sd = rd = 0
    for ln in lines:
        m = STATION_RE.match(ln)
        if m and m.group(1) in to_drop:
            sd += 1; continue
        rm = ROUTE_RE.match(ln)
        if rm and (rm.group(1) in to_drop or rm.group(2) in to_drop):
            rd += 1; continue
        out.append(ln)
    open(path, 'w', encoding='utf-8').write("".join(out))
    print(f"  {path.split(chr(92))[-1]}: -{sd} stations, -{rd} routes")
