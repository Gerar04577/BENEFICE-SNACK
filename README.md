# Bénéfice du Jour — guide d'installation

## Données d'exemple incluses

L'app démarre avec 3 sandwichs (Mitraillette/Américain, Jambon-fromage-crudités, Américain steak tartare) et 3 boissons (Coca-Cola, Eau, Bière) déjà encodés dans "Produits", recettes comprises. **Les coûts des ingrédients sont indicatifs** (je n'ai pas pu vérifier de vrais prix fournisseurs actuels — les grossistes belges comme Solucious/Sligro/Metro n'affichent leurs prix qu'aux clients professionnels connectés). Modifiez-les dans l'onglet Produits avec les vraies factures dès que possible. Tout est éditable et supprimable librement.


## 1. Mettre l'app en ligne (GitHub Pages)

1. Créez un nouveau repo GitHub, par exemple `BENEFICE-SNACK`.
2. Déposez-y les fichiers : `index.html`, `style.css`, `app.js`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`.
3. Repo → **Settings → Pages** → Source : `main` branch, dossier `/ (root)`.
4. L'app sera accessible à `https://<votre-utilisateur>.github.io/BENEFICE-SNACK/`.
5. Sur l'iPhone de votre belle-fille : ouvrir ce lien dans Safari → bouton Partager → **Sur l'écran d'accueil**.

## 2. Créer le scénario Make.com dédié (séparé de Charges et Compteurs)

1. Compte Make.com → **Créer un nouveau scénario** (ne touchez pas au scénario de Charges et Compteurs).
2. Module 1 : **Webhooks → Custom webhook** → créer un nouveau webhook → copier l'URL générée.
3. Ajouter un module **Router** juste après, avec 2 branches :
   - Branche **save** : filtre `action = save`
   - Branche **import** : filtre `action = import`
4. Branche `save` → module **OneDrive → Upload a file** :
   - Choisir/créer le dossier via le picker, ex. `/SAUVEGARDE BENEFICE SNACK`
   - `File Name` = `Sauvegarde-benefice-snack.json`
   - `Data` = `toBinary(1 ; base64)` — appliqué au **corps entier reçu du webhook** (pas seulement aux ventes : il contient aussi les réglages, les ingrédients et "Ma carte" — tout doit être sauvegardé pour qu'une restauration soit complète).
5. Branche `import` → module **OneDrive → Download a file** (le fichier créé à l'étape précédente) puis un module **Webhook response** qui renvoie son contenu en JSON à l'app.
6. Activer le scénario.
7. Copier l'URL du webhook (celle de l'étape 2) dans l'app, écran **Paramètres → Adresse du webhook Make.com**.

## 3. Fonctionnement de la sauvegarde automatique

- Rien à cliquer : dès que votre belle-fille quitte l'app (elle change d'app, éteint l'écran, ferme Safari) après avoir saisi des données, l'envoi vers Make.com → OneDrive part tout seul.
- Si elle n'a pas de réseau à ce moment-là, l'envoi repart automatiquement à la prochaine ouverture de l'app ou dès que le réseau revient.
- Le tableau de bord affiche un badge "OneDrive ✓" une fois qu'une journée est bien sauvegardée, ou "en attente" sinon.

## 4. En cas de perte de l'iPhone

1. Installer l'app sur le nouvel iPhone (étape 1, point 5).
2. Aller dans **Paramètres**, renseigner à nouveau l'adresse du webhook Make.com.
3. Appuyer sur **Restaurer l'historique depuis OneDrive**.

## 5. Rappel important

Cette app donne une estimation de pilotage quotidienne, pas une déclaration officielle. La ventilation exacte TVA repas/boissons/à emporter et le montant réel des cotisations sociales restent à valider avec le comptable.
