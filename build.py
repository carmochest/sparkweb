#!/usr/bin/env python3
"""Assemble static pages from _partials + _pages. Run: python3 build.py"""
import re, pathlib
root = pathlib.Path(__file__).parent
header = (root / "_partials/header.html").read_text()
footer = (root / "_partials/footer.html").read_text()
for page in sorted((root / "_pages").glob("*.html")):
    body = page.read_text()
    title = re.search(r"<!--TITLE: (.*?)-->", body).group(1)
    desc = re.search(r"<!--DESC: (.*?)-->", body).group(1)
    body = re.sub(r"<!--TITLE: .*?-->\n?", "", body)
    body = re.sub(r"<!--DESC: .*?-->\n?", "", body)
    out = header.replace("{{TITLE}}", title).replace("{{DESC}}", desc) + body + footer
    (root / page.name).write_text(out)
    print("built", page.name)
