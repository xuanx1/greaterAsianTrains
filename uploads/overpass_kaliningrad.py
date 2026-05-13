"""Fetch the Kaliningrad exclave + the Belarus transit corridor to it.
Kaliningrad has zero stations in curated data — it's the Russian exclave
between Poland/Lithuania. Real RZD operates a daily Moscow-Kaliningrad
sleeper via Belarus."""
import urllib.request, urllib.parse, json, sys, io, time, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Kaliningrad oblast: roughly 54.3-55.3N, 19.6-23.0E
REGIONS = [
    ("ru_kgd",  54.0, 19.0, 55.5, 23.5),
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
