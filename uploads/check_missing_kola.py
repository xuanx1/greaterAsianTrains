"""Are Kondopoga, Medvezhyegorsk, Segezha in the Overpass fetch but
filtered out at ingest time?"""
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

TARGETS = ["Кондопога", "Медвежья гора", "Медвежьегорск", "Сегежа", "Кемь",
           "Kondopoga", "Medvezhyegorsk", "Segezha", "Medvezhya gora", "Idel"]

for tag in ("ru_kola", "ru_komi", "ru_volga"):
    p = rf'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\overpass_{tag}.json'
    d = json.load(open(p, encoding='utf-8'))
    print(f"\n=== {tag} ===")
    for el in d.get('elements', []):
        if el.get('type') != 'node': continue
        tags = el.get('tags', {})
        if tags.get('railway') != 'station': continue
        name = tags.get('name', '')
        name_en = tags.get('name:en', '')
        if any(t.lower() in name.lower() or t.lower() in name_en.lower() for t in TARGETS):
            print(f"  id={el['id']} name='{name}' en='{name_en}' lat={el.get('lat')} lng={el.get('lon')}")
