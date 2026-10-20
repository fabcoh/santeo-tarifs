---
name: calculette-cumul
description: Règles de la vignette 🧮 Cumul (mutuelle + surcomplémentaire TALIS, besoins, dépenses prévues, remboursements, plafonds, gain) — à lire avant toute modification de Tableau.cumul / cumulDepenses / showCumul, et à compléter à chaque nouvelle règle donnée par Fabrice. À utiliser quand Fabrice parle de cumul, calculette, vignette, surcomplémentaire, TALIS, dépenses, remboursement, reste à charge, gain, plafond dentaire.
---

# Calculette du cumul — toutes les règles

Code : `src/tableau.js` (`cumul`, `cumulTotal`, `cumulDepenses`, `CU_DEP`, `CU_PLAFD`, `CU_IMP`, `CU_ORTHN`) — partagé avec
le CRM, donc **le calcul vit là, jamais dans la page** — et `src/comparateur.html` (`showCumul`, `cumulTarifs`,
`cumulCompagnies`, CSS `.cumul` / `#cubox`). Contrôle automatique : **`node tools/verif_cumul.js`** (l'Action le lance
avant de publier ; un écart arrête la publication).

## Quand une règle nouvelle arrive

1. L'écrire **ici**, dans la bonne section, avec la date et les mots de Fabrice entre guillemets.
2. La coder dans `src/tableau.js` (calcul) ou `src/comparateur.html` (fenêtre, réglages).
3. Si c'est une règle de calcul vérifiable, l'ajouter à `tools/verif_cumul.js` (invariant ou cas relu à la main).
4. `node tools/verif_cumul.js`, test Playwright de la vignette (412 px, zéro erreur JS), image relue.
5. Une ligne dans `CLAUDE.md` (« 🧮 Cumul ») et, si le CRM est concerné, dans `docs/carnet/ECHANGES.md`. Puis publier.

## Règles absolues (ne jamais casser)

- **On ne rembourse jamais plus que ce qui est dû** (Fabrice, 20/10/2026) : Sécu + mutuelle + surcomplémentaire ≤ dépense,
  soin par soin et au total ; aucun montant négatif. Garde-fou dans `cumulDepenses` (l'excédent éventuel est retiré au
  dernier payeur) et invariant n° 1 de `tools/verif_cumul.js`.
- **Ce qui est vraiment remboursé, moins ce qu'il a cotisé** (Fabrice, 20/10/2026 : « c'est pas parce qu'il a payé qu'il est
  remboursé ») : gain = remboursements (Sécu comprise) − cotisations de l'année ; jamais la dépense.
- **Vérité des chiffres** : une garantie qu'on ne sait pas chiffrer (texte, « n.c. ») n'est pas comptée et la vignette le
  dit (†). Un plafond absent des documents est écrit « non précisé dans les documents », jamais inventé.
- **Les réglages ne partent jamais chez le prospect** : cadre « Réglages — non envoyés », hors de `.cumul`, jamais capturé.

## Choix de la formule (fenêtre)

- Une mutuelle + une surcomplémentaire (`SURCOS` = TALIS ; Talis / Talis +). Le bouton 🧮 Cumul s'affiche dès qu'une
  formule est cochée.
- Compagnie **« ★ Toutes les compagnies »** d'office (« je dois pouvoir mettre toutes les compagnies et ne choisir que les
  filtres ») ; elle suit le **périmètre du panneau ⚖** (aucune coche = toutes ; APRIL seulement si sa case est cochée, et
  seulement ses **produits cochés au ☰**). La liste reste complète pour un choix à la main.
- **Besoins** = les postes du panneau ⚖, repris à l'ouverture (budget exclu). Formule retenue : la moins chère qui remplit
  tous les besoins ; à défaut celle qui en remplit le plus, ce qui manque en orange ; sans besoin, la formule cochée, sinon
  la moins chère.
- **Régime respecté** : produits TNS d'APRIL (Santé Pro, Pro Start, Pro Privilège) seulement en TNS / TNSRL ; les gammes
  locales suivent le régime dans `moteur.js` ; APICIL en décide.
- Tarifs : `Moteur.calculer` sur le profil du haut de page ; APICIL et APRIL par leurs relais, **jamais redemandés en
  boucle** (60 s après un échec).

## Grille des garanties

- Colonnes : **Mutuelle principale** (gras) · **Surcomplémentaire** (« RENFORT » en petites capitales au-dessus) ·
  **Total cumulé — Mutuelle + Surcompl.**
- Additions (`cumulTotal`) : % + %, € + € (l'unité gardée si commune), % + € sur une ligne ; **jamais** d'addition quand une
  valeur porte une précision (« 30 €/an (tabac) », « 3×20 € ») : deux lignes.
- Implantologie et orthodontie non remboursée marquées \* / \*\* avec ce que vaut chaque montant (par implant, par an, par
  semestre, % BR — `CU_IMP`, `CU_ORTHN`).
- Ordre du bas : cotisation juste sous la grille → soins prévus → bandeau « Pour x € de plus… » → notes \* → limites TALIS → logo.

## Dépenses prévues (volet « Dépenses »)

- Saisie **nombre + prix unitaire**, sur un an : couronnes, bridges, inlay-core, implants, orthodontie remboursée / non
  remboursée (par semestre), lunettes, lentilles, chambre (par jour). Non retenue d'une ouverture à l'autre.
- **Tarifs de convention** (Fabrice, 20/10/2026) : couronne 120 €, bridge 279,50 €, inlay-core 90 €, orthodontie remboursée
  193,50 € par semestre ; parodontologie : rien ; implants et orthodontie non remboursée : au forfait. **Les % incluent la
  Sécurité sociale.** Sécu : 60 % du tarif en prothèse, 100 % en orthodontie remboursée.
- **Ordre des payeurs** : Sécu → mutuelle (% Sécu comprise, ou forfait par unité / par an selon la gamme) →
  surcomplémentaire (en plus, sur ce qui reste) → reste à charge.
- APICIL : 2 implants au plus par an.
- **Soins sans base Sécu** (lunettes, lentilles, implants, orthodontie non remboursée, chambre — Fabrice, 20/10/2026 : « ne sont
  pas remboursés par la Sécu donc ils viennent directement en positif ») : Sécu = 0, tout ce que paient les contrats vient en
  plus ; la carte porte « non remboursé par la Sécu ». « Sans complémentaire », le prospect en paierait la totalité.

## Plafonds dentaires (1re année d'adhésion, par bénéficiaire, hors Sécu) — `CU_PLAFD`

Fabrice, 20/10/2026 : « faire attention aux plafonds… TALIS 900 €… vérifier les plafonds dentaires dans chacun des cas ».
Relevés dans `docs/connaissances/`. P = prothèses (couronne, bridge, inlay-core), O = orthodontie, I = implants.

| Gamme | Plafond | Soins |
|---|---|---|
| TALIS / Talis + | 600 € / 900 € | P O I (hors soins) |
| Cap Évolution | Accès — · Équilibre 600 · Tranquillité 1 000 · Sérénité 1 100 € (puis 700/1 100/1 200, puis 800/1 200/1 300) | P O I |
| CAP NR | 160 NR 600 · 200 NR 700 · 300 NR 800 · 400 NR 1 000 € (rien avant) | P O I |
| Mutuelle Verte | GCI 100 — · 150 et 200 : 750 · 300 : 1 000 · 500 : 1 200 € (après 2 ans : 1 000 → 2 400) | P O I |
| FLEXIA / SOLENCIA | 2 500 € (pas au Start) / 2 000 € | P |
| Révoluo (et RF50) | Rev 7 1 400 · Rev 8 2 000 € ; Rev 1–6 aucun | P O I |
| API SANTÉ | Équilibre 3–6 : 500 / 700 / 800 / 1 000 ; Sérénité 1–5 : 500 / 700 / 800 / 800 / 1 000 € (puis 800 → 1 500) | P |
| APRIL | `APRIL_GAR[code].plaf` (1er montant) → `EX.APRIL.plaf` | P (Pro / Pro Start : P O ; GAN : tout) |
| MCCINOVA, Renfort 100 | non précisé dans les documents — écrit tel quel | — |

- Calcul **unité par unité**. Au-delà du plafond, un **contrat responsable** paie encore le **ticket modérateur** des soins
  remboursés (« au-delà 100 % BR ») ; un forfait n'est plus payé ; la surcomplémentaire n'a pas de ticket modérateur.
- La surcomplémentaire reprend ce que la mutuelle ne paie plus, dans son propre plafond.
- « plafond atteint » en rouge sur la ligne ; mention des plafonds appliqués sous le bloc.
- **À trancher par Fabrice** : 1re année (choix actuel) ou 2e année ; implants dans le plafond API SANTÉ (non écrit, exclus).

## Présentation (néophyte, vendeur, sobre)

Revue du 20/10/2026 (critique ChatGPT relue avec Fabrice, « ok ») : le gain se mesure **entre la mutuelle seule et la mutuelle +
surcomplémentaire**, la Sécu payant la même chose dans les deux cas — plus de « gain » Sécu comprise ni de « différence sur l'année ».

- **Première ligne** (`.cu-top`) : « Reste à payer sur vos soins X € — au lieu de Y € sans complémentaire · hors cotisations » ;
  à côté, **seulement si positif**, « Avec TALIS + : + Z € » et en petit « R € remboursés en plus pour C € de cotisation ».
- Légende sous l'en-tête de la grille : « % = pourcentage de la base de remboursement de la Sécurité sociale, Sécu comprise · € = forfait ».
- **« Vos soins prévus : estimation des remboursements »** (jamais « ce qui vous sera remboursé »), puis en rouge le **délai
  d'attente de la surcomplémentaire** (`CU_CARENCE` : « délai d’attente de 90 jours en dentaire et en optique » ; la phrase « un soin fait pendant ces 90 jours n’est pas remboursé » retirée à la demande de Fabrice, 20/10/2026).
- **Soins et bilan dans les colonnes de la grille** (Fabrice, 20/10/2026 : « aligner dans les colonnes les remboursements…
  l'explication verticalement ») : en-tête <mutuelle> · <surco> · Total ; une ligne par soin — libellé + « coût … » (et « non
  remboursé par la Sécu »), mutuelle (« Sécu comprise », « plafond atteint »), « + » surcomplémentaire, total remboursé et « reste »
  en rouge. Puis **« Votre bilan sur l'année, pour ces soins »**, mêmes colonnes : « <mutuelle> seule » · « Apport <surco> » ·
  « Les deux » — cotisations¹, remboursements (Sécu comprise), reste à payer (rappel « sans complémentaire : … »), **coût réel
  = cotisations + reste**. Pas de colonne « sans complémentaire » : sur ces seuls soins elle paraîtrait moins chère en oubliant
  l'hospitalisation.
- **Ligne finale** : « Avec TALIS + : R € remboursés en plus pour C € de cotisation — + Z € pour vous » (vert) ; si négatif,
  « Sur ces seuls soins, TALIS coûte plus qu'il ne rembourse » (gris). Z = R − C = coût réel mutuelle seule − coût réel cumul.
- Mentions : « ¹ Les cotisations évoluent chaque année à la date anniversaire du contrat. Tableau présenté à titre indicatif —
  document non contractuel. Prothèses hors panier 100 % Santé (dans le panier 100 % Santé, le reste à charge est nul avec un
  contrat responsable) » + tarifs de convention + plafonds appliqués.
- **Couleurs** (« noir, bleu, rouge, vert selon mutuelle, surco, reste à charge ») : noir = mutuelle, bleu `#1F5FA8` =
  surcomplémentaire, vert `#157A47` = total, remboursements, gain, rouge `#C0392B` = reste à charge. Fond blanc, filets fins,
  aucun fond pastel. Logos à **surface égale** (`logoEgal`), noms à la même taille.
- Image : 520 px × 2 (`.cu-cap`) ; barre WhatsApp · ⬇ Télécharger · Envoyer dans le CRM (image seule, sans mail).

## Tests

- `node tools/verif_cumul.js` (invariants + cas relus).
- Playwright sur `dist/index.html#vide` servi en local, relais APRIL / APICIL simulés : scratchpad `t_cumul*.js`.
