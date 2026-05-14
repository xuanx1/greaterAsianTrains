"""Convert uploads/asia_europe_border.geojson into a compact JS file
the runtime loads as `window.CONTINENT_DIVIDE_LINES` — an array of
LineString-coordinate arrays. Douglas-Peucker-simplified at a tolerance
appropriate for the Asia-wide map zoom; full-detail source is ~624 KB
and 18k points, which is overkill for a thin reference overlay."""
import json, math, io, sys

SRC = "uploads/asia_europe_border.geojson"
OUT = "data_continents.js"
TOL = 0.04  # ~4 km perpendicular distance — visible at zoom level 10+

def simplify(line, tol):
    if len(line) < 3: return line
    def perp(p, a, b):
        ax, ay = a; bx, by = b; px, py = p
        dx, dy = bx-ax, by-ay
        ll = dx*dx + dy*dy
        if ll == 0: return math.hypot(px-ax, py-ay)
        t = max(0, min(1, ((px-ax)*dx + (py-ay)*dy) / ll))
        cx, cy = ax + t*dx, ay + t*dy
        return math.hypot(px-cx, py-cy)
    def rec(pts):
        if len(pts) <= 2: return pts
        a, b = pts[0], pts[-1]
        idx, dmax = 0, 0
        for i in range(1, len(pts)-1):
            d = perp(pts[i], a, b)
            if d > dmax: dmax, idx = d, i
        if dmax > tol:
            l = rec(pts[:idx+1]); r = rec(pts[idx:])
            return l[:-1] + r
        return [a, b]
    return rec(line)

with open(SRC, encoding="utf-8") as f:
    g = json.load(f)

raw_lines = []
for feat in g["features"]:
    geom = feat["geometry"]
    if geom["type"] == "LineString":
        raw_lines.append(geom["coordinates"])
    elif geom["type"] == "MultiLineString":
        raw_lines.extend(geom["coordinates"])

# The source geojson breaks the Asia/Europe boundary into 464 short
# fragments that share endpoints. Merge them into long chains so the
# label sampler (which walks each chain at a fixed pixel interval)
# can place many labels per chain instead of one per tiny fragment.
def round_pt(p):  return (round(p[0], 4), round(p[1], 4))

ends = {}
for i, line in enumerate(raw_lines):
    if len(line) < 2: continue
    a, b = round_pt(line[0]), round_pt(line[-1])
    ends.setdefault(a, []).append(("s", i))
    ends.setdefault(b, []).append(("e", i))

used = set()
merged = []
for start_i in range(len(raw_lines)):
    if start_i in used: continue
    if len(raw_lines[start_i]) < 2: continue
    used.add(start_i)
    chain = list(raw_lines[start_i])
    # Extend forward from the end of `chain`
    while True:
        tail = round_pt(chain[-1])
        nxt = None
        for side, j in ends.get(tail, []):
            if j in used: continue
            nxt = (side, j); break
        if not nxt: break
        side, j = nxt
        used.add(j)
        seg = raw_lines[j]
        if side == "s":
            chain.extend(seg[1:])  # already at start of seg
        else:
            chain.extend(reversed(seg[:-1]))
    # Extend backward from the start of `chain`
    while True:
        head = round_pt(chain[0])
        nxt = None
        for side, j in ends.get(head, []):
            if j in used: continue
            nxt = (side, j); break
        if not nxt: break
        side, j = nxt
        used.add(j)
        seg = raw_lines[j]
        if side == "e":
            chain[0:0] = seg[:-1]
        else:
            chain[0:0] = list(reversed(seg[1:]))
    merged.append(chain)

print(f"merge: {len(raw_lines)} fragments → {len(merged)} chains", file=sys.stderr)
simplified = [simplify(l, TOL) for l in merged]
simplified = [l for l in simplified if len(l) >= 2]

total_pts = sum(len(l) for l in simplified)
print(f"output: {len(simplified)} chains, {total_pts} points", file=sys.stderr)

out = io.StringIO()
out.write("// AUTO-GENERATED from uploads/asia_europe_border.geojson via\n")
out.write("// uploads/build_continents.py. Douglas-Peucker-simplified at\n")
out.write(f"// {TOL}° tolerance for compact runtime delivery. Each entry is\n")
out.write("// one segment of the Europe/Asia continental boundary — Urals,\n")
out.write("// Ural River, Caspian shore, Caucasus crest, Bosphorus & Aegean.\n")
out.write("window.CONTINENT_DIVIDE_LINES = [\n")
for seg in simplified:
    coords = ",".join(f"[{lng:.3f},{lat:.3f}]" for lng, lat in seg)
    out.write(f"  [{coords}],\n")
out.write("];\n")

with open(OUT, "w", encoding="utf-8") as f:
    f.write(out.getvalue())

import os
print(f"wrote {OUT} ({os.path.getsize(OUT):,} bytes)", file=sys.stderr)
