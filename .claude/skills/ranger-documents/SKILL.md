---
name: ranger-documents
description: Traiter les PDF d'assureurs que Fabrice dépose (tableau de garantie, IPID, notice, bulletin d'adhésion) — les reconnaître, les relire contre le comparateur, les ranger dans docs/ et clore le dépôt. À utiliser quand Fabrice dit « documents déposés », envoie un PDF ou un zip d'assureur, ou demande de remplacer un document.
---

# Ranger les documents d'un assureur

## 1. Récupérer

- Page de dépôt (https://claude.ai/artifact/5EWAbsBRP3EhxuFaFpiDc4) : `ArtifactData list` de la
  collection `depots`, statut `a_traiter` (`ligne`, `piece`, `asset`, `nomFichier`, `remarque`) ;
  `Artifact read` avec `path` = l'id de l'asset pour avoir le PDF.
- Chaque PDF dans son propre dossier du scratchpad ; Python lancé avec `-I`.

## 2. Reconnaître au contenu, jamais au nom

Le nom et la case sont souvent faux (MCCI, 05/10 : 3 PDF sur 11 mal rangés ; « Simply Santé » qui
était Santé Optimale). Lire la 1ʳᵉ page et le pied (gamme, millésime, référence). Comparer octet
pour octet au fichier en place (`cmp`, `sha256sum`) : un doublon ne se range pas.

## 3. Relire contre le comparateur

- **Tableau de garantie** : chaque valeur de `F` / `EX` de la gamme, ligne à ligne, **sur l'image**
  de la page (`pdftoppm`), pas seulement sur le texte extrait. Une grille de tarifs jointe : sondage
  contre `src/tarifs_all.json` sur toutes les zones. Un écart → corriger (compétence `regle-de-tarif`
  si c'est un tarif) et le dire à Fabrice. Pages changées → refaire les `TAMPONS` et `DOCPAGE`.
- **IPID / notice** : responsable ou non, âges, délais de stage, contre `INFO` et `LIMITES`.
- **Bulletin** : les champs que la page remplit existent toujours, même nom, même type (pypdf) ;
  générer une adhésion d'essai et la relire.

## 4. Ranger et publier

- `docs/` sous le **nom en place** (`<gamme>_tg|ipid|notice_2026.pdf`, `bulletin_<gamme>_2026.pdf`) ;
  nom nouveau → `DOCS` de la page. Publier (compétence `publier`).
- Fiche `docs/connaissances/<produit>.md` : relire et mettre à jour ce que le document change.
- Page de dépôt : téléverser le PDF dans ses assets (`Artifact publish asset:true`) et mettre à jour
  `APERCU` ; `update` du dépôt : `statut` `remplace` ou `refuse`, `traiteLe`, `reponse` en une ligne ;
  nom changé → `catalogue/etat`.
- Noter le dépôt dans « Fichiers docs/ » du `CLAUDE.md` (ce qui a changé, ce qui est identique).
