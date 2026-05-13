"""Fetch railway stations from Overpass for curated countries that have
no HOTOSM points file and currently <30 curated stations.

Uses the country area ID via ISO codes (nominatim-aliased). For each
country a bbox prefilter is included to keep the response size sane.
"""
import urllib.request, urllib.parse, json, sys, io, time, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# (cc, bbox: (south, west, north, east))
COUNTRIES = [
    ("BD", 20.5,  88.0, 27.0,  93.0),  # Bangladesh
    ("LK",  5.5,  79.5, 10.0,  82.0),  # Sri Lanka
    ("MY",  0.5,  99.5,  7.5, 119.5),  # Malaysia (East+West)
    ("MM",  9.5,  92.0, 28.5, 101.5),  # Myanmar
    ("SA", 16.0,  34.0, 32.5,  56.0),  # Saudi Arabia
    ("IL", 29.5,  34.0, 33.5,  36.0),  # Israel
    ("KH", 10.0, 102.0, 15.0, 108.0),  # Cambodia
    ("NP", 26.0,  80.0, 31.0,  89.0),  # Nepal
    ("GE", 41.0,  39.5, 43.5,  47.0),  # Georgia
    ("AM", 38.5,  43.0, 41.5,  47.0),  # Armenia
    ("AZ", 38.5,  44.0, 42.0,  51.0),  # Azerbaijan
    ("UZ", 37.0,  55.5, 46.0,  73.5),  # Uzbekistan
    ("TM", 35.0,  52.0, 43.0,  67.0),  # Turkmenistan
    ("KP", 37.5, 124.0, 43.5, 131.0),  # North Korea
]

for cc, s, w, n, e in COUNTRIES:
    out = rf'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\overpass_{cc.lower()}.json'
    if os.path.exists(out):
        print(f"{cc}: already cached, skipping")
        continue
    q = f"""[out:json][timeout:55];
(
  node["railway"="station"]({s},{w},{n},{e});
);
out body;"""
    body = urllib.parse.urlencode({"data": q}).encode()
    req = urllib.request.Request("https://overpass-api.de/api/interpreter", data=body,
                                  headers={"User-Agent": "great-asia-data-build/1.0"})
    print(f"fetching {cc} ({s},{w},{n},{e})…", end="", flush=True)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            data = r.read()
        open(out, 'wb').write(data)
        d = json.loads(data)
        print(f"  ok ({len(d['elements'])} nodes, {time.time()-t0:.1f}s)")
    except Exception as ex:
        print(f"  FAIL: {ex}")
    time.sleep(1.0)  # be polite to Overpass
