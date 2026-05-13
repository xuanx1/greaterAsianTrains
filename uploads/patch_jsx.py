"""Replace the literal combining-mark range with \\u escapes (safer)."""
p = r'c:\Users\darkl\OneDrive\Desktop\chronotrain\app.jsx'
s = open(p, encoding='utf-8').read()
old = '.normalize("NFD").replace(/[̀-ͯ]/g, "")'.replace('̀-ͯ', '̀-ͯ')
# we want to find the literal-mark version and turn it into \\u escape
needle = '.normalize("NFD").replace(/[̀-ͯ]/g, "")'
# the file has the literal mark version:
file_needle = '.normalize("NFD").replace(/[' + chr(0x300) + '-' + chr(0x36f) + ']/g, "")'
assert file_needle in s, "literal-mark form not found"
replacement = '.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")'
s2 = s.replace(file_needle, replacement, 1)
open(p, 'w', encoding='utf-8').write(s2)
print("patched: literal combining marks replaced with \\u escape")
