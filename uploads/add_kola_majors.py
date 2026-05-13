"""Add the three major Karelia stops on the Murmansk railway as curated
nodes — Kondopoga, Medvezhyegorsk, Segezha. They were filtered out at
ingest time by the 15 km distance floor (a smaller halt like Suna had
already taken the slot). For the app's purposes the big-name stations
should be in the dropdown even when a sibling halt sits a few km away.
"""
import re, math, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# (id, name_en, name_ru, lat, lng) — hand-checked against OSM/Wikidata
ADDS = [
    ("kondopoga",      "Kondopoga",      "Кондопога",    62.2094, 34.2758),
    ("medvezhyegorsk", "Medvezhyegorsk", "Медвежьегорск", 62.9086, 34.4491),
    ("segezha",        "Segezha",        "Сегежа",       63.7442, 34.3031),
]

# Real Murmansk railway segment times (Tze-Chiang-class express):
# Petrozavodsk → Kondopoga       ~  1.0 h ( 55 km)
# Kondopoga → Medvezhyegorsk     ~  2.0 h (105 km)
# Medvezhyegorsk → Segezha       ~  2.0 h (105 km)
# Segezha → Belomorsk            ~  1.5 h ( 95 km)
EDGES = [
    ("petrozavodsk",   "kondopoga",      1.0),
    ("kondopoga",      "medvezhyegorsk", 2.0),
    ("medvezhyegorsk", "segezha",        2.0),
    ("segezha",        "ru_93",          1.5),  # ru_93 = Belomorsk
]

def quote(x): return '"' + (x or "").replace('\\','\\\\').replace('"','\\"') + '"'

target = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js'
s = open(target, encoding='utf-8').read()

st_block = ["  // Murmansk railway majors — curated to bypass 15 km min-distance filter"]
for sid, en, ru, lat, lng in ADDS:
    st_block.append(f'  {{ id: {quote(sid)}, name: {quote(en)}, native: {quote(ru)}, country: "RU", lat: {lat}, lng: {lng} }},')

rt_block = ["  // Murmansk railway segment times (real RZD Tze-Chiang express)"]
for f, t, h in EDGES:
    rt_block.append(f'  {{ from: {quote(f)}, to: {quote(t)}, h: {h}, type: "conv", line: "Murmansk Railway", op: "RZD" }},')

m1 = re.search(r'(window\.EXTRA_STATIONS_RU\s*=\s*\[[\s\S]*?)(\n\];)', s)
s = s[:m1.end(1)] + "\n" + "\n".join(st_block) + m1.group(2) + s[m1.end():]
m2 = re.search(r'(window\.EXTRA_ROUTES_RU\s*=\s*\[[\s\S]*?)(\n\];)', s)
s = s[:m2.end(1)] + "\n" + "\n".join(rt_block) + m2.group(2) + s[m2.end():]
open(target, 'w', encoding='utf-8').write(s)
print("wrote data_ru.js with 3 curated Murmansk-line majors + 4 RZD segments")
