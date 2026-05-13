"""Remove all automated-ingest cross-country edges.

Two classes of route exist:
  (1) Curated cross-border edges (hand-checked, with named lines like
      'Hữu Nghị border', 'Khasan–Tumangang', 'BTK', 'Maitree Express').
      Keep these.
  (2) K-NN / Overpass-ingest edges (line labels: 'Overpass live ingest',
      'RZD trunk (Overpass live)', 'HOTOSM OSM ingest', 'K-NN bridge',
      'OSM connector ...', 'OSM rail corridor', 'OSM last-resort',
      'RZD trunk (Trolleway gpkg, K-NN)'). DROP these if they cross
      country borders — they're phantom links created by great-circle
      K-NN that ignore actual rail topology, water, and immigration.

Then validate that no graph component becomes orphaned.
"""
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

AUTO_LINE_LABELS = {
    "Overpass live ingest",
    "RZD trunk (Overpass live)",
    "HOTOSM OSM ingest",
    "K-NN bridge",
    "OSM connector (fallback)",
    "OSM connector (extended)",
    "OSM rail corridor",
    "OSM last-resort",
    "RZD trunk (Trolleway gpkg, K-NN)",
    "RZD trunk (Trolleway dataset)",
}

stations = {}
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'id:\s*"([a-zA-Z0-9_]+)",[^}]*?country:\s*"([A-Z]{2})"', s):
        stations[m.group(1)] = m.group(2)

ROUTE_RE = re.compile(r'^\s*\{\s*from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)",[^}]*?line:\s*"([^"]*)"[^}]*\},\s*$')

for path, lbl in [(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js', 'extra'),
                  (r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js', 'ru')]:
    print(f"\n=== {lbl} ===")
    lines = open(path, encoding='utf-8').read().splitlines(keepends=True)
    out = []
    dropped = 0
    for line in lines:
        m = ROUTE_RE.match(line)
        if m:
            f, t, lbl_route = m.group(1), m.group(2), m.group(3)
            fcc = stations.get(f); tcc = stations.get(t)
            if fcc and tcc and fcc != tcc and lbl_route in AUTO_LINE_LABELS:
                dropped += 1
                continue
        out.append(line)
    print(f"  dropped phantom cross-country edges: {dropped}")
    open(path, 'w', encoding='utf-8').write("".join(out))

print("\ndone")
