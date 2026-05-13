"""Debug: list the K nearest neighbours for problem Kola Line stations."""
import re, math, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

stations = {}
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'id:\s*"([a-zA-Z0-9_]+)",[^}]*?name:\s*"([^"]+)",[^}]*?country:\s*"([A-Z]{2})",\s*lat:\s*([0-9\.\-]+),\s*lng:\s*([0-9\.\-]+)', s):
        stations[m.group(1)] = (m.group(2), m.group(3), float(m.group(4)), float(m.group(5)))

def hv(a,b,c,d):
    R=6371; p1,p2=math.radians(a),math.radians(c)
    dp=math.radians(c-a); dl=math.radians(d-b)
    return 2*R*math.asin(math.sqrt(math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2))

ru = [(sid,nm,lat,lng) for sid,(nm,cc,lat,lng) in stations.items() if cc=="RU"]
print(f"RU stations total: {len(ru)}")

for target_id in ("ru_186", "ru_185", "ru_188", "ru_93", "ru_187", "ru_119"):
    if target_id not in stations: continue
    nm, cc, lat, lng = stations[target_id]
    print(f"\n=== {target_id} {nm} ({lat:.2f}N, {lng:.2f}E) — nearest 8 within 250km ===")
    cand = []
    for sid, nm2, lat2, lng2 in ru:
        if sid == target_id: continue
        d = hv(lat, lng, lat2, lng2)
        if d > 250: continue
        cand.append((d, sid, nm2))
    cand.sort()
    for d, sid, nm2 in cand[:8]:
        print(f"  {d:6.1f}km  {sid:25} {nm2}")
