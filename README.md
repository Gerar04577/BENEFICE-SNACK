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

## 6. Nouveautés — charges détaillées, investissements, impôt progressif

- **Charges fixes** (Paramètres) : désormais réparties en plusieurs postes (loyer, énergie, assurances, comptable, abonnements, entretien, taxes locales, remboursement d'emprunt). Le total se calcule automatiquement.
- **Investissements** (nouvel onglet "Invest.") : chaque achat durable (matériel de cuisson, froid, informatique, mobilier, véhicule, travaux...) s'y encode avec son montant et sa date de mise en service. L'app calcule elle-même la quote-part mensuelle amortie selon des durées usuelles du secteur (ex. informatique 3 ans, cuisson 5-7 ans) et l'intègre au bénéfice net. **Exception "petit matériel" : en dessous de 500 €, l'app déduit le montant en une seule fois** (le mois de mise en service), au lieu de l'étaler — conformément à la règle fiscale belge, peu importe la catégorie choisie. **Ces durées et ce seuil sont "communément admis" mais pas légalement figés — à faire valider par le comptable.**
- **Provision impôt progressive** (Paramètres) : remplace l'ancien taux fixe. Le calcul suit le vrai barème belge par tranches (quotité exemptée + 4 tranches 25/40/45/50%), appliqué sur le cumul du bénéfice depuis le 1er janvier. Une alerte explicative apparaît dans l'écran Saisie chaque fois qu'un changement de tranche fait grimper la provision du jour. **Seuils, taux et additionnels communaux sont indexés chaque année — à vérifier/ajuster avec le comptable, surtout si le snack n'est pas l'unique revenu du foyer.**
- **Aide contextuelle** : une icône "?" à côté des titres "Charges fixes mensuelles", "Provision impôt" et "Investissements" ouvre une explication simple de ce qu'il faut remplir, pensée pour que votre belle-fille puisse s'en servir seule.
- **Journal Nespresso** (bouton en haut de l'app, désormais appelé "Journal : Mode complet" / "Journal : Nespresso") : bascule vers un **2ᵉ journal de ventes complètement indépendant** — voir section 8 ci-dessous pour le détail. Le calcul y reste simplifié : ventes au prix TTC tel que payé par le client, moins coût des ingrédients de la recette, sans rien retirer d'autre (ni TVA, ni charges fixes, ni amortissement, ni cotisations, ni provision impôt). Un bouton doré indique quand ce journal est actif. **Ce chiffre ne doit jamais être comparé directement au bénéfice net du Mode complet — ce sont deux comptabilités avec des ventes différentes.** ⚠️ **Sécurité** : une confirmation explicite avec avertissement est obligatoire avant toute bascule, pour éviter qu'un appui accidentel fasse basculer le journal de saisie sans s'en rendre compte.

## 8. Séparation complète des deux journaux de ventes (changement majeur)

**Avant** : le Mode complet et le Mode Nespresso partageaient les mêmes ventes saisies — seul le calcul différait.
**Maintenant** : ce sont deux **journaux de ventes totalement indépendants**, chacun avec ses propres entrées par date.

- Saisir des sandwichs dans le Mode complet n'apparaît **jamais** dans le journal Nespresso, et inversement.
- Une même date (ex. 20/07/2026) peut avoir une entrée dans les deux journaux **en même temps**, avec des quantités différentes, sans aucun lien entre elles.
- Le catalogue (Ma carte, Matières premières), les Investissements et les Paramètres restent **partagés** entre les deux — seules les ventes du jour sont séparées.
- Les champs "Heures étudiants", "Achats matières" et "Charges exceptionnelles" **disparaissent** de l'écran Saisie quand le journal Nespresso est actif (ils ne servent à rien dans ce calcul simplifié).
- Écran **Cumuls** et **graphiques** : un tiret "—" apparaît partout où un journal n'a pas de donnée à une date/période donnée — ça ne veut pas dire "zéro", ça veut dire "rien saisi ici".
- **Sauvegarde/restauration OneDrive** : les deux journaux sont sauvegardés et restaurés séparément (clés distinctes), aucun risque de mélange.
- **Analyse mensuelle des produits** : reste basée sur le journal Mode complet uniquement (c'est celui qui a la notion de temps de préparation et de marge réelle à optimiser).

## 9. Format de date JJ/MM/AAAA

L'affichage textuel des dates (Résultats, Cumuls, graphiques) utilise désormais systématiquement le format **JJ/MM/AAAA**, indépendamment des réglages régionaux du téléphone.

⚠️ **Limite technique à connaître** : le **sélecteur de date natif** (calendrier qui s'ouvre en tapant sur le champ "Date") reste géré par Safari/iOS et affichera son propre format selon les réglages du téléphone — ça, l'app ne peut pas le forcer sans remplacer ce composant par un calendrier personnalisé. Seul l'affichage du résultat une fois la date choisie est garanti en JJ/MM/AAAA partout dans l'app.

### Vérifications effectuées (session la plus récente)
Indépendance des deux journaux vérifiée en conditions réelles : 5 ventes saisies dans le Mode complet un jour donné n'apparaissent pas dans le journal Nespresso à la même date (compteur à 0), et une saisie ultérieure dans Nespresso à cette même date n'altère pas les 5 ventes du Mode complet (vérifié à la fois via l'interface et via lecture directe du stockage). Écran Cumuls testé avec des journaux ayant des dates totalement différentes : totaux corrects par journal, tirets "—" affichés correctement là où un journal n'a rien. Graphiques testés avec ces mêmes données sans crash. Sauvegarde/restauration OneDrive testée avec un faux serveur local : les deux journaux repartent bien dans leurs clés respectives après restauration. 0 erreur JavaScript sur l'ensemble.

- **Par jour / par mois calendaire / par année fiscale** : trois niveaux de cumul, avec le Mode complet et le Mode Nespresso **toujours affichés séparément** (jamais additionnés entre eux). Basé sur les jours calendrier réellement saisis ; chaque année fiscale (1er janvier au 31 décembre) est comptée à part.
- **Projections** : une fois quelques jours saisis dans le mois en cours, l'app estime le bénéfice probable en fin de mois au prorata des jours calendrier écoulés (pas seulement les jours travaillés). Une projection de fin d'année apparaît une fois le mois de janvier terminé, pour avoir un minimum de recul. Calculées séparément pour les deux comptabilités.
- **Analyse mensuelle des produits** : une fois par mois, l'app identifie automatiquement (popup à l'ouverture, une seule fois par mois écoulé) le produit le plus rentable à pousser à la vente et le moins rentable à surveiller ou retirer de la carte, basé sur la marge par minute de préparation quand elle est renseignée. Toujours consultable à la demande dans l'onglet Cumuls.
- **Graphiques** (dans l'onglet Cumuls) : courbe d'évolution journalière (30 derniers jours, 2 lignes complet/Nespresso), barres mensuelles et annuelles groupées (2 barres par période), et barres horizontales de classement des produits (vert = plus rentable, doré = intermédiaire, rouge = ne rapporte rien ou perte). Dessinés directement en SVG natif, **sans bibliothèque externe** — fonctionnent même sans connexion internet.

### Vérifications effectuées (session la plus récente)
Cumuls mensuels/annuels vérifiés avec des données contrôlées (ex. 5 jours à 1 000 € = 5 000 € exact). Projection mensuelle vérifiée sur le mois réel en cours (2 000 € sur 10 jours → projection 2 384,62 €, identique au calcul manuel). Projection annuelle vérifiée de même (6 500 € sur 207 jours → projection 11 461,35 €). La confirmation de bascule Nespresso testée dans les deux sens : acceptée → bascule effective ; annulée → aucun changement. Barre de navigation à 6 onglets vérifiée par capture d'écran sur largeur iPhone, aucun chevauchement. 0 erreur JavaScript sur l'ensemble des tests.

### Vérifications effectuées (session précédente)
Le calcul par tranches a été comparé à un exemple officiel vérifié (revenu imposable 30 000 € → impôt net 6 884,50 €) : résultat identique. Le calcul de la provision marginale lors d'un franchissement de seuil a aussi été vérifié manuellement (352 € sur une tranche de 1 000 € à cheval sur deux paliers). Testé en conditions réelles de navigateur, aucune erreur JS.
