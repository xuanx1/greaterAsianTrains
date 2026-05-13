"""Check existing data_ru.js: any stations missing routes, any
routes whose `to` differs from the great-circle nearest curated hub."""
import re, json, math, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

text = open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js', encoding='utf-8').read()

st_pat = re.compile(r'id:\s*"(ru_\d+)",\s*name:\s*"([^"]+)",\s*native:\s*"([^"]+)",\s*country:\s*"RU",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)')
rt_pat = re.compile(r'from:\s*"(ru_\d+)",\s*to:\s*"([^"]+)",\s*h:\s*([0-9\.]+)')

existing_st = {m.group(1): {"name": m.group(2), "lat": float(m.group(4)), "lng": float(m.group(5))} for m in st_pat.finditer(text)}
existing_rt = {m.group(1): {"to": m.group(2), "h": float(m.group(3))} for m in rt_pat.finditer(text)}

print(f"existing stations: {len(existing_st)}")
print(f"existing routes:   {len(existing_rt)}")
missing = sorted(set(existing_st) - set(existing_rt))
print(f"stations WITHOUT routes: {len(missing)}")
for m in missing:
    s = existing_st[m]
    print(f"  {m} {s['name']} ({s['lat']},{s['lng']})")

# Curated hubs from data.js
HUBS = [
  ("naushki",50.39,106.10),("ulan_ude",51.83,107.58),("irkutsk",52.29,104.30),
  ("krasnoyarsk",56.01,92.85),("novosibirsk",55.04,82.93),("omsk",54.99,73.37),
  ("yekaterinburg",56.84,60.61),("moscow",55.75,37.62),("chita",52.03,113.52),
  ("zabaikalsk",49.65,117.34),("khabarovsk",48.48,135.08),("vladivostok",43.12,131.89),
  ("tayshet",55.94,98.00),("tyumen",57.15,65.53),("perm",58.01,56.25),
  ("kirov",58.60,49.65),("nnovgorod",56.32,44.00),("kazan",55.79,49.12),
  ("samara",53.20,50.15),("ufa",54.74,55.97),("stpetersburg",59.93,30.34),
  ("tula",54.20,37.62),("kursk",51.74,36.18),("belgorod",50.60,36.59),
  ("bryansk",53.24,34.36),("smolensk",54.78,32.05),("voronezh",51.66,39.20),
  ("rostov_don",47.22,39.71),("krasnodar",45.03,38.98),("sochi",43.43,39.93),
  ("volgograd",48.71,44.51),("astrakhan",46.35,48.04),("saratov",51.53,46.04),
  ("penza",53.20,45.00),("ulyanovsk",54.32,48.40),("vladimir_ru",56.13,40.40),
  ("yaroslavl",57.62,39.89),("vologda",59.22,39.89),("tomsk",56.50,84.97),
  ("barnaul",53.35,83.78),("komsomolsk",50.55,137.01),("sov_gavan",49.00,140.27),
  ("nakhodka",42.81,132.87),("khasan",42.43,130.65),("tynda",55.16,124.72),
  ("severobaikalsk",55.65,109.32),("bratsk",56.13,101.61),("makhachkala",42.98,47.50),
  ("orel",52.97,36.07),("tuapse",44.10,39.08),("tver",56.86,35.92),
  ("vyborg",60.71,28.75),("petrozavodsk",61.79,34.37),("murmansk",68.97,33.08),
  ("izhevsk",56.85,53.21),("orenburg",51.77,55.10),("minvody",44.21,43.13),
]
H = {h[0]:(h[1],h[2]) for h in HUBS}

def hv(a,b,c,d):
    R=6371; p1=math.radians(a); p2=math.radians(c)
    dp=math.radians(c-a); dl=math.radians(d-b)
    return 2*R*math.asin(math.sqrt(math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2))

print("\nRoutes where existing 'to' differs from nearest-hub:")
diff_count = 0
for sid, s in existing_st.items():
    if sid not in existing_rt: continue
    cur_to = existing_rt[sid]["to"]
    best = min(HUBS, key=lambda h: hv(s["lat"],s["lng"],h[1],h[2]))
    if best[0] != cur_to:
        d_cur = hv(s["lat"],s["lng"], H[cur_to][0], H[cur_to][1])
        d_best = hv(s["lat"],s["lng"], best[1], best[2])
        diff_count += 1
        print(f"  {sid} {s['name']:25} cur={cur_to} ({d_cur:.0f}km) nearest={best[0]} ({d_best:.0f}km)")
print(f"total differing: {diff_count}")
