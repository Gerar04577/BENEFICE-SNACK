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

## 10. Paramètres figés par journée (changement majeur)

Chaque jour enregistré fige désormais, au moment de la saisie, une **copie complète** de tout ce qui compte pour son calcul : Paramètres (charges fixes, TVA, cotisations, coût étudiant, barème impôt), Produits (prix, recettes), Ingrédients (coûts), Investissements (amortissements).

- **Modifier un prix, une charge fixe, un taux de TVA plus tard ne change plus jamais** le calcul des jours déjà enregistrés — seuls les nouveaux jours utilisent les valeurs actuelles.
- **Corriger une journée passée** (ex. ajouter une vente oubliée) réutilise le figé original de cette journée — la correction ne porte que sur ce que vous modifiez (ventes, achats, heures, charges exceptionnelles), jamais sur les paramètres qui étaient en vigueur ce jour-là.
- S'applique aux **deux journaux séparément** (Mode complet et Nespresso) — chacun fige ses propres paramètres au moment de sa propre saisie.
- **Entrées créées avant cette fonctionnalité** : n'ayant pas de figé (techniquement impossible de le reconstituer), elles continuent d'utiliser les paramètres actuels comme avant — c'est la seule exception.
- **Coût de stockage** : chaque jour enregistré occupe un peu plus de place (il embarque une copie du catalogue), de l'ordre de quelques Ko/jour — sans impact réel à l'échelle de ce commerce, même sur plusieurs années.

### Vérifications effectuées (session la plus récente)
Immunité rétroactive testée en changeant simultanément loyer (×3), TVA, prix d'un ingrédient (×5) et prix de vente d'un produit (×5) après la saisie d'un jour : le bénéfice affiché de ce jour reste rigoureusement identique. Correction d'un jour (ajout d'une vente) testée après un changement de loyer entre-temps : le calcul continue d'utiliser le loyer figé d'origine, pas le nouveau — vérifié à la fois dans l'interface et par lecture directe du figé stocké. Un nouveau jour créé après le changement utilise bien, lui, les nouveaux paramètres. Rétrocompatibilité vérifiée avec une entrée simulée sans figé (repli correct sur les paramètres actuels, aucun crash des écrans Résultats/Cumuls). Indépendance des figés entre les deux journaux vérifiée (Mode complet garde le prix d'avant un changement, Nespresso saisi après le même changement garde le nouveau prix). Bug corrigé au passage : les champs achats/heures étudiants/charges exceptionnelles ne se rechargeaient pas en revenant corriger un jour déjà saisi — c'est réparé et vérifié. 0 erreur JavaScript sur l'ensemble.

## 11. Rentabilité par produit et import depuis Scan Facture (changement majeur)

- **Marge en % dans "Ma carte"** : chaque produit affiche désormais sa marge indicative en euros **et** en pourcentage du prix de vente, avec un affichage en rouge dès que la marge est nulle ou négative — repérage visuel immédiat des produits qui posent problème.
- **Import depuis l'app "Scan Facture"** : dans l'onglet Produits, bouton "📷 Importer depuis Scan Facture" — lit directement les factures déjà scannées sur le même iPhone (les deux apps partagent le même stockage local du navigateur, aucun réseau ni webhook requis) et propose d'ajouter chaque produit détecté comme ingrédient, prérempli (nom, prix).
- **Mise à jour intelligente d'un ingrédient existant** : ajouter (à la main ou via import) un ingrédient dont le nom correspond déjà à un ingrédient existant **met à jour son coût** au lieu de créer un doublon — comparaison insensible à la casse et aux accents (ex. "FRITES SURGELEES" sur un ticket reconnaît bien "Frites surgelées" déjà enregistré). L'identifiant reste le même, donc les recettes existantes restent correctement liées.
- **Alerte "Prix de vente à revoir ?"** : quand le coût d'un ingrédient déjà connu change, une alerte liste automatiquement chaque produit dont la recette l'utilise, avec sa marge avant et après le changement — pensée pour déclencher la discussion sur les prix de vente à chaque nouvelle facture, sans avoir à recalculer à la main.

### Vérifications effectuées (session la plus récente)
Marge % testée et confirmée exacte (ex. 75 % puis recalcul à 65 % après changement de coût). Ajout d'un nouvel ingrédient (nom différent) vérifié inchangé, sans alerte. Mise à jour d'un ingrédient déjà existant testée via le formulaire manuel **et** via l'import Scan Facture, avec des variantes de casse et d'accents (ex. "steak haché" vs "Steak haché", "FRITES SURGELEES" vs "Frites surgelées") : dans tous les cas, aucun doublon créé, coût mis à jour sur le bon identifiant, recette du produit restée correctement liée. Bug réel trouvé et corrigé en cours de vérification : la comparaison ne gérait au départ que la casse, pas les accents — corrigé par une normalisation dédiée. Alerte d'impact vérifiée avec les bons montants de marge avant/après, y compris le cas d'une marge devenant négative (affichage rouge confirmé à la fois dans l'alerte et dans la liste des produits). 0 erreur JavaScript sur l'ensemble des scénarios testés.

## 12. Mode d'emploi intégré dans l'app

Le guide simple destiné à Melissa (avec exemples chiffrés : matières premières, coût/marge d'un produit, alerte de prix) est désormais accessible **directement dans l'app**, sans fichier séparé à lui transmettre : bouton **"📖 Mode d'emploi"** bien visible en haut de l'écran Paramètres.

- Techniquement : nouvelle entrée `"mode-emploi"` dans `HELP_TEXTS`, réutilise le système d'aide déjà existant (même mécanisme que les boutons "?" ailleurs dans l'app) — aucun code JavaScript supplémentaire nécessaire, juste un bouton avec `data-help="mode-emploi"`.
- Le fichier `mode-emploi-simple.md` (à la racine du projet) reste conservé en copie de secours imprimable, mais n'est plus le canal principal — son contenu vit désormais dans l'app elle-même.
- Sa section sur l'import Scan Facture a été retirée (obsolète : les factures du snack passeront finalement par Odoo, pas par ce circuit — voir point 8bis ci-dessous si présent, ou notes de session).

### Vérifications effectuées (session la plus récente)
Bouton "Mode d'emploi" testé : ouverture de la modale, titre et contenu complets affichés, calculs de l'exemple ("Fricadelle sauce") vérifiés exacts (coût matière 1,69 €, marge 2,81 €, 62 %), fermeture correcte. Non-régression vérifiée : les autres boutons d'aide existants (ex. "matières premières") continuent de fonctionner normalement après cet ajout. 0 erreur JavaScript.
