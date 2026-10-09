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
  **Rien ne colle pendant la capture** (Fabrice, 05/10/2026, 7 formules sur téléphone : 1ʳᵉ colonne vide et 3ᵉ rognée dans l'image) :
  la règle globale `td:nth-child(2){position:sticky}` du tableau des formules collait aussi la 1ʳᵉ formule du tableau de garantie ;
  défilé à l'horizontale, html2canvas décalait ces cellules. `#tgbox td:nth-child(2)` n'est plus collée, `.capwide` retire tout
  `sticky`, et `capture()` remet les défilements horizontaux à zéro. Test : scratchpad `t_cap7m.js` (412 px, défilé).
  **Sa largeur est plafonnée à ~2000 px** : `scale = min(2, 2000 / largeur du tableau)`. Cinq colonnes
  (Mutuelle Verte : 1996 px, 715 ko) gardent le ×2 ; API SANTÉ, à **onze formules**, sortait en 3392 px et
  1 Mo — 1,36 Mo une fois encodé en base64 pour le dépôt CRM, et une vignette illisible dans WhatsApp
  (mesuré le 25/09/2026). Pour tester la capture en local : `npm install html2canvas@1.4.1` dans le
  scratchpad, puis `addScriptTag` — cdnjs est bloqué depuis une session.
- `build.py` fabrique `dist/` : `index.html` (hébergé, `HOSTED=true`, adhésion derrière code), `clients.html`,
  `crm-public.html`, `adhesion-privee.html`, `comparateur-claude.html`. Il tourne depuis la racine ou depuis `src/`.
- **Publication = pousser `src/comparateur.html` sur `main`** : l'Action `.github/workflows/build.yml`
  reconstruit et commit `index.html` toute seule. Ne jamais éditer `index.html` à la main.
- Vérifier la mise en ligne : la mention « version JJ/MM/AAAA HH:MM » en bas de page (heure locale).
- **Envois rapprochés** (03/10/2026 : trois constructions de suite en échec à l'étape « Publier », la page en ligne restait
  ancienne) : la branche avançait pendant la construction et le `git push` de l'Action était refusé. Désormais
  `concurrency` (une seule construction, la plus récente) et, à la publication, `git pull --rebase` puis nouvel essai.
  Après un envoi, vérifier que le commit « Comparateur : construction automatique » suit bien.
- Si le push est refusé (« not in this session's authorized repository set ») : c'est une limitation de la
  session Claude, pas de git. Il faut une tâche créée avec le dépôt sélectionné. Sinon, dépôt manuel :
  https://github.com/fabcoh/santeo-tarifs/upload/main/src (et `/docs` pour les PDF).
- Commits : auteur `Claude <noreply@anthropic.com>`, messages en français.

## Fichiers `docs/` (chargés à l'exécution par la page)

- `bulletin_avenir_2026.pdf` (Cap Évolution, 72 p.), `bulletin_avenir_tns_2026.pdf` (Cap Évolution TNS, 85 p.), `bulletin_capnr_2026.pdf` (73 p.), `bulletin_talis_2026.pdf` (48 p.),
  `bulletin_mv_2026.pdf` (Mutuelle Verte, 22 p.), `bulletin_revoluo_2026.pdf` (24 p.) + `sepa_revoluo_2026.pdf`.
  Formulaires AcroForm remplis côté navigateur avec pdf-lib ; les PDF ont été allégés (pikepdf/qpdf),
  widgets orphelins rattachés, noms de champs en double suffixés `_2`.
- Tableaux de garantie / IPID / notices par gamme (`*_tg_2026.pdf`, `*_ipid_2026.pdf`, `*_notice_2026.pdf`,
  `lps_hospi_2026.pdf`). **La Mutuelle Verte édite deux IPID**, chacun rattaché à ses formules :
  `mv_ipid_gci100_300_2026.pdf` (GCI 100 à 300, « respecte les conditions légales des contrats responsables »)
  et `mv_ipid_gci500_2026.pdf` (GCI 500, « ne respecte pas »). Ils confirment les pastilles du comparateur.
  **Tableau de garantie et notices Mutuelle Verte (26/09/2026, zip de Fabrice)** : `mv_tg_2026.pdf` est désormais
  « Garanties Courtage Ind-100-500 », qui porte **les cinq formules** (l'ancien s'arrêtait à GCI 300). La Mutuelle
  Verte n'édite pas de notice unique : `mv_notice_gci100_300_2026.pdf` et `mv_notice_gci500_2026.pdf` (4 p.
  chacune) sont **assemblées** — délais de stage de la gamme (GCI 100–300 : prise en charge immédiate avec
  certificat de radiation ; GCI 500 : délais de stage de 3 à 10 mois) + Mutuelle Verte Assistance 2025.
  `DOCS.MV.Notice` est indexé sur la formule, comme l'IPID. Relecture ligne à ligne du nouveau tableau contre
  le comparateur : **une seule erreur, corrigée** — GCI 500 honoraires hors OPTAM en soins courants = **500 %**
  (et non 200 %) ; en hospitalisation hors OPTAM, 200 % est juste. Le poste optique reprend désormais,
  comme Cap Évolution, le forfait **2 verres simples** 16 ans et plus : 100 % / 100 / 150 / 200 / 250 € (Fabrice,
  26/09/2026 — c'étaient les verres mixtes, 150 / 250 / 300 / 350 €, qui flattaient la Mutuelle Verte).
  **Notice LPS Hospi reçue** (05/10/2026, page de dépôt, « NOTICE.pdf ») : `docs/lps_notice_2026.pdf`, « Descriptif de garanties »
  2 p., réf. « LPS HOSPI_2024 », `DOCS.LPSH.Notice`. Concorde avec le comparateur ; apporte psychologue 8 séances/an (> 3 ans),
  lit d'accompagnant 30 j, nuitée 22 h–6 h, liste de l'assistance RMA (montants renvoyés à une notice RMA absente), Médecin Direct.
  Fiche `avenir_lpshospi.md` mise à jour (source **DG**).
  **MCCI, dépôt du 05/10/2026** (11 PDF, trois mal rangés, identifiés par leur contenu) : IPID et **règlement mutualiste** (en vigueur
  au 1er avril 2026, rangé comme « notice ») des trois gammes — `mccinova|flexia|solencia_ipid_2026.pdf`, `…_notice_2026.pdf`
  (44 / 63 / 60 p.) ; `flexia_tg_2026.pdf` (11 p.) et `solencia_tg_2026.pdf` (9 p.) remplacés par une version qui **ajoute les grilles
  de tarifs au 1er janvier 2026** (FLEXIA 18–84 ans, SOLENCIA **62–99 ans**, âge atteint dans l'année ; 4 zones) — pages de
  garanties identiques mot pour mot, grilles concordantes avec `tarifs_all.json` (contrôle par sondage sur les 4 zones),
  `TAMPONS` inchangés (mêmes pages). Le tableau MCCINOVA déposé est identique au texte près à celui en place : gardé.
  `DOCS` des trois gammes : Tableau de garantie + IPID + Notice. Bulletin : sans objet (extranet MCCI). La fiche `mcci.md`
  est à reprendre avec les règlements. Page de dépôt (v16) : les 8 PDF téléversés dans ses assets et ajoutés à `APERCU`,
  `catalogue/etat` (lignes MCCI) écrit, les 11 dépôts passés en `remplace` (9) / `refuse` (2 : mauvais fichier dans la case).
  **LPS Hospi, bulletin 2026** (05/10/2026 : Fabrice dépose « adhesion.fdf.pdf », « remplace adhésion et ajoute notice ») : le
  fichier est **identique octet pour octet** à `bulletin_avenir_2026.pdf` (dossier Cap Évolution, 72 p.) ; ses **6 premières pages**
  sont le bulletin commun Avenir (case `LPS HOSPI`), extraites dans `docs/bulletin_lps_2026.pdf` (pypdf, 101 champs, 1,5 Mo) —
  seuls changent la page 5 (« Couverture Santé Solidaire ») et `NUM ADHERENT` → `NUMERO D'ADHERENT`, champ que la page ne
  remplit pas. `fillAdh` le charge pour `LPSH` (`DOSSIER`) et lui ajoute `lps_hospi_2026.pdf` (10 p.). **La case « LPS Hospi »
  n'était jamais cochée** : corrigé (`C("LPS HOSPI")` + formule). **Aucune notice LPS dans ce fichier** : la suite est le
  dossier Cap Évolution (descriptif, IPID, assistance RMA, statuts AG 2026, règlement mutualiste **garanties responsables** —
  qui ne vaut pas pour LPS, non responsable). La notice LPS est arrivée à part le même jour (voir plus haut).
- `adhesion.pdf.pdf` : dépôt par erreur, à supprimer.
- **Avenir Mutuelle, mise à jour du 28/09/2026** (dépôt de Fabrice sur la page de dépôt) : Cap Évolution, Cap Évolution
  TNS, CAP NR, TALIS — tableau de garantie, IPID, notice et bulletin. **Aucune garantie ne change** : les pages de
  garanties de Cap Évolution, TNS et TALIS sont identiques mot pour mot ; celles de CAP NR (nouvelle mise en page)
  concordent chiffre pour chiffre avec le comparateur. Les tableaux portent désormais la **notice d'assistance**
  Ressources Mutuelles Assistance (14 p.) en fin de fichier. La « notice » n'est plus le kit complet mais le
  **descriptif de garanties** (3 p. ; 10 p. pour CAP NR). Les bulletins portent les **statuts de l'AG du 24 juin
  2026** ; leurs 121–122 champs sont inchangés (noms, types, pages), la génération a été vérifiée (Cap Évolution
  salariés 72 p., TNS 85 p.). L'IPID Cap Évolution « ipid.pdf » déposé n'avait qu'une page : « IPID (38) » retenu.

- **Page de dépôt des documents** (28/09/2026) : https://claude.ai/artifact/5EWAbsBRP3EhxuFaFpiDc4 (privée à
  Fabrice ; source dans le scratchpad `depot/depot-documents.html`, capacités `db` + `assets`). Une case par gamme ×
  pièce (tableau de garantie, IPID, notice, bulletin d'adhésion) + « Autre document » ; Fabrice y dépose le PDF
  (20 Mo au plus) avec une remarque, puis dit « documents déposés ». **Pour traiter** : `ArtifactData list` de
  `depots` (statut `a_traiter` : `ligne`, `piece`, `asset`, `nomFichier`, `remarque`) → `Artifact read` avec
  `path` = l'id de l'asset pour récupérer le PDF → le relire contre le comparateur (et, pour un bulletin, vérifier
  que les champs que la page remplit existent toujours, même nom, même type) → le ranger dans `docs/` sous le nom
  en place, publier → `update` du dépôt : `statut` `remplace` (ou `refuse`), `traiteLe`, `reponse` en une ligne ;
  si le nom de fichier change, écrire `catalogue/etat` → `lignes.<ligne>.<piece>` = `[fichier, pages, note]`.
  Les lignes de la page ne suivent pas les clés de `DOCS` pour la Mutuelle Verte (`MV_100_300`, `MV_500`) et APICIL
  (`API_EQ`, `API_SER`).
  **03/10/2026 (Fabrice)** : **deux listes déroulantes, « Compagnie » et « Produit »** (les pastilles d'un premier essai ont été
  refusées : « deux champs filtre ») ; Produit se restreint à la compagnie choisie, choisir un produit fixe sa compagnie, « Tout
  afficher » remet à zéro ; le nombre « à traiter » suit chaque option. Les filtres s'appliquent aussi à l'historique ; l'historique **« Dépôts » est replié par défaut**, son titre
  l'affiche ou le masque. Filtres et ouverture retenus sur l'appareil (`depot_filtre`, `depot_produit`, `depot_journal`). **APRIL** ajoutée :
  une ligne par produit ouvert (`APRIL_ZEN`, `APRIL_MIX`…), bulletin « sans objet (April-On ou l'API) » — c'est là que
  Fabrice dépose les PDF April-On de Mix, Flexi, Optimale, Simply et Pro Privilège.
  **03/10/2026, suite (Fabrice)** : texte d'introduction retiré ; **œil 👁 à côté de « Nouveau PDF »**, qui ouvre l'aperçu du
  document en ligne dans une **fenêtre par-dessus la page** (fond assombri, ✕ Fermer ou clic à côté ; pdf.js) — le nom du
  fichier fait de même : plus aucun nouvel onglet (la 1ʳᵉ version, plein écran, passait pour un onglet). La page ne peut pas lire `fabcoh.github.io` (CSP) : les 56 PDF de
  `docs/` sont **copiés dans l'espace de la page** et la table `APERCU` (fichier → id d'asset) les relie — **un document
  remplacé doit y être téléversé à nouveau** (`Artifact publish asset:true`) et `APERCU` mis à jour. Un produit **incomplet** (au moins une
  pièce « Manquant » ; « sans objet » compte comme fournie) a son nom **en rouge**, dans le tableau comme dans la liste « Produit »
  (Fabrice : rouge plutôt que barré, 03/10/2026). Boutons « Nouveau PDF » / 👁 alignés en bas de case (`margin-top:auto`).

  **05/10/2026 (Fabrice)** : option **« ⚠ Documents à compléter (n produits) »** en tête de la liste « Produit » (`MANQUE`) :
  seuls les produits incomplets, toutes compagnies ou celle choisie ; l'historique suit. **Bulletin « sans objet »** pour MCCI
  (« vente en ligne sur le site MCCI » — Fabrice : « parfois on doit faire la vente sur le site en direct, comme pour APRIL ou
  VERALTI ») et pour APRIL (« April-On ou l'API ») sauf Mix et GAN qui ont le leur ; une case « sans objet » accepte quand même
  un PDF. Aperçu 👁 de `bulletin_lps_2026.pdf` ajouté à `APERCU`. Page version 14.

## Fiches de connaissances — `docs/connaissances/` (03/10/2026)

- Demande de Fabrice : que le Claude du CRM réponde à tout ce qui sort des connaissances de base (sophrologie, séances d'ostéo
  ou de kiné, plafond dentaire, implants, délais d'attente, âges, assistance…). **Une fiche Markdown par produit vendu (17)**,
  liste dans `docs/connaissances/README.md`, rédigées par lecture complète des PDF de `docs/` (chiffres vérifiés sur l'image
  des pages). Chaque fait porte sa source ; « Non précisé dans les documents » sinon. Sections : identité, adhésion, délais,
  résiliation, cotisation, tableau des garanties, **« Détails pratiques »** (par thème), assistance, exclusions, écarts entre
  documents, 35 à 50 questions-réponses. Consigne de rédaction : scratchpad `consigne_fiches.md`.
- **Un document remplacé dans `docs/` → relire et mettre à jour sa fiche** (et le carnet du CRM).
- Les écarts **avec le comparateur** relevés par les fiches ont été corrigés le 03/10/2026 (« Corrigé dans le comparateur » dans
  la fiche) : notice d'information APICIL (`apisante_ni_2026.pdf`, la « notice » d'avant était la fiche produit distributeurs),
  « Pas d'implantologie » Équilibre 1–3 / Sérénité 1, pharmacie Équilibre 1, Infos Mutuelle Verte (audio GCI 300 = 300 %,
  3 séances de prévention par 12 mois, délais de stage, aucun âge écrit), âges (Cap Évolution TNS 18 ans, Révoluo 7–8 70 ans,
  CAP NR / LPS sans âge maximum écrit, FLEXIA / SOLENCIA = grille de tarifs), Renfort 50 sans plafond propre, optique MCCI.
  **Laissé tel quel, à confirmer par Fabrice auprès d'Avenir** : la gratuité du 3ᵉ enfant appliquée au tarif Cap Évolution
  (non écrite dans le tableau ; la fenêtre Infos le dit). Révoluo : la réduction famille −5 / −10 % du tarif n'est dans aucun
  document (seule la gratuité du 3ᵉ enfant de moins de 20 ans l'est) ; le Renfort 25 existe mais n'est pas proposé.

## IA produits — chat des commerciaux (03/10/2026)

- Demande de Fabrice : un chat où le commercial pose une question sur nos produits et l'IA répond d'après nos données ;
  « les données sont dans un dossier commun et chacun interroge de son côté ». Bouton **💬 IA produits** en bas à droite,
  **page hébergée seulement** (`HOSTED`) ; panneau `#aipanel` (bulles, ↺ nouvelle conversation, Entrée pour envoyer,
  Maj+Entrée pour une ligne) ; historique en texte seul dans `sessionStorage` (`ia_hist`). Remplace l'ancien « Assistant
  garanties » (capacité `sample`, qui ne marchait que dans un artifact).
- **Pas de clé d'IA chez nous** (Fabrice : « je ne veux pas passer par une clé Anthropic », 03/10/2026) : la page n'est que
  la fenêtre, **l'IA du CRM WhatsApp répond**. `POST <CRM>/api/comparateur/ia` (base `CRMLINK.base`, sinon `santeo_crm_base`,
  sinon l'hôte Manus), PIN `X-Import-Auto-PIN` (`santeo_crm_pin`) ou `token` du lien CRM ; corps `{token?, question, contexte,
  historique}`, `contexte` = profil, prospect et formules affichées avec leur tarif (`LASTROWS`, 80 au plus) ; réponse
  `{reponse, fiches?}` ou `{erreur}`. 404 → « pas encore en service côté CRM » ; 401/403 → PIN ou lien expiré. Contrat
  complet dans `docs/carnet/ECHANGES.md`. Test : scratchpad `t_ia2.js` (CRM simulé par Playwright).
- **Abandonné** : le relais `ia-produits.php` + clé API Anthropic (scratchpad `ovh/ia/`, `iatest/`) — écrit et testé, jamais
  déposé. Ne pas le ressortir sans accord de Fabrice.

## Règles métier à ne pas casser

- **MCCINOVA** : mineurs au tarif 18 ans ; cadre « Conditions MCCINOVA » (âge atteint dans l'année, enfants
  jusqu'à 28 ans) affiché seulement si la gamme est dans le tableau.
- **RÉVOLUO / RF50 / RF100** : grille × zone (75 = zone 1) × régime (TNS ×0,90 ; Alsace-Moselle ×0,65 sans zone),
  réduction famille −5 %/−10 %, **18 et 19 ans même tarif** (ligne « 19 » de la grille), mineurs au tarif 18 ans,
  2 enfants payants max, pas de DOM-TOM, jusqu'à 80 ans. Grille alignée sur le tarificateur showcase : ×0,999 au centime.
  Renfort 50 éligible Rev 2–8, Renfort 100 éligible Rev 2–6. Option « Souscripteur non assuré » (enfants seuls) :
  bloc adhérent rempli, ligne « Adhérent » des assurés vide, cotisation recalculée. Génération = 2 PDF (bulletin + SEPA).
  **Autorisation d'utilisation du compte CERGAP** (Fabrice, 05/10/2026 : « intégrer ce document dans le SEPA… SEPA puis nouveau
  doc à la suite ») : `docs/autorisation_compte_revoluo_2026.pdf` (1 p., 13 champs) est ajouté **en page 2 du mandat SEPA**
  (`fillSepaREV`) : Je soussigné = l'adhérent (nom, prénom, adresse, CP ville — ce champ a deux widgets, il remplit aussi « FAIT
  A »), COTISATIONS et PRESTATIONS cochées, « LE » = date de signature, n° de contrat vide ; **« souscrit par (titulaire
  principal) » = l'adhérent, sauf « Souscripteur non assuré »** (« la mère ou le père à retirer du contrat et souscrit par
  l'enfant ») : le 1ᵉʳ enfant, à défaut le conjoint. Rempli et enregistré à part, page copiée, champs rattachés au formulaire
  (30 champs, modifiables). **Liens ⬇ par fichier** sous le message de génération : le 2ᵉ téléchargement automatique est
  souvent bloqué par le navigateur. Test : scratchpad `t_sepaautor.js`.
- **Lentilles : le forfait seul, en euros** (Fabrice, 25/09/2026). `EX.*.lentA` / `lentR` portaient « 100 % +50 € »
  et « +50 € » pour Mutuelle Verte, RÉVOLUO et les renforts ; c'est désormais « 50 € ». La part Sécu (100 %) est
  implicite, les mentions du courrier la rappellent. Un « 100 % » seul (Rev 1) ou « 100 % BR » (FLEXIA, APICIL)
  reste tel quel : il n'y a pas de forfait à isoler. Modifié **dans la page**, donc partout — tableau, image
  WhatsApp, courrier, `garanties.json`.
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
  (Fabrice, 26/09/2026) : ☐ Sans tarifs · icône messagerie · icône WhatsApp (infobulles ; image copiée puis
  messagerie ou WhatsApp ouverts) · **Envoyer par mail** (courrier Mailgun au prospect) · icône **autre destinataire** (petite fenêtre :
  expéditeur + adresse saisie, même courrier, mêmes copies cachées — `mailFenetre(…, autre=true)`) · **Envoyer dans le CRM**.
  **Icône ⬇ Télécharger** (rétablie à la demande de Fabrice, 03/10/2026, après l'icône WhatsApp : la même capture, `data-a="dl"`).
  Pas de consignes au-dessus du tableau : la ligne « synthèse d'après le tableau de
  garantie officiel… » est cachée à l'écran mais **reste dans l'image** (`.capwide .src`), la consigne de
  l'étoile est son infobulle. Le bouton **✉️ Email** de la barre flottante ouvre le tableau et la fenêtre
  « Envoyer par mail » — plus de `mailto:`. Venu du CRM, le bouton vert de cette barre devient
  **📲 Capture → WhatsApp** : il ouvre le tableau des formules cochées (⭐ comprise) et y déclenche le dépôt
  de la capture (`viaTableau("crm")`), en un clic. L'ancien dépôt en texte (`doDepotText`) est retiré. Pas de second aperçu.
  **« Envoyer dans le CRM » envoie aussi le mail** (Fabrice, 26/09/2026), en haut comme en bas : dépôt de l'image,
  puis le courrier de « Envoyer par mail » au prospect (même relais, expéditeur mémorisé `santeo_exp`, mêmes
  copies cachées), puis **la copie du courrier déposée dans la conversation** (`kind:"email"` : `subject`,
  `from`, `to`, `date`, `html`, `text`) pour la garder ou la renvoyer depuis le CRM. La page demande la copie
  au relais (`copie:true`) ; `santeo-mail.php` la renvoie avec les logos intégrés en `data:` au lieu de `cid:`.
  **Sans e-mail sur la fiche, l'image part seule** et le statut dit « mail non envoyé : pas d'adresse ».
  Un CRM qui refuse `kind:"email"` n'empêche rien : « copie non déposée dans le CRM ». `corpsMail()` fabrique le
  corps du courrier pour les deux chemins — une seule définition.
  **Ouverte depuis le CRM (`window.CRMLINK`), la page dépose la copie de TOUT courrier réussi** (demande du Claude
  du CRM, 26/09/2026) : fenêtre « Envoyer par mail », « autre destinataire » — même quand le destinataire n'est
  pas le prospect — et bouton ✉️ Email de la barre flottante, qui passent tous par `mailFenetre`. `copieCRM(d)`
  fait le dépôt et rend la mention (« copie dans le CRM » ou « ⚠ copie non déposée dans le CRM (raison) ») ; un
  échec ne bloque jamais l'envoi, déjà parti. Hors CRM, `copie` n'est pas demandée. **Dans la copie seulement**,
  le relais intègre les logos en `data:image/png;base64` (le CRM n'affiche aucune image distante) ; le courrier du
  prospect garde `cid:`. Le GET du relais annonce `version` et `copie` : c'est ainsi qu'on vérifie qu'il est à jour.
  **Anti-doublon** (26/09/2026 — deux courriers identiques reçus à 19:53 par M. CHENEVARIN : « Envoyer par mail » puis
  « Envoyer dans le CRM », qui envoie aussi le mail) : le même comparatif (mêmes formules) au même destinataire
  dans les **10 minutes** — `envoiCle`/`envoiRecent`/`envoiNote`, retenu sur l'appareil (`santeo_envois`) — n'est
  pas renvoyé sans le dire. Fenêtre d'envoi : un premier clic affiche « déjà parti à HH:MM », un second renvoie.
  « Envoyer dans le CRM » / « 📲 Capture » : l'image est déposée, le mail n'est pas renvoyé (« mail déjà envoyé à
  HH:MM, pas renvoyé »). Un autre destinataire ou d'autres formules ne sont pas concernés.
  **Après un envoi réussi, les fenêtres se ferment seules** (Fabrice, 26/09/2026) : 1,6 s après « Comparatif
  envoyé », la fenêtre d'envoi et le tableau de garantie (`fermerTableaux()`, `#tgov.tgmain`) disparaissent, et
  un bandeau vert (`bandeauOk`) confirme l'envoi 3 s. Même chose après un dépôt CRM réussi, juste avant le
  retour à la conversation. Un échec, lui, laisse tout ouvert, avec son message.
  **Bas du tableau raccourci** (Fabrice, 04/10/2026, capture du 04/10 à l'appui : « tu supprimes la partie sous le tableau des
  explications ») : **ni atouts de l'étoile ni bloc par colonne** (documents, limites) — `Tableau.piedCourt(G, cols)` ne garde
  qu'une ligne « <formule> : contrat non responsable. » par formule concernée (gamme `resp:false`, ou limites qui commencent
  par « Contrat NON responsable » : GCI 500). Puis la base du devis, puis **logo Santéo + « Courtier comparateur depuis 1992 »
  + « Infos légales : www.santeo.net »** (`Tableau.legal`, les longues mentions ne restent que dans le courrier). Dans la
  fenêtre, l'image et `docs/tg/`. `Tableau.pied` reste exporté. Ce qui suit décrit l'**ancien** bas de tableau :
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
  **La capture ne porte pas ces liens** (Fabrice, 26/09/2026) : `#tgbox.capwide .tglim .tgdoc` et `.tgsep`
  sont cachés pendant la capture — nom de la formule et limites seulement. La fenêtre, elle, les garde.
  « Contrat NON responsable. » n'est plus écrit deux fois quand les limites de la gamme commencent déjà par lui.
  **Mise en avant de lignes** (Fabrice, 26/09/2026) : un clic sur le libellé d'une ligne (orthodontie, prothèses…)
  la surligne — fond jaune pâle, valeurs en gras, filet orange à gauche ; second clic pour l'enlever. Plusieurs
  lignes possibles, retenues le temps de la page (`LIGNES_AVANT`, par libellé). Reprise **dans l'image** et **dans
  le courrier** : `mailTableau` ajoute un 3ᵉ élément à chaque ligne (`[libellé, valeurs, 1|0]`), que
  `santeo-mail.php` rend avec le même fond (`#FFF3C4`) ; la version texte marque ces lignes d'un `*`. Un relais
  plus ancien ignore ce 3ᵉ élément sans erreur.
- **Tableau en blocs** (Fabrice, 03/10/2026, « pour une meilleure visite chez le prospect ») : `Tableau.BLOCS` — Hospitalisation
  (Optam, hors Optam, chambre), Honoraires (spécialistes Optam / hors Optam), **Pharmacie** (médicaments remboursés `x:pharR`,
  pharmacie non remboursée `x:pharN`), Dentaire (**Prothèses dentaires**, implantologie, orthodontie), Optique (**verres et
  monture simples** `opt`, **complexes** `x:optC`, lentilles), Autres (audio, médecines douces). Bandeau `tr.tgsec` (une case
  par colonne, pour garder le cadre de la colonne ⭐) ; lignes **Optam, prothèses et verres simples en gras** (`tr.fort`, la 1ʳᵉ ligne de l'optique ajoutée « pour l'harmonie », Fabrice 03/10/2026), libellé compris ; **les autres libellés en normal** (Fabrice, 03/10/2026). Même découpage dans
  l'image, le courrier (`lignes` à 4ᵉ élément `titre` / `fort`, relais `2026-10-03 blocs`) et `docs/tg/`.
  **Valeurs relevées le 03/10/2026 sur l'image des tableaux de garantie** (scratchpad `releve/A|B|C.json`, pages citées) :
  optique complexe = même méthode que les verres simples de chaque gamme ; pharmacie remboursée = médicaments à 65 % ;
  « 100 % (hors 15/30 %) » pour APICIL Équilibre 1 et MCCINOVA Socle ; Mutuelle Verte « … (tabac) » (son seul forfait est
  l'antitabac) ; CAP NR pharmacie non remboursée « n.c. » (forfait prévention commun, pas de ligne) ; TALIS optique complexe =
  monture + 2 verres progressifs. Renforts et packs optionnels jamais comptés. **Corrigé au passage** : TALIS verres simples
  90 / 160 € (monture + 2 verres ; 50 / 100 € n'était que la monture), Révoluo Rev 1 optique « 100 % BR » (et non « — »).
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
  **Compagnies par défaut** (Fabrice, 01/10/2026) : dans le détail, **la case** coche pour cette fois ; **le nom** de la
  compagnie (`.fnom`) la fixe par défaut — case rouge (`.fcase.defaut`, `--nrc`), cochée — et un second clic sur le nom
  l'enlève. Un premier essai à l'appui long ne marchait pas chez Fabrice : abandonné. Liste `DEFAUT`, retenue sur
  l'appareil (`santeo_defaut`). À l'ouverture de la page, à chaque nouvelle fiche et sur « Tout effacer »,
  `selDefaut()` coche ces compagnies-là au lieu de « toutes » ; sans compagnie par défaut, rien ne change.
  **Le périmètre ne se règle que là** : le volet « Compagnies & gammes » du haut de page a été retiré, deux
  endroits pour le même réglage se désynchronisant et mangeant la place des résultats.
  **TALIS, surcomplémentaire, n'apparaît que si elle est cochée** : son tarif ne couvre
  qu'un complément et la mêler aux complémentaires fausserait la comparaison. LPS Hospi reste dans le lot,
  sa pastille « Hospitalisation seule » suffisant à la distinguer.
  **À l'arrivée d'une fiche**, `filtresApercu()` ouvre le panneau **6 secondes** puis le referme : le
  commercial voit qu'il repart vierge sans avoir à aller le vérifier. Dès qu'il y touche — bouton ⚖, clic ou
  saisie dans le panneau — le minuteur est annulé et le panneau lui appartient.
- **Modèles de filtre** (Fabrice, 06/10/2026 : « Dentaire implant », « valable pour tous, Antony et moi ») : bouton
  **📁 Modèles de filtre** sous « Options par poste » (`ouvrirModeles`). Un modèle = nom + explication + `sel` (compagnies et
  gammes cochées), `april` (produits APRIL, seulement si APRIL est cochée), `options` (`exOn`), `filtres` (seuils de `FILTRES`) —
  **jamais le budget**, propre au prospect. **Appliquer remplace** la sélection en cours (le budget saisi reste), reconstruit le
  panneau ⚖ et recalcule ; ✎ reprend nom et explication pour réenregistrer ; 🗑 en deux clics ; un nom déjà pris remplace le
  modèle. Le bouton affiche le nom du modèle qui correspond exactement à la sélection (`modelesSum`, à chaque `calc`).
  **Partage** : relais `https://capisante.fr/modeles.php` (scratchpad `livrer/modeles.php`, **déposé dans `www/` et vérifié le 06/10/2026** : lecture, écriture, suppression, appelant étranger refusé) — GET =
  liste, POST `enregistrer` / `supprimer` ; fichier `modeles-filtres.json` **hors du dossier web**, version précédente dans
  `modeles-filtres.avant.json` ; site appelant autorisé, 30 écritures/heure/IP, 80 modèles, contenu contrôlé champ par champ.
  Relais injoignable → modèles « (cet appareil) » dans `santeo_modeles`. Une nouvelle fiche (`filtresRAZ`) remet toujours à
  zéro : on applique le modèle après l'arrivée de la fiche. Test : scratchpad `t_modeles.js` (relais réel sous `php -S`).
  **« 👁 Afficher la sélection »** (Fabrice, 06/10/2026 : « si je coche une case, afficher la sélection… retrouver uniquement ce qui
  est coché ») : bouton de la barre flottante (`#sbvs`, ↔ « ☰ Tout afficher ») ; `VOIRSEL` réduit le tableau aux formules cochées
  (`SENDSEL`), après filtres, avec une ligne d'avertissement (cochées absentes comptées) ; ✕, plus aucune case cochée ou nouvelle
  fiche (`filtresRAZ`) le coupent. **Un modèle enregistré dans cet état retient `formules`** (`clé|fi`, niveau compris ; APRIL
  `rang × 100 + niveau`) : l'appliquer les coche et n'affiche qu'elles. Relais `2026-10-06 modeles de filtre, formules` (un relais
  plus ancien les ignore : la page le signale). Test : scratchpad `t_vsel.js`.
  **Formules cochées retenues d'office** (Fabrice, 06/10/2026 : « il faut afficher la sélection quand je clique sur le modèle et
  filtrer mes choix ») : à l'enregistrement, case « Retenir les n formules cochées » (cochée par défaut dès qu'une case d'envoi
  l'est, `#mdlform_f`) — plus besoin de passer d'abord par « Afficher la sélection ». **Appliquer** ouvre aussi le panneau ⚖
  6 s (`filtresApercu`), détail des compagnies déplié si le modèle en restreint. Test : scratchpad `t_vsel2.js`, `t_appl.js`.
  **Fenêtre compacte** (Fabrice, 06/10/2026 : « plusieurs filtres pré-enregistrés, minimise les infos pour garder le titre et
  commentaire ») : une carte par modèle = nom + explication + Appliquer / ✎ / 🗑 ; le résumé (compagnies, formules, seuils,
  auteur, date) est replié sous « ▸ Détail » ; « ＋ Enregistrer la sélection actuelle » est replié (`#mdlsave_d`, ouvert par ✎ ou
  quand aucun modèle n'existe). Test : scratchpad `t_mdlvue.js`.
  **Clic perdu corrigé au passage** : quitter le CP recalcule au `mousedown` et `render` reconstruisait les lignes, avalant le
  1ᵉʳ clic sur une case d'envoi. `render` ne touche plus aux lignes si leur HTML n'a pas changé (`RENDU_PREC`).
- **Case « tout cocher »** en tête de la colonne des cases (Fabrice, 26/09/2026) : coche ou décoche toutes les
  formules affichées — donc après filtres et périmètre. Pleine si toutes le sont, tiret si une partie
  (`syncSendAll()`). **`buildHead()` ne remplace l'en-tête que s'il a changé** : quitter un champ (CP…) recalcule
  au `mousedown`, et l'en-tête reconstruit à ce moment avalait le clic sur la case.
- **Bouton ↗ sous « Fiche CRM »** (Fabrice, 26/09/2026) : ouvre le comparateur **dans un nouvel onglet**, à la même
  adresse — donc la même fiche et le même lien CRM (`#fiche=…&crm=…&t=…`). Pour sortir de la petite fenêtre où le
  CRM l'ouvre. Ouvert en `noopener` : « Revenir au CRM » y suit l'adresse `back=`. Les formules cochées et
  l'étoile ne suivent pas. Un premier essai en « plein écran » dans la page a été retiré le même jour : ce
  n'était pas ce que Fabrice voulait.
- **Recherche de fiche par nom** : le CRM renvoie une **liste** sous un nom de champ variable ; la page prend
  `resultats`, `results`, `fiches`, `items`, `data`, `liste`, `prospects`, ou le premier tableau d'objets de la
  réponse. Avant, tout objet était pris pour une fiche : « Fiche reçue mais vide ». Ce message affiche
  désormais le diagnostic (adresse appelée, réponse brute) pour voir ce que le CRM a vraiment renvoyé.
  **Sur un mot seul (« cohen »), le CRM renvoie ses 50 dernières fiches sans filtrer** (constaté le 26/09/2026 ;
  « cohen marc » filtre bien). La page **trie donc elle-même** toute recherche sans chiffre ni @ : elle ne garde
  que les fiches dont nom + prénom contiennent chaque mot tapé (sans accents ni casse), dit « Aucune fiche »
  si rien ne correspond, et prévient quand la réponse atteint 50 fiches (d'autres peuvent manquer). Le vrai
  correctif est côté CRM : demande transmise à Fabrice pour le Claude du CRM.
  **Choix dans une liste** (30/09/2026) : le CRM ne renvoie le **détail** (adresse, e-mail, téléphone, famille) que
  si la recherche trouve une seule fiche. Avant, le clic relançait `q=<n° de fiche>` en recherche plein texte, qui
  revenait en liste : « Fiche illisible ». La page envoie désormais `&santeoId=<n°>` en plus ; le CRM doit y répondre
  par la fiche complète (`readSanteoComparateurDetails`). Tant qu'il l'ignore, la page reprend ce que la liste montre
  — nom, prénom, date de naissance, ville — et le dit en une ligne dans la fenêtre « Données importées du CRM »
  (`window.IMPNOTE`, lue une seule fois) ; le panneau de recherche se ferme. Les lignes de la liste sont des
  `div role=button` (et non des `label`), touchables sur téléphone. **Le détail technique (adresse appelée, code
  HTTP, réponse brute) n'est plus affiché** (Fabrice, 01/10/2026) : il reste dans la console, `window.CRMDIAG`.
  Constaté le 01/10 : `q=294421&santeoId=294421` renvoie encore `total:2` — le CRM ne lit pas `santeoId` tant que
  la branche `claude/comparateur-fiche-par-numero` de WhatsApp_Solution n'est ni fusionnée ni déployée.
  **Décision de Fabrice (01/10/2026) : on n'y touche pas pour le moment.** La branche est en conflit avec `main`
  (`ECHANGES.md`) ; si la question revient, la faire reprendre par le Claude du CRM, qui seul parle à Manus —
  ne pas ouvrir de PR dans son dépôt depuis ici.
- **Adresses de production (souscription en ligne)** (Fabrice, 05/10/2026 : « on clique sur adhésion, cela ouvre le site MCCI »,
  puis « je peux modifier les adresses depuis l'artefact et cela va dans le comparateur ») : dans le détail d'une ligne, un lien
  ouvre le site de la compagnie — **📝 Adhésion (site MCCI)** pour MCCINOVA / FLEXIA / SOLENCIA
  (`https://www.extranetcourtage.mcci.fr/#/broker/projects`), **🌐 Souscrire en ligne** pour toute autre gamme qui en reçoit une
  (en plus de son bulletin). Pas de code d'adhésion : le site a sa propre connexion ; rien n'est transmis à la compagnie.
  **Source** : `docs/liens_adhesion.json` (`lignes` = ids de la page de dépôt ; `lienAdh(r)` : MV → `MV_100_300`/`MV_500`,
  APICIL → `API_EQ`/`API_SER`, RF50/RF100 → `REV`, CAPEVO + TNS → `CAPEVO_TNS` s'il existe), lu au chargement, repli sur
  `LIENS_ADH` dans la page. **Fabrice modifie l'adresse dans la case « Bulletin d'adhésion » de la page de dépôt** (« Adresse
  de production », ✎ Modifier / Ajouter, https seul) → base `catalogue/liens` (`lignes`, `majLe`, `aReporter:true`). La page
  privée ne peut pas écrire dans le dépôt GitHub : **quand il dit « liens modifiés »**, lire `catalogue/liens`, recopier
  `lignes` dans `docs/liens_adhesion.json`, pousser, puis remettre `aReporter:false`. APRIL garde son bouton April-On.
  Tests : scratchpad `t_mcci.js`, `t_mcci2.js`, `depot/t_lien.js`.
- **Titre de la fenêtre d'adhésion** (01/10/2026) : « Adhésion — gamme formule · xx,xx €/mois » (`#adhtit`), le tarif
  retenu pour vérifier ; il suit le recalcul « Souscripteur non assuré » de Révoluo.
  **Une fiche n'est pas une liste** (30/09/2026, fiche 294413) : la fiche complète porte ses propres tableaux
  (`assures`, `enfants`) ; la règle « premier tableau d'objets de la réponse » prenait `assures` pour une liste —
  « 3 fiches, choisis la bonne » (l'adhérent, un assuré vide, ENFANT3). Un objet qui a `nom`, `prenom`,
  `civilite`, `naissance`, `assures` ou `enfants` est désormais une fiche ; le repli sur un tableau ignore
  `assures`, `enfants`, `conjoint`, `beneficiaires`.
- **Créer un tarif sans fiche CRM** (Fabrice, 01/10/2026) : dans la fenêtre « Fiche du CRM Santéo », sous la recherche,
  `creationHTML()` / `brancherCreation()`. **Créer un tarif** : âge, année ou date de naissance (`lireNaissance` :
  « 42 », « 1984 », « 04/12/1984 » ou « 04121984 »), département ou code postal, régime (Salarié, TNS, Alsace-Moselle
  salarié `RL`, Alsace-Moselle TNS `TNSRL`). Se déplient : **Compléter les infos** (civilité, nom, prénom, adresse, ville,
  téléphone, e-mail) et **Ajouter un assuré** (assuré 1 rappelé tel que saisi, puis lien conjoint / enfant, nom, prénom,
  date de naissance au masque, régime ; un mineur passe en enfant ; nom de famille de l'assuré 1 par défaut). « Voir les
  tarifs » remplit `PRO` (comme une fiche importée, donc l'adhésion) et le haut de page par `applyImport`, sans la fenêtre
  « Données importées du CRM » : le commercial vient de tout taper. Rien n'est écrit dans un CRM.
  **La fenêtre s'ouvre réduite** — recherche + « ▸ Créer un tarif » replié (Fabrice, 01/10/2026 ; un premier essai
  la dépliait d'office, ce n'était pas la demande) ; rien n'est retenu d'une ouverture à l'autre. Ouvrir « Ajouter un assuré » pose aussitôt la fiche de
  l'assuré 2. Champs à 40 px de haut et libellés sur une ligne (`white-space:nowrap`), grille alignée par le bas :
  un libellé qui passait à la ligne décalait son champ (constaté par Fabrice sur PC le 01/10/2026).
  **Elle ne s'ouvre que par le bouton Fiche CRM** (Fabrice, 01/10/2026). **Arrivée sur la page sans fiche** (directe ou
  `#vide`) : aucune fenêtre, assuré et code postal **vides**, aucun tarif (« Renseigne une année de naissance… »). Une
  saisie retrouvée après le rechargement des 6 h (`santeo_stash`, `window.STASH_OK`) n'est pas vidée. L'ancienne
  question « Importer une fiche prospect ? » ne sert plus sur la page hébergée. Le collage d'une fiche Santéo y est gardé, replié
  (« Coller une fiche copiée de Santéo », même `parseFiche`). Une fiche reçue par le lien mais incomplète (`FICHE_KO`)
  ouvre toujours l'ancienne fenêtre, qui la montre. Depuis le CRM WhatsApp, rien ne s'ouvre : la fiche arrive par le lien.
- **Haut de page** : une seule ligne — assuré, conjoint, régime, département/CP, mineurs — les âges retenus
  inscrits sous leur champ en position absolue, pour ne pas pousser la ligne. Le tableau démarre à 136 px
  au lieu de 255 avant ce resserrement. **Options par poste** ouvre une fenêtre par-dessus (`ouvrirOptions`) :
  six cases en deux groupes, chacune ajoutant une colonne au tableau, plus « Tout décocher ». Au repos elle
  ne prend aucune place.
- **Vérifier sur le document officiel** (Fabrice, 03/10/2026) : **icône 👁 à côté du nom de la formule** (ajoutée à sa demande), **appui long (0,5 s) sur la ligne**, ou clic
  droit sur ordinateur, ouvre `verifDocs(r)` — une fenêtre par-dessus qui affiche **dans la page** les PDF de la formule
  (tableau de garantie d'abord, puis IPID, notice, CG…), rendus par **pdf.js** chargé au premier usage depuis cdnjs (un PDF
  dans un cadre ne s'affiche pas sur Android). `DOCPAGE` ouvre directement la page du tableau quand elle est connue
  (Santé Mix : p. 5). **Ouverture directe sur la page des garanties de la formule** (Fabrice, 05/10/2026 : « éviter les pages de
  présentation ») : `pageGaranties(url, r)` prend la page de son tampon de cotisation (`TAMPONS`, compté de 0), sinon la 1ʳᵉ page
  tamponnée du fichier, sinon `DOCPAGE` ; le bouton « Pages 1–n » garde l'accès au début. Test : scratchpad `t_pagegar.js`.
  **Recadrage à l'affichage** (Fabrice, 05/10/2026 : « les tableaux API SANTÉ sont mal présentés ») : `DOCCROP` (fichier → [x0, x1]
  en points) — les plaquettes Équilibre 1–6 n'ont qu'une colonne, seule la bande 18–350 pt est rendue (texte ×1,8). Le PDF n'est
  pas modifié (pièces jointes, onglet) ; les renvois en petits caractères débordent un peu à droite. Test : scratchpad `t_crop.js`.
  « 🔍 Agrandir » double la largeur des pages, « Ouvrir dans un onglet » reste en secours. Le clic qui
  suit l'appui long n'ouvre pas le détail de la ligne (`window.APPUI_LONG`). Testé souris et tactile (Playwright, CDP).
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
  **Régime SSI : la fenêtre porte un bloc « entreprise »**, affiché seulement si le régime est **TNS**.
  APICIL refuse sinon (« siret obligatoire si le regime SOCIAL de l'assure est SSI et la situation
  Professionnelle differente de RETAITE », message réel du 23/09/2026). La doc v1.8 §5.2.2 en exige **six**,
  pas un seul : `siret` (14 chiffres), `raisonSociale`, `dateCreation`, `codePostalPM`, `statutSocial`
  (ArtisanCommercant / ProfessionLiberaleMedicale / ProfessionLiberaleNonMedicale / MicroEntrepreneur /
  ProfessionAgricole) et `defiscalisationMadelin`. Les cinq premiers sont **exigés comme le nom** dans cette
  fenêtre — c'est la seule qui bloque, APICIL rejetant de toute façon l'appel ; le code postal de l'entreprise
  est proposé égal à celui du prospect, la loi Madelin à « Oui ». **Aucun commentaire ni avertissement
  autour** (décision de Fabrice, 23/09/2026) : les champs parlent d'eux-mêmes, et le refus d'APICIL n'est plus
  commenté, seule sa phrase s'affiche. Alsace-Moselle TNS part en `ALSACEMOSELLE`, pas en `SSI` : le bloc ne
  s'affiche pas. Le relais `apicil-devis.php` transmet les six champs après contrôle de format.
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
  **Le BIC est de nouveau facultatif** (message de VERALTI transmis par Fabrice, 29/09/2026) : du 22 au 29/09,
  APICIL répondait sans lui `INTERNAL_SERVER_ERROR` / « Le BIC doit faire 8 ou 11 caractères ». Vide, il n'est
  plus transmis (`BICSepa` absent) et part dans la liste « le client devra saisir lui-même » ; saisi, il doit
  avoir 8 ou 11 caractères, sinon la page et le relais refusent. Le GET du relais annonce
  `"version":"2026-09-29 BIC facultatif"`.
  L'IBAN, lui, **est bien facultatif** : vérifié par appel réel le 22/09/2026 sur `DEV-2026-3315706`,
  BIC `CRLYFRPPPOI` seul, sans `IBANSEPA` — APICIL renvoie `success` et l'`urlEsignQuote`. Le client saisit
  son IBAN dans le parcours de signature.
  **La fenêtre reprend toute la fiche du prospect** — ce que le formulaire Docapost demanderait sinon à la
  main : nom/prénom, date de naissance, régime, adresse + CP + ville sur une ligne, téléphone + e-mail,
  nom/ville/CP de naissance, situation familiale, n° de Sécurité sociale + n° d'organisme sur une ligne,
  IBAN + BIC sur une ligne, jour de prélèvement. Ce qui vient du devis (nom, prénom, date de naissance,
  régime, code postal) s'affiche **en pointillé et non modifiable** : APICIL le recoupe.
  **Alertes ≠ blocage, ici aussi** : seuls l'e-mail, et un IBAN ou un BIC mal formés, arrêtent l'envoi ; pour tout le reste, un
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
  **`masqueTel()` pose la règle sur le champ lui-même** : à l'ouverture de la fenêtre et à chaque sortie du
  champ, `dv_tel` et `s_tel` repassent au format national. Avant, la réécriture n'avait lieu qu'au clic sur
  « Créer le devis » : la fenêtre affichait encore `+33768517874`, et on ne pouvait pas savoir si le numéro
  partirait bon. Un champ vide reste vide, un numéro incomplet (`06 22 19`) est laissé tel quel — au
  commercial de le corriger, jamais de le perdre.
  **Le numéro est rangé au format dès l'import**, dans `applyFicheJSON` (fiche JSON du CRM) comme dans
  `parseFiche` (fiche en texte) : `PRO.tel` vaut `0622197349`, et non plus `+33768517874` ni `06 22 19 73 49`.
  Toutes les fenêtres — le récapitulatif « Données importées du CRM », le devis, la signature — lisent donc
  déjà le bon format. `parseFiche` accepte aussi `0033…`, que son expression régulière laissait passer.
  **La civilité se relit dans la fenêtre de signature**, en tête de la ligne d'identité (M. / Mme) : elle est
  transmise à APICIL et le devis ne la montre plus une fois créé.
  **Le n° d'organisme d'affiliation n'a pas de champ chez APICIL** : il part dans `commentaire`, à
  destination du service de gestion (§5.4.2). Ne pas l'inventer ailleurs.
  **APICIL enveloppe sa vraie phrase dans un JSON d'erreur** : `apicilRaison()` en extrait `errorDescription`
  et l'affiche en entier. Ne jamais tronquer ce message, c'est le seul qui dise ce qui ne va pas.
- **Légende du tableau sans civilité** (demande du Claude du CRM, 06/10/2026, d'après Fabrice : « Pas de titre M. ou Madame, juste
  prénom et nom ») : `.tghdr` = « Prénom NOM · née le … · étude du … » ; la civilité n'accorde plus que « né » / « née »
  (« né(e) » si inconnue). Donc l'image et le courrier (qui relit `.tghdr`). **Le courrier dit « Bonjour Prénom NOM »** (Fabrice, 07/10/2026 : « c'est
  mieux ») : `santeo-mail.php` ; prénom tout en capitales ou tout en minuscules remis en casse de titre ; sans prénom, « Bonjour
  Monsieur DUPONT » ; sans rien, « Madame, Monsieur ». Relais `2026-10-07 … bonjour sans civilite`, déposé et vérifié le 07/10/2026.
  Réponse et rappel au CRM dans `docs/carnet/ECHANGES.md` (07/10/2026). Test : scratchpad `t_civ.js`.
- **Logos dans le tableau de garantie** : `Tableau.logo(...)` place le logo de l'assureur au-dessus de l'étoile,
  en tête de colonne. Fichiers dans `docs/` : `logo_mcci.png`, `logo_avenir.png`, `logo_mverte.png`,
  `logo_apicil.png`, `logo_revoluo.png` — PNG à fond transparent, normalisés à 160 px de haut, affichés en **42 px** (à 34 px un
  logo carré comme celui d'Avenir devenait illisible). Avenir, Mutuelle Verte et APICIL sont tirés des
  documents de `docs/` ; MCCI vient du fichier fourni par Fabrice, ses plaquettes ne publiant le logo qu'en
  blanc sur fond sombre. **Tant qu'un fichier manque, le nom de la compagnie s'affiche à sa place** — aucune
  image cassée. Le logo est reposé à chaque mise en avant d'une formule.
  **Révoluo, RF50 et RF100 portent le logo Révoluo** (fourni par Fabrice le 26/09/2026, **remplacé le 03/10/2026** par
  la version bulle verte + cubes optique / dentaire / santé, fond blanc rendu transparent avec bords doux, 325 × 160) et non celui d'Avenir : la gamme porte `logo:"revoluo"`. `Tableau.logo` et le courrier lisent `g.logo || g.ins`.
  **Logo Santéo** (Fabrice, 03/10/2026 : « notre logo dans les mails et dans les envois des captures au CRM ») :
  `docs/logo_santeo.png` (452 × 160, fond rendu transparent). **Logo bleu clair** (`docs/logo_santeobleu.png`, fourni par Fabrice le 03/10/2026, 494 × 120) **en bas, avec les mentions
  légales** (Fabrice, 03/10/2026 : « pas jolie le logo en haut ») : **dans le tableau**, `Tableau.legal()` après le pied (logo
  34–40 px + `Tableau.LEGAL` : données personnelles, CAPI FINANCE, garantie financière **MATRISK ASSURANCE
  n° MRCSBRO202310FR00000000053466A00**, SAS, ORIAS, ACPR, CNIL, Endya / Médiateur, mentions légales — sans « Ne plus recevoir
  d'e-mail », qui n'a de sens que dans un courrier) ; donc dans la fenêtre, l'image et `docs/tg/`. **Dans le courrier**, en tête
  du bloc gris des mentions légales (40 px de haut, `cid:logo_santeobleu.png`, `data:` dans la copie CRM), plus au-dessus de
  « Votre conseiller ». L'ancienne mention « CGPA n° 36770 — SARL » est remplacée. Relais `… mentions legales`. Un premier
  essai (logo en haut à droite de l'image, puis dans la case de tête des postes) a été retiré le même jour.
  **Base du devis** (Fabrice, 04/10/2026), entre le pied et les mentions, dans la fenêtre, l'image et le courrier :
  « **Devis établi le jj/mm/aaaa** · n assurés · Département 75 (75012) · Régime : Sécurité sociale (salarié | TNS) /
  Alsace-Moselle », une ligne par assuré (« Assuré 2 (conjoint) : né(e) le… / en… / n ans », enfant sans date = « mineur »),
  puis en plus petit et en italique « Devis valable **10 jours** à compter du…, soit jusqu'au… ». `Tableau.baseDevis(b)` /
  `baseDevisLignes` (option `devis` de `Tableau.document`, absente des images `docs/tg/`), `devisBase()` dans la page
  (fiche, sinon haut de page ; enfants = nombre de mineurs), envoyé au relais en `devis` ; le relais contrôle chaque valeur,
  prend **sa** date et place le bloc après « Votre conseiller ». La ligne des mentions ne dit plus « valables 15 jours »
  (« valables 10 jours » sans bloc). Relais `2026-10-04 PJ fusionnees (cotisation + IPID), base du devis` — garder
  « fusion » et « cotisation » dans la version : la page s'y fie.
  **Révoluo n'est pas Avenir Mutuelle** (Fabrice, 27/09/2026) : l'assureur est **REMA** (La Réunion des Mutuelles
  d'Assurances Régionales, SIREN 775 626 377, IPID et conditions générales), gestion déléguée au **CERGAP**.
  REV, RF50 et RF100 portent `ins:"rema"` (pastille violette `--rema`, déclarée dans les trois thèmes) et
  `COMP` = `REMA` — donc `garanties.json`, le périmètre, le sous-titre du tableau et le courrier. `moteur.js`
  écrivait `ins:"avenir"` en dur pour ces lignes : il reprend désormais `F[key].ins`.
  **Dans le courrier, la taille n'est pas une hauteur commune mais un encombrement commun** : les logos n'ont
  pas la même forme — Avenir est presque carré (211 × 160), MCCI un long bandeau (545 × 160). À 34 px de haut
  tous les deux, MCCI faisait 116 px de large contre 45 à Avenir, et écrasait la colonne voisine. Le relais
  lit les dimensions du PNG téléchargé (`getimagesizefromstring`) et égalise la **moyenne géométrique**
  (√(l × h) ≈ 46 px), bornée à 40 px de haut et 92 px de large : Avenir sort en 53 × 40, MCCI en 85 × 25.
  Les attributs `width` et `height` sont posés en plus du style, le CSS seul ne suffisant pas sous Outlook.
- **Après génération** : fenêtre « Faire signer sur Universign » (nom de collecte, signataire à copier, fichiers,
  page Universign intégrée en iframe). Le glisser-déposer d'un fichier vers un autre site est interdit par le navigateur.

## Images sans tarif pour le CRM — `docs/tg/` (27/09/2026)

- Demande du Claude du CRM (via Fabrice) : juste après le « oui » du prospect à « je vous les présente ? », le CRM
  envoie une **image du tableau de garantie sans tarif**. Sans tarif, l'image ne dépend que du besoin : **13 images
  fixes**, `dentaire-1…4`, `optique-1…4`, `hospitalisation-1…4`, `sans-besoin`, à
  `https://fabcoh.github.io/santeo-tarifs/docs/tg/<id>.png`, et leur liste `docs/tg/index.json` (formules retenues,
  valeur du poste, responsable ou non, alerte, **`empreinte`**).
- **Le choix des formules vit dans `src/selections.js`** (fonction pure, sans DOM) ; `tools/images_tg.js` fait les
  images avec `src/tableau.js` + `src/tableau.css` — le même tableau que la page, logos en `data:`, étoile masquée,
  **ligne du besoin mise en avant** (`tr.avant`). Refus de produire si Archivo / IBM Plex Sans ne sont pas chargées.
- **Règles de Fabrice, confirmées le 27/09/2026** : colonne 1 **toujours Cap Évolution Accès** ; puis une compagnie
  par colonne, **jamais deux fois le même logo**, ordre MCCI (FLEXIA) · Mutuelle Verte · Révoluo (REMA) · APICIL
  (Équilibre 1–6, Sérénité étant réservée aux plus de 50 ans) ; pour chacune, **la formule la moins chère qui atteint le
  niveau** (seuils 1 = 100 %, 2 = 131, 3 = 200, 4 = 300 ; optique même échelle en euros, « 100 % BR » ne compte pas),
  **la plus forte au niveau 4** ; une compagnie qui n'atteint pas le niveau est absente ; 5 colonnes au plus. Sans besoin :
  échelle montante en hospitalisation OPTAM depuis Cap Évolution Accès. **GCI 500 (non responsable) reste aux niveaux 4
  dentaire et hospitalisation** (Fabrice, 27/09/2026) : `responsable:false` sur la formule, plus d'alerte ; seule
  alerte restante dans `index.json` : moins de 3 formules.
- **Mise à jour** : l'Action lance `node tools/images_tg.js --verifier` (sans navigateur) ; si l'empreinte a changé,
  elle installe Playwright, refait les images et les commit avec `index.html`. L'empreinte couvre les valeurs affichées,
  les noms, les limites, les logos et le code de rendu. Le CRM compare `empreinte` pour savoir qu'une image a changé.
- En local : `NODE_PATH=<scratchpad>/node_modules CHROMIUM=/opt/pw-browsers/chromium node tools/images_tg.js`.
- **Nom de formule corrigé au passage** : `.replace(/\b(\S+) \1\b/…)` retirait la répétition « M. VERTE GCI GCI 100 »
  mais collait aussi « API SANTÉ Équilibre » en « API SANTÉquilibre » (`\b` ne connaît pas les lettres accentuées) —
  dans le texte WhatsApp, le bas du tableau et le courrier. Remplacé partout par `/(^|\s)(\S+) \2(?=\s|$)/`.

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
  **Depuis Windows** (vérifié le 29/09/2026), dans l'invite de commandes (`cmd`, pas PowerShell) :
  `curl.exe -T "%USERPROFILE%\Downloads\apicil-souscription.php" -u capisaf ftp://ftp.cluster129.hosting.ovh.net/www/apicil-souscription.php`
  — le mot de passe est demandé ensuite, sans écho. WinSCP a échoué (« La connexion a échoué ») : préférer cette ligne.
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
- **Un dépôt refusé dit pourquoi** (26/09/2026) : `crmDepot` remonte le code HTTP et le début de la réponse. 401/403 =
  **jeton `t=` expiré (2 h)** — « Rouvrez le comparateur depuis la conversation WhatsApp » ; sinon « Dépôt impossible
  (HTTP xxx · …) ». Avant, tout échec disait seulement « réessayer ». Un onglet ouvert par ↗ porte le même jeton :
  il expire à la même heure.
  **« Failed to fetch » = CRM injoignable** (02/10/2026, vers 18 h : « Dépôt impossible (Failed to fetch) », mail non
  parti puisque le dépôt passe en premier). Le Claude du CRM confirme que **toutes** les réponses de
  `/api/comparateur/depot` portent les en-têtes CORS, erreurs comprises (400, 401, 404, 413, 500 ; pré-vol OPTIONS 204),
  corps jusqu'à 3 Mo, image 2 Mo décodée, jeton 2 h. Une absence de réponse vient donc d'un serveur indisponible
  (redémarrage, publication, hébergeur). Sur un `TypeError` sans code HTTP, la page affiche « CRM injoignable pour
  l'instant — réessayez dans une minute » et un bouton **↻ Réessayer** qui relance le même dépôt ; le constat de Manus
  sur les journaux de 16 h UTC est attendu dans `docs/carnet/ECHANGES.md` du CRM.
  Le message porte aussi le **poids de l'envoi** (« envoi de 1 465 ko ») et `window.CRMDIAG` le garde : une plateforme qui
  coupe un envoi trop lourd sans CORS donne le même « Failed to fetch » qu'un serveur arrêté. Manus teste ~1,5 Mo.
  **Cause trouvée le 02/10/2026 (16:45 UTC)** — ni la page ni la taille (échec aussi avec une formule) : le site du CRM
  était passé en **accès réservé** sur l'hébergement Manus. La plateforme répond `401 {"error":"Unauthorized"}` (24 octets,
  **sans CORS**) au pré-vol comme au POST, avant le CRM, dont le journal n'a rien reçu. Le navigateur du commercial, sans
  session Manus, est refusé ; le CRM lui-même marche, il a sa connexion. Remède : remettre le site en **accès public**
  (réglage d'hébergement, par Manus avec l'accord de Fabrice). Si « CRM injoignable » revient : vérifier d'abord ce réglage.
- Recherche par e-mail : côté Manus, renvoie `404 Aucune fiche Santéo trouvée` — à corriger chez lui.
- **Mode automatique** (demande du Claude du CRM, 03/10/2026) : `#auto=<JSON base64url>&crm=…&t=…&back=…` — le serveur du CRM
  ouvre la page dans un navigateur sans écran ; la page remplit `PRO` et le haut de page, restreint `sel` aux gammes demandées,
  calcule (attend APICIL), coche `SENDSEL`, pose `RECO`, puis `viaTableau("crm")` — le même code que le bouton. `window.AUTO`
  (`exp`, `fin`) fixe l'expéditeur (antony@ / fcohen@ seulement) et remplace le retour à la conversation par la fin signalée :
  `window.SANTEO_AUTO` (`etat` en-cours → ok | erreur, `mail`, `formules`, `absentes`), `<pre id="santeo-auto">`, titre
  `SANTEO_AUTO OK|ERREUR`. Le mail ne part qu'après un dépôt accepté. APRIL écarté. Format complet : `docs/carnet/ECHANGES.md`.
  Test : `scratchpad/t_auto.js` (CRM et relais simulés par Playwright).
- **Boîte aux lettres entre les deux Claude** (02/10/2026, Fabrice : « vous ne pouvez pas échanger entre vous ? ») : le
  comparateur écrit dans `docs/carnet/ECHANGES.md` **de ce dépôt** (public : jamais de secret) ; le Claude du CRM écrit dans
  `docs/carnet/ECHANGES.md` de `fabcoh/WhatsApp_Solution`, rattaché à cette session **en lecture** (`/home/user/whatsapp_solution`,
  `git fetch origin main` puis `git show origin/main:docs/carnet/ECHANGES.md`). Ne jamais pousser dans le dépôt du CRM : Manus
  publie depuis sa branche principale. Fabrice n'a plus qu'à dire à chacun « lis le carnet ».

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
  **Pièces jointes = tableau de garantie et IPID officiels, rien d'autre** (Fabrice, 03/10/2026) : ni la capture PNG
  (la page l'envoie encore, le relais l'ignore), ni les notices. Le relais télécharge les PDF de `docs/` (libellés
  « Tableau de garantie », « Tableau de garantie + notice » (Révoluo, RF50, RF100 : un seul PDF), « IPID »,
  « Garanties + IPID » ; adresse `fabcoh.github.io/santeo-tarifs/docs/*.pdf` seule), un
  document commun à deux formules joint une fois, nommé « IPID - M. VERTE GCI 150.pdf ». **Tailles vérifiées avant
  l'envoi** : 5 Mo par fichier, **10 Mo en tout** ; au-delà, IPID d'abord puis tableaux du plus léger au plus lourd, le
  reste garde son lien sous la colonne. La réponse porte `piecesJointes`, `piecesJointesMo`, `nonJointes`. Relais
  `2026-10-03 PJ tableau + IPID (Revoluo)`, puis `2026-10-03 blocs`. Exemple réel : Cap Évolution + MV GCI 150 + Rev 4 = 6 fichiers, 7,4 Mo.
  **La cotisation est écrite sur le tableau de garantie joint** (Fabrice, 03/10/2026) : « 23,42€/m », noir gras, juste
  au-dessus du nom de la formule, en tête de sa colonne, sur la 1ʳᵉ page où elle figure. La page le fait avec pdf-lib
  (`pdfAvecTarifs`, `pdfsTarifs`) et envoie les PDF au relais (`pdfs:[{url, pdf}]`, base64) ; le relais ne les accepte que
  pour un tableau officiel d'une formule envoyée (`%PDF`…`%%EOF`, 5 Mo), sinon il télécharge l'original
  (`piecesJointes[].tarif`). Corps de requête porté à 40 Mo ; relais `2026-10-03 PJ avec cotisation`. **Emplacements** :
  `TAMPONS` (fichier → `CLE|fi` → page, centre x, ligne de base y en points PDF, taille), 117 relevés sur image le 03/10/2026
  (scratchpad `tampons/`, aperçus + `h.py`) ; RF50 / RF100 prennent la colonne « Rev N » (la colonne du renfort est commune) —
  Rev N seul et Rev N + renfort envoyés ensemble : un seul prix écrit. **Pas dans l'aperçu 👁** (Fabrice : rien n'y est
  sélectionné). Un tableau de garantie remplacé dans `docs/` → **refaire son emplacement**.
  **Une pièce jointe par formule** (Fabrice, 03/10/2026 : « trop de documents ») : la page met l'IPID **à la suite** du
  tableau de garantie tamponné (`pdfsTarifs`, `pdfs[].ipids`) ; le relais ne joint plus ces IPID à part et nomme le fichier
  « Tableau de garantie + IPID - <formule>.pdf » (6 Mo au plus). La page ne fusionne que si le GET du relais annonce
  « fusion » (relais `2026-10-03 PJ fusionnees (cotisation + IPID)`), et n'envoie de PDF que s'il annonce « cotisation ».
  Exemple : MV GCI 150 + Cap Évolution Équilibre + Rev 4 = 3 fichiers, 7,4 Mo. `attachment[0]`, `attachment[1]`… marchent
  bien chez Mailgun (vérifié par Fabrice) — une fausse piste du 03/10 (`santeo-mail.multipart-non-depose.php`) n'a pas servi.
  **Attention aux variables dans le relais** : la boucle des colonnes écrasait `$nom`, le nom du prospect, et
  le courrier disait « Bonjour Monsieur MCCINOVA ESSENTIELLE ». Les variables de colonne sont préfixées.
- **Signature « Votre conseiller »** (Fabrice, 05/10/2026) : Fabrice Cohen — **01 53 19 86 36** (la ligne du cabinet, plus le
  portable 06 22 19 73 49). `$TEL_CONSEILLER` dans `santeo-mail.php` l'emporte sur `santeo-mail-config.php`, qui porte la clé
  et n'est donc pas à rouvrir. Relais `2026-10-05 … tel conseiller`.
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
  pas à le rappeler pour le lui demander. **Ce n'est plus un `mailto:`** (décision de Fabrice, 25/09/2026 :
  le prospect ne doit pas avoir à ouvrir sa messagerie) mais un lien vers **`interet.php`**, page hébergée
  sur `capisante.fr`, avec un **jeton signé** dans l'adresse — formule (`key`, `fi`, que la page envoie
  désormais dans chaque colonne), tarif, fiche du prospect, conseiller expéditeur, conversation CRM ; 30 jours
  de validité, clé `interet-cle.txt`, fabriquée au premier appel et rangée **hors du dossier
  web** comme `apicil-cle.txt` (`curl -u capisaf ftp://ftp.cluster129.hosting.ovh.net/interet-cle.txt`
  pour la lire, la supprimer pour la révoquer — tous les liens déjà envoyés cessent alors de fonctionner).
  Aucune base de données : le lien se suffit à lui-même.
  **Jeton v2, chiffré (AES-256-GCM), depuis le 25/09/2026** — `t=2.<iv|tag|chiffré>` en base64url ; la clé de
  chiffrement est `sha256("aes|" + interet-cle.txt)`, un seul secret sur le serveur. Décodé en base64, un lien
  v2 ne révèle **rien** (vérifié : ni nom, ni e-mail, ni téléphone, ni formule). Le v1 (signé HMAC, lisible en
  base64) est encore accepté jusqu'à son expiration de 30 jours — ceux du 25/09 au matin — puis plus jamais.
  Il porte désormais **toute la fiche** : civilité, nom, prénom, e-mail, téléphone, date de naissance, régime,
  adresse / CP / ville, conjoint, enfants — la page envoie `fiche` au relais (`PRO.ddn`, `PRO.adresse`,
  `PRO.cp5`, `PRO.ville`, `PRO.conjoint.ddn`, `PRO.enfants[].ddn`, le régime du haut de page).
  **Récapitulatif en tête de page** : 3 ou 4 lignes (identité · naissance · régime, téléphone · e-mail, adresse,
  assurés en années), puis « Corriger mes informations » qui déplie les champs. « INCONNU » n'est jamais
  affiché : le nom vaut vide, le libellé devient « Votre nom » en orange et le bloc s'ouvre d'office — de même
  dès qu'il manque le nom, la date de naissance, le téléphone ou l'e-mail. **Contrôles serveur** : date de
  naissance réelle et 16–110 ans, téléphone français (`telFR`), e-mail, CP à 5 chiffres, enfants de moins de
  35 ans ; message sous le champ, saisie conservée. **Un champ vide ne bloque pas** (alertes ≠ blocage) — seule
  une valeur fausse bloque, et il faut **au moins un téléphone ou un e-mail**. Le mail « Intérêt confirmé »
  reprend toute la fiche confirmée, la liste **NON FOURNI PAR LE PROSPECT**, et **CORRECTIONS DU PROSPECT**,
  champ par champ, `ancienne → nouvelle`. **Rien n'est écrit dans le CRM** : le conseiller reporte.
  **Le tarif suit les corrections** (Fabrice, 25/09/2026) : quand le prospect change sa date de naissance, son
  régime, son code postal, son conjoint ou ses enfants, la page recalcule la cotisation **avec `src/moteur.js`
  chargé depuis GitHub Pages** — le même code que le comparateur, jamais une copie (vérifié : 461,77 € sur la
  page = 461,77 € par le moteur sous Node, même profil). Une fenêtre annonce « Vous avez modifié votre date de
  naissance — votre nouvelle cotisation mensuelle : X € au lieu de Y € ». Pas de fenêtre si le prix ne change
  pas ; « formule non proposée » si le profil la rend inéligible. API SANTÉ passe par `apicil.php`, qui
  accepte désormais `https://capisante.fr` dans `$ORIGINES_EN_PLUS`. Le prix recalculé part dans le mail
  sous **TARIF RECALCULÉ PAR LA PAGE (à vérifier)** — calculé dans le navigateur, il n'est pas une preuve.
  Le jeton porte `nk`, le **nombre de mineurs du haut de page** : il a fait le tarif même quand leurs dates
  ne sont pas connues ; le recalcul les ajoute aux enfants datés. Un conjoint connu par sa seule **année**
  s'affiche au 1ᵉʳ janvier dans le champ et n'est pas compté comme correction s'il n'est pas touché.
  **`interet.php`, deux étapes** : (1) « Nous avons bien pris en compte votre intérêt pour la formule… »,
  l'essentiel des garanties lu dans `garanties.json` (hospitalisation et honoraires OPTAM, chambre, dentaire
  prothèses, implantologie, orthodontie, optique, lentilles, audio, médecine douce — **il n'existe pas de
  poste « soins dentaires » dans les données**), les documents, puis « Je souhaite adhérer au : » pré-rempli
  **au lendemain**, en bleu gras, modifiable, jamais antérieur au lendemain (contrôle serveur) → VALIDER
  envoie au conseiller le **mail « Intérêt confirmé »** ; (2) « Afin de valider votre demande » : pièce
  d'identité, attestation de Sécurité sociale, RIB (photo ou PDF) → ENVOYER envoie le **mail « Pièces
  reçues »** avec les fichiers en pièces jointes. **Les pièces ne sont jamais conservées sur le serveur** :
  transmises à Mailgun puis effacées. Les photos sont réduites dans le navigateur (1600 px, JPEG) avant
  l'envoi — l'hébergement OVH plafonne un fichier (`upload_max_filesize`, lisible sur `interet.php` sans
  paramètre). En bas des deux pages, deux lignes simples : « Vous avez une question avant de souscrire ? »
  suivi de l'**icône WhatsApp officielle et du 01 53 19 86 36**, qui ouvre WhatsApp, puis « Besoin d'un
  renseignement ? **01 53 19 86 36** » en noir, qui lance l'appel. **Un seul numéro, la ligne du CRM**, pour les
  deux (Fabrice, 25/09/2026 — le 86 46 cité la veille et le 86 34 vu dans l'en-tête du CRM ne sont pas les bons).
  Les deux mails vont au **conseiller expéditeur du courrier**, copie `fcohen@` ; `Reply-To` = le prospect ;
  même compte Mailgun, même `santeo-mail-config.php` — **aucune clé nouvelle**. 20 envois/heure/IP.
  **Le corps reprend la forme des demandes de prospect du CRM** : « Nouvelle demande de prospect
  suite à email », puis `Destinataire`, `Conversation`, `Option`, `Tarif`, la date d'adhésion souhaitée, et
  la fiche du prospect — civilité, nom, prénom, e-mail, téléphone. Le conseiller sait ainsi **qui** appeler,
  **pour quelle formule**, **à quel tarif**, et retourne à la conversation d'un clic.
  **Test en local** : `interet-apercu.php` définit `APERCU` (les mails vont dans un fichier JSON au lieu de
  Mailgun), `jeton.php` fabrique un lien signé avec la clé du scratchpad ; `garanties.json` doit être copié
  dans `/tmp/santeo_garanties.json`, `fabcoh.github.io` étant bloqué depuis une session.
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
- **Le cartouche du tableau est dans la cellule de gauche de l'en-tête, à hauteur des logos** — titre 14 px
  gras, ligne prospect 11 px — et non au-dessus : trois étages (cartouche, logos, tarifs) faisaient un haut
  de courrier trop chargé (Fabrice, 25/09/2026). **Le tarif ferme le tableau** : ligne « TARIF MENSUEL », un
  cartouche gris clair par formule, chiffre en 14 px teal, puis les documents, puis les boutons — la
  disposition du comparateur historique, dans nos couleurs. Le bouton est en **9 px**, chaque ligne en
  `white-space:nowrap` : deux lignes toujours, jamais trois, même à cinq colonnes sous Apple Mail.
  **Pas de ligne « Indemnités journalières hospitalisation »** dans le courrier : `mailTableau` ne l'ajoute
  plus et le relais l'écarte par son libellé — hors sujet pour comparer des complémentaires ; la page et le
  texte WhatsApp (`offreTxt`), eux, la gardent. **Piège** : `offreTxt` et `mailTableau` ouvrent la même
  boucle `for(const [lab,src] of [["Indemnités…","ij"]].concat(TGROWS))` ; un remplacement « première
  occurrence » tombe sur `offreTxt`, qui vient avant. C'est arrivé le 25/09, corrigé le jour même. **Plus de ligne « Toute l'équipe Santéo »** sous le conseiller.
  Le **sous-titre de source** (« AVENIR M. · MCCI · synthèse d'après le tableau de garantie officiel… »)
  n'est plus affiché : la même mention figure déjà au pied, formule par formule. Le relais accepte toujours
  `soustitre`, il ne l'imprime plus.
- **La phrase d'accroche ne date ni ne source l'offre** : « Je fais suite à votre demande de devis, voici mes
  propositions. » Le site de provenance a été retiré — décision de Fabrice, 23/09/2026 ; `$prov` reste
  calculé dans le relais, prêt à resservir. **La date, elle, est sous le tableau**, en 10 px centré :
  « Tarifs au 23 septembre 2026, valables 15 jours. » Sans elle, rien ne bornerait l'offre dans le temps —
  un prospect revenant trois mois plus tard avec ce courrier n'aurait vu nulle part que les tarifs changent.
- **Les documents de chaque formule sont sous sa colonne** — sur **deux lignes** (Fabrice, 26/09/2026) :
  « **GARANTIES** » en gras, puis « IPID - NOTICE » (jamais les conditions générales ni la demande d'adhésion APRIL : filtrées par la page, Fabrice 05/10/2026), en **13 px** (Fabrice, 03/10/2026 : 10 px trop petit ; relais `… liens 13px`), cliquables, juste au-dessus de son bouton. Le pied ne garde que le **nom de la
  formule et ses limites**, trop longues pour une colonne : les répéter aux deux endroits ne faisait que du
  bruit. **Ce qui manque n'est pas un défaut du courrier mais du dossier** : `DOCS` ne publie qu'un tableau
  de garantie pour MCCINOVA, FLEXIA et SOLENCIA, et un seul « Garanties + IPID » pour LPS HOSPI — leurs IPID
  et notices n'existent pas encore. CAP NR, CAP ÉVOLUTION, TALIS et API SANTÉ affichent bien les trois. **CAP ÉVOLUTION pointait vers Google
  Drive**, que le relais écarte (il n'accepte que nos hôtes) : le courrier partait sans ses liens. Ses PDF sont
  désormais dans `docs/` (26/09/2026) — `capevo_tg_2026.pdf` (12 p.), `capevo_ipid_2026.pdf` (2 p., millésime
  2024, commun salariés / TNS) et `capevo_notice_2026.pdf`, qui est le **kit complet** (67 p.), la « notice » selon Fabrice. Ne jamais
  ouvrir le filtre à `drive.google.com`, qui héberge les fichiers de n'importe qui.
  **Ces documents sont ceux des salariés.** Chez Avenir, **Cap Evolution TNS est un autre produit** (autre
  caisse, autre kit — Fabrice, 26/09/2026 ; le bulletin propose ☐ Cap Evolution / ☐ Cap Evolution TNS).
  `DOCS.CAPEVO_TNS` porte ses documents (reçus le 26/09/2026) : `capevo_tns_tg_2026.pdf` (13 p., « ACCÈS TNS…
  SÉRÉNITÉ TNS », 04/2024) et `capevo_tns_notice_2026.pdf` (kit TNS, 81 p., notice « EVO PRO et CAP TNS ») ; l'IPID
  est **commun**, millésime 2024 (`capevo_ipid_2026.pdf`, qui remplace l'IPID 2023 encore chargé des niveaux ZEN).
  **Garanties TNS = garanties salariés**, chiffre pour chiffre (comparaison ligne à ligne des deux tableaux) :
  seuls changent des libellés (MonPsy, Médecin direct, actes de prévention). Le **bulletin d'adhésion** est le même
  (pages 1–3), mais **le dossier TNS a son propre PDF** : `bulletin_avenir_tns_2026.pdf` (87 p., 123 champs, reçu
  le 26/09/2026 — bulletin + documentation TNS), chargé par `fillAdh` quand le régime commence par `TNS` ; la
  page y coche `EVO TNS` au lieu de `EVO SAL`. Les 60 champs que la page remplit existent tous, de même type
  et mêmes options (vérifié) ; il ajoute des champs non utilisés (IJ hospi, perenity, `NUM ADHERENT`…) et porte
  `JOUR EFFET ADHESION` en **deux champs de premier niveau** du même nom : pypdf n'en lit qu'un, mais les deux
  widgets sont bien remplis (PyMuPDF). Le kit TNS seul (81 p.) n'a aucun champ de formulaire. Une entrée `CLE_TNS` vide n'afficherait rien plutôt que les documents salariés. `Tableau.documents(G, key, fi, reg)` et `Tableau.pied(…, reg)` prennent le régime
  (`regimeActuel()` dans la page, `TNS` ou `TNSRL`) ; `interet.php` fait de même avec le régime du jeton.
- **Ni bandeau ni pied par formule** (décision de Fabrice, 25/09/2026) : le courrier commence par « Bonjour »,
  sans le cartouche SANTÉO / ORIAS en tête, et les limites par formule n'y figurent plus — trop longues, elles
  faisaient cinq paragraphes identiques sous un tableau Mutuelle Verte. Elles restent dans la page et dans le
  texte WhatsApp. À la place, **les mentions de Fabrice suivent la date**, dans le même 10 px gris, en un
  seul paragraphe : forfaits par an et par assuré, pourcentages sur la base de remboursement Sécu comprise,
  tableau sans valeur contractuelle, taxes d'État, OPTAM / OPTAM-CO, optique sur 2 ans, offres non
  exhaustives, jamais plus que la dépense réelle, calcul sur les renseignements fournis. Deux mots adaptés au
  courrier : les conditions sont « accessibles par les liens sous chaque formule » (elles ne sont pas jointes
  en PDF) et les renseignements sont « ci-dessus » (le cartouche), pas « ci-dessous ».
  **Régression corrigée le 25/09** : la réécriture du corps de « Cette offre m'intéresse » avait emporté le
  bloc `$tdoc` — la ligne des documents sous les colonnes — parce qu'il était logé entre `$lienInteret` et
  le commentaire « La derniere ligne du tableau ». PHP se tait sur une variable absente : le courrier partait
  sans ses liens, sans erreur. Quand on remplace un bloc par ses bornes, relire ce qu'il y a entre.
- Quota **30 envois/heure/IP**, message limité à 4 Mo, image à 2,5 Mo.
- **Appelant serveur (CRM WhatsApp), accord de Fabrice du 02/10/2026** : « oui, il envoie seul les mails ». Le serveur du CRM
  envoie le comparatif sans qu'un conseiller l'ouvre. Il présente `X-Cle-Serveur`, **la clé d'`apicil.php`** (`apicil-cle.txt`,
  hors du dossier web ; `santeo-mail.php` la lit, ne la fabrique jamais) ; quota propre **200 envois/heure**. Le GET annonce
  `"version":"2026-10-02 appelant serveur"` (puis `2026-10-03 logo Santeo`) et `appelant`. L'anti-doublon et le choix des formules sont alors au CRM.
  **Mode « message interne »** (demande du Claude du CRM, accord de Fabrice du 08/10/2026) : quand un client déjà en gestion
  écrit sur WhatsApp, le serveur du CRM fait suivre ses messages (regroupés par heure, anti-doublon chez lui). `{"type":"interne",
  destinataire?, objet (200), texte (50 000)}` ; **expéditeur fixé « WhatsApp CRM <noreply@santeo.net> », sans Reply-To** (Fabrice,
  08/10/2026 : « pas Antony »), le champ `expediteur` est ignoré ; **clé serveur obligatoire** ; destinataires dans
  une **liste fermée** — `gestion@` (par défaut), `fcohen@`, `antony@` (ajoutés par Fabrice le même jour) — chaîne ou liste ;
  texte simple seul (ni HTML, ni pièce jointe), suivi Mailgun coupé, étiquette `interne-crm`, copie cachée `fcohen@` sauf s'il
  est destinataire ; réponse `{ok, id}` / `{ok:false, erreur}`. Version `2026-10-08 … message interne (gestion, fcohen, antony), expediteur WhatsApp CRM`,
  champ `interne` du GET (déposé et vérifié le 08/10/2026). **Fiche du client en tête** (Fabrice, 08/10/2026 : « nom prénom tel
  mail, adresse de la conversation, conversation ») : `client{nom,prenom,telephone,email}`, `lienConversation`, `lienFiche`
  (https, hôte du CRM ou nos hôtes, sinon retirés) ; le relais compose une version HTML échappée (tableau, boutons « Ouvrir la
  conversation / la fiche », conversation en `pre-wrap`). **Renvoi provisoire `gestion@` → `fcohen@`** (`$INTERNE_RENVOI` ;
  le vider pour basculer, le CRM n'a rien à changer). **Objet composé par le relais** (Fabrice, 08/10/2026 : « client ou prospect
  et sa demande principale » ; « c'est au CRM d'indiquer, toi tu ne fais que l'envoi ») : `statut` (client | prospect) +
  `demandePrincipale` → « Client — Claire DUPONT — Changement de formule » ; `objet` en repli. Version `… fiche client, renvoi
  gestion vers fcohen, objet statut + demande`, **déposé et vérifié le 08/10/2026** ; envoi réel reçu par Fabrice à 07:27. Contrat dans `docs/carnet/ECHANGES.md`. Test : scratchpad `tinterne/` (faux Mailgun sous `php -S`).
  **Expéditeur imposé en automatique** (Fabrice, 02/10/2026) : `antony@` pour les fiches d'Antony, `fcohen@` pour les siennes ;
  avec la clé serveur, le relais refuse tout autre expéditeur. Clé copiée par Fabrice dans les secrets Manus (`APICIL_CLE_SERVEUR`).

## Fenêtres (popups)

- **Une fenêtre qui porte une saisie ne se ferme que par son bouton** : `overlay(html, largeur, collante)`
  avec `collante = true` pour la signature APICIL, et la fenêtre de devis n'écoute plus le clic sur le fond.
  Un clic à côté effaçait un formulaire à demi rempli — adresse, IBAN, BIC, n° de Sécu — sans prévenir.
  Les fenêtres de lecture (Infos, documents, options) gardent la fermeture au clic sur le fond : rien à perdre.
- **Le rechargement automatique ne passe jamais par-dessus une fenêtre ouverte.** La page se recharge quand
  on revient dessus après **6 heures** (`FRESH`), pour ne pas servir une version périmée. Le garde-fou
  `fenetreOuverte()` (`#tgov`, `#dvov`, `#impov`) suspend ce rechargement : le commercial qui va consulter
  MyVERALTI ou sa messagerie retrouve sa souscription telle qu'il l'a laissée.

- **Version publiée** (Fabrice, 05/10/2026 : « j'ai toujours le grand format » — capture faite avec une page d'avant la
  publication). `build.py` écrit `dist/version.json` (`{"build": …}`), l'Action le recopie à la racine et le commit avec
  `index.html`. La page compare son `data-build` (`#buildstamp`) à `version.json?t=…` (`cache:"no-store"`) **à chaque retour
  sur l'onglet et à chaque nouvelle fiche** (`hashchange` : l'onglet `santeo_tarif` que le CRM réutilise ne fait que changer
  l'adresse après le #, rien ne le rechargeait) ; plus récente → rechargement (la fiche suit par le #), jamais par-dessus
  une fenêtre ouverte, une lecture par minute au plus. `window.verifierVersion`. Test : scratchpad `t_version.js`.

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
- **APRIL : accès API ouvert le 01/10/2026** (Damien VALCARCEL, april.com) — documentation et environnement de test
  **PréProduction (PPR)** sur l'API Store `https://ppr-api.april.fr/` ; la production s'ouvre sur demande, une fois les
  développements finis en PPR. Identifiants `clientId` / `clientSecret` (couple propre à CAPI FINANCE) : **jamais dans ce
  dépôt ni dans la page** — dans un `april-config.php` hors dépôt sur capisante.fr, comme APICIL ; même architecture
  (relais PHP, IP française, page qui n'appelle que le relais). Le secret PPR a transité par une conversation Claude le
  02/10/2026 : Fabrice ne juge pas utile de le renouveler (05/10/2026) ; ne jamais coller celui de production ici.
  `ppr-api.april.fr` est **bloqué depuis une session Claude** (proxy) : la documentation doit être fournie par Fabrice.
  Application `45254-5594-capi-finance` (créée le 01/10/2026), **trois API souscrites** : *Individual Healthcare and
  Borrower Portfolio* (« courante », REST, domaine Santé Prévoyance Apporteurs — à confirmer : sans doute la santé des
  particuliers), *healthProtection* 0.0.182 (`https://ppr-api-gateway.april.fr/healthprotection/v1/`, production
  `https://api-gateway.april.fr/healthprotection/v1/`) et *Borrower* 1.0 (emprunteur, hors sujet).
  **healthProtection, lu le 02/10/2026** (PDF de la page de documentation, 88 p.) : authentification **OAuth2** (jeton
  Bearer dans `Authorization`) + en-tête `x-projectUuid` (identifiant de traçabilité, un par projet) ; référentiels
  `GET /products`, `/products/{code}/guarantees`, `/commissions`, `/professionalCategories`, `/socialSecurityProviders`… ;
  tarif `POST /projects/prices?pricingType=Simple` (ou `AllOptions` : tous les niveaux d'un coup) avec un projet
  `{$type, properties:{addresses, email, effectiveDate}, persons:[{$id:"i-1", title, birthDate:"aaaa-mm-jj",
  mandatoryScheme, professionalCategory, familyStatus…}], products:[{$id:"p-1", productCode, insured:[{$id:"a-1",
  role, person:{$ref:"i-1"}}], commission, effectiveDate, coverages:[{guaranteeCode, levelCode…}]}]}` ; réponse :
  `priceType`, `insured`, `product.productCode`, `guaranteeCode`, `levelCode`, `contribution.contributionAmount`. Devis
  (`requestType=Quotation`), mise en relation (`ContactRequest`), adhésion papier / en ligne / télésélection. Elle vise
  d'abord la **prévoyance professionnelle** (`$type` « Prev… ») : un seul produit santé par projet. **Manquent** :
  les codes produits santé et niveaux (lisibles seulement par `GET /products` depuis le serveur), le Swagger.
  **Jeton OAuth2** (page d'accueil de l'API Store, 02/10/2026) : `POST https://ppr-am-gateway.april.fr/apistore/oauth/token
  ?grant_type=client_credentials&client_id=…&client_secret=…` → `access_token` (bearer, **7 199 s**), à passer en
  `Authorization: Bearer …`. Le relais devra le garder en cache (fichier hors du dossier web) jusqu'à expiration.
  **Vérification** : `april-config.php` (gabarit, secret à coller par Fabrice, `cle_verif`) + `april-verif.php` (lecture
  seule : IP sortante, jeton, `GET /products`, garanties et commissions de chaque produit, régimes ; essaie
  `…/v1/products` puis `…/v1/healthProtection/products`). Sources dans le scratchpad `ovh/april/`. À supprimer après relevé.
  **Premier accès réussi le 02/10/2026** (après correction du secret : 44 caractères collés au lieu de 43) : jeton obtenu
  par l'adresse (méthode du tutoriel), routes **sans** préfixe `/healthProtection` (`…/healthprotection/v1/products`),
  `GET /socialSecurityProviders` en **404**. **29 produits**, dont en santé : `OnlySante`, `SanteVita`, `FlexiSante`,
  `SanteMix` (Santé Mix Proximité), `SanteTranquil`, `SanteGan`, `SanteOptimale`, `SimplySante`, `SanteProtect`
  (Malakoff Humanis), `SantePeps`, `SanteCapSerenite`, `SanteZen`, `SantePrimo`, `SanteGlobale`, `SanteBrio`, `SanteMoove`,
  `SanteGenerali`, `SanteApril`, `HospiPlus` ; TNS : `SantePro`, `SanteProStart`, `SanteProPrivilege`, `SanteSolution`,
  `SantePremium` ; hors santé : `Obseques`, `FGP`, `PrevPremium`, `Tempo`, `Accident`. Garanties : le plus souvent
  `MaladieChirurgie` (+ renforts), FlexiSante en modules (`GarantieDentaireOptiqueAuditives`, `GarantieHospitalisation`,
  `Renfort…`, versions `Eco`). **Commissions** par produit : `1515`, `3010`, `3010S`, `1515S`, `1510`, `1616`…`2020`,
  `HORCOM` (00/00), `1010` — **le taux choisi change le tarif** : choix commercial de Fabrice, à fixer avant tout tarif.
  **Sélecteur des produits APRIL** (Fabrice, 02/10/2026) : APRIL est **une compagnie du périmètre comme les autres**
  (`sel.APRIL`, `COMP.APRIL` ; case = pour cette fois, nom = par défaut), dernière de la grille, avec à côté de son nom
  le bouton **☰ n / 24** qui déplie la liste (`APRIL_PRODUITS`, Particuliers : 14, TNS : 5, **Autres produits APRIL : 5** —
  GAN Senior, Protect, Cap Sérénité, Generali, Santé APRIL, ajoutés le 03/10/2026, `APRIL_A_BRANCHER` : jamais envoyés au
  relais tant que leurs garanties API ne sont pas relevées, annoncés « tarif pas encore branché »), cases à cocher, retenues sur
  l'appareil (`santeo_april`, `window.APRIL_SEL`) ; par défaut Santé Mix Proximité et Simply Santé. **Les tarifs APRIL ne
  sont pas encore branchés** : la sélection dira au futur relais quels produits interroger (quota APRIL).
  **Commission (Fabrice, 02/10/2026)** : tarifer d'abord à la **commission la plus forte**, avec un bouton **Remise** sur la
  proposition qui retarife à **15/15** pour baisser le prix. L'API n'a pas de champ « remise » : le seul levier est le code
  `commission` du produit (presque tous offrent `3010` et `1515` ; Santé Optimale aussi `1616`…`2020`).
  **Tarification APRIL, relevé par appels réels le 02/10/2026** (console `april-console.php`, outil temporaire, clé =
  `cle_verif`, lecture + tarification seulement, 300 appels/heure) : `$type` **`Sante`** (`PrevPro` pour la prévoyance) ;
  `products[].insured` est **un objet** `{$id:"a-1", role:"AssurePrincipal", person:{$ref:"i-1"}}` — une liste fait
  échouer la lecture (« Failed to read HTTP message ») ; chaque garantie pointe vers son assuré :
  `coverages:[{insured:{$ref:"a-1"}, guaranteeCode, levelCode:"01"}]` ; **niveaux `01`, `02`…** (« 1 », « N1 »,
  « Niveau1 » refusés). `pricingType=AllOptions` renvoie tous les niveaux (`grouping` 01…0n, `priceType` TarifDetaille,
  `contribution.contributionAmount` mensuel). Régimes `mandatorySchemes` : `SS`, `TNS`, `Agricole`, `AlsaceMoselle`.
  Simply Santé exige 50 ans dans l'année d'effet, Only Santé 55 ans. SanteMix rend `GarantieHospitalisation`
  obligatoire avec `GarantieFraisDeSante`, FlexiSante `GarantieDentaireOptiqueAuditives` avec l'hospitalisation.
  **Non disponibles pour CAPI FINANCE** : SanteBrio, SantePrimo, SanteGlobale, SanteMoove, SanteSolution, SantePremium.
  **Constat : sur Simply Santé, 15/15 donne le même prix que 30/10** (89,35 → 180,24 €, 60 ans, Paris) : la commission
  y change la rémunération, pas le prix. La préproduction répond par intermittence (délais de 60 s).
  **Page** : bloc `#aprilbox` sous le tableau (`aprilProfil`, `aprilCharge`, `aprilRendu`), produits × niveaux, bouton
  **Remise** (`aprilRemise` → `remise:true`, le relais passe en 15/15). Interrogé **seulement si la case APRIL est
  cochée** et le code postal à 5 chiffres. Pas encore parmi les formules : les garanties APRIL ne sont pas saisies.
  Relais `april.php` (scratchpad `ovh/april/`), à déposer dans `www/`.
  **Suite des relevés (02/10/2026, après-midi)** : une personne suffit avec `{$id, birthDate, mandatoryScheme}` ;
  **postCode en chaîne** (« 75011 » — Hospi + refuse le nombre, les autres acceptent les deux). Produits **modulables**
  (Santé Mix : hospitalisation | frais de santé ; Flexi Santé : hospitalisation | dentaire-optique-audio) : `grouping`
  « 03|02 », 24 combinaisons ; la page n'en montre que la **diagonale** (`aprilNiveaux`, « Niv. 3 » = 03|03).
  Niveaux à 45 ans, Paris (30/10) : Mix 59,79 → 172,95 ; Zen 64,38 → 191,39 ; Optimale 65,01 → 156,44 (7 niv.) ;
  Peps 64,22 → 148,85 ; Tranquillité 70,15 → 231,06 ; Vita 74,29 → 162,78 ; Santé Pro (TNS, `Artisan`) 60,65 → 247,92.
  **La commission ne change le prix que sur certains produits** : Santé Optimale 63,06 (15/15) < 65,01 (30/10) < 68,26
  (20/20) ; Simply Santé, Santé Mix, Santé Zen : identiques. **Hospi + ne se vend pas seul** (retiré du relais).
  **Familles** : `products[].insured` reste l'objet de l'assuré principal, les garanties des autres pointent vers
  `a-2`, `a-3`… Simply Santé et Santé Mix tarifent ainsi (couple 60/58 ans : 174,20 € ; enfant à 0 € sur Simply Santé,
  suspect) ; **Santé Zen répond « Relation must be set for a second insured on a health project »** — le lien de
  parenté a un format non documenté (essayé sur la personne, l'assuré, la garantie, le projet : `relation`,
  `relationship`, `familyLink`, `relations[]`…). **À demander à APRIL : le Swagger de healthProtection et un exemple de
  tarif famille.** La page signale tout tarif famille « à confirmer ». Produits fermés et Hospi + barrés dans la liste
  (`APRIL_FERMES`), jamais envoyés au relais.
  **Test de bout en bout en local** (scratchpad `relais/`) : `april.php` servi par `php -S` (avec
  `-d curl.cainfo=/root/.ccr/ca-bundle.crt`), jeton factice sur un 2ᵉ port, et `px/p.php` qui relaie vers la console
  en retirant ses deux lignes d'en-tête ; Playwright détourne `capisante.fr/april.php` vers lui.
  **Relais déposé et vérifié le 02/10/2026** (`https://capisante.fr/april.php`, GET = état). Retours de Fabrice le même
  jour : sur téléphone le tableau des niveaux débordait (seul « Niv. 1 » visible) → **pastilles par produit**
  (`.apl`, `.apniv`), qui passent à la ligne. **Deux chiffres suffisent** : `aprilCP()` prend le code postal du
  chef-lieu (`dept+"000"`, sauf 13001, 69001, 75001, 2A 20000, 2B 20200, DOM `97x00`) — « 75000 » n'existe pas et Santé
  Zen le refuse —, mention « Code postal pris au chef-lieu… ». Avec APRIL seule cochée, le tableau dit « Aucune formule
  dans le périmètre choisi… » au lieu de « Renseigne une année de naissance ».
  **Lignes APRIL dans le tableau des formules** (Fabrice, 02/10/2026 : « il faut placer les prix dans les tableaux ») :
  `moteur.js` reçoit `april:{etat, famille, produits:[{code, nom, niveaux:[{niv, prix}]}]}` (`aprilPourMoteur()`, la
  diagonale calculée par la page) et fait une ligne par produit et par niveau — `key:"APRIL"`, `fi = n° produit × 100 +
  niveau`, `gamme:"APRIL Santé Mix Proximité"`, `formule:"Niv. 3"`, triée par prix avec les autres. **Garanties non saisies :
  « n.c. » partout** (jamais « — », qui dirait « pas couvert »), pastille « Garanties APRIL à saisir ». Tant qu'elles ne
  le sont pas : **case d'envoi désactivée** (`.sendko`, hors « tout cocher »), ni étoile ni bouton « Tableau de garantie » —
  rien ne part au prospect ; un filtre de garantie compte les lignes APRIL **à part** (incomparables), le budget s'applique.
  `F.APRIL` est posé **à l'exécution** (hors du `F` publié : `garanties.json` et l'empreinte des images ne bougent pas).
  Le bloc `#aprilbox` ne garde que **Remise**, le nombre de produits tarifés, les refus et les mentions (CP, famille).
  **Garanties APRIL lues dans l'API** (Fabrice : « tu ne l'as pas dans l'API ? », 02/10/2026) : `POST /projects/warrantysSummary`
  (même projet que le tarif, un `levelCode` par appel) rend `resumeDeGaranties.postes[].categories[].listePrestations[]`
  `{identifiantPrestation, intitule, valeur}` + `renvois` (`responsable` / `nonresponsable`, optique, aides auditives…).
  **Valeurs sans unité** : déduites — % Sécu comprise pour `HOSPIT_CONV%%SEJOUR%%HONORAIRES_(NON_)DPTAM`,
  `SOINS_COURANTS%%HONORAIRES_(NON_)DPTAM_CONSULTATION`, `DENTAIRE%%PROTHESE_MODEREE_LIBRE`, `DENTAIRE%%ORTHODONTHIE_SS` ;
  € pour `CHAMBRE_PART` (/j), `OPTIQUE%%CLASSE_B_CAT_1` (2 verres simples, « forfait incluant la Sécu »),
  `CONFORT_MED_NAT%%MED_NAT`, `DENTAIRE%%AUTRES_FRAIS` (non remboursés : implantologie et ortho non remboursée) ;
  `OPTIQUE%%LENTILLES` et `AUDIO%%2021%%CLASSE_2` valent 100 à tous les niveaux → « 100 % BR ». `DENTAIRE%%REMBOURSEMENT`
  = plafond dentaire annuel. Relevé pour **10 produits** (Zen 6 niv., Optimale 7, Peps 5, Tranquillité 6, Vita 6, Simply 5,
  Only 6 — **non responsable** —, Santé Pro 6, Pro Start 5, Pro Privilège 3) et rangé dans la page (`APRIL_GAR`, relevés
  du scratchpad `april/wsall_*.json`). **Santé Mix et Flexi Santé** (modulables) : le niveau du résumé s'écrit **« 03|03 »**
  dans chaque garantie (« 03 » seul → « slug APRIL_ASP_MIXV5-lvl-03 not found ») ; relevés sur la diagonale 01|01…06|06
  (trouvé à la demande de Fabrice, « cherche encore pour mixte »). Flexi Santé ne porte **aucun renvoi** responsable /
  non responsable : **non responsable**. Règle de Fabrice (02/10/2026) : **non responsable par
  défaut**, comme CAP NR — « Responsable » seulement quand le résumé d'APRIL porte le renvoi `responsable`, même si les
  garanties en ont l'allure (Flexi : OPTAM distinct du non-OPTAM, paniers 100 % Santé aux frais réels). Un premier
  classement « responsable » de Flexi, déduit des garanties, a été retiré le même jour. Les 12 produits ouverts ont désormais leurs garanties.
  `F.APRIL` / `EX.APRIL` sont remplis à l'exécution (`APRIL_RANG` : rang fixe du produit dans `APRIL_PRODUITS`, fi = rang
  × 100 + niveau) ; pastille Responsable / Non responsable ; les filtres de garantie s'appliquent aux lignes APRIL
  connues. **L'envoi au prospect reste fermé** pour APRIL (ni `garanties.json`, ni documents, ni logo, ni `interet.php`).
  **Documents APRIL** (Fabrice, 02/10/2026 : « tu peux ajouter les documents directement ? ») : rien dans l'API hors devis
  (qui crée un projet et envoie un e-mail). Les PDF **publics** d'april.fr / pro.april.fr (`assets.april.fr/prismic/
  documents/...`, lus par la console `url=`) sont rangés dans `docs/` : `april_<code en minuscules>_tg_2026.pdf` (la
  « notice garanties » d'APRIL : tableau + notice en un seul PDF) et `april_<code>_ipid_2026.pdf` (« document
  d'information produit »), pour **7 produits** : Zen (12 p.), Only (3), Peps (11), Vita (11), Tranquillité (12),
  Santé Pro TNS (9, millésime 2026), Pro Start (9, IPID du socle). **Aucun document public** pour Santé Mix, Flexi,
  Optimale, Simply et Pro Privilège (vendus par courtiers seulement : April-On). `DOCS.APRIL` posé à l'exécution,
  indexé sur fi (« Tableau de garantie + notice », « IPID »). **Pas de bulletin d'adhésion public** : chez APRIL
  l'adhésion passe par l'API (`SubscriptionPaper` produit un bulletin rempli, `SubscriptionOnline` la signature en
  ligne) ou par April-On — à construire, pas un PDF à remplir.
  **Contrôle des garanties de l'API contre les PDF** : honoraires, prothèses, plafond dentaire, orthodontie de Santé Zen
  identiques ; **optique niveau 1 « 100 » = 100 % BR** (Zen, Peps, Vita, Tranquillité), corrigé pour tous les produits ;
  **lentilles fausses dans l'API** (« 100 » partout, alors que Zen donne 35 → 200 € acceptées et 50 → 250 € refusées) :
  reprises des PDF (`lentA` / `lentR`, forfait seul), « n.c. » pour les 5 produits sans PDF.
  **Règle de Fabrice (02/10/2026) : « n'affiche que ce qui est certain ».** Confrontation automatique API / PDF
  (scratchpad `april/verif.py`, poste par poste et niveau par niveau) : l'API se trompe sur des postes entiers — chambre
  de Peps (« Non » contre 30 → 90 €/j), audio de Peps (100 % BR contre 100 % BR + 100 → 300 €), prothèses de Pro Start
  (125 → 275 % contre 100 → 250 %), consultations de Santé Pro, prothèses d'Only (en % au lieu d'un forfait en €),
  lentilles partout. Donc : **une valeur ne s'affiche que si l'API et le PDF concordent** (ou lue dans le PDF : prothèses
  et honoraires d'Only, lentilles) ; sinon **« n.c. »**. Les 5 produits **sans PDF public** (Mix, Flexi, Optimale,
  Simply, Pro Privilège) n'affichent **aucune garantie** — tarif seul, pastille « Garanties non vérifiées ». Un poste
  « n.c. » sous un filtre de garantie rend la ligne **incomparable** (comptée à part), jamais « non couverte ».
  **03/10/2026 : brochures relues** (Fabrice : « corrige tout ») — les « n.c. » d'Only, Peps, Pro, Pro Start, Tranquillité, Vita
  et Zen sont remplacés par les valeurs lues dans le PDF (image vérifiée) ; « — » = non couvert par la formule de base (renfort
  ou pack non compté : chambre, implants et médecines douces de Zen ; chambre de Peps). `APRIL_GAR.SanteGan` ajouté (notice
  p.6–7, responsable), utilisé dès que son tarif sera branché. `EX.APRIL.orthN` ne reprend le forfait « dentaire non
  remboursé » que chez Only, Pro et Pro Start (`APRIL_ORTHN_DANS_IMP`) : chez Vita, Tranquillité et GAN il ne couvre pas
  l'orthodontie. Only Santé : prothèses en « € /acte ». `plaf` est rangé mais affiché nulle part.
  **↗ April-On** (accord écrit de Fabrice, 03/10/2026 : « Oui, j'accepte qu'un clic crée un projet chez APRIL ») : bouton
  dans le détail de chaque ligne APRIL. `aprilOn(r, btn)` reprend le profil de la tarification (`APRIL_ST.cle`), y ajoute
  `action:"aprilon"`, le produit, le niveau (`fi % 100`) et l'identité de `PRO` ; le relais `april.php` (version
  `2026-10-03 April-On`) fait `POST /projects` (sans requestType : ni devis, ni mail, rien à signer) et ne rend qu'un lien
  d'un hôte APRIL (`aprilon.fr`, `april.fr`), 20 projets/heure/IP. L'onglet s'ouvre au clic puis suit le lien. Libellé
  **« (essai) »** tant que seule la préproduction est ouverte : le projet n'arrive pas dans l'April-On réel. Testé avec une
  fausse API (corps, niveau « 03|03 » des modulables, lien étranger refusé) ; **pas encore contre APRIL** (préproduction en
  504 depuis la nuit du 02 au 03/10). La forme exacte de la réponse (`content`) est celle de la notice, à confirmer.
  **Préproduction APRIL en panne** (constaté le 05/10/2026 : `POST /projects/prices` → HTTP 502 réponse vide sur tous les
  produits, 504 depuis la nuit du 02 au 03/10). Mail rédigé pour Damien Valcarcel (rétablissement, passage en production,
  Swagger, exemple famille, tableaux de garanties de Flexi, Optimale, Simply et Pro Privilège — **Santé Mix a son kit complet dans `docs/` depuis le 03/10**, une première version du mail l'oubliait). Quand aucun produit n'est tarifé et que
  tous les refus viennent d'APRIL (5xx, délai), `aprilRendu` affiche **une seule ligne** « APRIL indisponible pour le moment :
  leur serveur ne répond pas (HTTP 502). Rien à corriger dans le comparateur » (test : scratchpad `t_aprilpanne.js`).
  **Tarifs APRIL gardés par produit** (Fabrice, 05/10/2026 : « quand je clique sur une nouvelle garantie d'APRIL, es-tu
  obligé de recharger les autres ? ») : `APRIL_CACHE` (`base` = profil sans la liste des produits, `res` par code produit).
  Cocher un produit n'interroge que lui (`aprilDemande` n'envoie que les manquants), les lignes déjà là restent affichées
  (« Tarif en cours pour … ») ; décocher ne demande rien. Âge, CP, régime, famille, date d'effet ou Remise changent la base :
  tout est redemandé. Une panne (5xx, code 0) n'est jamais gardée. Test : scratchpad `t_aprilcache.js`.
  **Autres produits APRIL branchés** (Fabrice, 05/10/2026 : « pourquoi je n'ai pas les tarifs ») : préproduction revenue,
  appels réels — `SanteGan` (55 ans dans l'année d'effet, 5 niv.), `SanteProtect` (5 niv.), `SanteCapSerenite` (50 ans, 6 niv.),
  tous `MaladieChirurgie`, commissions 3010 / 1515, **responsables** (renvoi du résumé). GAN garde ses garanties lues dans la
  notice + ses 4 PDF (`APRIL_DOCS`) ; Protect et Cap Sérénité : aucun document public, « n.c. » partout. `SanteGenerali` (« plus
  commercialisé ») et `SanteApril` (« non disponible ») passent dans `APRIL_FERMES` ; `APRIL_A_BRANCHER` est vide. Relais
  `april.php` version `2026-10-05 April-On, GAN Protect Cap Serenite` (scratchpad `livrer/april.php`), **déposé par Fabrice et
  vérifié le 05/10/2026** par un appel réel au relais (70 ans, Paris : GAN 121,05 → 343,32 ; Protect 120,51 → 229,30 ; Cap
  Sérénité 102,91 → 240,23). Test : scratchpad `t_aprilautres.js`.
  **Flexi Santé et Santé Optimale : kits April-On reçus** (Fabrice, 06/10/2026 : notice valant CG, demande d'adhésion, IPID,
  exemples de remboursement, fiche argumentaire). Garanties relues **sur l'image** de la notice (Flexi FLI062025 p. 12–13, Optimale
  OPL042026 p. 8–9) et rangées dans `APRIL_GAR` (bonus fidélité et renforts jamais comptés). **Flexi a deux formules** : Complète
  (« Conforme 100 % Santé – Responsable », modules 1–6) et Eco (non responsable, optique-dentaire 1–4) ; le relais tarife la
  **Complète** (`GarantieHospitalisation` + `GarantieDentaireOptiqueAuditives`, sans « Eco ») → Flexi passe **Responsable** (le
  document l'écrit ; l'API ne le disait pas). L'IPID fourni est celui de l'**Eco** : rangé (`april_flexisante_eco_ipid_2026.pdf`)
  mais **non relié** — IPID de la Complète à demander. Fichiers `april_flexisante_*` / `april_santeoptimale_*` (`tg` = la notice,
  `bulletin`, `exemples`, `argumentaire`) ; `DOCPAGE` 12 / 8 ; `TAMPONS` (au-dessus de « Niveau n », page 11 / 7 comptée de 0).
  Les fichiers envoyés pour « Simply Santé » le même jour étaient ceux de Santé Optimale (identiques octet pour octet) : Simply et
  Pro Privilège restent sans document. Test : scratchpad `t_flexopt.js`.
  **Familles APRIL résolues** (06/10/2026, exemple « Santé ZEN Famille » envoyé par Damien Valcarcel) : tous les assurés vont
  dans **`products[].insureds`** (liste, au pluriel), chacun `{$id, role: AssurePrincipal | Conjoint | Enfant, person}` ; les
  garanties pointent vers chacun. L'ancien `insured` (objet, assuré principal seul) faisait dire à Santé Zen « Relation must be
  set ». `$type` `Sante` ou `SantePrev` : même prix ; `attachmentMandatoryScheme` des enfants : facultatif, même prix. Vérifié par
  appels réels sur les 12 produits ouverts (couple + 2 enfants ; couple de 62/64 ans pour Simply, Only, GAN, Cap Sérénité) ; la
  remise famille d'APRIL se voit sur l'assuré principal (Zen 55,70 € seul, 50,13 € en famille). Une ligne par assuré et par
  niveau (`TarifDetaille`), additionnées par le relais. Relais `2026-10-06 familles (insureds)…` (**déposé et vérifié le 06/10/2026** : couple + 2 enfants, Lyon, Zen 205,46 €, Mix 149,47 €, Vita 180,93 € au niveau 1), qui répond `liensFamille:true` :
  la page retire alors « Tarif famille à confirmer ». **La préproduction n'ouvre qu'aux heures ouvrées, du lundi au vendredi**
  (Damien, 06/10/2026) : les pannes de nuit et de week-end étaient normales. Production : sur simple demande écrite.
  **Liste remaniée** (Fabrice, 05/10/2026 : « remettre GAN, Malakoff dans les choix principaux ») : plus de groupe « Autres
  produits » ; GAN, Protect et Cap Sérénité parmi les Particuliers, les produits barrés en fin de groupe, mention « Barré : APRIL
  ne le propose pas à notre compte (raison au survol) ». **Les fi ne bougent pas** : `APRIL_RANG` suit `APRIL_ORDRE_RANG`, ordre
  figé du 03/10 (un nouveau produit s'ajoute à la fin), indépendant de l'affichage. Test : scratchpad `t_aprilordre.js`.
  **Envoi APRIL ouvert** (Fabrice, 05/10/2026 : « redonne la main pour envoyer les propositions… contour rouge mais cliquable…
  le temps qu'on passe en prod ») : la case d'envoi des lignes APRIL est une `sendchk` normale cerclée de rouge (`.sendapr`,
  `--nrc`), infobulle « tarif de préproduction, à vérifier dans April-On » ; l'étoile ⭐ aussi. `F.APRIL.names[fi]` = « <produit>
  Niv. n », `LIMITES.APRIL[fi]` = « Contrat NON responsable. » pour Only / Flexi (ligne du bas du tableau). Tableau, image, mail
  fonctionnent ; **logo APRIL** (`docs/logo_april.png`, 681 × 160, extrait en vectoriel de l'IPID Santé Mix, sans la devise,
  fond rendu transparent ; `LOGOS.april` dans `tableau.js`, 05/10/2026) ; **limites** : `interet.php` ne connaît pas APRIL (`garanties.json` ne le porte
  pas) — la page « Cette offre m'intéresse » n'aura ni synthèse de garanties ni recalcul. Mode automatique du CRM : APRIL toujours
  écarté. À refermer ou à finir au passage en production. Test : scratchpad `t_aprilenvoi.js`.
  **Production préparée** (Fabrice, 09/10/2026 : demande de mise en production envoyée à Damien à 8 h 50, « prépare tout ») :
  `april.php` `2026-10-09 production prete, appelant serveur…` lit **`april-config-production.php`** (à côté de `april-config.php`,
  qui garde la préproduction) s'il porte `'actif' => true` et un id / secret renseignés (gabarit scratchpad `livrer/`, emplacements
  `COLLER_ICI_ID` / `COLLER_ICI_SECRET`, adresses `am-gateway.april.fr/apistore/oauth/token` et `api-gateway.april.fr/healthprotection/v1`
  **à confirmer par APRIL**). Bascule = déposer ce fichier ; retour = `'actif' => false`. Cache du jeton **par environnement**
  (`april-jeton-ppr|prod-<empreinte>.json`) : un jeton de préproduction ne part jamais vers la production. GET : `environnement`,
  `production` (active / fichier présent, inactif ou incomplet / pas de fichier), `hoteApi` ; **`GET ?jeton=1`** essaie d'obtenir
  un jeton (« obtenu » / « REFUSE », 10/h/IP) sans rien montrer d'un secret. Chaque réponse POST porte `environnement` : la page
  (`APRIL_PROD`) retire alors le cercle rouge, l'infobulle « préproduction » et le « (essai) » d'April-On — sans republier.
  **Appelant serveur** (clé `apicil-cle.txt`, `X-Cle-Serveur`) : tarification seulement, 600/h ; April-On lui est refusé (403).
  Testé contre un faux APRIL (scratchpad `tprod/`) et dans la page (`t_aprilprod.js`). **Déposé et vérifié le 09/10/2026** :
  GET `ppr` / « pas de fichier », tarif réel Zen 65,33 € et Mix 60,49 € (niveau 1, 46 ans, Paris).
- Autres compagnies : aucune autre n'a encore ouvert d'accès API. Prestataire du tarificateur capisante.com : demande à envoyer.
- Manus : e-mail de recherche, retour `adresse/cp/ville` depuis Santéo, PIN pour Caroline (refus à diagnostiquer).
- LPS Hospi : restent à obtenir le règlement mutualiste et la notice d'assistance RMA propres à LPS (le descriptif est reçu).
- ~~Harmonisation optique FLEXIA / SOLENCIA~~ : faite le 03/10/2026 (forfait monture + 2 verres simples : FLEXIA 100 % BR /
  150 / 200 / 260 €, SOLENCIA 150 / 200 / 300 / 350 € ; lentilles non remboursées FLEXIA Start « — »).

## Tests

Playwright + Chromium (`/opt/pw-browsers/chromium`), `dist/` servi en local (`python3 -m http.server 8765`),
`pdf-lib` et `html2canvas` injectés depuis `node_modules`. Vérifier : zéro erreur JS, champs PDF (pypdf), rendu (pdftoppm).
