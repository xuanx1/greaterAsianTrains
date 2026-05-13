"""Generate the new data_ru.js.

Dedup strategy (replaces previous 80 km filter):
  1. Drop if name_en OR name_ru normalises to a curated RU station name
     (catches transliteration variants: Ekaterinburg=Yekaterinburg,
     Moskva=Moscow, Tinda=Tynda, Izevsk=Izhevsk, Taishet=Tayshet etc.).
  2. Drop if within 3 km of any curated RU station (catches alt-name
     yards/terminals of the same physical hub: Adler=Sochi, SPb=St P,
     Tula-1=Tula, Yaroslavl-Moskovsky=Yaroslavl, Tomsk-2=Tomsk etc.).

3 km is dramatically tighter than the old 80 km rule — it can only
collapse stations that share a physical hub footprint, so legitimate
spurs (Esto-Sadok, Roza Khutor, Krasnaya Polyana near Sochi) survive.
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
# Also strip "(Adler)" tail from curated en to catch bare "Adler"-free variants — but
# we use 3km proximity for that case instead, so leave as-is.

def hv(a,b,c,d):
    R=6371; p1=math.radians(a); p2=math.radians(c)
    dp=math.radians(c-a); dl=math.radians(d-b)
    return 2*R*math.asin(math.sqrt(math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2))

stations = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\stations.json', encoding='utf-8'))

out_st = []
out_rt = []
drop_log = []
seen_en = {normalize(en) for _, en, _, *_ in CURATED}
seen_ru = {normalize(ru) for _, _, ru, *_ in CURATED}
for r in stations:
    n_en = normalize(r["name_en"])
    n_ru = normalize(r["name_ru"])
    name_for_label = r.get("name_en") or r.get("name_ru") or ""
    if not n_en and not n_ru:
        continue
    if n_en in curated_norm or n_ru in curated_norm:
        drop_log.append(("name_match_curated", r["fid"], name_for_label))
        continue
    if (n_en and n_en in seen_en) or (n_ru and n_ru in seen_ru):
        drop_log.append(("name_match_other_gpkg", r["fid"], name_for_label))
        continue
    # proximity to curated (≤3 km = same physical hub)
    nearest = min(CURATED, key=lambda h: hv(r["lat"], r["lng"], h[3], h[4]))
    d_near = hv(r["lat"], r["lng"], nearest[3], nearest[4])
    if d_near < 3.0:
        drop_log.append(("within_3km_of_"+nearest[0], r["fid"], name_for_label))
        continue
    if n_en: seen_en.add(n_en)
    if n_ru: seen_ru.add(n_ru)
    sid = f"ru_{r['fid']}"
    lat = round(r["lat"], 4); lng = round(r["lng"], 4)
    out_st.append({
        "id": sid, "name": name_for_label, "native": r.get("name_ru") or "",
        "country": "RU", "lat": lat, "lng": lng,
    })
    h_to = round(d_near / 70.0, 2)
    out_rt.append({"from": sid, "to": nearest[0], "h": h_to})

print(f"stations to write: {len(out_st)}")
print(f"routes to write:   {len(out_rt)}")
print(f"dropped: {len(drop_log)}")
from collections import Counter
print(Counter(t[0] for t in drop_log))

# --- Render JS ---
def quote(s):
    return '"' + (s or "").replace('\\','\\\\').replace('"','\\"') + '"'

lines = []
lines.append("// Russian railway stations from trolleway/russian-railways-simplegeodata (stations.gpkg).")
lines.append("// Dedup strategy (replaces the previous 80 km distance filter):")
lines.append("//  1. drop if English OR Russian name matches a curated RU station (after")
lines.append("//     normalising case/punctuation/ё→е) — catches Ekaterinburg=Yekaterinburg,")
lines.append("//     Moskva=Moscow, Tinda=Tynda, Izevsk=Izhevsk, Taishet=Tayshet, …;")
lines.append("//  2. drop if within 3 km of any curated hub — catches alt-name yards of the")
lines.append("//     same physical hub: Adler=Sochi, SPb=St P, Tula-1=Tula, Yaroslavl-Moskovsky,")
lines.append("//     Tomsk-2, Kirov-Passazirsky, Voronez-1, Tikhookeanskaya=Nakhodka, etc.")
lines.append("// 3 km is far tighter than the old 80 km — it can only collapse stations that")
lines.append("// share a hub footprint, so real spurs (Esto-Sadok, Roza Khutor) survive.")
lines.append("//")
lines.append("// Each spur connects to its nearest curated RU hub by great-circle; h = gc_km/70.")
lines.append("// Five far-north Komi/Yamal spurs (Workuta, Labytnangi, Usinsk, Synya, Pechora)")
lines.append("// pick Perm/Tyumen by great-circle, though the real rail line runs Kirov-Kotlas-")
lines.append("// Vorkuta; their h values are coarse upper bounds.")
lines.append("")
lines.append("window.EXTRA_STATIONS_RU = [")
for s in out_st:
    lines.append(f'  {{ id: {quote(s["id"])}, name: {quote(s["name"])}, native: {quote(s["native"])}, country: "RU", lat: {s["lat"]}, lng: {s["lng"]} }},')
lines.append("];")
lines.append("")
lines.append("window.EXTRA_ROUTES_RU = [")
for rt in out_rt:
    lines.append(f'  {{ from: {quote(rt["from"])}, to: {quote(rt["to"])}, h: {rt["h"]}, type: "conv", line: "RZD trunk (Trolleway dataset)", op: "RZD" }},')
lines.append("];")
lines.append("")
lines.append("if (window.STATIONS) window.STATIONS = window.STATIONS.concat(window.EXTRA_STATIONS_RU);")
lines.append("if (window.ROUTES) window.ROUTES = window.ROUTES.concat(window.EXTRA_ROUTES_RU);")
lines.append("if (window.STATIONS_BY_ID) for (const s of window.EXTRA_STATIONS_RU) window.STATIONS_BY_ID[s.id] = s;")
lines.append("")

text = "\n".join(lines)
open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js', 'w', encoding='utf-8').write(text)
print("wrote data_ru.js")
