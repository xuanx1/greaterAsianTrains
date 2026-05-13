"""Build EXTRA_STATIONS_RU / EXTRA_ROUTES_RU from stations.gpkg.

Filter strategy: name-based dedup (drop any gpkg station whose English
name already appears among curated RU stations in data.js, plus dedup
within gpkg).

Each kept station connects to the nearest curated RU hub by great-circle
distance; h = gc_km / 70 (rounded to 2 dp).
"""
import json, math, re, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# --- Curated RU stations (id, name_en, lat, lng) — from data.js ---
CURATED = [
  ("naushki",       "Naushki",            50.39, 106.10),
  ("ulan_ude",      "Ulan-Ude",           51.83, 107.58),
  ("irkutsk",       "Irkutsk",            52.29, 104.30),
  ("krasnoyarsk",   "Krasnoyarsk",        56.01,  92.85),
  ("novosibirsk",   "Novosibirsk",        55.04,  82.93),
  ("omsk",          "Omsk",               54.99,  73.37),
  ("yekaterinburg", "Yekaterinburg",      56.84,  60.61),
  ("moscow",        "Moscow",             55.75,  37.62),
  ("chita",         "Chita",              52.03, 113.52),
  ("zabaikalsk",    "Zabaikalsk",         49.65, 117.34),
  ("khabarovsk",    "Khabarovsk",         48.48, 135.08),
  ("vladivostok",   "Vladivostok",        43.12, 131.89),
  ("tayshet",       "Tayshet",            55.94,  98.00),
  ("tyumen",        "Tyumen",             57.15,  65.53),
  ("perm",          "Perm",               58.01,  56.25),
  ("kirov",         "Kirov",              58.60,  49.65),
  ("nnovgorod",     "Nizhny Novgorod",    56.32,  44.00),
  ("kazan",         "Kazan",              55.79,  49.12),
  ("samara",        "Samara",             53.20,  50.15),
  ("ufa",           "Ufa",                54.74,  55.97),
  ("stpetersburg",  "St. Petersburg",     59.93,  30.34),
  ("tula",          "Tula",               54.20,  37.62),
  ("kursk",         "Kursk",              51.74,  36.18),
  ("belgorod",      "Belgorod",           50.60,  36.59),
  ("bryansk",       "Bryansk",            53.24,  34.36),
  ("smolensk",      "Smolensk",           54.78,  32.05),
  ("voronezh",      "Voronezh",           51.66,  39.20),
  ("rostov_don",    "Rostov-on-Don",      47.22,  39.71),
  ("krasnodar",     "Krasnodar",          45.03,  38.98),
  ("sochi",         "Sochi (Adler)",      43.43,  39.93),
  ("volgograd",     "Volgograd",          48.71,  44.51),
  ("astrakhan",     "Astrakhan",          46.35,  48.04),
  ("saratov",       "Saratov",            51.53,  46.04),
  ("penza",         "Penza",              53.20,  45.00),
  ("ulyanovsk",     "Ulyanovsk",          54.32,  48.40),
  ("vladimir_ru",   "Vladimir",           56.13,  40.40),
  ("yaroslavl",     "Yaroslavl",          57.62,  39.89),
  ("vologda",       "Vologda",            59.22,  39.89),
  ("tomsk",         "Tomsk",              56.50,  84.97),
  ("barnaul",       "Barnaul",            53.35,  83.78),
  ("komsomolsk",    "Komsomolsk-na-Amure",50.55, 137.01),
  ("sov_gavan",     "Sovetskaya Gavan",   49.00, 140.27),
  ("nakhodka",      "Nakhodka",           42.81, 132.87),
  ("khasan",        "Khasan",             42.43, 130.65),
  ("tynda",         "Tynda",              55.16, 124.72),
  ("severobaikalsk","Severobaikalsk",     55.65, 109.32),
  ("bratsk",        "Bratsk",             56.13, 101.61),
  ("makhachkala",   "Makhachkala",        42.98,  47.50),
  ("orel",          "Orel",               52.97,  36.07),
  ("tuapse",        "Tuapse",             44.10,  39.08),
  ("tver",          "Tver",               56.86,  35.92),
  ("vyborg",        "Vyborg",             60.71,  28.75),
  ("petrozavodsk",  "Petrozavodsk",       61.79,  34.37),
  ("murmansk",      "Murmansk",           68.97,  33.08),
  ("izhevsk",       "Izhevsk",            56.85,  53.21),
  ("orenburg",      "Orenburg",           51.77,  55.10),
  ("minvody",       "Mineralnye Vody",    44.21,  43.13),
]

# Petropavlovsk in gpkg fid=402 is actually in Kazakhstan (54.86N, 69.17E
# is Petropavl). The existing curated dataset treats it as RU — preserve
# that. We also exclude curated hub names from re-import.

def normalize(s):
    if s is None: return ""
    s = s.strip().lower()
    s = re.sub(r"[\s\-\.\(\)]+", "", s)
    s = s.replace("'", "").replace("`","")
    return s

CURATED_NAME_SET = {normalize(n) for _, n, _, _ in CURATED}
# Also dedupe against base-form (e.g. "Vladimir" vs "Vladimir-1")
# We treat exact-normalized match as dup.

def haversine(lat1, lng1, lat2, lng2):
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(a))

# --- Load gpkg stations ---
stations = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\stations.json', encoding='utf-8'))

# --- Apply name-based dedup ---
# 1) drop entries whose name_en matches a curated name
# 2) within gpkg, keep first occurrence per normalized name_en
seen_norm = set(CURATED_NAME_SET)
kept = []
dropped_curated = []
dropped_internal_dup = []
for r in stations:
    nm = r.get("name_en") or r.get("name_ru") or ""
    n = normalize(nm)
    if not n:
        continue
    if n in CURATED_NAME_SET:
        dropped_curated.append((r["fid"], nm))
        continue
    if n in seen_norm:
        dropped_internal_dup.append((r["fid"], nm))
        continue
    seen_norm.add(n)
    kept.append(r)

print(f"gpkg total: {len(stations)}")
print(f"dropped (matches curated name): {len(dropped_curated)}")
for fid, nm in dropped_curated:
    print(f"  fid={fid} '{nm}'")
print(f"dropped (internal name dup): {len(dropped_internal_dup)}")
for fid, nm in dropped_internal_dup:
    print(f"  fid={fid} '{nm}'")
print(f"kept: {len(kept)}")

# --- Assign nearest curated hub ---
routes = []
flagged_far = []
for r in kept:
    best = None
    for hid, hname, hlat, hlng in CURATED:
        d = haversine(r["lat"], r["lng"], hlat, hlng)
        if best is None or d < best[1]:
            best = (hid, d)
    hid, d = best
    h = round(d / 70.0, 2)
    routes.append({
        "fid": r["fid"], "to": hid, "km": round(d, 1), "h": h,
        "name": r.get("name_en") or r.get("name_ru"),
    })
    if d > 600:
        flagged_far.append((r["fid"], r.get("name_en"), hid, round(d,1)))

print(f"\nflagged (nearest hub >600km — review): {len(flagged_far)}")
for fid, nm, hid, km in flagged_far:
    print(f"  fid={fid} '{nm}' -> {hid} {km}km")

# Save intermediate
with open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\ru_build.json','w',encoding='utf-8') as f:
    json.dump({"kept": kept, "routes": routes,
               "dropped_curated":[{"fid":a,"name":b} for a,b in dropped_curated],
               "dropped_internal_dup":[{"fid":a,"name":b} for a,b in dropped_internal_dup]},
              f, ensure_ascii=False, indent=1)
print("\nWrote ru_build.json")
