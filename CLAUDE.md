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
- Si le push est refusé (« not in this session's authorized repository set ») : c'est une limitation de la
  session Claude, pas de git. Il faut une tâche créée avec le dépôt sélectionné. Sinon, dépôt manuel :
  https://github.com/fabcoh/santeo-tarifs/upload/main/src (et `/docs` pour les PDF).
- Commits : auteur `Claude <noreply@anthropic.com>`, messages en français.

## Fichiers `docs/` (chargés à l'exécution par la page)

- `bulletin_avenir_2026.pdf` (Cap Évolution, 74 p.), `bulletin_avenir_tns_2026.pdf` (Cap Évolution TNS, 87 p.), `bulletin_capnr_2026.pdf` (75 p.), `bulletin_talis_2026.pdf` (55 p.),
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
  Plus de bouton Télécharger ni de consignes au-dessus du tableau : la ligne « synthèse d'après le tableau de
  garantie officiel… » est cachée à l'écran mais **reste dans l'image** (`.capwide .src`), la consigne de
  l'étoile est son infobulle. Le bouton **✉️ Email** de la barre flottante ouvre le tableau et la fenêtre
  « Envoyer par mail » — plus de `mailto:`. Venu du CRM, le bouton vert de cette barre devient
  **📲 Capture → WhatsApp** : il ouvre le tableau des formules cochées (⭐ comprise) et y déclenche le dépôt
  de la capture (`viaTableau("crm")`), en un clic. L'ancien dépôt en texte (`doDepotText`) est retiré. Pas de second aperçu.
  **« Envoyer dans le CRM » envoie aussi le mail** (Fabrice, 26/09/2026), en haut comme en bas : dépôt de l'image,
  puis le courrier de « Envoyer par mail » au prospect (même relais, expéditeur mémorisé `santeo_exp`, mêmes
  copies cachées), puis **la copie du courrier déposée dans la conversation** (`kind:"email"` : `subject`,
  `from`, `to`, `date`, `html`, `text`) pour la garder ou la renvoyer depuis le CRM. La page demande la copie
  au relais (`copie:true`) ; `santeo-mail.php` la renvoie avec les logos en adresse publique au lieu de `cid:`.
  **Sans e-mail sur la fiche, l'image part seule** et le statut dit « mail non envoyé : pas d'adresse ».
  Un CRM qui refuse `kind:"email"` n'empêche rien : « copie non déposée dans le CRM ». `corpsMail()` fabrique le
  corps du courrier pour les deux chemins — une seule définition.
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
- **Case « tout cocher »** en tête de la colonne des cases (Fabrice, 26/09/2026) : coche ou décoche toutes les
  formules affichées — donc après filtres et périmètre. Pleine si toutes le sont, tiret si une partie
  (`syncSendAll()`). **`buildHead()` ne remplace l'en-tête que s'il a changé** : quitter un champ (CP…) recalcule
  au `mousedown`, et l'en-tête reconstruit à ce moment avalait le clic sur la case.
- **Mode plein écran du tableau de garantie** (Fabrice, 26/09/2026) : bouton ⛶ / ⧉ sous « Fiche CRM » ; la
  fenêtre du tableau (`#tgov.tgmain`) prend toute la page, choix mémorisé (`santeo_tgplein`). **Plein écran
  plutôt qu'un vrai onglet** : les envois (mail, CRM, autre destinataire) ouvrent leurs fenêtres dans la page
  du comparateur ; dans un onglet séparé, elles s'ouvriraient derrière, dans l'autre onglet.
- **Recherche de fiche par nom** : le CRM renvoie une **liste** sous un nom de champ variable ; la page prend
  `resultats`, `results`, `fiches`, `items`, `data`, `liste`, `prospects`, ou le premier tableau d'objets de la
  réponse. Avant, tout objet était pris pour une fiche : « Fiche reçue mais vide ». Ce message affiche
  désormais le diagnostic (adresse appelée, réponse brute) pour voir ce que le CRM a vraiment renvoyé.
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
- **Logos dans le tableau de garantie** : `Tableau.logo(...)` place le logo de l'assureur au-dessus de l'étoile,
  en tête de colonne. Fichiers dans `docs/` : `logo_mcci.png`, `logo_avenir.png`, `logo_mverte.png`,
  `logo_apicil.png`, `logo_revoluo.png` — PNG à fond transparent, normalisés à 160 px de haut, affichés en **42 px** (à 34 px un
  logo carré comme celui d'Avenir devenait illisible). Avenir, Mutuelle Verte et APICIL sont tirés des
  documents de `docs/` ; MCCI vient du fichier fourni par Fabrice, ses plaquettes ne publiant le logo qu'en
  blanc sur fond sombre. **Tant qu'un fichier manque, le nom de la compagnie s'affiche à sa place** — aucune
  image cassée. Le logo est reposé à chaque mise en avant d'une formule.
  **Révoluo, RF50 et RF100 portent le logo Révoluo** (fourni par Fabrice le 26/09/2026, fond blanc rendu
  transparent) et non celui d'Avenir : la gamme porte `logo:"revoluo"`, distinct de `ins:"avenir"` qui reste
  l'assureur (pastille de couleur, routage). `Tableau.logo` et le courrier lisent `g.logo || g.ins`.
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
  « Tableau des garanties », puis « IPID - Notice », en **10 px**, cliquables, juste au-dessus de son bouton. Le pied ne garde que le **nom de la
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

## Fenêtres (popups)

- **Une fenêtre qui porte une saisie ne se ferme que par son bouton** : `overlay(html, largeur, collante)`
  avec `collante = true` pour la signature APICIL, et la fenêtre de devis n'écoute plus le clic sur le fond.
  Un clic à côté effaçait un formulaire à demi rempli — adresse, IBAN, BIC, n° de Sécu — sans prévenir.
  Les fenêtres de lecture (Infos, documents, options) gardent la fermeture au clic sur le fond : rien à perdre.
- **Le rechargement automatique ne passe jamais par-dessus une fenêtre ouverte.** La page se recharge quand
  on revient dessus après **6 heures** (`FRESH`), pour ne pas servir une version périmée. Le garde-fou
  `fenetreOuverte()` (`#tgov`, `#dvov`, `#impov`) suspend ce rechargement : le commercial qui va consulter
  MyVERALTI ou sa messagerie retrouve sa souscription telle qu'il l'a laissée.

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
- Harmonisation optique FLEXIA / SOLENCIA (base « 2 verres simples », comme Cap Évolution et Mutuelle Verte).

## Tests

Playwright + Chromium (`/opt/pw-browsers/chromium`), `dist/` servi en local (`python3 -m http.server 8765`),
`pdf-lib` et `html2canvas` injectés depuis `node_modules`. Vérifier : zéro erreur JS, champs PDF (pypdf), rendu (pdftoppm).
