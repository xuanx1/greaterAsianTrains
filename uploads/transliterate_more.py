"""Transliterate the residual 33 non-Latin station names.

Approach per script:
  * Hangul (Korean) — algorithmic Revised Romanization, fully deterministic.
  * Han (Chinese) — hand-mapped pinyin for the 12 specific names.
  * Arabic / Persian — hand-romanised, since they're city names with
    standard English forms (e.g. Narowal Junction).
  * Hebrew — hand-romanised.
  * Myanmar — hand-romanised.

Also: drop a few entries that aren't passenger stations (modal cable-car
boarding pads, ruin sites, generic 'upper platform' labels) — they slipped
past the earlier name-quality filter because the bad keywords were in
Korean/Hebrew, not Latin.
"""
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# === Hangul Revised Romanization =============================================
# Hangul syllable block = (initial consonant, vowel, optional final consonant).
# Each block has codepoint AC00 + (init * 21 * 28) + (vowel * 28) + final.
HG_INITIALS = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h']
HG_VOWELS   = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo',
               'u','wo','we','wi','yu','eu','ui','i']
HG_FINALS   = ['', 'g','kk','gs','n','nj','nh','d','l','lg','lm','lb','ls','lt','lp','lh',
               'm','b','bs','s','ss','ng','j','ch','k','t','p','h']

def hangul_to_latin(text):
    out = []
    for c in text:
        co = ord(c)
        if 0xAC00 <= co <= 0xD7A3:
            n = co - 0xAC00
            i = n // (21*28); v = (n // 28) % 21; f = n % 28
            out.append(HG_INITIALS[i] + HG_VOWELS[v] + HG_FINALS[f])
        elif c == ' ':
            out.append(' ')
        else:
            out.append(c)
    return "".join(out)

def title(s):
    parts = s.split(' ')
    return ' '.join(p[:1].upper() + p[1:] if p else p for p in parts)

# === Hand-mapped names ======================================================
# (sid → (latin name, native, optional new_country))
HAND = {
    # Japan — funicular base station, not intercity rail. Skip but rename so it's readable.
    "osm_jp_9941280727":  ("Kimiidera Cable Sanroku", "紀三井寺ケーブル山麓", None),

    # Mongolia — Han-script border halts. Pinyin.
    "osm_mn_4072951316":  ("Temet",   "特默特", None),
    "osm_mn_11524780871": ("Kumusu",  "库木苏", None),
    "osm_mn_7369154310":  ("Wushe'er","乌舍尔", None),
    "osm_mn_7369154305":  ("Yoerdun", "尤尔敦", None),

    # Myanmar — two of these are actually in PRC Yunnan (mis-bbox); reassign to CN.
    "osm_mm_554060581":   ("Xiyi",      "西邑",   "CN"),
    "osm_mm_1826090372":  ("Chuxiong West", "楚雄西", "CN"),
    "osm_mm_1270396696":  ("Kyini",     "ကြီးနီဘူတာ", None),

    # Russia — Han-script entries are PRC Heilongjiang stations near the border.
    "osm_ru_3038816725":  ("Tongjiang",   "同江",   "CN"),
    "osm_ru_6711712376":  ("Qingling",    "青岭",   "CN"),
    "osm_ru_6715109132":  ("Jianshe",     "建设",   "CN"),
    "osm_ru_7342429581":  ("Hengshan",    "恒山",   "CN"),
    "osm_ru_8983226863":  ("Zhentoufeng", "枕头峰", "CN"),

    # Russia — Hangul-script entry, possibly Sakhalin Korean-area but the name
    # 두암 ('Duam') geocodes to a Sakhalin halt.
    "osm_ru_1932694459":  ("Duam", "두암", None),

    # Pakistan / Iran / Saudi / Turkmenistan — Arabic/Persian script.
    "osm_pk_1778013861":  ("Narowal Junction", "نارووال جکشن", None),
    "osm_ir_8371927564":  ("Miyutek",   "میوتک", None),
    "osm_sa_703746101":   ("Gargar",    "گرگر", None),
    "osm_sa_703746658":   ("Khosravi",  "خسروی", None),
    "osm_sa_802530932":   ("Al-Disah",  "محطة الديسة", None),
    "osm_tm_696516108":   ("Khayyam",   "ایستگاه خیام", None),

    # Israel — Hebrew.
    "osm_il_13626956323": ("Tayibe-Shomron", "טייבה - השומרון", None),
}

# Drop list — these aren't real stations (cable-car platforms, ruin sites).
DROP_IDS = {
    "osm_kr_5411400684",   # 모노레일 탑승장 — monorail boarding area
    "osm_kr_9435437902",   # 상부승강장 — upper platform
    "osm_il_13341910479",  # שרידים של תחנת רכבת טורקית — ruin of Turkish railway station
}

# === Patch ==================================================================
ROUTE_RE_DROP = re.compile(r'^\s*\{\s*from:\s*"([^"]+)",\s*to:\s*"([^"]+)"')
STATION_LINE_RE = re.compile(r'^(\s*\{\s*id:\s*")([a-zA-Z0-9_]+)("\s*,\s*name:\s*")([^"]*)("\s*,\s*native:\s*")([^"]*)("\s*,\s*country:\s*")([A-Z]{2})("[^}]*\},\s*)$')

def patch(path):
    lines = open(path, encoding='utf-8').read().splitlines(keepends=True)
    out = []
    transliterated = 0
    dropped = 0
    drop_routes_for = set(DROP_IDS)
    for ln in lines:
        m = STATION_LINE_RE.match(ln)
        if m:
            pre1, sid, mid1, name, mid2, native, mid3, cc, suffix = m.groups()
            if sid in DROP_IDS:
                dropped += 1
                continue
            # Hand-mapped names take priority
            if sid in HAND:
                new_name, new_native, new_cc = HAND[sid]
                transliterated += 1
                ln = f"{pre1}{sid}{mid1}{new_name}{mid2}{new_native}{mid3}{new_cc or cc}{suffix}"
            elif any('가' <= c <= '힣' for c in name):  # Hangul block
                rom = title(hangul_to_latin(name))
                if rom and rom != name:
                    transliterated += 1
                    ln = f"{pre1}{sid}{mid1}{rom}{mid2}{name}{mid3}{cc}{suffix}"
            out.append(ln)
            continue
        # Drop routes that touch a dropped station
        rm = ROUTE_RE_DROP.match(ln)
        if rm and (rm.group(1) in drop_routes_for or rm.group(2) in drop_routes_for):
            continue
        out.append(ln)
    open(path, 'w', encoding='utf-8').write("".join(out))
    print(f"  {path.split(chr(92))[-1]}: {transliterated} transliterated, {dropped} dropped")

for p in [r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data.js',
          r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_extra.js',
          r'c:\Users\darkl\OneDrive\Desktop\chronotrain\data_ru.js']:
    patch(p)
print("\ndone")
