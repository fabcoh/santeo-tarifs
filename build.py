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
import base64, hashlib, pathlib, datetime
# Horodatage de construction : ISO en UTC, la page l'affiche dans l'heure locale du navigateur
BUILD = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# Code d'accès au bulletin d'adhésion sur GitHub Pages (seule son empreinte SHA-256 est publiée).
# Pour le changer : modifier ici, relancer build.py, pousser dist/index.html sur santeo-tarifs.
ADH_PASSWORDS = ["Monavion54@", "Santeo26@"]
ADH_GATE = ",".join(hashlib.sha256(x.encode()).hexdigest() for x in ADH_PASSWORDS)
ROOT = pathlib.Path(__file__).parent
# Ce fichier fonctionne qu'il soit a la racine du depot ou dans src/
if not (ROOT/"src").exists() and (ROOT.parent/"src").exists():
    ROOT = ROOT.parent
SRC, DIST = ROOT/"src", ROOT/"dist"
DIST.mkdir(exist_ok=True)

tpl  = (SRC/"comparateur.html").read_text(encoding="utf-8")
data = (SRC/"tarifs_all.json").read_text(encoding="utf-8")
b64  = base64.b64encode((SRC/"bulletin_avenir.pdf").read_bytes()).decode()
base = tpl.replace("__DATA__", data).replace("__BULLETIN__", b64)

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
