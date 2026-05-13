"""Validate all three data files together: every route's from/to resolves
to a real station, no duplicate ids, etc."""
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

stations = {}  # id -> source file
def parse(path):
    s = open(path, encoding='utf-8').read()
    ids = re.findall(r'id:\s*"([a-zA-Z0-9_]+)"', s)
    return ids, s

for path, tag in [
    (r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js', 'data.js'),
    (r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js', 'data_extra.js'),
    (r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js', 'data_ru.js'),
]:
    ids, _ = parse(path)
    for i in ids:
        if i in stations:
            print(f"DUP: {i} in {tag} and {stations[i]}")
        stations[i] = tag

print(f"total stations: {len(stations)}")

# Routes
all_routes = []
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'from:\s*"([a-zA-Z0-9_]+)",\s*to:\s*"([a-zA-Z0-9_]+)"', s):
        all_routes.append((m.group(1), m.group(2)))
print(f"total route entries: {len(all_routes)}")

bad = [(f,t) for f,t in all_routes if f not in stations or t not in stations]
print(f"routes with unknown station: {len(bad)}")
for f, t in bad[:20]:
    print(f"  from={f} ({'KNOWN' if f in stations else 'UNK'}) to={t} ({'KNOWN' if t in stations else 'UNK'})")
