#!/usr/bin/env python3
"""check-motcle.py — le terme-clé du titre est dans le H1, le premier paragraphe et un H2
(MASTERFACTORY-SITE.md §13 : « mot-clé dans H1 + premier paragraphe + un H2 »).

Repris le 2026-11-10 de reports/audit-seo-2026-11-09/motcle_local.py, qui avait servi à corriger
11 sites le 2026-11-09 mais n'était lancé par aucun site. Changements :
  - les mots s'écrivent dans tout alphabet (« Fuß », « congé », « è » coupaient les mots) ;
  - mots vides en anglais, français, allemand, espagnol, italien, portugais et néerlandais ;
  - les pages de service (à propos, méthode, légal, contact, widget) sont écartées : leur terme est le
    nom du site, une phrase naturelle suffit (consigne du brief du 2026-11-09).

Terme-clé = début du <title> avant « : », « | », « ( », « — » ou l'année. Présent dans une zone si au
moins 2/3 de ses mots pleins y sont ; pour les H2, dans un même H2. Premier paragraphe = premier <p>
après le H1 (hors nav, footer) : une mention « site indépendant » placée avant l'introduction en prend
la place, et c'est elle que Google lit en tête.

Usage : python3 check-motcle.py <dossier-du-site | dossier dist>   -> code 1 s'il reste des pages en écart.
Validé le 2026-11-10 : 0 écart sur 11 sites corrigés le 2026-11-09 (cas bons), écarts trouvés sur les
sites non corrigés et sur une page dont on a retiré le terme du H1 (cas mauvais).
"""
import collections
import glob
import html
import os
import re
import sys

STOP = set("""
the a an of in on for and to by your my is are what how with from at uk us vs or per
le la les des du de un une et pour par sur dans au aux en ou votre vos quel quelle combien comment est
der die das den dem des ein eine einen und für fur von mit im zu wie viel was ist oder bei nach
el los las del por para con y que cuánto cuanto cómo como mi tu su al
il lo gli dei delle degli una e per con nel nella come quanto quanti di da
o os as do da dos das um uma com no na quanto
het een van voor op hoe wat
""".split())
SERVICE = re.compile(
    r"/(about|about-us|a-propos|qui-sommes-nous|sobre|sobre-nosotros|quienes-somos|chi-siamo|ueber-uns|uber-uns"
    r"|over-ons|quem-somos|method|methode|methodology|methodologie|metodologia|methodik|legal|legal-notice|mentions"
    r"|mentions-legales|privacy|privacy-policy|confidentialite|cookies|impressum|datenschutz|privacidad|aviso-legal"
    r"|note-legali|terms|cgu|contact|kontakt|contacto|contatti|contato|widget|embed|editorial|editorial-policy|charte-editoriale|politique-editoriale)(/|$)")


def norm(s):
    return re.findall(r"[^\W_]+", html.unescape(s).lower())


def attr(h, pat):
    m = re.search(pat, h, re.S | re.I)
    return m.group(1) if m else ""


def texte(s):
    return re.sub(r"<[^>]+>", " ", s)


def analyse(h):
    t = html.unescape(attr(h, r"<title[^>]*>(.*?)</title>")).strip()
    key = re.split(r"[:|(—–]| 20\d\d", t)[0].strip()
    kw = [w for w in norm(key) if w not in STOP and (len(w) > 2 or w.isdigit())]
    main = re.sub(r"<(script|style|nav|footer)[\s\S]*?</\1>", " ", h)
    h1 = texte(attr(main, r"<h1[^>]*>(.*?)</h1>"))
    apres = main.split("</h1>", 1)[-1]
    m = re.search(r"<p[^>]*>(.*?)</p>", apres, re.S)
    p1 = texte(m.group(1) if m else "")
    h2s = [texte(x) for x in re.findall(r"<h2[^>]*>(.*?)</h2>", main, re.S)]

    def a(txt):
        ws = {x.rstrip("s") for x in norm(txt)}
        n = sum(k.rstrip("s") in ws for k in kw)
        return n >= max(1, round(len(kw) * 2 / 3)) if kw else True

    manque = [z for z, ok in (("H1", a(h1)), ("1er paragraphe", a(p1)), ("H2", any(a(x) for x in h2s))) if not ok]
    return key, manque, html.unescape(p1).strip()[:90]


def main():
    arg = (sys.argv[1] if len(sys.argv) > 1 else ".").rstrip("/")
    dist = next((os.path.join(arg, d) for d in ("dist", "out") if os.path.isdir(os.path.join(arg, d))), arg)
    fautes, n = [], 0
    for f in sorted(glob.glob(f"{dist}/**/index.html", recursive=True)):
        url = "/" + os.path.relpath(f, dist).replace("index.html", "")
        if SERVICE.search(url):
            continue
        h = open(f, encoding="utf8").read()
        if re.search(r'<meta[^>]+name="robots"[^>]+noindex', h) or "<h1" not in h or 'http-equiv="refresh"' in h:
            continue
        n += 1
        key, manque, p1 = analyse(h)
        if manque:
            fautes.append((url, key, manque, p1))
    if n == 0:
        print("check-motcle : 0 page lue — le contrôle a échoué, il n'a rien vérifié")
        sys.exit(2)
    print(f"check-motcle : {len(fautes)}/{n} page(s) où le terme-clé du titre manque",
          dict(collections.Counter(z for x in fautes for z in x[2])))
    for url, key, manque, p1 in fautes[:40]:
        print(f"  {url:45.45} « {key} » absent de : {', '.join(manque)}\n      1er § : {p1}")
    sys.exit(1 if fautes else 0)


if __name__ == "__main__":
    main()
