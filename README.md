# Barber — app de file d'attente

## Ce qu'il y a ici
- `index.html` — la page client (publique). Ouverte via un lien comme
  `index.html?shop=votre-slug`.
- `owner.html` — connexion / inscription propriétaire + panneau de gestion.
- `firestore.rules` — règles de sécurité à copier dans la console Firebase
  (Firestore Database → Rules), pour remplacer les règles par défaut.

## Mettre en ligne (GitHub Pages)
1. Dans ton repo `barber-app` sur GitHub, mets ces 3 fichiers à la racine
   (via "Add file" → "Upload files", ou `git add` / `git commit` / `git push`
   si tu utilises Git en ligne de commande).
2. Repo → Settings → Pages → sous "Source", choisis la branche `main` et
   le dossier `/ (root)` → Save.
3. GitHub te donne une URL du style
   `https://kerima1.github.io/barber-app/` — ça prend une minute ou deux
   la première fois.

## Tester
- Propriétaire : ouvre `.../owner.html`, crée un compte (nom du salon,
  téléphone, e-mail, code PIN).
- Client : une fois le compte créé, le lien de ton salon apparaît dans
  Réglages → copie-le et ouvre-le dans un autre onglet (ou sur ton
  téléphone) pour voir ce qu'un client verrait.

## Ce qui manque encore (prochaine étape)
Ce premier passage couvre le cœur qui fonctionne vraiment : prendre un
numéro, le panneau du coiffeur (Terminé / Absent / Annuler), et la
connexion. Ce qu'on a déjà conçu dans la maquette et qu'il reste à
brancher sur Firestore :
- Réglages avancés : logo, couleurs, QR code à télécharger
- Image du ticket (téléchargement)
- Bilingue FR/AR
- Mode clair/sombre automatique
- Boîtes de confirmation avant chaque action
