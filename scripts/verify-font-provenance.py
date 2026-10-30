"""Read-only font comparison; requires optional FontTools (not needed to run the app)."""
import hashlib
import json
from pathlib import Path
from fontTools.ttLib import TTFont

source = Path('node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff')
target = Path('scripts/cormorant-garamond-600.ttf')
a = TTFont(source, recalcTimestamp=False)
b = TTFont(target, recalcTimestamp=False)
differences = [tag for tag in a.keys() if tag not in ['GlyphOrder', 'head'] and a[tag].compile(a) != b[tag].compile(b)]
head_differences = [key for key, value in a['head'].__dict__.items() if value != b['head'].__dict__.get(key)]
matched = set(a.keys()) == set(b.keys()) and not differences and set(head_differences) <= {'modified', 'checkSumAdjustment'}
print(json.dumps({'source': str(source), 'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'target': str(target), 'target_sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'matching_font_tables': matched, 'non_head_differences': differences, 'head_differences': head_differences}, indent=2))
raise SystemExit(0 if matched else 1)
