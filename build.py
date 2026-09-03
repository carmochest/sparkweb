#!/usr/bin/env python3
"""Assemble static pages from _partials + _pages. Run: python3 build.py

index.html is the one-page app: every other page's content is also embedded
into it as a pop-up "sheet" (replacing the {{SHEETS}} token), so visitors can
open Tickets, Plan Your Visit, etc. without leaving the map. The standalone
pages are still built as a fallback / for direct links."""
import re, pathlib, time
V = str(int(time.time()))  # cache-busting stamp for css/js
root = pathlib.Path(__file__).parent
header = (root / "_partials/header.html").read_text()
footer = (root / "_partials/footer.html").read_text()

SHEETS = ["tickets", "plan-your-visit", "events", "programs", "parties", "field-trips", "sponsorship", "terms"]

def read_page(name):
    body = (root / "_pages" / f"{name}.html").read_text()
    title = re.search(r"<!--TITLE: (.*?)-->", body).group(1)
    desc = re.search(r"<!--DESC: (.*?)-->", body).group(1)
    body = re.sub(r"<!--TITLE: .*?-->\n?", "", body)
    body = re.sub(r"<!--DESC: .*?-->\n?", "", body)
    return title, desc, body

def sheet_from(name):
    """Turn a page body into a sheet: keep the hero heading, drop the hero photo,
    drop the 3D map section (the app has it on the front), unwrap <main>."""
    _, _, body = read_page(name)
    body = re.sub(r'<main id="main">|</main>', "", body)
    h1 = re.search(r"<h1>(.*?)</h1>", body, re.S)
    heading = re.sub(r"\s+", " ", h1.group(1)).strip() if h1 else name.replace("-", " ").title()
    # hero: keep lede + ctas, lose the photo/grid
    hero = re.search(r'<section class="hero[^"]*"[^>]*>.*?</section>', body, re.S)
    intro = ""
    if hero:
        h = hero.group(0)
        lede = re.search(r'<p class="lede">.*?</p>', h, re.S)
        ctas = re.search(r'<div class="hero-ctas">.*?</div>', h, re.S)
        intro = (lede.group(0) if lede else "")  # ctas dropped: the tickets strip covers it
        body = body.replace(h, "")
    body = re.sub(r'<section class="mm-section"[^>]*>.*?</section>\s*', "", body, flags=re.S)
    cta = "" if name in ("tickets", "terms", "parties", "field-trips", "sponsorship") else (
        '<div class="panel-tickets"><div><strong>Ready to visit?</strong><span>Day passes from 450 THB · memberships available</span></div>'
        '<a class="btn btn--coral btn--small" href="tickets.html" data-sheet="tickets">Tickets &amp; membership</a></div>')
    return (f'<article class="sheet" id="sheet-{name}" hidden aria-labelledby="sheet-{name}-title" role="dialog">\n'
            f'  <header class="sheet-head"><h2 id="sheet-{name}-title">{heading}</h2>'
            f'<button type="button" class="sheet-close" data-sheet-close aria-label="Close">×</button></header>\n'
            f'  <div class="sheet-body">{cta}<div class="sheet-intro">{intro}</div>{body}</div>\n'
            f'</article>\n')

zone_sheet = ('<article class="sheet sheet--zone" id="sheet-zone" hidden aria-labelledby="sheet-zone-title" role="dialog">\n'
              '  <header class="sheet-head"><h2 id="sheet-zone-title">Zone</h2><button type="button" class="sheet-close" data-sheet-close aria-label="Close">×</button></header>\n'
              '  <div class="sheet-body"></div>\n</article>\n')
sheets_html = '<div class="sheet-layer" data-sheet-layer hidden>\n' + "".join(sheet_from(n) for n in SHEETS) + zone_sheet + "</div>\n"

for page in sorted((root / "_pages").glob("*.html")):
    title, desc, body = read_page(page.stem)
    if page.stem == "index":
        body = body.replace("{{SHEETS}}", sheets_html)
    out = header.replace("{{TITLE}}", title).replace("{{DESC}}", desc) + body + footer
    out = re.sub(r'(href|src)="((?:css|js)/[^"?]+)"', lambda m: f'{m.group(1)}="{m.group(2)}?v={V}"', out)
    (root / page.name).write_text(out)
    print("built", page.name)
