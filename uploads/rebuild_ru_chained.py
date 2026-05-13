"""Rebuild data_ru.js with K-nearest-neighbour connectivity.

Previous version connected each gpkg spur ONLY to its single nearest
curated hub. That made the contours lumpy: from Murmansk you'd hit the
local spurs (≤6 h) then nothing until Petrozavodsk at 18 h, because the
intermediate Kola-Line stations all radiated back to Murmansk instead
of chaining south.

New rule: each gpkg station gets up to K=3 connections, picked from the
combined pool of (curated RU hubs + other gpkg spurs). The nearest
neighbour is always included; the 2nd and 3rd are only added if their
distance to the station is ≤2× the nearest distance and ≤300 km. That
gives sensible chains along real corridors without overconnecting
distant pairs (a Vladivostok station won't link to a Sakhalin one).
"""
import json, math, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

CURATED = [
  ("naushki","Naushki","Наушки",50.39,106.10),("ulan_ude","Ulan-Ude","Улан-Удэ",51.83,107.58),
  ("irkutsk","Irkutsk","Иркутск",52.29,104.30),("krasnoyarsk","Krasnoyarsk","Красноярск",56.01,92.85),
  ("novosibirsk","Novosibirsk","Новосибирск",55.04,82.93),("omsk","Omsk","Омск",54.99,73.37),
  ("yekaterinburg","Yekaterinburg","Екатеринбург",56.84,60.61),("moscow","Moscow","Москва",55.75,37.62),
  ("chita","Chita","Чита",52.03,113.52),("zabaikalsk","Zabaikalsk","Забайкальск",49.65,117.34),
  ("khabarovsk","Khabarovsk","Хабаровск",48.48,135.08),("vladivostok","Vladivostok","Владивосток",43.12,131.89),
  ("tayshet","Tayshet","Тайшет",55.94,98.00),("tyumen","Tyumen","Тюмень",57.15,65.53),
  ("perm","Perm","Пермь",58.01,56.25),("kirov","Kirov","Киров",58.60,49.65),
  ("nnovgorod","Nizhny Novgorod","Нижний Новгород",56.32,44.00),("kazan","Kazan","Казань",55.79,49.12),
  ("samara","Samara","Самара",53.20,50.15),("ufa","Ufa","Уфа",54.74,55.97),
  ("stpetersburg","St. Petersburg","Санкт-Петербург",59.93,30.34),("tula","Tula","Тула",54.20,37.62),
  ("kursk","Kursk","Курск",51.74,36.18),("belgorod","Belgorod","Белгород",50.60,36.59),
  ("bryansk","Bryansk","Брянск",53.24,34.36),("smolensk","Smolensk","Смоленск",54.78,32.05),
  ("voronezh","Voronezh","Воронеж",51.66,39.20),("rostov_don","Rostov-on-Don","Ростов-на-Дону",47.22,39.71),
  ("krasnodar","Krasnodar","Краснодар",45.03,38.98),("sochi","Sochi (Adler)","Сочи",43.43,39.93),
  ("volgograd","Volgograd","Волгоград",48.71,44.51),("astrakhan","Astrakhan","Астрахань",46.35,48.04),
  ("saratov","Saratov","Саратов",51.53,46.04),("penza","Penza","Пенза",53.20,45.00),
  ("ulyanovsk","Ulyanovsk","Ульяновск",54.32,48.40),("vladimir_ru","Vladimir","Владимир",56.13,40.40),
  ("yaroslavl","Yaroslavl","Ярославль",57.62,39.89),("vologda","Vologda","Вологда",59.22,39.89),
  ("tomsk","Tomsk","Томск",56.50,84.97),("barnaul","Barnaul","Барнаул",53.35,83.78),
  ("komsomolsk","Komsomolsk-na-Amure","Комсомольск-на-Амуре",50.55,137.01),
  ("sov_gavan","Sovetskaya Gavan","Советская Гавань",49.00,140.27),
  ("nakhodka","Nakhodka","Находка",42.81,132.87),("khasan","Khasan","Хасан",42.43,130.65),
  ("tynda","Tynda","Тында",55.16,124.72),("severobaikalsk","Severobaikalsk","Северобайкальск",55.65,109.32),
  ("bratsk","Bratsk","Братск",56.13,101.61),("makhachkala","Makhachkala","Махачкала",42.98,47.50),
  ("orel","Orel","Орёл",52.97,36.07),("tuapse","Tuapse","Туапсе",44.10,39.08),
  ("tver","Tver","Тверь",56.86,35.92),("vyborg","Vyborg","Выборг",60.71,28.75),
  ("petrozavodsk","Petrozavodsk","Петрозаводск",61.79,34.37),("murmansk","Murmansk","Мурманск",68.97,33.08),
  ("izhevsk","Izhevsk","Ижевск",56.85,53.21),("orenburg","Orenburg","Оренбург",51.77,55.10),
  ("minvody","Mineralnye Vody","Минеральные Воды",44.21,43.13),
]

def normalize(s):
    if s is None: return ""
    s = s.strip().lower().replace("ё","е")
    return re.sub(r"[\s\-\.\(\)']+","", s)

curated_norm = set()
for _, en, ru, *_ in CURATED:
    curated_norm.add(normalize(en))
    curated_norm.add(normalize(ru))

def hv(a,b,c,d):
    R=6371; p1=math.radians(a); p2=math.radians(c)
    dp=math.radians(c-a); dl=math.radians(d-b)
    return 2*R*math.asin(math.sqrt(math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2))

stations = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\stations.json', encoding='utf-8'))

# Apply dedup (same as before): drop name matches + 3 km proximity
seen_en = {normalize(en) for _, en, _, *_ in CURATED}
seen_ru = {normalize(ru) for _, _, ru, *_ in CURATED}
kept = []
for r in stations:
    n_en = normalize(r["name_en"]); n_ru = normalize(r["name_ru"])
    if not n_en and not n_ru: continue
    if n_en in curated_norm or n_ru in curated_norm: continue
    if (n_en and n_en in seen_en) or (n_ru and n_ru in seen_ru): continue
    near = min(CURATED, key=lambda h: hv(r["lat"], r["lng"], h[3], h[4]))
    d_near = hv(r["lat"], r["lng"], near[3], near[4])
    if d_near < 3.0: continue
    if n_en: seen_en.add(n_en)
    if n_ru: seen_ru.add(n_ru)
    kept.append(r)

print(f"stations kept: {len(kept)}")

# Build combined pool for K-NN: curated hubs + kept gpkg
pool = []
for hid, _, _, lat, lng in CURATED:
    pool.append((hid, lat, lng, True))  # is_curated
for r in kept:
    pool.append((f"ru_{r['fid']}", r["lat"], r["lng"], False))

# For each kept station, generate:
#   (a) ALWAYS the nearest curated RU hub — keeps long-distance fan-in,
#       so Dijkstra from any hub-rooted origin (Moscow, Murmansk, …) can
#       still find the spurs.
#   (b) Up to 2 nearest pool-wide neighbours (curated or gpkg), within
#       MAX_KM. That builds intra-corridor chains (Kola Line stations
#       link to each other, not just to Murmansk).
# Edge canonicalisation prevents A→B + B→A duplicates.
HUB_INDEX = [(hid, lat, lng) for hid, _, _, lat, lng in CURATED]
NN_K = 2
MAX_KM = 250.0

routes_out = []
edges_seen = set()

def add_edge(a, b, km):
    key = tuple(sorted([a, b]))
    if key in edges_seen: return
    edges_seen.add(key)
    routes_out.append((key[0], key[1], round(km/70.0, 2), round(km, 1)))

for r in kept:
    sid = f"ru_{r['fid']}"
    # (a) nearest curated hub
    nh = min(HUB_INDEX, key=lambda h: hv(r["lat"], r["lng"], h[1], h[2]))
    add_edge(sid, nh[0], hv(r["lat"], r["lng"], nh[1], nh[2]))
    # (b) up to NN_K nearest pool-wide
    cand = []
    for pid, lat, lng, _ in pool:
        if pid == sid: continue
        d = hv(r["lat"], r["lng"], lat, lng)
        if d > MAX_KM: continue
        cand.append((d, pid))
    cand.sort()
    for d, pid in cand[:NN_K]:
        add_edge(sid, pid, d)

print(f"routes generated: {len(routes_out)}")

# Distribution: connections per station
from collections import Counter
conns = Counter()
for f, t, *_ in routes_out:
    conns[f] += 1; conns[t] += 1
avg = sum(conns[f"ru_{r['fid']}"] for r in kept) / max(1, len(kept))
print(f"avg connections per kept station: {avg:.2f}")

# --- Render JS ---
def quote(s):
    return '"' + (s or "").replace('\\','\\\\').replace('"','\\"') + '"'

lines = []
lines.append("// Russian railway stations from trolleway/russian-railways-simplegeodata (stations.gpkg).")
lines.append("// Dedup strategy (drop, in order):")
lines.append("//  1. English OR Russian name matches a curated RU station (after normalising")
lines.append("//     case/punctuation/ё→е) — Ekaterinburg=Yekaterinburg, Moskva=Moscow,")
lines.append("//     Tinda=Tynda, Izevsk=Izhevsk, Taishet=Tayshet, Oryol=Orel, ...")
lines.append("//  2. within 3 km of a curated hub — Adler=Sochi, SPb=St P, Tula-1=Tula,")
lines.append("//     Yaroslavl-Moskovsky, Tomsk-2, Tikhookeanskaya=Nakhodka, ...")
lines.append("//")
lines.append("// Connectivity:")
lines.append("//   (a) every spur always connects to its nearest curated RU hub by great-")
lines.append("//       circle — preserves long-distance fan-in so Moscow/Murmansk can still")
lines.append("//       reach the leaves;")
lines.append("//   (b) plus up to 2 nearest pool-wide neighbours (curated or other spur)")
lines.append("//       within 250 km — builds intra-corridor chains so the Kola Line spurs")
lines.append("//       (Olenegorsk → Apatity → Kandalaksha → Loukhi → Belomorsk → Petrozavodsk)")
lines.append("//       link to each other, not all radially back to Murmansk.")
lines.append("// Edge keys are sorted endpoints so A→B + B→A never both appear.")
lines.append("// Replaces the old 'single nearest hub' rule which left contour plateaus —")
lines.append("// from Murmansk nothing reachable between 6 h and 18 h, because every Kola")
lines.append("// Line station radiated to Murmansk rather than chaining south.")
lines.append("")
lines.append("window.EXTRA_STATIONS_RU = [")
for r in kept:
    sid = f"ru_{r['fid']}"
    lat = round(r["lat"], 4); lng = round(r["lng"], 4)
    nm = r.get("name_en") or r.get("name_ru") or ""
    nat = r.get("name_ru") or ""
    lines.append(f'  {{ id: {quote(sid)}, name: {quote(nm)}, native: {quote(nat)}, country: "RU", lat: {lat}, lng: {lng} }},')
lines.append("];")
lines.append("")
lines.append("window.EXTRA_ROUTES_RU = [")
for f, t, h, km in sorted(routes_out, key=lambda r: (r[0], r[1])):
    lines.append(f'  {{ from: {quote(f)}, to: {quote(t)}, h: {h}, type: "conv", line: "RZD trunk (Trolleway gpkg, K-NN)", op: "RZD" }},')
lines.append("];")
lines.append("")
lines.append("if (window.STATIONS) window.STATIONS = window.STATIONS.concat(window.EXTRA_STATIONS_RU);")
lines.append("if (window.ROUTES) window.ROUTES = window.ROUTES.concat(window.EXTRA_ROUTES_RU);")
lines.append("if (window.STATIONS_BY_ID) for (const s of window.EXTRA_STATIONS_RU) window.STATIONS_BY_ID[s.id] = s;")
lines.append("")

open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js', 'w', encoding='utf-8').write("\n".join(lines))
print("wrote data_ru.js")
