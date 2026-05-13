"""Find gpkg stations whose Russian name matches a curated RU native name
(catches transliteration variants like Ekaterinburg vs Yekaterinburg)."""
import json, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

CURATED_NATIVE = {
    "Наушки","Улан-Удэ","Иркутск","Красноярск","Новосибирск","Омск",
    "Екатеринбург","Москва","Чита","Забайкальск","Хабаровск","Владивосток",
    "Тайшет","Тюмень","Пермь","Киров","Нижний Новгород","Казань","Самара",
    "Уфа","Санкт-Петербург","Тула","Курск","Белгород","Брянск","Смоленск",
    "Воронеж","Ростов-на-Дону","Краснодар","Сочи","Волгоград","Астрахань",
    "Саратов","Пенза","Ульяновск","Владимир","Ярославль","Вологда","Томск",
    "Барнаул","Комсомольск-на-Амуре","Советская Гавань","Находка","Хасан",
    "Тында","Северобайкальск","Братск","Махачкала","Орёл","Туапсе","Тверь",
    "Выборг","Петрозаводск","Мурманск","Ижевск","Оренбург","Минеральные Воды",
}

def norm_ru(s):
    if not s: return ""
    s = s.strip().lower().replace("ё","е")
    return re.sub(r"[\s\-\.\(\)']+","", s)

CURATED_NATIVE_NORM = {norm_ru(s) for s in CURATED_NATIVE}

stations = json.load(open(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\uploads\stations.json', encoding='utf-8'))
matches = []
for r in stations:
    if norm_ru(r["name_ru"]) in CURATED_NATIVE_NORM:
        matches.append(r)
print(f"matches by Russian name: {len(matches)}")
for r in matches:
    print(f"  fid={r['fid']} en='{r['name_en']}' ru='{r['name_ru']}' [{r['lat']:.3f},{r['lng']:.3f}]")
