"""Bounded, read-only history scan. Reports paths/counts, never matched values.
Run from repository root: python3 scripts/audit-publication.py
Binary provenance and customer identification still require manual review.
"""
import collections
import json
import re
import subprocess


def git(*args):
    return subprocess.check_output(['git', *args])


patterns = {
    'secret-shaped': r'(?:sk_(?:live|test)_[A-Za-z0-9]{12,}|whsec_[A-Za-z0-9]{12,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)',
    'capability-shaped': r'''(?:proof|tracking_proof|client_secret|idempotency_key)[\s"':=]+[A-Za-z0-9_-]{24,}''',
    'private-network': r'https?://(?:10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|[^/\s]+\.(?:internal|local))',
    # Names are deliberately not reproduced in the public report.
    'historical-operations': r'customer dashboard roles|cross-service history|shared backend serving',
}
findings = collections.defaultdict(set)
counts = collections.Counter()
rows = git('rev-list', '--objects', '--all').decode().splitlines()
for row in rows:
    parts = row.split(' ', 1)
    if len(parts) != 2:
        continue
    sha, path = parts
    if git('cat-file', '-t', sha).strip() != b'blob':
        continue
    data = git('cat-file', 'blob', sha)
    if b'\0' in data:
        counts['binary_blobs'] += 1
        continue
    counts['text_blobs'] += 1
    text = data.decode('utf-8', errors='replace')
    for label, pattern in patterns.items():
        if re.search(pattern, text, re.I):
            findings[label].add(path)
    for email in re.findall(r'\b[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b', text):
        if email not in {'example.test', 'example.com', 'b.test'}:
            findings['email-domain-needs-review'].add(path)
print(json.dumps({
    'commits': int(git('rev-list', '--all', '--count')),
    'objects': len(rows), **counts,
    'findings': {label: sorted(paths) for label, paths in findings.items()},
    'limits': 'Pattern scan only; no assertion of secret absence or asset rights. Does not fetch refs or inspect external services.',
}, indent=2))
