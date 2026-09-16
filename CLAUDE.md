# Comparateur Santéo — notes pour Claude

Propriétaire : Fabrice Cohen, courtier santé (CAPI FINANCE / SANTÉO, ORIAS 07001983). GitHub : `fabcoh`.
Langue de travail : français. Réponses courtes et directes ; pour une procédure, **une seule étape à la fois**.

## Ce que c'est

Comparateur de tarifs et générateur d'adhésions (MCCI, Avenir Mutuelle, Mutuelle Verte, Révoluo/REMA),
page web statique servie par GitHub Pages : https://fabcoh.github.io/santeo-tarifs/
Reliée au CRM WhatsApp développé par « Manus » (serveur `https://whatsappcrm-45ekaxrk.manus.space`).

## Dépôts et publication

- `fabcoh/santeo-tarifs` (public, GitHub Pages depuis `main`, racine) — **le seul qui compte**.
- `fabcoh/santeo-comparateur-claude` (privé) — copie de sauvegarde, même contenu de `src/`.
- Source unique : `src/comparateur.html` (gabarit) + `src/tarifs_all.json` (grilles) + `src/bulletin_avenir.pdf`.
- `build.py` fabrique `dist/` : `index.html` (hébergé, `HOSTED=true`, adhésion derrière code), `clients.html`,
  `crm-public.html`, `adhesion-privee.html`, `comparateur-claude.html`. Il tourne depuis la racine ou depuis `src/`.
- **Publication = pousser `src/comparateur.html` sur `main`** : l'Action `.github/workflows/build.yml`
  reconstruit et commit `index.html` toute seule. Ne jamais éditer `index.html` à la main.
- Vérifier la mise en ligne : la mention « version JJ/MM/AAAA HH:MM » en bas de page (heure locale).
- Si le push est refusé (« not in this session's authorized repository set ») : c'est une limitation de la
  session Claude, pas de git. Il faut une tâche créée avec le dépôt sélectionné. Sinon, dépôt manuel :
  https://github.com/fabcoh/santeo-tarifs/upload/main/src (et `/docs` pour les PDF).
- Commits : auteur `Claude <noreply@anthropic.com>`, messages en français.

## Fichiers `docs/` (chargés à l'exécution par la page)

- `bulletin_avenir_2026.pdf` (Cap Évolution, 74 p.), `bulletin_capnr_2026.pdf` (75 p.), `bulletin_talis_2026.pdf` (55 p.),
  `bulletin_mv_2026.pdf` (Mutuelle Verte, 22 p.), `bulletin_revoluo_2026.pdf` (24 p.) + `sepa_revoluo_2026.pdf`.
  Formulaires AcroForm remplis côté navigateur avec pdf-lib ; les PDF ont été allégés (pikepdf/qpdf),
  widgets orphelins rattachés, noms de champs en double suffixés `_2`.
- Tableaux de garantie / IPID par gamme (`*_tg_2026.pdf`, `*_ipid_2026.pdf`, `lps_hospi_2026.pdf`).
- `adhesion.pdf.pdf` : dépôt par erreur, à supprimer.

## Règles métier à ne pas casser

- **MCCINOVA** : mineurs au tarif 18 ans ; cadre « Conditions MCCINOVA » (âge atteint dans l'année, enfants
  jusqu'à 28 ans) affiché seulement si la gamme est dans le tableau.
- **RÉVOLUO / RF50 / RF100** : grille × zone (75 = zone 1) × régime (TNS ×0,90 ; Alsace-Moselle ×0,65 sans zone),
  réduction famille −5 %/−10 %, **18 et 19 ans même tarif** (ligne « 19 » de la grille), mineurs au tarif 18 ans,
  2 enfants payants max, pas de DOM-TOM, jusqu'à 80 ans. Grille alignée sur le tarificateur showcase : ×0,999 au centime.
  Renfort 50 éligible Rev 2–8, Renfort 100 éligible Rev 2–6. Option « Souscripteur non assuré » (enfants seuls) :
  bloc adhérent rempli, ligne « Adhérent » des assurés vide, cotisation recalculée. Génération = 2 PDF (bulletin + SEPA).
- **Assurés** : l'adhérent n'est jamais repris en conjoint ni en enfant ; un mineur est toujours un enfant ;
  alertes à la génération (conjoint = adhérent, conjoint mineur, enfant ≥ 28 ans).
- **Alertes ≠ blocage** : à la génération, fenêtre « Informations manquantes » (IBAN, BIC, Sécu, organisme,
  identité…) avec « Compléter » ou « Télécharger quand même ». Jamais de blocage dur.
- **Adresse à l'import de documents** : un seul choix parmi attestation > RIB > pièce d'identité, validé par le commercial.
- **Tableau de garantie** : tarifs et prospect affichés d'office, case « Sans tarifs », barre unique
  Télécharger / WhatsApp / Email (+ Déposer dans le CRM). Pas de second aperçu.
- **Après génération** : fenêtre « Faire signer sur Universign » (nom de collecte, signataire à copier, fichiers,
  page Universign intégrée en iframe). Le glisser-déposer d'un fichier vers un autre site est interdit par le navigateur.

## Contrat avec le CRM (Manus)

- Lien entrant : `#fiche=…`, `crm=<origine>`, `t=<JWT 2 h, conversationId>`, `back=<url>` ; `#vide` = comparateur vide.
- `POST /api/comparateur/depot` (image ou texte), `GET /api/comparateur/fiche?token=`,
  `GET /api/comparateur/recherche?q=` avec en-tête `X-Import-Auto-PIN` (**jamais dans l'URL**, PIN stocké sur l'appareil).
- Retour au CRM après dépôt : `crmBack()` (opener → `back=` → fermeture).
- Recherche par e-mail : côté Manus, renvoie `404 Aucune fiche Santéo trouvée` — à corriger chez lui.

## Sécurité

- Codes d'accès à l'adhésion : seules les empreintes SHA-256 dans `build.py`. Ne jamais écrire les codes en clair
  dans le dépôt public. Aucun jeton, clé API, identifiant Universign ou Santéo dans la page ni dans le dépôt.
- Documents scannés à l'adhésion : lus dans le navigateur, jamais envoyés ni conservés.

## En cours / à faire

- Universign : compte existant (plateforme classique, API XML-RPC `ws.universign.eu/sign/rpc`, guide 8.113).
  Attente de l'activation API par le support ; intégration prévue côté serveur Manus (contrat d'API rédigé le 13/09).
- Intégration d'API de compagnies d'assurance (chantier à ouvrir).
- Manus : e-mail de recherche, retour `adresse/cp/ville` depuis Santéo, PIN pour Caroline (refus à diagnostiquer).
- LPS Hospi : dossier complet à obtenir (aujourd'hui bulletin + garanties, 10 p.).
- GCI 500 (Mutuelle Verte), harmonisation optique FLEXIA / SOLENCIA.

## Tests

Playwright + Chromium (`/opt/pw-browsers/chromium`), `dist/` servi en local (`python3 -m http.server 8765`),
`pdf-lib` et `html2canvas` injectés depuis `node_modules`. Vérifier : zéro erreur JS, champs PDF (pypdf), rendu (pdftoppm).
