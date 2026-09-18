#!/usr/bin/env python3
"""Construit toutes les versions du comparateur Santéo à partir de src/.

  python3 build.py

Produit dans dist/ :
  clients.html            lien clients (claude.ai) — sans popup d'import, avec bulletin
  crm-public.html         lien du bouton € (claude.ai, public) — import, sans bulletin, icône 🔒
  adhesion-privee.html    lien privé Fabrice (claude.ai) — import + bulletin PDF, badge rouge
  comparateur-claude.html page autonome hébergeable dans le CRM Manus — tout, sans code (auth CRM)
  index.html              page GitHub Pages — import automatique par le lien, copie d'image directe,
                          bulletin PDF derrière un code d'accès (ADH_PASSWORD ci-dessous)
"""
import base64, hashlib, json, pathlib, datetime, subprocess, tempfile
# Horodatage de construction : ISO en UTC, la page l'affiche dans l'heure locale du navigateur
BUILD = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# Code d'accès au bulletin d'adhésion sur GitHub Pages (seule son empreinte SHA-256 est publiée).
# Pour le changer : modifier ici, relancer build.py, pousser dist/index.html sur santeo-tarifs.
# Codes d'accès à l'adhésion : seules les empreintes SHA-256 figurent ici (dépôt public).
# Pour changer un code : python3 -c "import hashlib;print(hashlib.sha256(b'NouveauCode').hexdigest())"
ADH_GATE = ",".join([
    "771b132d4416ba004e694647abf789f5a5ac3c076eb4cca1b1dff3252873f486",
    "d8be6f5e88953c3603fa0a5aaed3819710944f30c8f1c974b08232a76b41d05f",
])
ROOT = pathlib.Path(__file__).parent
# Ce fichier fonctionne qu'il soit a la racine du depot ou dans src/
if not (ROOT/"src").exists() and (ROOT.parent/"src").exists():
    ROOT = ROOT.parent
SRC, DIST = ROOT/"src", ROOT/"dist"
DIST.mkdir(exist_ok=True)

tpl  = (SRC/"comparateur.html").read_text(encoding="utf-8")

# ---------------------------------------------------------------- garanties.json
# Les garanties par formule vivent dans comparateur.html (objets F, EX, COMP, TGNOTE,
# TGROWS) : c'est la page qui les affiche, c'est elle qui fait foi. On les republie
# telles quelles en JSON pour que le CRM WhatsApp lise les memes valeurs, sans jamais
# les recopier a la main. La page, elle, ne depend pas de ce fichier.

def _bloc(nom, ligne_debut):
    """Texte d'une declaration JS, de sa ligne d'ouverture au « }; » en debut de ligne."""
    i = tpl.find(ligne_debut)
    if i < 0:
        raise SystemExit("build.py : declaration introuvable dans comparateur.html — " + nom)
    fin = tpl.find("\n};", i)
    if fin < 0:                      # declaration tenant sur une seule ligne
        fin = tpl.find("\n", i)
        return tpl[i:fin]
    return tpl[i:fin + 3]

def ecrire_garanties():
    decls = "\n".join([
        _bloc("F", "const F = {"),
        _bloc("EX", "const EX={"),
        _bloc("TGNOTE", "const TGNOTE={"),
        _bloc("COMP", "const COMP={"),
    ])
    # Les lignes du tableau vivent desormais dans src/tableau.js, partage avec le serveur.
    dump = decls + "\nconst TGROWS = require(" + json.dumps(str(SRC/"tableau.js")) + ").POSTES;\n" + """
const postes = TGROWS.map(([libelle, src]) => src.startsWith("x:")
  ? {cle: src.slice(2), libelle, source: "extras"}
  : {cle: src, libelle, source: "gammes"});
console.log(JSON.stringify({
  genere: process.argv[1],
  source: "src/comparateur.html — objets F, EX, COMP, TGNOTE",
  avertissement: "Synthese des tableaux de garantie. Seuls les documents contractuels (TG, notice, IPID) font foi.",
  compagnies: COMP, postes, gammes: F, extras: EX, notes: TGNOTE,
}, null, 1));
"""
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as fh:
        fh.write(dump)
        chemin = fh.name
    try:
        sortie = subprocess.run(["node", chemin, BUILD], capture_output=True, text=True)
    except FileNotFoundError:
        print("build.py : node absent — src/garanties.json laisse en l'etat.")
        return
    finally:
        pathlib.Path(chemin).unlink(missing_ok=True)
    if sortie.returncode:
        print("build.py : extraction des garanties impossible — src/garanties.json laisse en l'etat.")
        print(sortie.stderr.strip()[:500])
        return
    # Reecrit seulement si le contenu change, pour ne pas polluer l'historique a chaque build.
    cible, neuf = SRC/"garanties.json", sortie.stdout
    ancien = cible.read_text(encoding="utf-8") if cible.exists() else None
    def sans_date(t):
        try: d = json.loads(t); d.pop("genere", None); return json.dumps(d, sort_keys=True)
        except Exception: return t
    if ancien is None or sans_date(ancien) != sans_date(neuf):
        cible.write_text(neuf, encoding="utf-8")
        print("src/garanties.json regenere :", len(json.loads(neuf)["gammes"]), "gammes")

ecrire_garanties()

data = (SRC/"tarifs_all.json").read_text(encoding="utf-8")
b64  = base64.b64encode((SRC/"bulletin_avenir.pdf").read_bytes()).decode()

# Modules partages avec le serveur du CRM : recopies dans la page pour qu'elle reste
# un fichier unique, et publies tels quels dans dist/ pour etre charges par Node.
# Feuille de style de la page, republiee telle quelle : le serveur du CRM rend le
# tableau de garantie avec exactement les memes regles, sans copie a maintenir.
_i = tpl.index("<style>") + len("<style>")
_j = tpl.index("</style>", _i)
(SRC/"tableau.css").write_text(
    "/* Genere par build.py depuis le <style> de src/comparateur.html — ne pas editer. */\n"
    "@import url(\"https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800"
    "&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap\");\n" + tpl[_i:_j],
    encoding="utf-8")

MODULES = ["moteur.js", "tableau.js"]
modules = "\n".join((SRC/m).read_text(encoding="utf-8") for m in MODULES if (SRC/m).exists())
for m in MODULES:
    if (SRC/m).exists():
        (DIST/m).write_text((SRC/m).read_text(encoding="utf-8"), encoding="utf-8")
for f in ("garanties.json", "tableau.css"):
    if (SRC/f).exists():
        (DIST/f).write_text((SRC/f).read_text(encoding="utf-8"), encoding="utf-8")

base = (tpl.replace("/*__MODULES__*/", modules)
           .replace("__DATA__", data).replace("__BULLETIN__", b64))

URL = {
  "clients":  "https://claude.ai/code/artifact/6be994e8-c859-47e4-952f-b11dec7e44b7",
  "crm":      "https://claude.ai/code/artifact/960f3fdc-224f-48cb-8d93-e7e0af3d576d",
  "adhesion": "https://claude.ai/code/artifact/b250e322-069b-4841-a2c6-30270337f45e",
}

def variant(crm, adh, adhurl, priv, selfurl, title, hosted=False, gate=""):
    s = (base.replace("__CRM__", "true" if crm else "false")
             .replace("__ADH__", "true" if adh else "false")
             .replace("__ADHURL__", adhurl)
             .replace("__PRIV__", "true" if priv else "false")
             .replace("__SELFURL__", selfurl)
             .replace("__HOSTED__", "true" if hosted else "false")
             .replace("__GATE__", gate)
             .replace("__BUILD__", BUILD))
    if title:
        s = s.replace("<title>Comparateur Santéo</title>", f"<title>{title}</title>", 1)
    return s

def wrap(body):
    return ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
            '<style>:root{color-scheme:light dark}body{margin:0;font:14px system-ui,sans-serif;background:#f6f7f4}'
            'img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n'+body+'\n</body>\n</html>\n')

(DIST/"clients.html").write_text(variant(False, True, "", False, URL["clients"], None), encoding="utf-8")
(DIST/"crm-public.html").write_text(variant(True, False, URL["adhesion"], False, URL["crm"], "Comparateur Santéo CRM"), encoding="utf-8")
(DIST/"adhesion-privee.html").write_text(variant(True, True, "", True, URL["adhesion"], "Comparateur Santéo Adhésion"), encoding="utf-8")
# Page hébergeable complète (CRM Manus : protégée par l'authentification du CRM)
(DIST/"comparateur-claude.html").write_text(wrap(variant(True, True, "", False, "", None, hosted=True)), encoding="utf-8")
# Page GitHub Pages : import automatique (#fiche=), copie d'image directe, bulletin PDF sous code d'accès
(DIST/"index.html").write_text(wrap(variant(True, True, "", False, "", None, hosted=True, gate=ADH_GATE)), encoding="utf-8")
print("dist/ construit :", ", ".join(p.name for p in sorted(DIST.iterdir())))
