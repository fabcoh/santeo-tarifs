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
- **Toutes les dates se saisissent en `jj/mm/aaaa`, avec le même masque** (`masqueDate()`) : bulletin
  d'adhésion (`addn`, `cddn`, `kddn0`–`kddn3`, `aeff`, `asig`) et fenêtres APICIL. Le masque **ne remplace
  pas un indice déjà posé** — `addn` garde son `jj/mm/1985`, qui rappelle l'année saisie en haut de page.
  **`apicilNaiss()` passe par `isoDate()`** : une date impossible (31/02) ne part plus vers APICIL, elle
  retombe sur le 1ᵉʳ janvier de l'année d'âge, comme une date absente. Avant, l'expression régulière la
  laissait passer et l'API la refusait sans rien expliquer.
- **Le lecteur de documents sert deux formulaires** : l'adhésion (préfixe d'identifiants « a ») et la
  fenêtre de signature APICIL (préfixe « s »). `docDropHTML(pfx)`, `wireDocDrop(pfx, LAB, fin)` et
  `confirmDoc(docs, onDone, LAB)` prennent la table des champs visés en paramètre — `LAB_ADHESION` ou
  `LAB_SIGNATURE`. **Un champ en lecture seule n'est jamais écrasé** : dans la fenêtre de signature, nom,
  prénom, date de naissance et code postal viennent du devis, qu'APICIL recoupe ; ils servent seulement au
  contrôle du titulaire du document.
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
  affichée comme « Suivre la signature ».
  **Le BIC est obligatoire en pratique**, contrairement à ce qu'annonce la documentation : sans lui APICIL
  répond `INTERNAL_SERVER_ERROR` / « Le BIC doit faire 8 ou 11 caractères » — vérifié par appel réel.
  L'IBAN, lui, **est bien facultatif** : vérifié par appel réel le 22/09/2026 sur `DEV-2026-3315706`,
  BIC `CRLYFRPPPOI` seul, sans `IBANSEPA` — APICIL renvoie `success` et l'`urlEsignQuote`. Le client saisit
  son IBAN dans le parcours de signature.
  **La fenêtre reprend toute la fiche du prospect** — ce que le formulaire Docapost demanderait sinon à la
  main : nom/prénom, date de naissance, régime, adresse + CP + ville sur une ligne, téléphone + e-mail,
  nom/ville/CP de naissance, situation familiale, n° de Sécurité sociale + n° d'organisme sur une ligne,
  IBAN + BIC sur une ligne, jour de prélèvement. Ce qui vient du devis (nom, prénom, date de naissance,
  régime, code postal) s'affiche **en pointillé et non modifiable** : APICIL le recoupe.
  **Alertes ≠ blocage, ici aussi** : seuls l'e-mail et le BIC arrêtent l'envoi ; pour tout le reste, un
  premier clic énumère ce que le client devra saisir lui-même, un second envoie quand même. Le **nom de
  naissance** est proposé égal au nom et n'est jamais signalé : c'est le cas courant.
  **Dates : `jj/mm/aaaa` à l'écran, `AAAA-MM-JJ` pour APICIL.** `masqueDate()` pose le masque de saisie —
  on tape des chiffres, les barres s'écrivent seules, et aucune barre n'est ajoutée en fin de champ, sinon
  on ne pourrait plus effacer. `dateFR()` affiche, `isoDate()` convertit à l'envoi et **renvoie une chaîne
  vide pour une date qui n'existe pas** (31/02, 30/02, 00/00) : le contrôle s'appuie là-dessus plutôt que sur
  une expression régulière, qui laissait passer le 31 février. Concerne la date de naissance et la date
  d'effet de la fenêtre de devis, et la date de naissance rappelée dans la fenêtre de signature.
  **Téléphone : dix chiffres nationaux, toujours** (`telFR()`). Un numéro venu du CRM arrive en
  `+33 6 22 19 73 49`, `0033…` ou `33…` ; transmis tel quel, le formulaire de signature répond « Erreur dans
  la saisie du numéro de téléphone ». La page normalise avant d'envoyer, **dans le devis comme dans la
  signature**, et réécrit le champ pour que le commercial voie le numéro tel qu'il partira.
  **La civilité se relit dans la fenêtre de signature**, en tête de la ligne d'identité (M. / Mme) : elle est
  transmise à APICIL et le devis ne la montre plus une fois créé.
  **Le n° d'organisme d'affiliation n'a pas de champ chez APICIL** : il part dans `commentaire`, à
  destination du service de gestion (§5.4.2). Ne pas l'inventer ailleurs.
  **APICIL enveloppe sa vraie phrase dans un JSON d'erreur** : `apicilRaison()` en extrait `errorDescription`
  et l'affiche en entier. Ne jamais tronquer ce message, c'est le seul qui dise ce qui ne va pas.
- **Logos dans le tableau de garantie** : `Tableau.logo(...)` place le logo de l'assureur au-dessus de l'étoile,
  en tête de colonne. Fichiers dans `docs/` : `logo_mcci.png`, `logo_avenir.png`, `logo_mverte.png`,
  `logo_apicil.png` — PNG à fond transparent, normalisés à 160 px de haut, affichés en **42 px** (à 34 px un
  logo carré comme celui d'Avenir devenait illisible). Avenir, Mutuelle Verte et APICIL sont tirés des
  documents de `docs/` ; MCCI vient du fichier fourni par Fabrice, ses plaquettes ne publiant le logo qu'en
  blanc sur fond sombre. **Tant qu'un fichier manque, le nom de la compagnie s'affiche à sa place** — aucune
  image cassée. Le logo est reposé à chaque mise en avant d'une formule.
  **Dans le courrier, la taille n'est pas une hauteur commune mais un encombrement commun** : les logos n'ont
  pas la même forme — Avenir est presque carré (211 × 160), MCCI un long bandeau (545 × 160). À 34 px de haut
  tous les deux, MCCI faisait 116 px de large contre 45 à Avenir, et écrasait la colonne voisine. Le relais
  lit les dimensions du PNG téléchargé (`getimagesizefromstring`) et égalise la **moyenne géométrique**
  (√(l × h) ≈ 46 px), bornée à 40 px de haut et 92 px de large : Avenir sort en 53 × 40, MCCI en 85 × 25.
  Les attributs `width` et `height` sont posés en plus du style, le CSS seul ne suffisant pas sous Outlook.
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
  **À reprendre** : la tarification de production renvoie pourtant bien
  `siApiSanteConfortEquilibreSBase1/2/3` sous les formules Équilibre, pour un profil de 60 ans
  (appel réel du 23/09/2026, CP 75011, né en 1966). Le libellé du pack « Séniors » sur la gamme Équilibre
  n'est donc pas celui que ces notes annonçaient. À confirmer avant de coder les Packs Confort.

### Production

- **En production depuis le 23/09/2026** : `apicil-config.php` porte `environnement => 'production'`,
  l'adresse `https://api.apicil.com/p0/…` et le jeu `p0-parcours-souscription-xapi-CAPI-FINANCE`. Les valeurs
  de recette y restent en commentaire, pour revenir en arrière en ôtant quatre `//`.
- Les trois relais annoncent `production` et `contactPartenaire` vaut `fcohen@santeo.net` ; l'échappatoire de
  recette (`essais`) est fermée.
- **La production est bien plus rapide que la recette** : une tarification revient en **0,95 s**, contre
  plusieurs secondes et des `INTERNAL_SERVER_ERROR` intermittents en recette. Les coupures observées
  (« Connection reset by peer », « Timeout exceeded » sur leurs services internes) étaient donc propres à la
  recette : ne pas les attribuer à nos données.
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

## Envoi d'e-mails (Mailgun)

- Compte **Sinch Mailgun**, organisation « COHEN / capi finance ». Domaine d'envoi : **`santeo.net`**
  (le domaine racine, pas un sous-domaine), **vérifié**, en **région US** — donc
  `https://api.mailgun.net/v3/santeo.net`. Une clé de région EU sur l'adresse US échoue sans rien expliquer :
  c'est l'erreur d'intégration la plus fréquente.
- Le domaine est chaud : 6 918 messages acceptés en septembre 2026, 99,12 % délivrés, 0,74 % de rebonds,
  79,08 % d'ouvertures, 0,04 % de plaintes. Toute adresse `@santeo.net` peut donc servir d'expéditeur —
  `antony@`, `sandra@`, `caroline@`, `fcohen@`.
- `sandboxd9ad…mailgun.org` est le bac à sable d'ouverture de compte : zéro envoi, sans usage.
- Réglages du domaine : rétention des messages **3 jours**, TLS opportuniste, suivi des **clics et des
  ouvertures activé**. **Le suivi réécrit les liens** : l'adresse « Cette offre m'intéresse » passera par
  `email.santeo.net`, ce qui donne l'événement `clicked` sans montrer un domaine étranger au prospect.
- **DNS, état vérifié le 22/09/2026** — tout ce qui sert à l'envoi est en place :

  | Enregistrement | Hôte | État |
  |---|---|---|
  | TXT (SPF) | `santeo.net` → `v=spf1 include:mailgun.org ~all` | ✅ Verified |
  | TXT (DKIM) | `smtp._domainkey.santeo.net` | ✅ Active |
  | CNAME (suivi) | `email.santeo.net` → `mailgun.org` | ✅ Verified |
  | MX | `santeo.net` → `mxa`/`mxb.mailgun.org` | 🟠 Unverified — **et c'est voulu** |

  **Ne jamais poser les MX Mailgun sur `santeo.net`** : le domaine reçoit déjà le courrier du cabinet par un
  autre fournisseur. Les poser couperait `fcohen@`, `gestion@`, `sandra@`, `caroline@`, `antony@`. Mailgun le
  dit lui-même (« unless your domain already uses another provider for receiving email »). L'orange est le
  bon état. Les e-mails de leads arrivent donc au webhook par une **route** Mailgun ou une redirection depuis
  la messagerie, pas par les MX : à retrouver dans Receiving → Routes avant toute retouche du DNS.
- **SPF en `~all` et un seul `v=spf1` par domaine** : si `santeo.net` envoie aussi depuis la messagerie du
  cabinet, l'enregistrement doit inclure ce fournisseur **en plus** de `include:mailgun.org`. Non vérifié :
  le DNS n'est pas interrogeable depuis une session Claude (proxy).
- **Mailgun ne sert aujourd'hui qu'à recevoir** dans le CRM (`POST /api/mailgun/incoming`, webhook qui crée
  les fiches depuis les e-mails de leads). L'envoi sortant existe dans **l'autre comparateur** de Manus
  (`santeocomp-ktjuxhxk.manus.space`, `server/email.ts`), pas dans le CRM ni ici.
- **Les deux comparateurs sont conservés** : `santeocomp` (CAP Évolution, CAP NR / CAP Liberté Santé, TALIS)
  et celui-ci. La politique tarifaire devient donc **une par source**, jamais une règle unique.
- Clés : **une clé d'envoi dédiée, à privilèges minimaux**, dans le coffre de celui qui envoie. Jamais dans
  ce dépôt, jamais dans une page, jamais dans une conversation. La clé de signature des webhooks est une
  clé **distincte** de la clé d'envoi.

### Envoi du comparatif depuis la page — `santeo-mail.php`

- Bouton **📮 Envoyer au prospect** dans la barre du tableau de garantie. La page capture le tableau, réunit
  les formules affichées et remet le tout au relais ; **elle n'envoie jamais elle-même**, une page publique
  ne peut pas porter de clé Mailgun. **En ligne et vérifié par envoi réel le 23/09/2026.**
- **Le corps du courrier reproduit le tableau de garantie**, celui que le prospect reçoit en image sur
  WhatsApp : même titre, même ligne prospect, même sous-titre, mêmes colonnes (gamme, formule, tarif) et
  mêmes lignes, puis le même pied — un bloc par formule avec ses documents et ses limites. **Ce n'est pas
  une liste de fiches** : le prospect compare en lisant une ligne de gauche à droite.
  La page envoie `entete` et `soustitre` **relus dans le cadre affiché** (`.tghdr`, `.src`), pas reconstruits :
  le courrier dit exactement ce que le commercial a sous les yeux.
  **La différence avec l'image : les documents sont cliquables.** C'est la raison d'être du courrier.
  **Le rendu suit la capture, sans rien y ajouter ni en retirer** : toutes les lignes, y compris celles où
  aucune formule ne garantit rien (le prospect voit que le poste existe et n'est pas couvert) ; ni colonne
  teintée ni mention « conseillée », que la capture ne porte pas — une ligne de plus dans un en-tête
  désalignait les tarifs d'une colonne à l'autre.
  **Les logos des compagnies sont téléchargés par le relais** depuis `docs/` et joints en ligne (`cid:`) :
  une image distante serait bloquée par Outlook et Gmail. Un téléchargement qui échoue laisse le nom de la
  compagnie à sa place, jamais d'image cassée. La page ne fournit qu'un **nom de fichier**, contrôlé par
  `^logo_[a-z]+\.png$` — elle ne choisit pas une adresse.
  Largeur **100 %, plafonnée à 960 px** ; texte courant à 13,5 px, libellés et valeurs du tableau à 14 px.
  Au-delà de **cinq colonnes** le relais s'arrête : le tableau déborderait sur téléphone.
  Le PNG capturé part en **pièce jointe ordinaire** (plus en image intégrée) : le corps le reproduit déjà.
  **Attention aux variables dans le relais** : la boucle des colonnes écrasait `$nom`, le nom du prospect, et
  le courrier disait « Bonjour Monsieur MCCINOVA ESSENTIELLE ». Les variables de colonne sont préfixées.
- Fichiers dans `www/` : `santeo-mail.php` + `santeo-mail-config.php` (**clé, hors dépôt**).
- **L'expéditeur est choisi dans une liste fermée côté serveur** (`fcohen@`, `sandra@`, `caroline@`,
  `antony@`) : la page n'envoie qu'une adresse, le relais refuse tout ce qui n'est pas dans la liste. Sinon
  n'importe qui pourrait écrire au nom de Santéo. Le choix est mémorisé sur l'appareil (`santeo_exp`).
- **Les liens des documents sont filtrés par le relais** : seuls `fabcoh.github.io`, `santeo.net` et
  `capisante.fr` passent. Un lien fourni par l'appelant pourrait sinon envoyer le prospect ailleurs, sous
  notre nom.
- **Aucune image distante dans le courrier** : Outlook et Gmail les bloquent par défaut, le prospect verrait
  un cadre vide. Le tableau est donc du HTML, et le PNG capturé une pièce jointe ordinaire. Version texte
  jointe, exigée par les filtres anti-spam.
- **Cinq formules au maximum par courrier** — décision de Fabrice, 23/09/2026. Au-delà le tableau déborde sur
  téléphone ; le relais s'arrête aux cinq premières colonnes.
- **Copie cachée systématique** au conseiller et à `fcohen@santeo.net` : toute offre partie laisse une trace.
- **« Cette offre m'intéresse » : un bouton sous chaque formule**, dans la dernière ligne du tableau, et
  non un seul bouton en bas du courrier — le prospect dit ainsi **laquelle** l'intéresse, le conseiller n'a
  pas à le rappeler pour le lui demander. C'est un `mailto:` vers le conseiller expéditeur (`antony@`,
  `fcohen@`…) avec copie à `fcohen@santeo.net` ; l'objet et le corps portent le nom de la formule et celui
  du prospect. **Le corps reprend la forme des demandes de prospect du CRM** : « Nouvelle demande de prospect
  suite à email », puis `Destinataire`, `Conversation`, `Option`, `Tarif`, et la fiche du prospect —
  civilité, nom, prénom, e-mail, téléphone. Le conseiller sait ainsi **qui** appeler, **pour quelle formule**,
  **à quel tarif**, et retourne à la conversation d'un clic.
  **`conversation` est l'adresse `&back=` du lien d'arrivée** (`window.CRMLINK.back`), transmise par la page.
  Elle est filtrée côté relais comme les liens de documents — nos hôtes plus celui du CRM, et `https` seul :
  elle repart dans un courrier signé Santéo, un appelant ne doit pas pouvoir y glisser une autre adresse.
  Hors CRM, la ligne est simplement absente. **Il n'y a pas de numéro de fiche** : le comparateur n'en reçoit
  aucun, ni du lien ni de la fiche importée. Si le `EditFiche.asp?ID=…` de `santeo.dyndns.org` doit y figurer,
  il faut que le CRM transmette cet identifiant.
  Pas de jeton, pas de page à héberger, fonctionne depuis n'importe quelle boîte. Un lien signé
  à durée longue, traçable, reste la bonne cible — il demande un serveur qui tienne un instantané de devis
  (voir la note d'intégration avec Manus). Le bouton est en **10 px**, deux lignes, et non un pavé : trois
  colonnes doivent tenir côte à côte sur un téléphone. **Aucune phrase sous les boutons** : « Un clic
  prévient votre conseiller » n'apprenait rien que le bouton ne dise déjà, et poussait le pied plus bas.
- **Le cartouche du tableau tient sur une seule échelle, centré et collé au tableau** : titre 14 px gras,
  ligne prospect 11 px, au lieu de 20 / 14, qui faisaient un titre de journal au-dessus d'un tableau à 14 px.
  Le **sous-titre de source** (« AVENIR M. · MCCI · synthèse d'après le tableau de garantie officiel… »)
  n'est plus affiché : la même mention figure déjà au pied, formule par formule. Le relais accepte toujours
  `soustitre`, il ne l'imprime plus.
- **La phrase d'accroche ne date ni ne source l'offre** : « Je fais suite à votre demande de devis, voici mes
  propositions. » Le site de provenance a été retiré — décision de Fabrice, 23/09/2026 ; `$prov` reste
  calculé dans le relais, prêt à resservir. **La date, elle, est sous le tableau**, en 10 px centré :
  « Tarifs au 23 septembre 2026, valables 15 jours. » Sans elle, rien ne bornerait l'offre dans le temps —
  un prospect revenant trois mois plus tard avec ce courrier n'aurait vu nulle part que les tarifs changent.
- **Les documents de chaque formule sont sous sa colonne** — « Tableau de garantie - IPID - Notice » sur une
  seule ligne, en **10 px**, cliquables, juste au-dessus de son bouton. Le pied ne garde que le **nom de la
  formule et ses limites**, trop longues pour une colonne : les répéter aux deux endroits ne faisait que du
  bruit. **Ce qui manque n'est pas un défaut du courrier mais du dossier** : `DOCS` ne publie qu'un tableau
  de garantie pour MCCINOVA, FLEXIA et SOLENCIA, et un seul « Garanties + IPID » pour LPS HOSPI — leurs IPID
  et notices n'existent pas encore. CAP NR, CAP ÉVOLUTION, TALIS et API SANTÉ affichent bien les trois.
- Quota **30 envois/heure/IP**, message limité à 4 Mo, image à 2,5 Mo.

## Couleurs

- Les variables de thème sont déclarées **trois fois** : `:root`, le bloc `prefers-color-scheme: dark` et
  `:root[data-theme="dark"]`. **Une variable ajoutée doit l'être aux trois**, sinon `var(--x)` est invalide
  dans le thème oublié et la propriété disparaît. C'est ce qui rendait les fenêtres transparentes :
  `--card` était utilisée (fond de `#dvbox`, des champs du panneau de filtres) sans avoir jamais été
  définie — on lisait le tableau au travers. `--card` = `#FFFFFF` en clair, `#232B3A` en sombre.

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
