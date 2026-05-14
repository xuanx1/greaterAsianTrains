"""Filter Natural Earth disputed-area polygons to Asia and emit a
compact JS file (data_disputed.js) that the app loads to draw dotted
boundary outlines for each disputed territory."""
import json, math, sys, io

SRC = "uploads/ne_disputed_polys.geojson"
OUT = "data_disputed.js"

# Asia bbox matches GRID_LAT/LNG envelope used elsewhere.
LNG_MIN, LNG_MAX = 18, 148
LAT_MIN, LAT_MAX = -10, 72

# Names we explicitly want excluded — outside the Asian rail map scope
# or too small/historical to be worth a dotted overlay.
EXCLUDE = {
    "Israel",                       # whole-country polygon; not a dispute line
    "Ilemi Triangle", "Ilemi Triange",   # Africa edge (and the NE typo)
    "Bir Tawil", "Halayib Triangle",
    "Somaliland",
    "Vojvodina", "Kosovo",
    "Baykonur",                     # Russian space-launch lease, not a dispute
    "Abyei", "S. Sudan",
    "Taiwan",                       # whole-island polygon; map already shows it
    "Vukovar Island", "Šarengrad Island",
    "East Jerusalem", "Mount Scopus",
    "No Man's Land (Fort Latrun)", "No Man's Land (Jerusalem)",
    "Junagadh and Manavadar",       # historical/dormant
    "North Borneo",                 # Phil claim on Sabah — dormant
    "Diego Garcia NSF", "Br. Indian Ocean Ter.",
    "Pinnacle Is.",                 # Senkaku — too small to render meaningfully
    "Korean islands under UN jurisdiction",
    "Tiran and Sanafir Is.", "Doumera Island", "Abu Musa I.",
}

# Pretty label per BRK_NAME.
LABEL_OVERRIDE = {
    "N. Cyprus": "Northern Cyprus (TRNC)",
    "Cyprus U.N. Buffer Zone": "Cyprus UN Buffer Zone",
    "Korean Demilitarized Zone (south)": "Korean DMZ (south side)",
    "Korean Demilitarized Zone (north)": "Korean DMZ (north side)",
    "Artsakh": "Nagorno-Karabakh (Artsakh)",
    "Crimea": "Crimea (Russia–Ukraine)",
    "Abkhazia": "Abkhazia (Self admin., claimed by Georgia)",
    "South Ossetia": "South Ossetia (Self admin., claimed by Georgia)",
    "Jammu and Kashmir": "Jammu & Kashmir (Admin. India, claimed Pakistan)",
    "Aksai Chin": "Aksai Chin (Admin. China, claimed India)",
    "Arunachal Pradesh": "Arunachal Pradesh (Admin. India, claimed China)",
    "Gaza": "Gaza Strip",
    "West Bank": "West Bank",
    "Golan Heights": "Golan Heights (Admin. Israel, claimed Syria)",
    "UNDOF Zone": "Golan UNDOF Zone",
    "Shebaa Farms": "Shebaa Farms (Admin. Israel, claimed Lebanon)",
    "Donetsk People's Republic": "Donetsk PR (Self admin., claimed Ukraine)",
    "Luhansk People's Republic": "Luhansk PR (Self admin., claimed Ukraine)",
    "Transnistria": "Transnistria (Self admin., claimed Moldova)",
    "Gilgit-Baltistan": "Gilgit-Baltistan (Admin. Pakistan, claimed India)",
    "Shaksam Valley": "Shaksgam Valley (Admin. China, claimed India)",
    "Siachen Glacier": "Siachen Glacier (India/Pakistan)",
    "Demchok": "Demchok sector",
    "Samdu Valleys": "Samdu Valleys",
    "Tirpani Valleys": "Tirpani Valleys",
    "Bara Hotii Valleys": "Bara Hotii Valleys",
    "Near Om Parvat": "Om Parvat sector",
    "Bhutan (Chumbi salient)": "Bhutan – Chumbi salient (claimed China)",
    "Bhutan (northwest valleys)": "Bhutan NW valleys (claimed China)",
}

def in_asia(geom):
    if geom["type"] == "Polygon":
        rings = geom["coordinates"]
    else:
        rings = [r for poly in geom["coordinates"] for r in poly]
    for ring in rings:
        for lng, lat in ring:
            if LNG_MIN <= lng <= LNG_MAX and LAT_MIN <= lat <= LAT_MAX:
                return True
    return False

def simplify(ring, tol_deg=0.01):
    """Douglas-Peucker, perpendicular-distance threshold in degrees."""
    if len(ring) < 3: return ring
    def perp(p, a, b):
        ax, ay = a; bx, by = b; px, py = p
        dx, dy = bx-ax, by-ay
        ll = dx*dx + dy*dy
        if ll == 0: return math.hypot(px-ax, py-ay)
        t = ((px-ax)*dx + (py-ay)*dy) / ll
        t = max(0, min(1, t))
        cx, cy = ax + t*dx, ay + t*dy
        return math.hypot(px-cx, py-cy)
    def rec(pts):
        if len(pts) <= 2: return pts
        a, b = pts[0], pts[-1]
        idx, dmax = 0, 0
        for i in range(1, len(pts)-1):
            d = perp(pts[i], a, b)
            if d > dmax:
                dmax = d; idx = i
        if dmax > tol_deg:
            left = rec(pts[:idx+1])
            right = rec(pts[idx:])
            return left[:-1] + right
        return [a, b]
    return rec(ring)

with open(SRC, encoding="utf-8") as f:
    g = json.load(f)

picked = []
for feat in g["features"]:
    if not in_asia(feat["geometry"]): continue
    p = feat["properties"]
    brk = (p.get("BRK_NAME") or p.get("NAME") or "").lstrip("﻿").strip()
    if brk in EXCLUDE: continue
    label = LABEL_OVERRIDE.get(brk, brk)
    rings = []
    geom = feat["geometry"]
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    for poly in polys:
        outer = poly[0]  # outer ring only — disputed territories rarely have holes worth showing
        outer = simplify(outer, tol_deg=0.012)
        if len(outer) >= 3:
            rings.append(outer)
    if not rings: continue
    picked.append({"name": label, "rings": rings})

print(f"emitting {len(picked)} disputed areas", file=sys.stderr)
total_pts = sum(len(r) for it in picked for r in it["rings"])
print(f"total vertices: {total_pts}", file=sys.stderr)

# Emit JS
out = io.StringIO()
out.write("// AUTO-GENERATED from Natural Earth ne_10m_admin_0_disputed_areas\n")
out.write("// (uploads/build_disputed.py). Each entry is a disputed area whose\n")
out.write("// outer ring(s) the app renders as a dotted boundary line.\n")
out.write("window.DISPUTED_LINES = [\n")
for it in picked:
    out.write(f'  {{ name: {json.dumps(it["name"], ensure_ascii=False)}, rings: [\n')
    for ring in it["rings"]:
        coords = ",".join(f"[{lng:.3f},{lat:.3f}]" for lng, lat in ring)
        out.write(f"    [{coords}],\n")
    out.write("  ] },\n")
out.write("];\n")

with open(OUT, "w", encoding="utf-8") as f:
    f.write(out.getvalue())

print(f"wrote {OUT} ({len(out.getvalue())} bytes)", file=sys.stderr)
