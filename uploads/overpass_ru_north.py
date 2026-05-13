"""Fetch Karelia/Kola/Arkhangelsk-Komi corridors which trolleway gpkg
covers thinly. The 4-6 h dip from Murmansk has only Loukhi + Paozero
because intermediate halts (Engozero, Knyazhaya, Apatity-mid, ...) are
not in the gpkg."""
import urllib.request, urllib.parse, json, sys, io, time, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

REGIONS = [
    ("ru_kola",  56, 28, 70, 45),   # Karelia + Kola + Arkhangelsk + Komi west
    ("ru_komi",  58, 45, 70, 65),   # Komi + north Urals
    ("ru_volga", 50, 36, 58, 60),   # Volga + Urals foothills (fill central plateaus)
]

for tag, s, w, n, e in REGIONS:
    out = rf'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\overpass_{tag}.json'
    if os.path.exists(out):
        print(f"{tag}: cached"); continue
    q = f"""[out:json][timeout:55];
(
  node["railway"="station"]({s},{w},{n},{e});
);
out body;"""
    body = urllib.parse.urlencode({"data": q}).encode()
    req = urllib.request.Request("https://overpass-api.de/api/interpreter", data=body,
                                  headers={"User-Agent": "great-asia-data-build/1.0"})
    print(f"fetching {tag} ({s},{w},{n},{e})…", end="", flush=True)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            data = r.read()
        open(out, 'wb').write(data)
        d = json.loads(data)
        print(f"  ok ({len(d['elements'])} nodes, {time.time()-t0:.1f}s)")
    except Exception as ex:
        print(f"  FAIL: {ex}")
    time.sleep(1.0)
