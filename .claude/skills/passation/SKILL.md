---
name: passation
description: Reprendre le travail du comparateur après un résumé de conversation, une nouvelle session ou une longue pause, sans refaire ce qui est fait ni perdre ce qui attend. À utiliser en début de session, après « continue », ou quand on ne sait plus où l'on en est.
---

# Passation

1. **Lire `CLAUDE.md` en entier** : règles métier, sécurité, et la section « En cours / à faire ».
   Ce qui y est écrit l'emporte sur un résumé de conversation.
2. **État du dépôt** : `git status --short`, `git log --oneline -8`, `git fetch -q origin main` puis
   `git log origin/main --oneline -3` (la construction automatique a-t-elle suivi ?). Un fichier
   modifié non commité vient de la session d'avant : le relire avant d'y toucher.
3. **Le scratchpad n'est pas fiable** : il peut avoir disparu avec le conteneur. Les relais PHP livrés
   sont dans `livrer/` s'il existe ; sinon la version en ligne se lit par son GET (`version`).
4. **Ce qui attend quelqu'un** : le carnet du CRM (compétence `carnet-crm`), la page de dépôt
   (`depots` à `a_traiter`, compétence `ranger-documents`), `catalogue/liens` à `aReporter:true`
   (recopier dans `docs/liens_adhesion.json`).
5. **Reprendre la dernière demande de Fabrice**, pas une tâche de la liste : une étape à la fois, en
   français, réponse courte. Un relais à déposer = lui donner la ligne `curl -T` puis vérifier la version.
6. **Avant de finir** : noter dans `CLAUDE.md` ce qui a été décidé (date, phrase de Fabrice), ce qui
   est en ligne et vérifié, ce qui reste ouvert ; publier.

Jamais : répéter un secret vu dans la conversation, écrire un code d'accès en clair, pousser chez le CRM.
