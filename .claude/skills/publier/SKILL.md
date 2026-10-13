---
name: publier
description: Mettre en ligne une modification du comparateur (page https://fabcoh.github.io/santeo-tarifs/) et vérifier qu'elle l'est vraiment. À utiliser après toute modification de src/, build.py, tools/ ou d'un logo, et quand Fabrice dit « publie », « c'est en ligne ? », « j'ai toujours l'ancienne version ».
---

# Publier le comparateur

La page en ligne est `index.html` à la racine de `main`, **construit par l'Action**
`.github/workflows/build.yml` à partir de `src/`. On ne touche jamais à `index.html`,
`version.json`, `src/garanties.json`, `src/tableau.css` ni `docs/tg/` à la main : l'Action
les régénère et les commit.

## Étapes

1. Construire en local pour attraper les erreurs : `python3 build.py` (racine ou `src/`).
   Pour un changement visible, tester la page de `dist/` (Playwright, voir « Tests » du
   `CLAUDE.md`) : zéro erreur JS.
2. Commit sur la branche de travail, auteur `Claude <noreply@anthropic.com>`, message en
   français, avec les lignes d'attribution de la session.
3. Envoyer sur `main` puis aligner la branche de travail :
   ```sh
   git pull -q --rebase origin main && git push -q origin HEAD:main \
     && git push -q -f origin HEAD:<branche de travail>
   ```
   Arbre de travail sale (fichiers de test) : `git stash` avant le `pull`.
4. Attendre le commit **« Comparateur : construction automatique »** juste après le sien
   (`git fetch -q origin main; git log origin/main --oneline -2`, toutes les 15 s, 3 min au plus).
   Absent : regarder l'Action (`gh api repos/fabcoh/santeo-tarifs/actions/runs?per_page=3`).
   Les envois rapprochés sont gérés (`concurrency` + `pull --rebase` à l'étape « Publier ») :
   seule la plus récente construction publie.
5. Dire à Fabrice : la mention « version JJ/MM/AAAA HH:MM » en bas de page change ; la page
   ouverte se recharge seule au retour sur l'onglet (`version.json`), sinon recharger.

## Si ça bloque

- Push refusé « not in this session's authorized repository set » : limitation de la session,
  pas de git. Dépôt manuel par Fabrice : https://github.com/fabcoh/santeo-tarifs/upload/main/src.
- Les relais PHP (`capisante.fr`) ne partent **pas** par ce chemin : Fabrice les dépose par FTP
  (une ligne `curl -T …` à lui donner, voir `CLAUDE.md`), puis vérifier la `version` de leur GET.
- `src/moteur.js` ou `src/tableau.js` modifié : prévenir le CRM (compétence `regle-de-tarif`).
