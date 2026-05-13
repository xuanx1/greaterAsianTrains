"""Transliterate Cyrillic-only station names to Latin script.

Stations where the `name` field is Cyrillic and `native` is empty came
out of the OSM ingest with no `name:en` tag. The UI needs a Latin
display name. Move the Cyrillic to `native` and put a BGN/PCGN-style
transliteration in `name`.

BGN/PCGN romanisation is the standard the US BGN and UK PCGN use for
Russian. It's reasonable for Kazakh, Kyrgyz, Ukrainian too with a few
extensions.
"""
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# BGN/PCGN Russian → Latin (with common extensions for Kazakh/extra Cyrillic).
MAP = {
    'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'Zh','З':'Z',
    'И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R',
    'С':'S','Т':'T','У':'U','Ф':'F','Х':'Kh','Ц':'Ts','Ч':'Ch','Ш':'Sh',
    'Щ':'Shch','Ъ':"",'Ы':'Y','Ь':"",'Э':'E','Ю':'Yu','Я':'Ya',
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
    'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh',
    'щ':'shch','ъ':"",'ы':'y','ь':"",'э':'e','ю':'yu','я':'ya',
    # Kazakh / Kyrgyz / Tatar extensions:
    'Қ':'Q','қ':'q','Ғ':'Gh','ғ':'gh','Ң':'Ng','ң':'ng','Ө':'O','ө':'o',
    'Ұ':'U','ұ':'u','Ү':'Y','ү':'y','Һ':'H','һ':'h','Ә':'A','ә':'a',
    'І':'I','і':'i','Ї':'Yi','ї':'yi','Є':'Ye','є':'ye','Ў':'W','ў':'w',
    'Ҡ':'K','ҡ':'k','Ҙ':'Z','ҙ':'z','Ҫ':'S','ҫ':'s','Ҭ':'T','ҭ':'t',
    'Ҝ':'G','ҝ':'g','Җ':'Zh','җ':'zh','Ҷ':'Ch','ҷ':'ch','Ҳ':'H','ҳ':'h',
}

def is_cyrillic(s):
    return any('Ѐ' <= c <= 'ӿ' or 'Ԁ' <= c <= 'ԯ' for c in s)

def has_ascii_letter(s):
    return any('a' <= c.lower() <= 'z' for c in s)

def translit(s):
    out = []
    for c in s:
        if c in MAP: out.append(MAP[c])
        else: out.append(c)
    return "".join(out)

# Test
TESTS = ["Ганькино", "Жанаарна", "Кеңжалы", "Кондопога", "Медвежья Гора",
         "Бүйректөбе", "Жосалы", "Темір", "Үштөбе", "Сегежа",
         "Калининград-Пассажирский", "70-й километр", "Блок-пост 1303 км"]
for t in TESTS:
    print(f"  {t}  →  {translit(t)}")

# Patch the three files
STATION_RE = re.compile(r'(\{\s*id:\s*"([a-zA-Z0-9_]+)",\s*name:\s*")([^"]*)("\s*,\s*native:\s*")([^"]*)("[^}]*\})')

def patch(path):
    s = open(path, encoding='utf-8').read()
    changed = 0
    def repl(m):
        nonlocal changed
        prefix1, sid, name_field, mid, native_field, suffix = m.groups()
        if has_ascii_letter(name_field):
            return m.group(0)  # already has a Latin name
        if not is_cyrillic(name_field):
            return m.group(0)
        # Promote Cyrillic to native, transliterate to name
        new_name = translit(name_field).strip()
        new_native = native_field if native_field else name_field
        changed += 1
        return prefix1 + new_name + mid + new_native + suffix
    s2 = STATION_RE.sub(repl, s)
    open(path, 'w', encoding='utf-8').write(s2)
    print(f"{path.split(chr(92))[-1]}: {changed} stations transliterated")

print()
patch(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js')
patch(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js')
patch(r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js')
