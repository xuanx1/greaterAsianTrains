"""List every station whose `name` has no ASCII letter, grouped by
script so we know which transliterators to add."""
import re, sys, io, unicodedata
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from collections import defaultdict

def script_of(s):
    """Return the dominant Unicode script for a string."""
    counts = defaultdict(int)
    for c in s:
        if c.isspace() or not c.isalpha():
            continue
        # ranges
        co = ord(c)
        if 0x0400 <= co <= 0x04FF or 0x0500 <= co <= 0x052F: counts['Cyrillic'] += 1
        elif 0x3040 <= co <= 0x309F: counts['Hiragana'] += 1
        elif 0x30A0 <= co <= 0x30FF: counts['Katakana'] += 1
        elif 0x4E00 <= co <= 0x9FFF: counts['Han'] += 1
        elif 0xAC00 <= co <= 0xD7AF: counts['Hangul'] += 1
        elif 0x0600 <= co <= 0x06FF or 0x0750 <= co <= 0x077F: counts['Arabic'] += 1
        elif 0x0590 <= co <= 0x05FF: counts['Hebrew'] += 1
        elif 0x1000 <= co <= 0x109F: counts['Myanmar'] += 1
        elif 0x0900 <= co <= 0x097F: counts['Devanagari'] += 1
        else: counts['Latin'] += 1
    return max(counts.items(), key=lambda x: x[1])[0] if counts else 'Empty'

unreadables = defaultdict(list)
for path in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
             r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    s = open(path, encoding='utf-8').read()
    for m in re.finditer(r'\{\s*id:\s*"([a-zA-Z0-9_]+)",\s*name:\s*"([^"]*)",\s*native:\s*"([^"]*)",\s*country:\s*"([A-Z]{2})"', s):
        sid, en, native, cc = m.group(1), m.group(2), m.group(3), m.group(4)
        if any('a' <= c.lower() <= 'z' for c in en):
            continue
        unreadables[script_of(en)].append((sid, en, native, cc))

print(f"total unreadable stations: {sum(len(v) for v in unreadables.values())}")
for script, items in sorted(unreadables.items(), key=lambda x: -len(x[1])):
    print(f"\n=== {script}: {len(items)} ===")
    for sid, en, native, cc in items:
        print(f"  {cc} {sid:25} name='{en}' native='{native}'")
