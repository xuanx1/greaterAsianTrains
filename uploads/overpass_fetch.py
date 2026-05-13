"""Fetch Russian railway stations from Overpass for the gap regions.

Trolleway gpkg covers western Russia well but is sparse east of the
Urals and in the Caucasus, leaving long contour plateaus from any
Far East / Siberian origin. Overpass fills the gap with live OSM data.

Three bboxes, separately so each call stays under the 30s timeout:
  FE   — Vladivostok–Khabarovsk–Komsomolsk corridor   (42–55N, 128–145E)
  Sib  — Tomsk–Krasnoyarsk–Bratsk–Tynda backbone      (50–60N,  80–125E)
  Cauc — Sochi / Krasnodar / Caucasus rail            (42–46N,  36–50E)
"""
import urllib.request, urllib.parse, json, sys, io, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

REGIONS = [
    ("ru_fe",   42, 128, 55, 145),
    ("ru_sib",  50,  80, 60, 125),
    ("ru_cauc", 42,  36, 46,  50),
]

for tag, s, w, n, e in REGIONS:
    out = rf'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\overpass_{tag}.json'
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
        with urllib.request.urlopen(req, timeout=90) as r:
            data = r.read()
        open(out, 'wb').write(data)
        d = json.loads(data)
        print(f"  ok ({len(d['elements'])} nodes, {time.time()-t0:.1f}s)")
    except Exception as ex:
        print(f"  FAIL: {ex}")
