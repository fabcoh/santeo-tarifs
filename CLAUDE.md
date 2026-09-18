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
- **Filtre par garantie** (panneau ⚖ sur le bord droit) : un seuil minimum par poste (dentaire, implantologie,
  orthodontie remboursée / non remboursée, optique, lentilles, hospitalisation, honoraires, chambre, audio,
  médecines douces) + un **budget mensuel** avec tolérance **+15 %**. Les seuils proposés sont uniquement les
  valeurs présentes dans les gammes. Une garantie exprimée dans l'autre unité (% contre €) n'est pas comparable :
  l'offre est écartée et comptée à part, jamais silencieusement. Sélection mémorisée sur l'appareil.
  Les offres au-dessus du budget portent une pastille « +x % / budget ».
- **Après génération** : fenêtre « Faire signer sur Universign » (nom de collecte, signataire à copier, fichiers,
  page Universign intégrée en iframe). Le glisser-déposer d'un fichier vers un autre site est interdit par le navigateur.

## API APICIL / VERALTI (tarification)

- Offre « API Santé » (individuel et TNS), documentation VERALTI **v1.8** du 27/01/2026. Support : support@veralti.com.
- Identité commerciale : `typePartenaire=COURTAGE`, **code apporteur `0031164`**, `codeProduit=ApiSante`.
- Recette `https://hp-api.apicil.com/r2/...`, production `https://api.apicil.com/p0/...`.
  Deux familles de services : `apicil-parcours-souscription-xapi-v1` (tarif, devis, souscription)
  et `apicil-referentiel-donnees-xapi-v1` (pays, activités professionnelles).
- **Authentification par en-têtes `client_id` / `client_secret` à chaque appel** — secrets permanents, pas d'OAuth.
  Le même couple ouvre la souscription : jamais dans le navigateur, **jamais dans ce dépôt public**.
- APICIL est derrière Cloudflare et **refuse les IP hors d'Europe** (403 « you have been blocked »).
  Les appels doivent partir d'une IP française.

### Proxy de tarification (obligatoire)

- Hébergement gratuit OVH sur `capisante.fr` (cluster129, Gravelines, PHP 8.2), acheté le 18/09/2026.
- Fichiers dans `www/` : `apicil-tarif.php` (relais) + `apicil-config.php` (**identifiants, hors dépôt**).
  `apicil-verif.php` est un outil de diagnostic temporaire, à supprimer après usage.
- Le relais ne sait faire **que** la tarification ; code apporteur et produit figés côté serveur.
  **Aucun jeton dans la page** : elle est publique, un mot de passe y serait lisible. La protection est
  côté serveur — hôte appelant autorisé (`Origin`, à défaut `Referer`) + 60 appels/heure/IP.
- **IP sortante à déclarer si APICIL l'exige : `5.135.48.82`** (différente de l'IP du site).
- Accès FTP : `ftp.cluster129.hosting.ovh.net`, login `capisaf`, SFTP port 22 (WinSCP ; l'explorateur web OVH n'existe plus).

### Règles métier APICIL

- Gammes **Équilibre 1 à 6** et **Sérénité 1 à 5**. Packs Confort : « Jeunes et Familles » (`...ConfortEquilibreJFBase1/2/3`)
  pour Équilibre, « Séniors » (`...ConfortSereniteSBase1/2/3`) pour Équilibre et Sérénité.
- **Les libellés du référentiel §6.1.2 font foi** ; l'exemple §5.1.4 de la documentation contient une coquille
  (`...ConfortEquilibreSBase...`), vérifié par appel réel.
- L'API ne renvoie **que les formules éligibles au profil** : inutile de coder les règles d'éligibilité.
- Limites : 1 assuré, 1 conjoint, 8 enfants, 8 ayants droit ; date d'effet entre J−30 et J+1 an.
- Régimes : `GENERAL` / `ALSACEMOSELLE` / `SSI`. La tarification **n'enregistre rien** dans le SI d'APICIL.
- Reste à faire confirmer : le format de `codesAvantages` (chaîne `A|B` au §5.1.3, tableau au §4.1).

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
- APICIL : tarification en production dans le comparateur (gamme « API SANTÉ », **à cocher explicitement** :
  chaque affichage est un appel réel sous notre code apporteur). Garanties **Équilibre 1–6 et Sérénité 1–5**
  saisies depuis les plaquettes (`docs/apisante_*_tg_2026.pdf`). Restent à faire : Packs Confort en option
  (PC1–PC3, décrits dans la plaquette Sérénité), âge réel des mineurs (transmis à 10 ans faute de champ),
  puis devis / souscription / signature électronique.
- Date de naissance APICIL : celle de la fiche si elle est cohérente avec l'âge saisi, sinon 1ᵉʳ janvier
  (âge atteint dans l'année). Demander à Manus la date exacte dans ses exports.
- Autres compagnies : aucune n'a encore ouvert d'accès API. Prestataire du tarificateur capisante.com : demande à envoyer.
- Manus : e-mail de recherche, retour `adresse/cp/ville` depuis Santéo, PIN pour Caroline (refus à diagnostiquer).
- LPS Hospi : dossier complet à obtenir (aujourd'hui bulletin + garanties, 10 p.).
- GCI 500 (Mutuelle Verte), harmonisation optique FLEXIA / SOLENCIA.

## Tests

Playwright + Chromium (`/opt/pw-browsers/chromium`), `dist/` servi en local (`python3 -m http.server 8765`),
`pdf-lib` et `html2canvas` injectés depuis `node_modules`. Vérifier : zéro erreur JS, champs PDF (pypdf), rendu (pdftoppm).
