"""Write a path/hash inventory without inferring ownership from appearance.
Run from the repository root after npm ci. Does not modify artwork or fonts.
"""
import csv
import hashlib
import json
from pathlib import Path
import re
import subprocess

root = Path.cwd()
out = root / 'docs/inventory'
out.mkdir(exist_ok=True)
paths = subprocess.check_output(['git', 'ls-files'], text=True).splitlines()
# Include review captures, including new ones before they are committed.
paths = sorted(set(paths) | {str(p) for p in Path('docs/screenshots').glob('*.png')})
rows = []
for path in paths:
    p = Path(path)
    if not p.exists() or not (path.startswith(('static/', 'docs/screenshots/')) or path in ['contact.png', 'scripts/cormorant-garamond-600.ttf']):
        continue
    role, origin, evidence, decision = 'project imagery', 'owner-attested AI-generated during 2026: Grok Imagine and ChatGPT/OpenAI image generation; individual provider unverified', 'Owner confirms 2026 generation and providers in RIGHTS.md; exact dates/plans/terms and repository-wide inputs unverified', 'Project rights reserved; provider/input terms review remains; preserve asset'
    if path.startswith('static/textures/') or path == 'static/favicon.svg':
        role, evidence = 'procedural vector source', 'SVG filters/shapes; owner confirms AI generation during 2026 with Grok Imagine and ChatGPT/OpenAI (RIGHTS.md)'
    if '/sofa-books/' in path and p.suffix == '.webp':
        role, evidence = 'generated derivative: story cover or positioned book', 'scripts/generate_sofa_books.py describes derivation from atlases/cloth and historical templates; source images/textures owner-attested AI-generated during 2026 (RIGHTS.md)'
    if 'atlas' in path:
        role = 'source artwork atlas'
    if path.startswith('docs/screenshots/') or path == 'contact.png':
        role = 'review screenshot/contact sheet derivative'
        origin = 'application render/contact sheet derived from owner-attested 2026 AI artwork'
        evidence = 'Actual application capture or project contact sheet; source art attestation in RIGHTS.md'
    if p.suffix == '.temporary':
        origin = 'not applicable: empty file'
        role, evidence, decision = 'empty build remnant', f'{p.stat().st_size} bytes; no visible artwork', 'No meaningful image content; no deletion needed for review'
    if p.suffix == '.ttf':
        role, origin, evidence, decision = 'font derivative', 'third-party: Cormorant Garamond 4.001 / SIL OFL-1.1', 'Pass 2 table comparison verified SHA-256 d44e6acce1ab253c7cf0dfe4ccd5923be9d7dfc7f7050ef7bbb3778daca568c5 against locked Fontsource WOFF; rerun scripts/verify-font-provenance.py if changed', 'Distributable with Cormorant copyright/OFL notice; preserve font naming conditions'
    sha = hashlib.sha256(p.read_bytes()).hexdigest()
    rows.append([path, p.stat().st_size, sha, role, origin, evidence, decision])
with (out / 'assets.csv').open('w') as f:
    writer = csv.writer(f, lineterminator='\n'); writer.writerow(['path', 'bytes', 'sha256', 'role', 'origin_classification', 'evidence', 'distribution_decision']); writer.writerows(rows)
# Git entry dates are repository evidence, not generation dates or author/provider proof.
first_seen = {}
revisions = {}
previous = {}
commits = subprocess.check_output(['git', 'rev-list', '--reverse', 'HEAD', '--', 'src/lib/data/library.js', 'src/lib/data/library.ts'], text=True).splitlines()
for commit in commits:
    for library_path in ['src/lib/data/library.ts', 'src/lib/data/library.js']:
        result = subprocess.run(['git', 'show', commit + ':' + library_path], capture_output=True, text=True)
        if result.returncode == 0:
            break
    else:
        continue
    date = subprocess.check_output(['git', 'show', '-s', '--format=%aI', commit], text=True).strip()
    current = {}
    for match in re.finditer(r"slug:\s*'([^']+)'", result.stdout):
        slug = match.group(1)
        rest = result.stdout[match.end():]
        next_slug = re.search(r"slug:\s*'", rest)
        block = rest[:next_slug.start()] if next_slug else rest
        description = re.search(r"description:\s*'((?:[^'\\]|\\.)*)'", block)
        excerpt = re.search(r'excerpt:\s*\[(.*?)\]', block, re.S)
        current[slug] = (description.group(1) if description else '', tuple(re.findall(r"'((?:[^'\\]|\\.)*)'", excerpt.group(1))) if excerpt else ())
        first_seen.setdefault(slug, (commit, date))
        if slug in previous and previous[slug] != current[slug]:
            revisions.setdefault(slug, []).append(commit)
    previous = current
source = Path('src/lib/data/library.ts').read_text()
with (out / 'stories.csv').open('w') as f:
    writer = csv.writer(f, lineterminator='\n')
    writer.writerow(['slug', 'title', 'source', 'content', 'authorship', 'decision', 'first_seen_commit', 'git_author_date', 'later_text_revision_commits'])
    for slug, title in re.findall(r"slug: '([^']+)', title: '([^']+)'", source):
        commit, date = first_seen[slug]
        writer.writerow([slug, title, 'src/lib/data/library.ts', 'description and excerpt; displayed minutes do not establish a full-length story', 'mixed human-authored and AI-assisted content (owner-confirmed); individual attribution unverified', 'Owner supplied no outside material for reproduction; repository-wide origin not independently certified; reserved rights preference', commit, date, '; '.join(revisions.get(slug, [])) or 'none found; formatting and type changes excluded'])
lock = json.loads(Path('package-lock.json').read_text())
with (out / 'dependencies.csv').open('w') as f:
    writer = csv.writer(f, lineterminator='\n'); writer.writerow(['lock_path', 'version', 'declared_license', 'dev_dependency', 'optional', 'notice_status'])
    for path, meta in sorted(lock['packages'].items()):
        if path:
            installed = Path(path)
            notices = sorted(str(p) for p in installed.glob('*') if p.is_file() and p.name.lower().startswith(('license', 'licence', 'notice', 'copying'))) if installed.exists() else []
            writer.writerow([path, meta['version'], meta.get('license', 'UNDECLARED'), meta.get('dev', False), meta.get('optional', False), '; '.join(notices) or 'Not installed on this platform; verify upstream notice before redistributing'])
# Historical-only asset sources remain distributed with Git history.
historical = subprocess.check_output(['git', 'log', '--all', '--format=', '--name-only', '--', 'assets', 'static'], text=True).splitlines()
with (out / 'historical-assets.txt').open('w') as f:
    f.write('Historical-only paths: image/texture family owner-attested AI-generated (RIGHTS.md); per-file provider/input/terms records remain unverified; history is not rewritten.\n')
    f.write('\n'.join(sorted(set(p for p in historical if p and not Path(p).exists()))) + '\n')
print(f'Inventoried {len(rows)} current asset/font files; {len(lock["packages"])-1} locked dependency entries.')
