#!/usr/bin/env python3
"""Relevé complet des remboursements, tiré des tableaux de garanties des fiches docs/connaissances/.

Fabrice, 21/11/2026 : « oui tu relèves l'ensemble … l'ensemble des remboursements des garanties … créer un fichier md ».
Les fiches ont été rédigées par lecture des PDF de docs/ (chiffres vérifiés sur l'image des pages) : on ne relit pas les
PDF ici, on reprend leurs tableaux « ## Tableau des garanties » tels quels.

Sorties :
  docs/connaissances/GARANTIES_TOUTES.md : toutes les lignes, gamme par gamme, formule par formule ;
  docs/garanties_detail.json             : les mêmes lignes rattachées aux formules du comparateur (clé | fi),
                                           lues par la recherche des besoins de la page (🔎).
Usage : python3 tools/garanties_detail.py   (depuis la racine du dépôt)
"""
import json, os, re, sys, datetime

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FICHES = os.path.join(RACINE, "docs", "connaissances")
GAR = json.load(open(os.path.join(RACINE, "src", "garanties.json"), encoding="utf-8"))

def norm(t):
    import unicodedata
    t = unicodedata.normalize("NFD", t.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn").strip()

# ---- colonnes → formules du comparateur -------------------------------------------------------------
def noms(cle):
    return GAR["gammes"][cle]["names"]

def colonnes_gamme(cle, alias=None):
    """{en-tête normalisé: [(clé, fi)]} pour une gamme locale."""
    m = {}
    for fi, n in enumerate(noms(cle)):
        m[norm(n)] = [(cle, fi)]
    for a, fi in (alias or {}).items():
        m[norm(a)] = [(cle, fi)]
    return m

def tout(cles):
    return [(c, fi) for c in cles for fi in range(len(noms(c)))]

APRIL = GAR.get("april", {}).get("gammes", {})
def colonnes_april(code):
    g = APRIL[code]; m = {}
    fis = g["fi"]
    for i, fi in enumerate(fis):
        for h in ("n%d" % (i + 1), "niveau %d" % (i + 1), "f%d" % (i + 1)):
            m[h] = [("APRIL", fi)]
    m["__tout__"] = [("APRIL", fi) for fi in fis]
    return m

def rev_cols():
    m = {}
    for n in range(1, 9):
        l = [("REV", n - 1)]
        if n >= 2: l.append(("RF50", n - 2))
        if 2 <= n <= 6: l.append(("RF100", n - 2))
        m["rev %d" % n] = l
    m["__tout__"] = tout(["REV", "RF50", "RF100"])
    m["renfort 50"] = [("RF50", fi) for fi in range(len(noms("RF50")))]
    m["renfort 100"] = [("RF100", fi) for fi in range(len(noms("RF100")))]
    return m

APICIL = {("e%d" % i): [("APICIL", i - 1)] for i in range(1, 7)}
APICIL.update({("s%d" % i): [("APICIL", 5 + i)] for i in range(1, 6)})
APICIL["__tout__"] = tout(["APICIL"])

FICHES_CONF = {
    "avenir_capevolution.md": ("Avenir Mutuelle — CAP ÉVOLUTION", colonnes_gamme("CAPEVO")),
    "avenir_capnr.md": ("Avenir Mutuelle — CAP NR", dict(colonnes_gamme("CAPNR", {"ESSENTIEL": 0, "100 NR": 1, "130 NR": 2, "160 NR": 3,
                                                   "200 NR": 4, "300 NR": 5, "400 NR": 6}), __tout__=tout(["CAPNR"]))),
    "avenir_talis.md": ("Avenir Mutuelle — TALIS (surcomplémentaire)", colonnes_gamme("TALIS", {"TALIS": 0, "TALIS +": 1})),
    "avenir_lpshospi.md": ("Avenir Mutuelle — LPS HOSPI", dict(colonnes_gamme("LPSH", {"LPS HOSPI": 0}), __tout__=tout(["LPSH"]))),
    "mutuelleverte_gci.md": ("La Mutuelle Verte — GCI", colonnes_gamme("MV", {"GCI 500 (non resp.)": 4})),
    "rema_revoluo.md": ("REMA — RÉVOLUO (et Renforts 50 / 100)", rev_cols()),
    "apicil_apisante.md": ("APICIL — API SANTÉ", APICIL),
    "mcci.md": ("MCCI — MCCINOVA, FLEXIA, SOLENCIA", None),   # trois gammes : la colonne dit laquelle
    "april_onlysante.md": ("APRIL — Only Santé", colonnes_april("OnlySante")),
    "april_santegan.md": ("APRIL — Senior GAN", colonnes_april("SanteGan")),
    "april_santemix.md": ("APRIL — Santé Mix Proximité", colonnes_april("SanteMix")),
    "april_santepeps.md": ("APRIL — Santé Peps", colonnes_april("SantePeps")),
    "april_santepro.md": ("APRIL — Santé Pro (TNS)", colonnes_april("SantePro")),
    "april_santeprostart.md": ("APRIL — Santé Pro Start (TNS)", colonnes_april("SanteProStart")),
    "april_santetranquil.md": ("APRIL — Tranquillité Santé", colonnes_april("SanteTranquil")),
    "april_santevita.md": ("APRIL — Vita Santé", colonnes_april("SanteVita")),
    "april_santezen.md": ("APRIL — Santé Zen", colonnes_april("SanteZen")),
}
MCCI = {}
for c in ("MCCINOVA", "FLEXIA", "SOLENCIA"):
    for fi, n in enumerate(noms(c)):
        MCCI.setdefault(c, {})[norm(n)] = [(c, fi)]

# Sous-tableaux optionnels (renforts, packs, surcomplémentaires en plus du socle) : dans le fichier, jamais dans la recherche.
# Les renforts de Révoluo sont des produits du comparateur (RF50, RF100) : ils restent comptés.
OPTION_RE = re.compile(r"renfort|\(option|option\b|surco|surcompl|pack confort|pack sant", re.I)
TOUT_RE = re.compile(r"^(n1 a n\d|rev 1 a rev 8|toutes formules|n1 a n5|n1 a n6)$")

def cellules(l):
    return [c.strip() for c in l.strip().strip("|").split("|")]

def nettoie(t):
    t = re.sub(r"\*\*(.*?)\*\*", r"\1", t)
    t = t.replace("\\|", "|")
    return re.sub(r"\s+", " ", t).strip()

def lit_fiche(nom):
    titre, conf = FICHES_CONF[nom]
    L = open(os.path.join(FICHES, nom), encoding="utf-8").read().split("\n")
    dans = False; sous = ""; tables = []
    i = 0
    while i < len(L):
        l = L[i]
        if l.startswith("## "):
            dans = l.lower().startswith("## tableau des garanties")
        elif dans and l.startswith("### "):
            sous = nettoie(l[4:])
        elif dans and l.startswith("|") and i + 1 < len(L) and re.match(r"^\|[-| :]+\|\s*$", L[i + 1]):
            tete = cellules(l); lignes = []
            j = i + 2
            while j < len(L) and L[j].startswith("|"):
                lignes.append([nettoie(c) for c in cellules(L[j])]); j += 1
            tables.append((sous, [nettoie(c) for c in tete], lignes)); i = j; continue
        i += 1
    # notes du haut de section (source, renvois) : la 1re ligne de texte qui suit le titre
    return titre, conf, tables

def rattache(conf, tete, nom, sous=""):
    """Pour chaque colonne de valeurs : la liste des (clé, fi) qu'elle concerne, ou None (colonne d'option)."""
    cols = []
    if nom != "rema_revoluo.md" and OPTION_RE.search(sous or ""):
        return [None] * (len(tete) - 1), True
    if nom == "mcci.md":
        g = None
        for c, m in MCCI.items():
            if all(norm(h) in m for h in tete[1:]): g = c
        return [MCCI[g][norm(h)] if g else None for h in tete[1:]], (g is None)
    for h in tete[1:]:
        n = norm(h)
        if n in conf: cols.append(conf[n])
        elif TOUT_RE.match(n) and "__tout__" in conf: cols.append(conf["__tout__"])
        else: cols.append(None)
    return cols, all(c is None for c in cols)

def main():
    detail = {}; md = []
    date = datetime.date.today().strftime("%d/%m/%Y")
    md.append("# Toutes les garanties — remboursements formule par formule\n")
    md.append("Relevé du %s, tiré des tableaux « Tableau des garanties » des fiches de ce dossier (chaque fiche cite ses pages "
              "sources ; chiffres vérifiés sur l'image des PDF de `docs/`). Fabriqué par `tools/garanties_detail.py` — ne pas éditer "
              "à la main : corriger la fiche, puis relancer l'outil. Les mêmes lignes alimentent la recherche des besoins (🔎) du "
              "comparateur (`docs/garanties_detail.json`).\n" % date)
    md.append("Lecture : % = % de la base de remboursement Sécu comprise ; € = forfait ; « - » = non couvert ; renforts et packs "
              "optionnels dans des tableaux à part (non comptés dans la recherche).\n")
    md.append("Non relevés (pas de fiche) : APRIL Flexi Santé, Santé Optimale, Simply Santé, Pro Privilège, Protect, Cap Sérénité.\n")
    nb = 0
    for nom in FICHES_CONF:
        titre, conf, tables = lit_fiche(nom)
        md.append("\n## %s\n\n_Source : `docs/connaissances/%s`._\n" % (titre, nom))
        for sous, tete, lignes in tables:
            cols, option = rattache(conf, tete, nom, sous)
            md.append("\n### %s%s\n" % (sous or "Garanties", " — option (non comptée dans la recherche)" if option else ""))
            md.append("| " + " | ".join(tete) + " |")
            md.append("|" + "---|" * len(tete))
            for ln in lignes:
                ln = (ln + [""] * len(tete))[:len(tete)]
                vals = ln[1:]
                prec = None
                for k, v in enumerate(vals):           # « idem » = valeur de la colonne précédente
                    if norm(v) == "idem" and prec is not None: vals[k] = prec
                    prec = vals[k]
                md.append("| " + " | ".join([ln[0]] + vals) + " |")
                for k, v in enumerate(vals):
                    if k >= len(cols) or not cols[k]: continue
                    for (cle, fi) in cols[k]:
                        detail.setdefault(cle, {}).setdefault(str(fi), []).append([sous, ln[0], v])
                        nb += 1
    out = {"genere": date, "source": "docs/connaissances/*.md (Tableau des garanties)", "outil": "tools/garanties_detail.py",
           "lignes": detail}
    json.dump(out, open(os.path.join(RACINE, "docs", "garanties_detail.json"), "w", encoding="utf-8"), ensure_ascii=False,
              separators=(",", ":"))
    open(os.path.join(FICHES, "GARANTIES_TOUTES.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")
    print("lignes rattachées :", nb, "| gammes :", {k: len(v) for k, v in detail.items()})

if __name__ == "__main__":
    main()
