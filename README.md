# Comparateur Santéo — page publique

Page du comparateur de tarifs santé (MCCI / Avenir Mutuelle / Mutuelle Verte), servie par GitHub Pages
depuis la branche `main`, à la racine.
Import automatique d'une fiche prospect par le lien : `index.html#fiche=<fiche encodée>`.

## Comment publier une modification

Tout part de `src/` : une modification de `src/comparateur.html` (ou de `build.py`) déclenche l'action
GitHub « Construire le comparateur », qui reconstruit `index.html` et le publie automatiquement.
Il n'y a jamais à déposer `index.html` à la main.

## Contenu

- `src/comparateur.html` — le modèle, seul fichier à modifier
- `src/tarifs_all.json` — les grilles tarifaires
- `src/bulletin_avenir.pdf` — bulletin AVENIR MUTUELLE, embarqué dans la page
- `build.py` — construit `index.html` à partir de `src/`
- `docs/` — tableaux de garanties, IPID, et `bulletin_mv_2026.pdf` (chargé à la demande)
- `index.html` — produit par l'action, ne pas modifier directement

Historique complet et versions de travail : dépôt privé `santeo-comparateur-claude`.
