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
- **Modules partagés avec le serveur du CRM** : `src/moteur.js` (calcul des tarifs, fonction pure, ni DOM ni
  réseau) et `src/tableau.js` (fabrique du tableau de garantie). `build.py` les recopie dans la page — elle
  reste un fichier unique — et les publie tels quels. **Toute règle de tarification se modifie dans
  `src/moteur.js`, jamais dans la page** : sinon le CRM et le comparateur annoncent deux tarifs différents.
- **Fichiers dérivés, jamais édités à la main** : `src/garanties.json` (objets `F`, `EX`, `COMP`, `TGNOTE`
  republiés en JSON) et `src/tableau.css` (le `<style>` de la page). `build.py` les régénère ; l'Action les
  commit avec `index.html`. Ils sont servis par GitHub Pages : `https://fabcoh.github.io/santeo-tarifs/src/…`.
- **L'image du tableau reste une capture** : la page avec html2canvas, un serveur avec un navigateur sans
  écran (Playwright) sur `Tableau.document(...)`. Aucune image identique n'est possible sans moteur de rendu.
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
- Tableaux de garantie / IPID / notices par gamme (`*_tg_2026.pdf`, `*_ipid_2026.pdf`, `*_notice_2026.pdf`,
  `lps_hospi_2026.pdf`). **La Mutuelle Verte édite deux IPID**, chacun rattaché à ses formules :
  `mv_ipid_gci100_300_2026.pdf` (GCI 100 à 300, « respecte les conditions légales des contrats responsables »)
  et `mv_ipid_gci500_2026.pdf` (GCI 500, « ne respecte pas »). Ils confirment les pastilles du comparateur.
  Manquent encore : IPID et notice de MCCINOVA, FLEXIA, SOLENCIA (gammes MCCI, pas encore vendues),
  notice de LPS HOSPI.
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
  **Bas du tableau**, dans cet ordre :
  1. les atouts de la formule marquée de l'⭐, poste par poste — hospitalisation, honoraires, chambre, dentaire,
     implantologie, orthodontie, optique, lentilles, audio, médecines douces ; les postes sans garantie sont
     omis. **Hospitalisation et honoraires au parcours OPTAM** : le cas courant, et le seul comparable d'une
     compagnie à l'autre. La phrase suit l'étoile.
  2. **un bloc par colonne** : nom de la formule, ses documents (tableau de garantie, IPID, notice) en liens,
     puis en petit ses **limites et délais de carence** (`LIMITES`, une chaîne par gamme ou un tableau indexé
     sur la formule). Un contrat **non responsable** y est signalé, l'information étant due au prospect.
     Pas de note de gamme : une seule compagnie commentée laissait croire à un parti pris.
  Dans la page, ces liens **ouvrent le PDF dans une fenêtre par-dessus** (`showDoc`) : le commercial ne quitte
  pas son comparatif pour montrer une garantie. **Une image n'est jamais cliquable** : les mêmes liens et les
  mêmes limites sont donc repris dans le texte WhatsApp / e-mail qui accompagne l'image (`offreTxt`).
- **Filtre par garantie** (panneau ⚖ sur le bord droit) : un seuil minimum par poste (dentaire, implantologie,
  orthodontie remboursée / non remboursée, optique, lentilles, hospitalisation, honoraires, chambre, audio,
  médecines douces) + un **budget mensuel** avec tolérance **+15 %**. Les seuils proposés sont uniquement les
  valeurs présentes dans les gammes. Une garantie exprimée dans l'autre unité (% contre €) n'est pas comparable :
  l'offre est écartée et comptée à part, jamais silencieusement. Sélection mémorisée sur l'appareil, mais
  **`filtresRAZ()` remet tout à zéro — seuils, budget et périmètre — dès qu'une nouvelle fiche arrive**
  (`applyImport` avec des données) : garder les seuils d'un prospect pour le suivant ferait disparaître des
  offres sans que personne comprenne pourquoi. Le bouton « Tout effacer » appelle la même fonction.
  Les offres au-dessus du budget portent une pastille « +x % / budget ».
  En tête du panneau, un bouton **périmètre** tourne en trois temps — toutes les compagnies, aucune, puis le
  choix compagnie par compagnie (cases à cocher sur deux colonnes sous le bouton, avec raccourcis
  « Toutes » / « Aucune » ; le nom de la compagnie passe en infobulle, la pastille du tableau le donnant
  déjà). L'ouverture du détail est retenue sur l'appareil, comme la sélection.
  **Le périmètre ne se règle que là** : le volet « Compagnies & gammes » du haut de page a été retiré, deux
  endroits pour le même réglage se désynchronisant et mangeant la place des résultats.
  **TALIS, surcomplémentaire, n'apparaît que si elle est cochée** : son tarif ne couvre
  qu'un complément et la mêler aux complémentaires fausserait la comparaison. LPS Hospi reste dans le lot,
  sa pastille « Hospitalisation seule » suffisant à la distinguer.
  **À l'arrivée d'une fiche**, `filtresApercu()` ouvre le panneau **6 secondes** puis le referme : le
  commercial voit qu'il repart vierge sans avoir à aller le vérifier. Dès qu'il y touche — bouton ⚖, clic ou
  saisie dans le panneau — le minuteur est annulé et le panneau lui appartient.
- **Haut de page** : une seule ligne — assuré, conjoint, régime, département/CP, mineurs — les âges retenus
  inscrits sous leur champ en position absolue, pour ne pas pousser la ligne. Le tableau démarre à 136 px
  au lieu de 255 avant ce resserrement. **Options par poste** ouvre une fenêtre par-dessus (`ouvrirOptions`) :
  six cases en deux groupes, chacune ajoutant une colonne au tableau, plus « Tout décocher ». Au repos elle
  ne prend aucune place.
- **Documents par formule** : dans `DOCS`, une valeur est une adresse valable pour toute la gamme, ou un
  **tableau indexé sur la formule** quand le document en dépend — APICIL publie une plaquette par gamme
  Équilibre et une seule pour toutes les Sérénité, La Mutuelle Verte un IPID pour GCI 100–300 et un autre
  pour GCI 500.
  Un document absent (`null`) n'apparaît pas : jamais de lien vers un document qui ne concerne pas la formule.
  `docsDe(r)` et le bas du tableau passent tous deux par `Tableau.documents(...)` — une seule règle de choix.
  Le bouton « Infos » ne s'affiche que si la gamme a des données dans `INFO`.
- **Devis APICIL** : bouton 🧾 dans le détail d'une formule API SANTÉ, à côté d'Adhésion, **sur le comparateur
  public**. Il ouvre une fenêtre de contrôle (civilité, nom, prénom, date de naissance, code postal à 5 chiffres,
  date d'effet, e-mail et téléphone facultatifs) : jamais d'envoi direct, un devis engageant le code apporteur.
  Au retour, référence du devis et lien vers MyVERALTI. Relais dédié `apicil-devis.php`, **15 devis/heure/IP**,
  au plus 3 formules par projet.
  **Le message n'a pas la forme de celui de la tarification** (§5.2.2) : l'assuré principal est porté par la
  **racine** (`role`, `civilite`, `nom`, `prenom`, `dateNaissance`, `regimeSocial`, `codePostal`…) et
  `beneficiaires` ne contient que conjoint, enfants et ayants droit — y mettre l'assuré fait échouer l'appel.
  Le retour (§5.2.4) place la référence commerciale et le lien MyVERALTI dans `relatedQuotes[0]`
  (`reference`, `accessURL`), `IdOpportunite` n'étant que l'identifiant du projet.
  **L'appel dure 25 à 60 s** (enregistrement dans MyVERALTI) : relais à 120 s, compteur affiché dans la
  fenêtre. En cas de dépassement le devis peut avoir été créé quand même — vérifier MyVERALTI avant de
  recommencer, jamais relancer à l'aveugle.
- **Souscription APICIL** : bouton « ✍️ Envoyer à la signature », affiché **seulement après la création du
  devis**, dans la même fenêtre. Il ouvre une confirmation qui rappelle le signataire, **l'adresse de
  destination** et la nature de l'acte : APICIL envoie au client un lien de signature Docapost, irréversible
  une fois parti. Jamais d'envoi en un clic. Relais `apicil-souscription.php`, **10 demandes/heure/IP**.
  **`modeSouscription` est figé à `ELECTRONIQUEMAIL` côté serveur** — PAPIER et ELECTRONIQUESMS ne sont pas
  ouverts. `contactPartenaire` (l'adresse du compte MyVERALTI) vit dans le relais, jamais dans la page.
  L'adresse du service porte la **référence commerciale** (`/api/souscriptions/DEV-AAAA-NNNNNNN/demande`) et
  le corps porte l'`IdOpportunite` : les deux viennent du devis. Les dates de naissance des bénéficiaires
  doivent être **identiques à celles du devis**, APICIL les recoupe. Le retour (§5.4.4) donne `urlEsignQuote`,
  affichée comme « Suivre la signature ». Sans IBAN transmis, le client renseigne ses coordonnées bancaires
  dans le parcours de signature.
- **Logos dans le tableau de garantie** : `Tableau.logo(...)` place le logo de l'assureur au-dessus de l'étoile,
  en tête de colonne. Fichiers dans `docs/` : `logo_mcci.png`, `logo_avenir.png`, `logo_mverte.png`,
  `logo_apicil.png` — PNG à fond transparent, normalisés à 160 px de haut, affichés en **42 px** (à 34 px un
  logo carré comme celui d'Avenir devenait illisible). Avenir, Mutuelle Verte et APICIL sont tirés des
  documents de `docs/` ; MCCI vient du fichier fourni par Fabrice, ses plaquettes ne publiant le logo qu'en
  blanc sur fond sombre. **Tant qu'un fichier manque, le nom de la compagnie s'affiche à sa place** — aucune
  image cassée. Le logo est reposé à chaque mise en avant d'une formule.
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
- **Appelants autorisés** : les sites listés dans `apicil-config.php`, plus, déclarés dans `apicil.php`,
  l'hôte du CRM WhatsApp (le comparateur y est hébergé, il appelle depuis le navigateur) et les **appelants
  serveur**. Un serveur n'envoyant ni `Origin` ni `Referer`, il présente une clé dans l'en-tête
  **`X-Cle-Serveur`**. **Cette clé n'est écrite nulle part ailleurs que sur le serveur** : `apicil.php` la
  fabrique lui-même au premier appel (`random_bytes`) et la range dans `apicil-cle.txt`, **hors du dossier
  web** — ni dans ce dépôt, ni dans une page, ni dans une conversation. Pour la lire :
  `curl -u capisaf ftp://ftp.cluster129.hosting.ovh.net/apicil-cle.txt`. Pour la révoquer : supprimer ce
  fichier, le relais en fabrique une autre au prochain appel. Quota propre de 600 appels/heure, compté par
  appelant et non par IP — le CRM sert de nombreuses conversations derrière une seule adresse.
- Accès : `ftp.cluster129.hosting.ovh.net`, login `capisaf`. **SFTP (port 22) est refusé** — la connexion se
  ferme juste après l'authentification, SSH n'étant pas ouvert sur ce compte. Le **FTP simple fonctionne** ;
  depuis un Mac, sans rien installer, une ligne suffit dans le Terminal :
  `curl -T "$(ls -t ~/Downloads/apicil-devis*.php | head -1)" -u capisaf ftp://ftp.cluster129.hosting.ovh.net/www/apicil-devis.php`
  (vérifier la taille annoncée : le Mac renomme un second téléchargement `fichier (1).php`).
  L'explorateur web OVH n'existe plus. Depuis une session Claude, les ports 21 et 22 sont bloqués :
  le dépôt ne peut pas être fait d'ici.

### Règles métier APICIL

- **Âges d'adhésion** : Équilibre dès 16 ans, **Sérénité réservée aux plus de 50 ans**.
  Souscription limitée à moins de 86 ans (Équilibre 2–3, Sérénité 1–2) ou moins de 80 ans
  (Équilibre 4–6, Sérénité 3–5) ; **78 ans en statut TNS**. L'API applique ces règles elle-même.
- **Plafond dentaire annuel** (prothèses des paniers modéré et libre) : 500 à 1 000 € la 1re année,
  800 à 1 500 € ensuite, selon le niveau. Implantologie limitée à **2 implants**.
  Devis obligatoire au-delà de 1 000 €, sinon remboursement au minimum du contrat responsable.
- Optique : un équipement tous les 2 ans (un an avant 16 ans ou si la vue évolue).
  Aides auditives : une par oreille tous les 4 ans, plafond réglementaire 1 700 € en classe II.
- Exclusions principales : indemnités journalières, chambre particulière en permission de sortie,
  hébergement en USLD, forfait journalier en établissement médico-social, chirurgie esthétique non remboursée.
- Gammes **Équilibre 1 à 6** et **Sérénité 1 à 5**. Packs Confort : « Jeunes et Familles » (`...ConfortEquilibreJFBase1/2/3`)
  pour Équilibre, « Séniors » (`...ConfortSereniteSBase1/2/3`) pour Équilibre et Sérénité.
- **Les libellés du référentiel §6.1.2 font foi** ; l'exemple §5.1.4 de la documentation contient une coquille
  (`...ConfortEquilibreSBase...`), vérifié par appel réel.
- L'API ne renvoie **que les formules éligibles au profil** : inutile de coder les règles d'éligibilité.
- Limites : 1 assuré, 1 conjoint, 8 enfants, 8 ayants droit ; date d'effet entre J−30 et J+1 an.
- Régimes : `GENERAL` / `ALSACEMOSELLE` / `SSI`. La tarification **n'enregistre rien** dans le SI d'APICIL.
- Reste à faire confirmer : le format de `codesAvantages` en **tarification** (chaîne `A|B` au §5.1.3,
  tableau au §4.1). En **création de devis**, le §5.2.3 le donne en tableau d'objets `[{"avantage":"CODE"}]` ;
  le relais l'omet tant qu'aucun code n'est utilisé.

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
- APICIL : tarification en production dans le comparateur. La gamme « API SANTÉ » suit la règle commune
  (aucune coche = toutes les gammes) : c'est une complémentaire, elle se compare aux autres. Son tarif vient
  d'un appel réel sous notre code apporteur — temporisé côté page, 60 appels/heure/IP côté relais. Garanties **Équilibre 1–6 et Sérénité 1–5**
  saisies depuis les plaquettes (`docs/apisante_*_tg_2026.pdf`). Plafonds, limites et exclusions
  renseignés dans `INFO` (bouton ⓘ). Restent à faire : Packs Confort en option (PC1–PC3, décrits dans la
  plaquette Sérénité — ils portent les médecines douces, absentes des gammes de base), âge réel des mineurs
  (transmis à 10 ans faute de champ). **Création de devis en place** ; restent la souscription et la signature
  électronique APICIL (`modeSouscription` PAPIER / ELECTRONIQUEMAIL / ELECTRONIQUESMS — la signature est
  fournie par APICIL, Universign n'est pas nécessaire pour cette compagnie).
  **Démarrer souscription est en place** (`apicil-souscription.php`, mode ELECTRONIQUEMAIL) ; restent le
  téléchargement de la liasse, le suivi de l'état du devis et la validation de souscription.
- Date de naissance APICIL : celle de la fiche si elle est cohérente avec l'âge saisi, sinon 1ᵉʳ janvier
  (âge atteint dans l'année). Demander à Manus la date exacte dans ses exports.
- Autres compagnies : aucune n'a encore ouvert d'accès API. Prestataire du tarificateur capisante.com : demande à envoyer.
- Manus : e-mail de recherche, retour `adresse/cp/ville` depuis Santéo, PIN pour Caroline (refus à diagnostiquer).
- LPS Hospi : dossier complet à obtenir (aujourd'hui bulletin + garanties, 10 p.).
- GCI 500 (Mutuelle Verte), harmonisation optique FLEXIA / SOLENCIA.

## Tests

Playwright + Chromium (`/opt/pw-browsers/chromium`), `dist/` servi en local (`python3 -m http.server 8765`),
`pdf-lib` et `html2canvas` injectés depuis `node_modules`. Vérifier : zéro erreur JS, champs PDF (pypdf), rendu (pdftoppm).
