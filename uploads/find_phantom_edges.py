"""Find phantom cross-country edges that shouldn't exist.

K-NN with a pool-wide candidate set will happily connect two stations
across an international border or a sea strait whenever they happen to
be within the 200-300 km radius. Examples the user flagged:
  - Mandalay (MM) ↔ India
  - Mary (TM) ↔ Uzbekistan (might be real Trans-Caspian)
  - Korsakov (Sakhalin RU) ↔ Hokkaido (JP) — no rail link, La Pérouse Strait

This script lists all cross-country edges by source-line, so we can
spot which ones came from K-NN ingest vs curated routes.
"""
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

stations = {}
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'id:\s*"([a-zA-Z0-9_]+)",[^}]*?name:\s*"([^"]+)",[^}]*?country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        stations[m.group(1)] = (m.group(2), m.group(3), float(m.group(4)), float(m.group(5)))

xb = []
for path, lbl in [(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js', 'data'),
                  (r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js', 'extra'),
                  (r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js', 'ru')]:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)",[^}]*?line:\s*"([^"]*)"', s):
        f, t, line = m.group(1), m.group(2), m.group(3)
        if f not in stations or t not in stations: continue
        fnm, fcc, *_ = stations[f]
        tnm, tcc, *_ = stations[t]
        if fcc != tcc:
            xb.append((fcc, tcc, fnm, tnm, line, lbl, f, t))

print(f"total cross-country edges: {len(xb)}")
from collections import Counter
print("\nby (from→to country):")
for k, n in Counter((a, b) for a, b, *_ in xb).most_common(30):
    print(f"  {k}: {n}")
print("\nby line label (first 25):")
for k, n in Counter(x[4] for x in xb).most_common(25):
    print(f"  '{k}': {n}")

# Show edges with auto-generated 'line' labels (likely K-NN phantoms)
print("\n=== suspicious K-NN cross-country edges ===")
for fcc, tcc, fnm, tnm, line, lbl, f, t in xb:
    if line in ("HOTOSM OSM ingest", "Overpass live ingest", "RZD trunk (Overpass live)",
                "RZD trunk (Trolleway gpkg, K-NN)", "K-NN bridge", "OSM connector (fallback)",
                "OSM connector (extended)", "OSM rail corridor", "OSM last-resort"):
        print(f"  {fcc}→{tcc}  {fnm} ↔ {tnm}  [{line}] {lbl} ids={f}/{t}")
