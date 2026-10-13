---
name: regle-de-tarif
description: Changer une règle de tarification, une grille ou le tableau de garanties sans que le CRM WhatsApp et le comparateur annoncent deux choses différentes. À utiliser pour toute modification de src/moteur.js, src/tarifs_all.json, src/tableau.js, des garanties (F, EX) ou d'une éligibilité (âges, zones, régimes).
---

# Changer une règle de tarif sans casser le CRM

Le CRM calcule et dessine avec **nos** fichiers : il garde une copie conforme de
`src/moteur.js` (`server/vendor/moteur.cjs`) et de `src/tableau.js` (`server/vendor/tableau/`,
par `scripts/vendor-tableau.mjs`, `COMMIT_COMPARATEUR`). Il lit `src/tarifs_all.json`,
`src/garanties.json`, `docs/tg/index.json` et `docs/connaissances/` en ligne. Une règle écrite
ailleurs que dans ces fichiers n'existe que pour la page.

## Où écrire

- Calcul, éligibilité, réduction, zone : **`src/moteur.js`**, jamais dans la page. Fonction pure
  (ni DOM ni réseau) : elle doit tourner sous Node.
- Grilles : `src/tarifs_all.json` (contrôler par sondage contre le PDF de l'assureur).
- Garanties, libellés, limites : objets `F`, `EX`, `LIMITES` de `src/comparateur.html`
  (`garanties.json` en est tiré par `build.py`).
- Rendu du tableau de garanties : `src/tableau.js` (+ le `<style>` de la page → `tableau.css`).

## Étapes

1. Reproduire le cas sous Node avant de toucher :
   ```sh
   node -e 'const M=require("./src/moteur.js"),D=require("./src/tarifs_all.json"),
   F=require("./src/garanties.json").gammes,z=M.zones(D);
   const r=M.calculer({D,F,sel:{},age:78,cnjAge:44,hasCnj:true,kids:0,reg:"SAL",dept:"35",zone:z["35"]});
   console.log(r.rows.map(x=>x.gamme+" "+x.formule+" "+x.total), r.warns)'
   ```
   (`F` = `garanties.json` → `gammes`.)
2. Corriger, refaire le même appel, plus deux ou trois profils voisins (bornes d'âge, couple,
   enfants, TNS, Alsace-Moselle). Règle de Fabrice : **ne jamais sortir un tarif qui peut tromper**
   — une gamme non éligible n'a pas de ligne, et une alerte (`warns`) dit pourquoi.
3. Noter la règle dans « Règles métier à ne pas casser » du `CLAUDE.md` (date, phrase de Fabrice).
4. Publier (compétence `publier`). L'Action refait `docs/tg/` si l'empreinte change.
5. **Prévenir le CRM** dans `docs/carnet/ECHANGES.md` (compétence `carnet-crm`) : fichier, commit,
   ce qui change pour un même profil, et ce qu'il doit refaire (recopier `moteur.js` en
   `server/vendor/moteur.cjs`, ou lancer `scripts/vendor-tableau.mjs`). Vérifier ensuite sur son
   `main` que sa copie a suivi : `diff` de `src/moteur.js` avec `git show origin/main:server/vendor/moteur.cjs`.

Ne jamais écrire dans le dépôt du CRM.
