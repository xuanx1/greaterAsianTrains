"""Reassign country for auto-imported stations whose Natural Earth
polygon disagrees with the claimed country.

Skip curated stations (hand-picked country attribution is intentional
even at borders — e.g., 'darshana' is a curated India-Bangladesh
crossing). Skip a few politically-charged borders the basemap handles
fuzzily (RU/GE Abkhazia, AM/AZ Karabakh, IL/PS Jerusalem).

After reassignment, rerun strip_phantom_borders so newly-cross-border
auto edges get pruned, then rerun rebuild_knn_chains to relay chains
within the corrected country graphs.
"""
import json, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Skip these claimed→actual pairs as known fuzzy/political borders
SKIP_PAIRS = {
    ("RU", "GE"),   # Abkhazia / South Ossetia
    ("GE", "RU"),
    ("AM", "AZ"),   # Nagorno-Karabakh
    ("AZ", "AM"),
    ("IL", "PS"),   # Jerusalem / West Bank
}

# Treat curated cross-border crossings as intentional — don't reassign.
# Curated id list: anything NOT starting with 'osm_' or matching r'^ru_\d+'.
def is_curated(sid):
    return not (sid.startswith("osm_") or re.fullmatch(r"ru_\d+", sid))

d = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\mismatched.json', encoding='utf-8'))
reassign = {}
for x in d:
    sid = x["id"]
    if is_curated(sid): continue
    if (x["claimed"], x["actual"]) in SKIP_PAIRS: continue
    reassign[sid] = x["actual"]
print(f"will reassign {len(reassign)} stations")
from collections import Counter
print("by (from → to):")
for k, n in Counter((x["claimed"], reassign[x["id"]])
                    for x in d if x["id"] in reassign).most_common():
    print(f"  {k[0]} → {k[1]}: {n}")

# Apply the rewrite
STATION_LINE_RE = re.compile(r'^(\s*\{\s*id:\s*")([a-zA-Z0-9_]+)("\s*,\s*name:\s*")([^"]*)("\s*,\s*native:\s*")([^"]*)("\s*,\s*country:\s*")([A-Z]{2})("[^}]*\},\s*)$')

for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    n_changed = 0
    out_lines = []
    for ln in s.splitlines(keepends=True):
        m = STATION_LINE_RE.match(ln)
        if m and m.group(2) in reassign:
            p1, sid, p2, name, p3, native, p4, cc, suf = m.groups()
            new_cc = reassign[sid]
            ln = f"{p1}{sid}{p2}{name}{p3}{native}{p4}{new_cc}{suf}"
            n_changed += 1
        out_lines.append(ln)
    open(path, 'w', encoding='utf-8').write("".join(out_lines))
    print(f"  {path.split(chr(92))[-1]}: {n_changed} stations reassigned")
