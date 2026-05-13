"""Find Kaliningrad Main station (Пассажирский) in the Overpass dump."""
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
d = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\overpass_ru_kgd.json', encoding='utf-8'))
TARGETS = ["Калининград", "Kaliningrad", "Пассажирский", "Северный", "Светлогорск", "Зеленоградск", "Черняховск", "Балтийск"]
for el in d['elements']:
    if el.get('type') != 'node': continue
    tags = el.get('tags', {})
    name = tags.get('name', '')
    name_en = tags.get('name:en', '')
    for t in TARGETS:
        if t.lower() in name.lower() or t.lower() in name_en.lower():
            print(f"  id={el['id']} name='{name}' en='{name_en}' lat={el.get('lat')} lng={el.get('lon')}")
            break
