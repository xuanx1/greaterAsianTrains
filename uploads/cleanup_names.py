"""Drop garbage-named stations from data_ru.js and data_extra.js, and
remove any routes that reference the dropped IDs."""
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads')
from name_quality import is_acceptable

STATION_RE = re.compile(r'^\s*\{\s*id:\s*"([a-zA-Z0-9_]+)",\s*name:\s*"([^"]*)",\s*native:\s*"([^"]*)",.*\},\s*$')
ROUTE_RE = re.compile(r'^\s*\{\s*from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)",')

def clean_file(path, label):
    print(f"\n== {label} ==")
    lines = open(path, encoding='utf-8').read().splitlines(keepends=True)
    drop_ids = set()
    out = []
    for line in lines:
        m = STATION_RE.match(line)
        if m:
            sid, en, ru = m.group(1), m.group(2), m.group(3)
            if not is_acceptable(en, ru):
                drop_ids.add(sid)
                continue
        out.append(line)
    print(f"  dropped {len(drop_ids)} garbage stations")
    sample = list(drop_ids)[:8]
    for d in sample:
        print(f"    {d}")
    # second pass: drop routes mentioning a dropped id
    final = []
    dropped_routes = 0
    for line in out:
        m = ROUTE_RE.match(line)
        if m and (m.group(1) in drop_ids or m.group(2) in drop_ids):
            dropped_routes += 1
            continue
        final.append(line)
    print(f"  dropped {dropped_routes} orphaned routes")
    open(path, 'w', encoding='utf-8').write("".join(final))
    return drop_ids

clean_file(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js', 'data_ru.js')
clean_file(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js', 'data_extra.js')
print("\ndone")
