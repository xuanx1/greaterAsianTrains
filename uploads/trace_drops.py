"""Trace why each station was dropped."""
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

seen_en = set(); seen_ru = set()
# pre-populate from curated
for _, en, ru, *_ in CURATED:
    seen_en.add(normalize(en)); seen_ru.add(normalize(ru))

dropped_internal = []
for r in stations:
    n_en = normalize(r["name_en"])
    n_ru = normalize(r["name_ru"])
    if n_en in curated_norm or n_ru in curated_norm:
        continue
    if n_en and n_en in seen_en:
        dropped_internal.append(("EN dup", r, n_en))
        continue
    if n_ru and n_ru in seen_ru:
        dropped_internal.append(("RU dup", r, n_ru))
        continue
    # proximity to curated
    nearest = min(CURATED, key=lambda h: hv(r["lat"], r["lng"], h[3], h[4]))
    d_near = hv(r["lat"], r["lng"], nearest[3], nearest[4])
    if d_near < 3.0:
        continue
    if n_en: seen_en.add(n_en)
    if n_ru: seen_ru.add(n_ru)

print(f"internal dups: {len(dropped_internal)}")
for tag, r, key in dropped_internal:
    print(f"  {tag} fid={r['fid']} en='{r['name_en']}' ru='{r['name_ru']}' key='{key}'")
