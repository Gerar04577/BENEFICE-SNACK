/* ============================================================
   Bénéfice du Jour — logique de l'application
   ============================================================ */

const KEYS = {
  entries: "benefice-snack:entries",
  entriesNespresso: "benefice-snack:entriesNespresso",
  settings: "benefice-snack:settings",
  ingredients: "benefice-snack:ingredients",
  products: "benefice-snack:products",
  investissements: "benefice-snack:investissements",
  modeNespresso: "benefice-snack:modeNespresso",
  pendingSync: "benefice-snack:pendingSync",
  seeded: "benefice-snack:seeded"
};

const DEFAULT_SETTINGS = {
  tvaRepasSurPlace: 12,
  tvaRepasEmporter: 6,
  tvaAlcool: 21,
  tvaNonAlcoolSurPlace: 21,
  tvaNonAlcoolEmporter: 6,

  // Charges fixes détaillées (€/mois) — leur somme remplace l'ancien champ unique
  chargeLoyer: 0,
  chargeElectricite: 0,
  chargeGaz: 0,
  chargeEau: 0,
  chargeAssuranceIncendie: 0,
  chargeAssuranceAccident: 0,
  chargeComptable: 0,
  chargeSecretariatSocial: 0,
  chargeAbonnements: 0,
  chargeEntretien: 0,
  chargeTaxeCommune: 0,
  chargeTaxeEnseigne: 0,
  chargeTaxeTerrasse: 0,
  chargeEmprunt: 0,

  joursOuvresParMois: 26,
  cotisationsTrimestrielles: 0,
  joursOuvresParTrimestre: 78,

  // Provision impôt progressive (barème IPP belge — indexé chaque année, à vérifier/ajuster)
  quotiteExemptee: 10910,
  trancheSeuil1: 16320,
  trancheSeuil2: 28800,
  trancheSeuil3: 49840,
  trancheTaux1: 25,
  trancheTaux2: 40,
  trancheTaux3: 45,
  trancheTaux4: 50,
  additionnelsCommunaux: 0,

  coutHoraireEtudiant: 0,
  webhookUrl: ""
};

// Catégories d'investissement — durée d'amortissement usuelle (années), barème belge communément admis
const CATEGORIES_INVESTISSEMENT = {
  informatique: { label: "Informatique / caisse (TPV)", duree: 3 },
  logiciel: { label: "Logiciel", duree: 1 },
  cuisson: { label: "Matériel de cuisson (four, plaques)", duree: 6 },
  froid: { label: "Froid / hotte / ventilation", duree: 8 },
  mobilier: { label: "Mobilier / agencement", duree: 7 },
  vehicule: { label: "Véhicule", duree: 5 },
  travaux: { label: "Travaux / aménagements du local", duree: 10 },
  batiment: { label: "Bâtiment (si propriétaire)", duree: 25 },
  autre: { label: "Autre investissement", duree: 5 }
};

// Textes d'aide contextuelle (icône "?") — à destination directe de l'utilisatrice
const HELP_TEXTS = {
  "mode-emploi": {
    titre: "Mode d'emploi simple",
    corps: `<b>1. Les "Matières premières" — le prix de ce que vous achetez</b>
<br><br>
Pour chaque ingrédient : le <b>nom</b>, l'<b>unité</b> (pièce, kg, ou litre), et le <b>coût</b> — ce que vous payez pour une seule unité.
<br><br>
<i>Exemple :</i> vous achetez un sac de frites de 10 kg pour 15 €. Le coût à indiquer n'est pas 15 €, mais <b>1,50 €/kg</b> (15 € ÷ 10 kg).
<br><br>
<table style="width:100%; border-collapse:collapse;">
<tr><td>Pain baguette</td><td>pièce</td><td>0,40 €</td></tr>
<tr><td>Fricadelle</td><td>pièce</td><td>0,90 €</td></tr>
<tr><td>Frites surgelées</td><td>kg</td><td>1,50 €</td></tr>
<tr><td>Sauce (bidon)</td><td>litre</td><td>3,00 €</td></tr>
</table>
<br>
<b>2. "Ma carte" — vos produits vendus, et leur recette</b>
<br><br>
Pour chaque produit : le <b>prix de vente</b>, et la <b>recette</b> — quels ingrédients, en quelle quantité, entrent dans une portion.
<br><br>
<i>Exemple : "Fricadelle sauce"</i><br>
Pain 1 pièce × 0,40 € = 0,40 €<br>
Fricadelle 1 pièce × 0,90 € = 0,90 €<br>
Frites 0,2 kg × 1,50 €/kg = 0,30 €<br>
Sauce 0,03 l × 3,00 €/l = 0,09 €<br>
<b>Total coût matière = 1,69 €</b>
<br><br>
Si ce produit se vend 4,50 €, l'app affiche : <b>Vente 4,50 € · Coût matière 1,69 € · Marge indicative 2,81 € (62%)</b>.
<br><br>
62% veut dire : sur 100 € de vente de ce produit, il reste 62 € une fois la matière première payée.
<br><br>
⚠️ Si le chiffre est en <b style="color:var(--rust)">rouge</b>, la marge est nulle ou négative — ce produit coûte plus cher à préparer qu'il ne rapporte. À corriger en priorité.
<br><br>
<b>3. Où trouver le prix à indiquer</b>
<br><br>
La plupart du temps, vous connaissez déjà le prix (ticket de caisse, facture, ou ce que vous a dit le fournisseur) : ouvrez <b>Produits → Matières premières</b> et saisissez-le à la main.
<br><br>
<b>4. L'alerte "Prix de vente à revoir ?"</b>
<br><br>
Dès qu'un prix d'ingrédient déjà connu change, une alerte apparaît automatiquement, listant chaque produit concerné avec sa marge avant et après :
<br><br>
<i>💡 Prix de vente à revoir ? — Fricadelle sauce — marge 2,81 € → 2,51 € (−0,30 €)</i>
<br><br>
C'est le bon moment pour se demander : faut-il augmenter le prix de vente, ou accepter de gagner un peu moins sur ce produit ?
<br><br>
<b>5. Résumé — les 3 réflexes à avoir</b>
<br><br>
1) Un prix qui change → mettez à jour "Matières premières".<br>
2) Une alerte "Prix de vente à revoir ?" apparaît → décidez si le prix de vente doit changer.<br>
3) Un chiffre en <b style="color:var(--rust)">rouge</b> dans "Ma carte" → ce produit ne rapporte rien (ou pire) — à corriger sans attendre.`
  },
  "livre-journal": {
    titre: "Livre journal (SPF)",
    corps: `Génère un document imprimable à recopier sur le livre journal des recettes, pour le SPF Finances.
<br><br>
Basé uniquement sur le <b>journal Mode complet</b> (jamais le journal Nespresso). Pour chaque jour, les ventes TTC sont réparties par taux de TVA (12 %, 6 %, 21 %, ou tout autre taux paramétré dans Réglages), avec le total HT et la TVA correspondante — en utilisant les taux de TVA figés au moment de chaque jour, même si vous les avez changés depuis.
<br><br>
<b>1) Une seule journée</b> : choisissez une date précise.<br>
<b>2) Un mois entier</b> : toutes les journées de ce mois, avec un total.<br>
<b>3) Une période personnalisée</b> : du... au..., selon vos besoins (ex. pour recopier plusieurs semaines d'un coup).
<br><br>
Le document s'ouvre dans un nouvel onglet, prêt à imprimer. Sur iPhone, dans l'aperçu d'impression, vous pouvez aussi l'enregistrer en PDF via le bouton de partage.`
  },
  "matieres-premieres": {
    titre: "Comment remplir les matières premières",
    corps: `C'est la liste de tous vos ingrédients de base — ce que vous achetez chez le fournisseur pour préparer vos produits.
<br><br>
<b>Nom</b> : ex. "Jambon cuit".<br>
<b>Unité</b> : choisissez comment vous l'achetez — au kg, au litre, ou à la pièce (ex. un pain, un œuf).<br>
<b>Coût par unité</b> : le prix payé au fournisseur pour 1 unité (1 kg, 1 litre, ou 1 pièce) — regardez la vraie facture, pas une estimation.
<br><br>
Ces ingrédients servent ensuite à construire les recettes de "Ma carte", pour calculer automatiquement le coût matière de chaque produit vendu.
<br><br>
⚠️ Rappel : ces coûts servent surtout au classement "quel produit rapporte le plus" et au calcul du journal Nespresso — pas au bénéfice net du Mode complet, qui se base sur le champ "Achats matières (réel)" saisi chaque jour.`
  },
  "ma-carte": {
    titre: "Comment remplir Ma carte",
    corps: `C'est la liste des produits que vous vendez réellement au client.
<br><br>
<b>Nom</b> : ex. "Mitraillette".<br>
<b>Type</b> : repas, boisson alcoolisée ou non-alcoolisée — ça détermine automatiquement le bon taux de TVA appliqué.<br>
<b>Prix de vente</b> : le prix TTC affiché sur votre carte, celui payé par le client.<br>
<b>Temps de préparation</b> (optionnel) : en minutes — utile pour le classement "marge par minute", qui aide à repérer les produits rapides et rentables.<br>
<b>Recette</b> : la liste des ingrédients (et quantités) qui composent ce produit — l'app calcule automatiquement le coût matière à partir de ça.
<br><br>
Une fois un produit créé, il apparaît directement dans l'écran Saisie.`
  },
  "tva": {
    titre: "Comment fonctionne la TVA dans l'app",
    corps: `L'app applique automatiquement le bon taux de TVA belge horeca selon le type de produit et le lieu de vente — vous n'avez rien à choisir au moment de la saisie.
<br><br>
<b>Repas</b> : 12% sur place, 6% à emporter.<br>
<b>Boissons alcoolisées</b> : 21%, toujours, peu importe le lieu.<br>
<b>Boissons non-alcoolisées</b> : 21% sur place, 6% à emporter.
<br><br>
Ces taux sont modifiables ici si la réglementation change — mais ⚠️ à faire valider par le comptable avant de les changer, ce sont des taux légaux, pas de simples préférences.`
  },
  "onedrive": {
    titre: "Sauvegarde et restauration OneDrive",
    corps: `<b>Sauvegarde</b> : automatique, sans bouton à presser — elle se déclenche toute seule quand l'app se ferme ou passe en arrière-plan, et envoie une copie de toutes vos données (les 2 journaux, produits, ingrédients, investissements, paramètres) vers OneDrive via Make.com.
<br><br>
<b>Adresse du webhook Make.com</b> : l'adresse technique fournie par Make.com lors de la configuration du scénario — à coller ici une seule fois.
<br><br>
<b>Restaurer l'historique depuis OneDrive</b> : ⚠️ action sensible — ça remplace TOUTES les données actuellement sur ce téléphone par la dernière sauvegarde trouvée sur OneDrive. À utiliser uniquement si vous changez d'appareil ou si vous avez perdu des données localement, jamais "juste pour voir".`
  },
  "historique-badges": {
    titre: "Que veulent dire les badges de l'historique",
    corps: `À côté de chaque date, un petit badge indique si cette journée a bien été envoyée vers OneDrive :
<br><br>
<b>"OneDrive ✓"</b> (vert) : cette journée est sauvegardée sur OneDrive, en sécurité même si le téléphone est perdu ou cassé.<br>
<b>"en attente"</b> : pas encore envoyée — ça arrive normalement tout seul à la prochaine fermeture de l'app avec une connexion internet active, aucune action nécessaire de votre part.
<br><br>
Si "en attente" reste affiché longtemps, vérifiez la connexion internet du téléphone, ou que l'adresse du webhook Make.com est bien renseignée dans Paramètres.`
  },
  "parametres-figes": {
    titre: "Corriger une journée / paramètres figés",
    corps: `<b>Pour corriger une erreur sur un jour déjà saisi :</b><br>
Tapez sur le champ Date, choisissez le jour à corriger — tout se recharge automatiquement (ventes, achats, heures, charges). Modifiez ce qu'il faut, puis "Enregistrer la journée".
<br><br>
⚠️ Vérifiez d'abord que vous êtes sur le <b>bon journal</b> (bouton en haut : Mode complet ou Nespresso) — une même date peut avoir une saisie différente dans chacun.
<br><br>
<b>Pourquoi les chiffres d'un jour ancien ne bougent jamais :</b><br>
Chaque jour enregistré fige, au moment de sa saisie, une photo complète de tout ce qui sert à son calcul : les charges fixes, la TVA, les cotisations, le prix des produits, le coût des ingrédients, les investissements — tout.
<br><br>
Résultat : si vous changez un prix ou une charge dans Paramètres <b>après coup</b>, ça ne change <b>jamais</b> le calcul des jours déjà enregistrés. Seuls les nouveaux jours utilisent les valeurs à jour.
<br><br>
Et si vous corrigez un jour ancien (ex. ajouter une vente oubliée), la correction réutilise <b>les paramètres figés de ce jour-là</b> — pas ceux d'aujourd'hui — même si vous avez changé des prix entre-temps.
<br><br>
C'est voulu : ça reflète la réalité de ce que vous avez vraiment gagné ce jour précis, avec les vrais prix et charges de l'époque.`
  },
  "charges-fixes": {
    titre: "Comment remplir les charges fixes",
    corps: `Indiquez ici vos frais qui reviennent chaque mois, même les jours où le snack est fermé.
<br><br>
<b>Loyer</b> : le loyer mensuel du local (+ charges locatives si séparées).<br>
<b>Électricité</b> : facture mensuelle moyenne.<br>
<b>Gaz</b> : laissez à 0 si le rez-de-chaussée commercial n'a pas de gaz pour l'instant — à remplir si ça change un jour.<br>
<b>Eau</b> : laissez à 0 tant que c'est gratuit — à remplir si ça change un jour.<br>
<b>Assurance incendie</b> : prime mensuelle de l'assurance incendie/local.<br>
<b>Assurance accident de travail</b> : prime mensuelle de l'assurance accident de travail.<br>
<b>Comptable</b> : honoraires mensuels du comptable.<br>
<b>Secrétariat social</b> : ce que vous payez chaque mois au secrétariat social.<br>
<b>Abonnements</b> : logiciel de caisse, téléphone, internet.<br>
<b>Entretien</b> : nettoyage, enlèvement des déchets/graisses.<br>
<b>Taxe communale</b>, <b>Taxe enseigne</b>, <b>Taxe terrasse</b> : séparées car elles arrivent généralement sur des factures distinctes.<br>
<b>Remboursement d'emprunt</b> : mensualité si un crédit a servi à financer le matériel ou le local.
<br><br>
Le total est calculé automatiquement et utilisé pour répartir ces frais sur chaque jour ouvré du mois.`
  },
  "investissements": {
    titre: "Comment remplir les investissements",
    corps: `Un investissement est un achat destiné à durer plusieurs années (four, frigo, caisse, mobilier, véhicule...) — pas un achat de matière première du jour.
<br><br>
Pour chaque investissement, indiquez :<br>
<b>Nom</b> : ex. "Friteuse professionnelle".<br>
<b>Montant</b> : prix payé (TVA comprise si vous ne récupérez pas la TVA).<br>
<b>Catégorie</b> : choisissez celle qui correspond le mieux — la durée d'amortissement se remplit toute seule selon le barème belge habituel.<br>
<b>Date de mise en service</b> : le jour où vous avez commencé à l'utiliser (pas forcément la date d'achat).
<br><br>
L'app répartit alors automatiquement le coût sur la durée indiquée et l'intègre dans le calcul du bénéfice, comme une charge fixe mensuelle supplémentaire.
<br><br>
<b>Exception importante — petit matériel de moins de 500 € :</b><br>
Si le montant payé est <b>inférieur à 500 €</b> (ex. un petit ustensile, une petite friteuse d'appoint), l'app ne l'étale <b>pas</b> sur plusieurs années. Elle déduit le montant <b>en une seule fois</b>, le mois où vous l'avez mis en service — c'est la règle fiscale belge pour le "petit matériel". Peu importe la catégorie choisie dans ce cas : c'est uniquement le montant qui décide. Au-delà de 500 €, l'étalement sur plusieurs années s'applique normalement.
<br><br>
⚠️ Les durées proposées sont "communément admises" mais pas gravées dans le marbre — demandez confirmation à votre comptable, qui peut les ajuster selon le bien réel.`
  },
  "cumuls": {
    titre: "Comment lire les cumuls",
    corps: `Cet écran regroupe les bénéfices déjà saisis, à trois niveaux :
<br><br>
<b>Par jour</b> : les 30 derniers jours saisis, avec les deux journaux côte à côte (Mode complet et Nespresso) — <b>totalement indépendants</b>, jamais additionnés entre eux. Un tiret "—" signifie simplement qu'aucune vente n'a été saisie ce jour-là dans ce journal précis (pas forcément dans l'autre).<br>
<b>Par mois calendaire</b> : le total du mois pour chaque journal séparément, avec une <b>projection</b> de ce que ça donnerait en fin de mois si le rythme actuel continue (calculée sur les jours calendrier, pas seulement les jours travaillés).<br>
<b>Par année fiscale</b> : le total de l'année (1er janvier au 31 décembre) pour chaque journal séparément, avec une projection de fin d'année — disponible seulement une fois janvier terminé, pour avoir un minimum de recul.
<br><br>
⚠️ Les projections sont des estimations basées sur la tendance actuelle, pas une garantie — un mois d'été et un mois d'hiver peuvent être très différents.`
  },
  "analyse-produits": {
    titre: "Comment lire l'analyse des produits",
    corps: `Chaque mois, l'app regarde les ventes du mois précédent (une fois qu'il est terminé) et identifie :<br>
- le produit qui rapporte le plus (à mettre en avant, à pousser à la vente)<br>
- le produit le moins rentable, voire qui ne rapporte rien (à surveiller ou à retirer de la carte)
<br><br>
Le classement se base sur la marge par minute de préparation quand le temps est renseigné (sinon la marge par vente) — un produit rapide et peu cher peut être plus rentable qu'un plat long à préparer, même si sa marge en euros semble plus petite.
<br><br>
Cette analyse s'affiche automatiquement une fois par mois à l'ouverture de l'app, et reste toujours consultable ici.`
  },
  "nespresso": {
    titre: "Qu'est-ce que le journal Nespresso ?",
    corps: `C'est un 2ᵉ journal de ventes, complètement SÉPARÉ du Mode complet — un bouton en haut de l'app permet de basculer de l'un à l'autre.
<br><br>
<b>Les deux journaux sont totalement indépendants</b> : les ventes saisies dans l'un n'apparaissent JAMAIS dans l'autre, même à la même date. Saisir 5 sandwichs aujourd'hui dans le Mode complet n'a aucun effet sur le journal Nespresso — il faudrait les saisir une 2ᵉ fois, séparément, si vous voulez qu'ils y apparaissent aussi.
<br><br>
Le catalogue de produits et ingrédients (Ma carte, Matières premières) reste le même dans les deux — seules les <b>ventes du jour</b> sont séparées.
<br><br>
En journal Nespresso, le calcul est volontairement très simple :<br>
<b>Bénéfice = prix de vente payé par le client − coût des ingrédients de la recette</b>, tel quel, sans rien retirer d'autre — pas de TVA, pas de charges fixes, pas d'amortissement, pas de cotisations, pas de provision impôt. C'est pour ça que les champs "heures étudiants", "achats matières" et "charges exceptionnelles" disparaissent de la saisie dans ce journal : ils ne servent à rien ici.
<br><br>
⚠️ Ce chiffre ne doit jamais être confondu avec le vrai bénéfice net du Mode complet — ce sont deux comptabilités différentes, avec des ventes différentes.`
  },
  "provision-impot": {
    titre: "Comment fonctionne la provision impôt",
    corps: `L'app met de côté chaque jour une partie du bénéfice pour anticiper l'impôt à payer plus tard, en suivant le vrai système progressif belge :
<br><br>
- Les premiers <b>10 910 €</b> gagnés dans l'année (quotité exemptée) ne sont quasiment pas taxés.<br>
- Ensuite, le taux appliqué augmente par paliers : <b>25% → 40% → 45% → 50%</b> selon le cumul déjà gagné depuis le 1er janvier.<br>
- Concrètement : un même bénéfice de 500 € sera peu taxé en janvier, et plus taxé en décembre si l'année a été bonne.
<br><br>
Les <b>seuils et taux</b> sont à vérifier chaque année (ils sont indexés), et le champ <b>additionnels communaux</b> dépend de la commune — demandez ces deux informations au comptable.
<br><br>
⚠️ Ceci reste une estimation de trésorerie, pas une déclaration fiscale officielle — surtout si le snack n'est pas l'unique revenu du foyer.`
  }
};

const TYPE_LABELS = {
  repas: "Repas",
  alcool: "Boisson alcoolisée",
  nonalcool: "Boisson non-alcoolisée"
};

/* ============================================================
   Stockage local
   ============================================================ */
function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2));
}

function loadJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadSettings() { return { ...DEFAULT_SETTINGS, ...loadJSON(KEYS.settings, {}) }; }
function saveSettings(s) { saveJSON(KEYS.settings, s); }

function loadEntries() { return loadJSON(KEYS.entries, []); }
function saveEntries(e) { saveJSON(KEYS.entries, e); }
function loadEntriesNespresso() { return loadJSON(KEYS.entriesNespresso, []); }
function saveEntriesNespresso(e) { saveJSON(KEYS.entriesNespresso, e); }

// Journal actif selon le mode en cours (Mode complet ou Mode Nespresso) — utilisé partout
// où l'écran doit refléter "ce qu'on est en train de remplir en ce moment".
function loadCurrentJournal() { return isModeNespresso() ? loadEntriesNespresso() : loadEntries(); }
function saveCurrentJournal(list) { isModeNespresso() ? saveEntriesNespresso(list) : saveEntries(list); }

function loadIngredients() { return loadJSON(KEYS.ingredients, []); }
function saveIngredients(list) { saveJSON(KEYS.ingredients, list); }

function loadProducts() { return loadJSON(KEYS.products, []); }
function saveProducts(list) { saveJSON(KEYS.products, list); }

function loadInvestissements() { return loadJSON(KEYS.investissements, []); }
function saveInvestissements(list) { saveJSON(KEYS.investissements, list); }

/* ============================================================
   Charges fixes totales (somme des sous-postes)
   ============================================================ */
function totalChargesFixes(settings) {
  // Repli sur les anciens champs groupes (chargeEnergie / chargeTaxesLocales) pour les
  // journees deja figees AVANT la separation en sous-postes — sinon leur total historique
  // perdrait silencieusement ces montants. Une journee figee APRES la separation a toujours
  // les nouveaux champs definis (meme a 0), donc le test "!= null" distingue bien les deux cas.
  const energie = (settings.chargeElectricite != null || settings.chargeGaz != null || settings.chargeEau != null)
    ? (settings.chargeElectricite || 0) + (settings.chargeGaz || 0) + (settings.chargeEau || 0)
    : (settings.chargeEnergie || 0);
  const taxesLocales = (settings.chargeTaxeCommune != null || settings.chargeTaxeEnseigne != null || settings.chargeTaxeTerrasse != null)
    ? (settings.chargeTaxeCommune || 0) + (settings.chargeTaxeEnseigne || 0) + (settings.chargeTaxeTerrasse || 0)
    : (settings.chargeTaxesLocales || 0);
  return (settings.chargeLoyer || 0) + energie +
    (settings.chargeAssuranceIncendie || 0) + (settings.chargeAssuranceAccident || 0) +
    (settings.chargeComptable || 0) + (settings.chargeSecretariatSocial || 0) +
    (settings.chargeAbonnements || 0) + (settings.chargeEntretien || 0) +
    taxesLocales + (settings.chargeEmprunt || 0);
}

/* ============================================================
   Amortissement des investissements
   ============================================================ */
// Seuil belge : en dessous de ce montant (HTVA), le petit matériel est déduit
// en une fois, l'année de son achat, plutôt qu'amorti sur plusieurs années.
const SEUIL_PETIT_MATERIEL = 500;

function estPetitMateriel(inv) {
  return (inv.montant || 0) < SEUIL_PETIT_MATERIEL;
}

// Amortissement mensuel total encore actif à une date donnée (les investissements
// totalement amortis, au-delà de leur durée, ne comptent plus ; le petit matériel
// <500€ est compté en entier sur le seul mois de sa mise en service, puis plus rien).
function totalAmortissementMensuel(dateStr, investissements) {
  const date = new Date(dateStr + "T00:00:00");
  return investissements.reduce((sum, inv) => {
    const debut = new Date(inv.dateMiseEnService + "T00:00:00");
    if (isNaN(debut.getTime())) return sum;

    if (estPetitMateriel(inv)) {
      // Déduit intégralement le mois de mise en service uniquement.
      const memeMois = date.getFullYear() === debut.getFullYear() && date.getMonth() === debut.getMonth();
      return memeMois ? sum + (inv.montant || 0) : sum;
    }

    const cat = CATEGORIES_INVESTISSEMENT[inv.categorie] || CATEGORIES_INVESTISSEMENT.autre;
    const duree = inv.dureeAnnees || cat.duree || 5;
    if (date < debut) return sum;
    const finAmortissement = new Date(debut);
    finAmortissement.setFullYear(finAmortissement.getFullYear() + duree);
    if (date >= finAmortissement) return sum;
    return sum + (inv.montant || 0) / duree / 12;
  }, 0);
}

/* ============================================================
   Provision impôt progressive (barème IPP belge)
   ============================================================ */
// Impôt brut par tranches, sur un revenu imposable donné (avant réduction quotité exemptée).
function impotBrutParTranches(revenu, settings) {
  if (revenu <= 0) return 0;
  const paliers = [
    { seuil: settings.trancheSeuil1, taux: settings.trancheTaux1 },
    { seuil: settings.trancheSeuil2, taux: settings.trancheTaux2 },
    { seuil: settings.trancheSeuil3, taux: settings.trancheTaux3 },
    { seuil: Infinity, taux: settings.trancheTaux4 }
  ];
  let impot = 0;
  let bas = 0;
  for (const p of paliers) {
    const haut = Math.min(revenu, p.seuil);
    if (haut > bas) impot += (haut - bas) * (p.taux / 100);
    bas = p.seuil;
    if (revenu <= p.seuil) break;
  }
  return impot;
}

// Impôt net total dû sur un cumul de revenu depuis le 1er janvier (réduction quotité
// exemptée + additionnels communaux appliqués).
function impotNetCumule(revenu, settings) {
  if (revenu <= 0) return 0;
  const brut = impotBrutParTranches(revenu, settings);
  const reduction = (settings.quotiteExemptee || 0) * ((settings.trancheTaux1 || 0) / 100);
  const net = Math.max(0, brut - reduction);
  return net * (1 + (settings.additionnelsCommunaux || 0) / 100);
}

// Détermine dans quelle tranche se situe un cumul de revenu (index 0 à 3), pour détecter
// un changement de palier entre deux cumuls.
function trancheIndex(revenu, settings) {
  if (revenu <= (settings.quotiteExemptee || 0)) return -1;
  if (revenu <= settings.trancheSeuil1) return 0;
  if (revenu <= settings.trancheSeuil2) return 1;
  if (revenu <= settings.trancheSeuil3) return 2;
  return 3;
}

const TRANCHE_TAUX_LABELS = (s) => [s.trancheTaux1, s.trancheTaux2, s.trancheTaux3, s.trancheTaux4];

/* ============================================================
   Paramètres figés par journée ("snapshot")
   Chaque jour enregistré fige, au moment de la saisie, une copie
   complète des paramètres, produits, ingrédients et investissements
   en vigueur ce jour-là. Modifier les Paramètres ou les prix
   PLUS TARD ne change donc plus jamais le calcul des jours déjà
   enregistrés — seuls les nouveaux jours utilisent les valeurs
   actuelles. Les entrées créées avant cette fonctionnalité n'ont
   pas de snapshot : elles continuent d'utiliser les valeurs
   actuelles (comportement précédent), faute de mieux.
   ============================================================ */
function buildSnapshotParams() {
  return {
    settings: loadSettings(),
    products: loadProducts(),
    ingredients: loadIngredients(),
    investissements: loadInvestissements()
  };
}

// Retourne les paramètres à utiliser pour CETTE entrée : ceux figés à sa création si
// disponibles, sinon les paramètres actuels (repli pour les anciennes entrées).
function resolveParams(entry, liveSettings, liveProducts, liveIngredients, liveInvestissements) {
  const snap = entry.snapshotParams;
  if (!snap) return { settings: liveSettings, products: liveProducts, ingredients: liveIngredients, investissements: liveInvestissements };
  return {
    settings: { ...DEFAULT_SETTINGS, ...(snap.settings || {}) },
    products: snap.products || liveProducts,
    ingredients: snap.ingredients || liveIngredients,
    investissements: snap.investissements || liveInvestissements
  };
}

// Cumul du bénéfice avant impôt depuis le 1er janvier de l'année de `date`, en excluant
// cette date elle-même (pour connaître le point de départ AVANT le jour en cours).
function cumulBeneficeAvantImpotDepuisJanvier(dateStr, settings, products, ingredients) {
  const annee = dateStr.slice(0, 4);
  const entries = loadEntries().filter((e) => e.date.slice(0, 4) === annee && e.date < dateStr);
  return entries.reduce((sum, e) => sum + computeDayBeneficeAvantImpot(e, settings, products, ingredients), 0);
}

// Version allégée de computeDay qui ne calcule que le bénéfice avant impôt (utilisée
// pour reconstruire le cumul annuel sans recalculer toute la structure d'affichage).
// Utilise les paramètres figés du jour `e` s'ils existent (voir resolveParams).
function computeDayBeneficeAvantImpot(entry, liveSettings, liveProducts, liveIngredients) {
  const { settings, products, ingredients, investissements } = resolveParams(entry, liveSettings, liveProducts, liveIngredients, loadInvestissements());
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));
  let ventesHTTotal = 0;
  (entry.ventes || []).forEach((v) => {
    const p = productsById[v.productId];
    if (!p) return;
    const qteSurPlace = v.qteSurPlace || 0;
    const qteEmporter = v.qteEmporter || 0;
    const qteTotal = qteSurPlace + qteEmporter;
    if (qteTotal === 0) return;
    const tauxSP = tauxTVA(p.type, "surPlace", settings);
    const tauxEmp = tauxTVA(p.type, "emporter", settings);
    ventesHTTotal += (qteSurPlace * p.prixVente) / (1 + tauxSP / 100) + (qteEmporter * p.prixVente) / (1 + tauxEmp / 100);
  });
  const chargesFixesJour = totalChargesFixes(settings) / (settings.joursOuvresParMois || 1);
  const amortissementJour = totalAmortissementMensuel(entry.date, investissements) / (settings.joursOuvresParMois || 1);
  const cotisationsJour = settings.cotisationsTrimestrielles / (settings.joursOuvresParTrimestre || 1);
  const coutEtudiantsJour = (entry.heuresEtudiants || 0) * settings.coutHoraireEtudiant;
  return ventesHTTotal - (entry.achats || 0) - chargesFixesJour - amortissementJour - cotisationsJour - coutEtudiantsJour - (entry.chargesExceptionnelles || 0);
}

function todayISO() { return new Date().toISOString().slice(0, 10); }
function eur(n) {
  return (Math.round((n || 0) * 100) / 100).toLocaleString("fr-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function eurOuTiret(n) { return n == null ? "—" : eur(n); }
// Affichage de date au format JJ/MM/AAAA, indépendamment des réglages régionaux du téléphone.
function formatDateFR(dateStr) {
  if (!dateStr || dateStr.length < 10) return dateStr || "";
  return `${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)}/${dateStr.slice(0, 4)}`;
}

/* ============================================================
   Cumuls (jour / mois / année fiscale) — deux journaux de ventes
   totalement indépendants (Mode complet / Mode Nespresso).
   Une même date peut exister dans un journal, dans l'autre, dans
   les deux, ou dans aucun — sans aucun lien entre les deux.
   ============================================================ */
function joursDansMois(annee, mois1a12) {
  return new Date(annee, mois1a12, 0).getDate(); // mois1a12 : 1=janvier
}
function joursDansAnnee(annee) {
  return (new Date(annee, 1, 29).getMonth() === 1) ? 366 : 365; // test année bissextile
}
function jourDeLAnnee(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const debut = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d - debut) / 86400000) + 1;
}

// Calcule, pour chaque jour saisi d'UN journal donné, le bénéfice (fonction de calcul fournie).
function computeAllDailyPourJournal(entries, computeFn) {
  return entries.slice().sort((a, b) => a.date.localeCompare(b.date)).map((e) => ({ date: e.date, valeur: computeFn(e) }));
}

// Regroupe une liste { date, valeur } d'UN SEUL journal par mois ("YYYY-MM") ou année ("YYYY").
function regrouperUn(daily, longueurCle) {
  const map = new Map();
  daily.forEach((d) => {
    const cle = d.date.slice(0, longueurCle);
    if (!map.has(cle)) map.set(cle, { cle, total: 0, dates: [] });
    const g = map.get(cle);
    g.total += d.valeur;
    g.dates.push(d.date);
  });
  return Array.from(map.values()).sort((a, b) => b.cle.localeCompare(a.cle));
}

// Fusionne deux regroupements indépendants (complet / nespresso) par clé, pour l'affichage
// côte à côte — sans jamais mélanger les totaux entre eux.
function fusionnerParCle(groupesComplet, groupesNespresso) {
  const map = new Map();
  groupesComplet.forEach((g) => map.set(g.cle, { cle: g.cle, complet: g.total, datesComplet: g.dates, nespresso: null, datesNespresso: [] }));
  groupesNespresso.forEach((g) => {
    if (!map.has(g.cle)) map.set(g.cle, { cle: g.cle, complet: null, datesComplet: [], nespresso: g.total, datesNespresso: g.dates });
    else { const e = map.get(g.cle); e.nespresso = g.total; e.datesNespresso = g.dates; }
  });
  return Array.from(map.values()).sort((a, b) => b.cle.localeCompare(a.cle));
}

// Projection au prorata des jours calendrier écoulés (pas seulement les jours saisis).
function projeter(cumul, joursEcoules, joursTotal) {
  if (joursEcoules <= 0) return null;
  return (cumul / joursEcoules) * joursTotal;
}

function buildCumuls(products, ingredients, settings) {
  const entriesComplet = loadEntries();
  const entriesNespresso = loadEntriesNespresso();
  const dailyComplet = computeAllDailyPourJournal(entriesComplet, (e) => computeDay(e, settings, products, ingredients).beneficeNet);
  const dailyNespresso = computeAllDailyPourJournal(entriesNespresso, (e) => computeDayNespresso(e, products, ingredients).beneficeNespresso);

  const daily = fusionnerParCle(
    dailyComplet.map((d) => ({ cle: d.date, total: d.valeur, dates: [d.date] })),
    dailyNespresso.map((d) => ({ cle: d.date, total: d.valeur, dates: [d.date] }))
  ).map((d) => ({ date: d.cle, complet: d.complet, nespresso: d.nespresso }));

  const moisFusion = fusionnerParCle(regrouperUn(dailyComplet, 7), regrouperUn(dailyNespresso, 7));
  const anneesFusion = fusionnerParCle(regrouperUn(dailyComplet, 4), regrouperUn(dailyNespresso, 4));

  const today = todayISO();
  const [anneeAuj, moisAuj] = [parseInt(today.slice(0, 4), 10), parseInt(today.slice(5, 7), 10)];

  const moisAvecProjection = moisFusion.map((m) => {
    const [a, mo] = m.cle.split("-").map((x) => parseInt(x, 10));
    const total = joursDansMois(a, mo);
    const estMoisEnCours = a === anneeAuj && mo === moisAuj;
    const ecouleComplet = (estMoisEnCours && m.datesComplet.length) ? Math.max(parseInt(today.slice(8, 10), 10), ...m.datesComplet.map((d) => parseInt(d.slice(8, 10), 10))) : total;
    const ecouleNespresso = (estMoisEnCours && m.datesNespresso.length) ? Math.max(parseInt(today.slice(8, 10), 10), ...m.datesNespresso.map((d) => parseInt(d.slice(8, 10), 10))) : total;
    return {
      ...m,
      joursTotal: total,
      estMoisEnCours,
      projectionComplet: (estMoisEnCours && m.complet != null) ? projeter(m.complet, ecouleComplet, total) : null,
      projectionNespresso: (estMoisEnCours && m.nespresso != null) ? projeter(m.nespresso, ecouleNespresso, total) : null,
      joursEcoulesComplet: ecouleComplet,
      joursEcoulesNespresso: ecouleNespresso
    };
  });

  const anneesAvecProjection = anneesFusion.map((y) => {
    const a = parseInt(y.cle, 10);
    const total = joursDansAnnee(a);
    const estAnneeEnCours = a === anneeAuj;
    const premierMoisEcoule = estAnneeEnCours ? moisAuj > 1 : true;
    const ecouleComplet = (estAnneeEnCours && y.datesComplet.length) ? Math.max(jourDeLAnnee(today), ...y.datesComplet.map(jourDeLAnnee)) : total;
    const ecouleNespresso = (estAnneeEnCours && y.datesNespresso.length) ? Math.max(jourDeLAnnee(today), ...y.datesNespresso.map(jourDeLAnnee)) : total;
    const projectionDisponible = estAnneeEnCours && premierMoisEcoule;
    return {
      ...y,
      joursTotal: total,
      estAnneeEnCours,
      projectionDisponible,
      projectionComplet: (projectionDisponible && y.complet != null) ? projeter(y.complet, ecouleComplet, total) : null,
      projectionNespresso: (projectionDisponible && y.nespresso != null) ? projeter(y.nespresso, ecouleNespresso, total) : null,
      joursEcoulesComplet: ecouleComplet,
      joursEcoulesNespresso: ecouleNespresso
    };
  });

  return { daily, mois: moisAvecProjection, annees: anneesAvecProjection };
}

/* ============================================================
   Analyse mensuelle des produits — basée sur le journal Mode complet
   (marge par minute de préparation la plus significative). Le Mode
   Nespresso n'a pas d'équivalent : il n'a pas de notion de temps ni
   de charges à optimiser, seulement ventes − achats.
   ============================================================ */
function moisPrecedentCle(today) {
  const d = new Date(today + "T00:00:00");
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

// Agrège les lignes de vente (marge, marge/min) de toutes les entrées d'un mois donné ("YYYY-MM").
function analyseMensuelleProduits(moisCle, settings, products, ingredients) {
  const entries = loadEntries().filter((e) => e.date.startsWith(moisCle));
  if (entries.length === 0) return null;

  const parProduit = new Map();
  entries.forEach((e) => {
    const r = computeDay(e, settings, products, ingredients);
    r.lignes.forEach((l) => {
      if (!parProduit.has(l.productId)) parProduit.set(l.productId, { nom: l.nom, margeTotale: 0, qteTotale: 0, tempsTotalMin: 0 });
      const p = parProduit.get(l.productId);
      p.margeTotale += l.marge;
      p.qteTotale += l.qteTotal;
      if (l.tempsPreparationMin) p.tempsTotalMin += l.tempsPreparationMin * l.qteTotal;
    });
  });

  const liste = Array.from(parProduit.values()).map((p) => ({
    ...p,
    margeParMinute: p.tempsTotalMin > 0 ? p.margeTotale / p.tempsTotalMin : null,
    margeParVente: p.qteTotale > 0 ? p.margeTotale / p.qteTotale : 0
  }));
  if (liste.length === 0) return null;

  liste.sort((a, b) => (b.margeParMinute != null ? b.margeParMinute : b.margeParVente) - (a.margeParMinute != null ? a.margeParMinute : a.margeParVente));
  const meilleur = liste[0];
  const pire = liste[liste.length - 1];

  let message = `Analyse du mois de ${moisCle} (Mode complet) : `;
  if (liste.length > 1 && meilleur !== pire) {
    message += `"${meilleur.nom}" est le produit le plus rentable (${eur(meilleur.margeTotale)} de marge sur le mois${meilleur.margeParMinute != null ? `, ${eur(meilleur.margeParMinute)}/min` : ""}) — à mettre en avant. `;
    if (pire.margeParVente <= 0) {
      message += `"${pire.nom}" ne rapporte rien ou fait perdre de l'argent (${eur(pire.margeTotale)} sur le mois) — à revoir ou retirer de la carte.`;
    } else {
      message += `"${pire.nom}" est le moins rentable actuellement (${eur(pire.margeTotale)} sur le mois) — à surveiller.`;
    }
  } else {
    message += `"${meilleur.nom}" est votre seul produit vendu ce mois-ci (${eur(meilleur.margeTotale)} de marge).`;
  }
  return { moisCle, liste, message };
}

function cleAlerteVue(moisCle) { return "benefice-snack:alerteVue:" + moisCle; }

/* ============================================================
   Graphiques (SVG natif, aucune bibliothèque externe requise)
   ============================================================ */
const CHART_GREEN = "#3B5D42", CHART_GOLD = "#B8892B", CHART_RUST = "#A63D2F", CHART_LINE = "#C9BFA9";
const SVGNS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

function clearSvg(id) {
  const svg = document.getElementById(id);
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  return svg;
}

// Courbe à 2 séries (Mode complet / Mode Nespresso).
function drawLineChart(id, labels, serieA, serieB) {
  const svg = clearSvg(id);
  if (labels.length === 0) return;
  const W = 340, H = 160, padL = 6, padR = 10, padB = 20, padT = 10;
  const all = [...serieA, ...serieB, 0];
  const max = Math.max(...all), min = Math.min(...all);
  const span = (max - min) || 1;
  const x = (i) => labels.length > 1 ? padL + (i / (labels.length - 1)) * (W - padL - padR) : padL;
  const y = (v) => padT + (1 - (v - min) / span) * (H - padT - padB);

  svg.appendChild(svgEl("line", { x1: padL, y1: y(0), x2: W - padR, y2: y(0), stroke: CHART_LINE, "stroke-dasharray": "3,3" }));
  [[serieA, CHART_GREEN], [serieB, CHART_GOLD]].forEach(([serie, color]) => {
    if (serie.length === 0) return;
    const d = "M " + serie.map((v, i) => `${x(i)},${y(v)}`).join(" L ");
    svg.appendChild(svgEl("path", { d, fill: "none", stroke: color, "stroke-width": 2 }));
  });
  svg.appendChild(Object.assign(svgEl("text", { x: padL, y: H - 4, "font-size": 9, fill: "#5A5147" }), { textContent: labels[0] }));
  if (labels.length > 1) {
    svg.appendChild(Object.assign(svgEl("text", { x: W - padR - 18, y: H - 4, "font-size": 9, fill: "#5A5147" }), { textContent: labels[labels.length - 1] }));
  }
}

// Barres groupées à 2 séries (Mode complet / Mode Nespresso), valeurs pouvant être négatives.
function drawGroupedBarChart(id, labels, serieA, serieB) {
  const svg = clearSvg(id);
  if (labels.length === 0) return;
  const W = 340, H = 160, padB = 20, padT = 10;
  const maxAbs = Math.max(...serieA.map(Math.abs), ...serieB.map(Math.abs), 1);
  const zeroY = H - padB;
  const scale = (H - padT - padB) / maxAbs;
  const groupW = W / labels.length;
  const barW = groupW * 0.3;

  labels.forEach((label, i) => {
    const gx = i * groupW + groupW * 0.15;
    [[serieA[i], CHART_GREEN, gx], [serieB[i], CHART_GOLD, gx + barW + 3]].forEach(([val, color, bx]) => {
      const h = Math.abs(val) * scale;
      const barY = val >= 0 ? zeroY - h : zeroY;
      svg.appendChild(svgEl("rect", { x: bx, y: barY, width: barW, height: Math.max(h, 1), fill: color }));
    });
    svg.appendChild(Object.assign(svgEl("text", { x: gx, y: H - 5, "font-size": 9, fill: "#5A5147" }), { textContent: label }));
  });
}

// Barres horizontales de classement (marge par produit, triée décroissante).
function drawHorizontalBarChart(id, labels, values) {
  const svg = clearSvg(id);
  if (labels.length === 0) return;
  const W = 340, H = Math.max(160, labels.length * 30), padL = 92, padR = 44;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const maxAbs = Math.max(...values.map(Math.abs), 1);
  const rowH = H / labels.length;

  labels.forEach((label, i) => {
    const rowY = i * rowH + rowH * 0.2;
    const w = (Math.abs(values[i]) / maxAbs) * (W - padL - padR);
    const color = values[i] <= 0 ? CHART_RUST : (i === 0 ? CHART_GREEN : CHART_GOLD);
    const texteLabel = label.length > 16 ? label.slice(0, 15) + "…" : label;
    svg.appendChild(Object.assign(svgEl("text", { x: 0, y: rowY + rowH * 0.35, "font-size": 10, fill: "#241F1A" }), { textContent: texteLabel }));
    svg.appendChild(svgEl("rect", { x: padL, y: rowY, width: Math.max(w, 1), height: rowH * 0.5, fill: color }));
    svg.appendChild(Object.assign(svgEl("text", { x: padL + w + 4, y: rowY + rowH * 0.35, "font-size": 9, fill: "#5A5147" }), { textContent: eur(values[i]) }));
  });
}

/* ============================================================
   Données d'exemple (à modifier/supprimer librement)
   Coûts indicatifs uniquement — à remplacer par les vraies
   factures fournisseurs.
   ============================================================ */
function seedExampleData() {
  if (loadJSON(KEYS.seeded, false)) return;
  if (loadIngredients().length > 0 || loadProducts().length > 0) {
    saveJSON(KEYS.seeded, true);
    return;
  }

  const ing = (nom, unite, cout) => ({ id: uid(), nom, unite, coutParUnite: cout });
  const ingredients = [
    ing("Pain baguette", "piece", 0.45),
    ing("Jambon cuit", "kg", 9.0),
    ing("Fromage", "kg", 8.0),
    ing("Beurre", "kg", 6.5),
    ing("Fricadelle", "piece", 0.9),
    ing("Frites surgelées", "kg", 2.2),
    ing("Sauce", "l", 4.0),
    ing("Garniture crudités (portion)", "piece", 0.3),
    ing("Steak haché", "kg", 8.5),
    ing("Garniture oignon/câpres (portion)", "piece", 0.25),
    ing("Canette soda", "piece", 0.55),
    ing("Eau bouteille 50cl", "piece", 0.35),
    ing("Bière bouteille 25cl", "piece", 0.9)
  ];
  saveIngredients(ingredients);
  const byName = Object.fromEntries(ingredients.map((i) => [i.nom, i.id]));

  const products = [
    {
      id: uid(), nom: "Mitraillette / Américain", type: "repas", prixVente: 6.5, tempsPreparationMin: 4,
      recette: [
        { ingredientId: byName["Pain baguette"], quantite: 1 },
        { ingredientId: byName["Fricadelle"], quantite: 1 },
        { ingredientId: byName["Frites surgelées"], quantite: 0.2 },
        { ingredientId: byName["Sauce"], quantite: 0.03 }
      ]
    },
    {
      id: uid(), nom: "Jambon-fromage-crudités", type: "repas", prixVente: 4.5, tempsPreparationMin: 3,
      recette: [
        { ingredientId: byName["Pain baguette"], quantite: 1 },
        { ingredientId: byName["Jambon cuit"], quantite: 0.06 },
        { ingredientId: byName["Fromage"], quantite: 0.04 },
        { ingredientId: byName["Beurre"], quantite: 0.01 },
        { ingredientId: byName["Garniture crudités (portion)"], quantite: 1 }
      ]
    },
    {
      id: uid(), nom: "Américain (steak tartare)", type: "repas", prixVente: 6.0, tempsPreparationMin: 5,
      recette: [
        { ingredientId: byName["Pain baguette"], quantite: 1 },
        { ingredientId: byName["Steak haché"], quantite: 0.12 },
        { ingredientId: byName["Garniture oignon/câpres (portion)"], quantite: 1 }
      ]
    },
    {
      id: uid(), nom: "Coca-Cola (canette)", type: "nonalcool", prixVente: 2.0, tempsPreparationMin: 0.5,
      recette: [{ ingredientId: byName["Canette soda"], quantite: 1 }]
    },
    {
      id: uid(), nom: "Eau (50cl)", type: "nonalcool", prixVente: 1.5, tempsPreparationMin: 0.2,
      recette: [{ ingredientId: byName["Eau bouteille 50cl"], quantite: 1 }]
    },
    {
      id: uid(), nom: "Bière (25cl)", type: "alcool", prixVente: 2.5, tempsPreparationMin: 0.5,
      recette: [{ ingredientId: byName["Bière bouteille 25cl"], quantite: 1 }]
    }
  ];
  saveProducts(products);
  saveJSON(KEYS.seeded, true);
}

/* ============================================================
   Calculs
   ============================================================ */
function tauxTVA(type, lieu, settings) {
  if (type === "alcool") return settings.tvaAlcool;
  if (type === "repas") return lieu === "surPlace" ? settings.tvaRepasSurPlace : settings.tvaRepasEmporter;
  return lieu === "surPlace" ? settings.tvaNonAlcoolSurPlace : settings.tvaNonAlcoolEmporter;
}

function coutMatiereUnitaire(product, ingredients) {
  const byId = Object.fromEntries(ingredients.map((i) => [i.id, i]));
  return (product.recette || []).reduce((sum, l) => {
    const ing = byId[l.ingredientId];
    if (!ing) return sum;
    return sum + l.quantite * ing.coutParUnite;
  }, 0);
}

// Calcule le détail d'une journée : ventes HT par produit, marge par produit, totaux.
// Utilise les paramètres figés de ce jour-là (settings/products/ingredients/investissements)
// s'ils existent — sinon replie sur les paramètres actuels (anciennes entrées).
function computeDay(entry, liveSettings, liveProducts, liveIngredients) {
  const { settings, products, ingredients, investissements } = resolveParams(entry, liveSettings, liveProducts, liveIngredients, loadInvestissements());
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));
  const lignes = [];
  let ventesHTTotal = 0;

  (entry.ventes || []).forEach((v) => {
    const p = productsById[v.productId];
    if (!p) return;
    const qteSurPlace = v.qteSurPlace || 0;
    const qteEmporter = v.qteEmporter || 0;
    const qteTotal = qteSurPlace + qteEmporter;
    if (qteTotal === 0) return;

    const tauxSP = tauxTVA(p.type, "surPlace", settings);
    const tauxEmp = tauxTVA(p.type, "emporter", settings);
    const caTTC_SP = qteSurPlace * p.prixVente;
    const caTTC_Emp = qteEmporter * p.prixVente;
    const caHT = caTTC_SP / (1 + tauxSP / 100) + caTTC_Emp / (1 + tauxEmp / 100);

    const coutUnitaire = coutMatiereUnitaire(p, ingredients);
    const coutTotal = coutUnitaire * qteTotal;
    const marge = caHT - coutTotal;
    const margeUnitaireHT = caHT / qteTotal - coutUnitaire;
    const margeParMinute = p.tempsPreparationMin ? margeUnitaireHT / p.tempsPreparationMin : null;

    ventesHTTotal += caHT;
    lignes.push({
      productId: p.id, nom: p.nom, qteTotal, qteSurPlace, qteEmporter,
      caHT, coutTotal, marge, margeUnitaireHT, margeParMinute,
      tempsPreparationMin: p.tempsPreparationMin || null
    });
  });

  const chargesFixesJour = totalChargesFixes(settings) / (settings.joursOuvresParMois || 1);
  const amortissementJour = totalAmortissementMensuel(entry.date, investissements) / (settings.joursOuvresParMois || 1);
  const cotisationsJour = settings.cotisationsTrimestrielles / (settings.joursOuvresParTrimestre || 1);
  const coutEtudiantsJour = (entry.heuresEtudiants || 0) * settings.coutHoraireEtudiant;

  const beneficeAvantImpot =
    ventesHTTotal - (entry.achats || 0) - chargesFixesJour - amortissementJour - cotisationsJour - coutEtudiantsJour - (entry.chargesExceptionnelles || 0);

  // Provision impôt progressive : impôt marginal du jour = impôt(cumul+jour) − impôt(cumul avant).
  const cumulAvant = cumulBeneficeAvantImpotDepuisJanvier(entry.date, settings, products, ingredients);
  let provisionImpot = 0;
  let changementTranche = null;
  if (beneficeAvantImpot > 0) {
    const cumulApres = cumulAvant + beneficeAvantImpot;
    provisionImpot = Math.max(0, impotNetCumule(cumulApres, settings) - impotNetCumule(cumulAvant, settings));
    const tAvant = trancheIndex(cumulAvant, settings);
    const tApres = trancheIndex(cumulApres, settings);
    if (tApres > tAvant) {
      const nouveauTaux = TRANCHE_TAUX_LABELS(settings)[Math.max(tApres, 0)];
      changementTranche = {
        nouveauTaux,
        message: `Bonne nouvelle et attention à la fois : le bénéfice cumulé de l'année vient de franchir un nouveau seuil d'imposition. À partir de maintenant, chaque euro supplémentaire gagné cette année est provisionné à ${nouveauTaux}% (au lieu du taux précédent) — c'est pour ça que la provision d'aujourd'hui est plus élevée que d'habitude. C'est normal : plus on gagne dans l'année, plus la tranche marginale monte.`
      };
    }
  }
  const beneficeNet = beneficeAvantImpot - provisionImpot;

  lignes.sort((a, b) => {
    const scoreA = a.margeParMinute != null ? a.margeParMinute : a.margeUnitaireHT;
    const scoreB = b.margeParMinute != null ? b.margeParMinute : b.margeUnitaireHT;
    return scoreB - scoreA;
  });

  return { lignes, ventesHTTotal, chargesFixesJour, amortissementJour, cotisationsJour, coutEtudiantsJour, beneficeAvantImpot, provisionImpot, beneficeNet, changementTranche };
}

/* ============================================================
   Livre journal (SPF) — répartition des ventes TTC/HT/TVA par taux, par jour
   Uniquement basé sur le journal Mode complet. Utilise les taux de TVA figés
   au moment de chaque jour (comme le reste des calculs de l'app).
   ============================================================ */
function ventesParTauxPourJour(entry, settings, products) {
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));
  const parTaux = {};
  const ajoute = (taux, ttc) => {
    const key = String(taux);
    if (!parTaux[key]) parTaux[key] = { taux, ttc: 0, ht: 0 };
    const ht = ttc / (1 + taux / 100);
    parTaux[key].ttc += ttc;
    parTaux[key].ht += ht;
  };
  (entry.ventes || []).forEach((v) => {
    const p = productsById[v.productId];
    if (!p) return;
    const qteSP = v.qteSurPlace || 0;
    const qteEmp = v.qteEmporter || 0;
    if (qteSP > 0) ajoute(tauxTVA(p.type, "surPlace", settings), qteSP * p.prixVente);
    if (qteEmp > 0) ajoute(tauxTVA(p.type, "emporter", settings), qteEmp * p.prixVente);
  });
  return parTaux;
}

// Construit les lignes du livre journal (une par jour) pour une plage de dates [dateDebut, dateFin] incluse.
// N'inclut que les jours du journal Mode complet qui ont une entrée enregistrée dans cette plage.
function buildLivreJournalRows(dateDebut, dateFin) {
  const liveSettings = loadSettings();
  const liveProducts = loadProducts();
  const liveIngredients = loadIngredients();
  const liveInvestissements = loadInvestissements();
  const entries = loadEntries()
    .filter((e) => e.date >= dateDebut && e.date <= dateFin)
    .sort((a, b) => a.date.localeCompare(b.date));

  const tauxSet = new Set();
  const rows = entries.map((entry) => {
    const { settings, products } = resolveParams(entry, liveSettings, liveProducts, liveIngredients, liveInvestissements);
    const parTaux = ventesParTauxPourJour(entry, settings, products);
    Object.values(parTaux).forEach((t) => tauxSet.add(t.taux));
    return { date: entry.date, parTaux };
  });

  const tauxColonnes = Array.from(tauxSet).sort((a, b) => b - a);
  return { rows, tauxColonnes };
}

function formatDateFRCourt(iso) {
  return formatDateFR(iso);
}

// Construit le tableau HTML (sans l'enveloppe <html>) à partir des lignes calculées.
// Réutilisé à la fois par l'affichage dans l'app et par le document imprimable.
function generateLivreJournalTableHTML(rows, tauxColonnes) {
  if (rows.length === 0) {
    return { tableHtml: `<p>Aucune vente enregistrée (journal Mode complet) sur cette période.</p>`, totalTTC: 0 };
  }

  const totaux = {};
  let totalHT = 0, totalTVA = 0, totalTTC = 0;

  const theadCols = tauxColonnes.map((t) => `<th>Ventes ${t}% TTC</th>`).join("");
  const bodyRows = rows.map((r) => {
    let ligneHT = 0, ligneTVA = 0, ligneTTC = 0;
    const cols = tauxColonnes.map((t) => {
      const v = r.parTaux[String(t)];
      const ttc = v ? v.ttc : 0;
      const ht = v ? v.ht : 0;
      ligneTTC += ttc;
      ligneHT += ht;
      ligneTVA += ttc - ht;
      totaux[t] = (totaux[t] || 0) + ttc;
      return `<td>${eur(ttc)}</td>`;
    }).join("");
    totalHT += ligneHT;
    totalTVA += ligneTVA;
    totalTTC += ligneTTC;
    return `<tr><td>${formatDateFRCourt(r.date)}</td>${cols}<td>${eur(ligneHT)}</td><td>${eur(ligneTVA)}</td><td><b>${eur(ligneTTC)}</b></td></tr>`;
  }).join("");

  const totalCols = tauxColonnes.map((t) => `<td><b>${eur(totaux[t] || 0)}</b></td>`).join("");

  const tableHtml = `<table class="lj-table">
    <thead><tr><th>Date</th>${theadCols}<th>Total HT</th><th>Total TVA</th><th>Total TTC</th></tr></thead>
    <tbody>${bodyRows}</tbody>
    <tfoot><tr><td>TOTAL</td>${totalCols}<td><b>${eur(totalHT)}</b></td><td><b>${eur(totalTVA)}</b></td><td><b>${eur(totalTTC)}</b></td></tr></tfoot>
  </table>`;

  return { tableHtml, totalTTC };
}

// Affiche le livre journal directement dans l'app (pas de nouvelle fenêtre — les PWA
// installées sur iPhone bloquent ou gèrent mal window.open). Un bouton "Imprimer"
// séparé permet, en plus, d'ouvrir un aperçu d'impression si souhaité.
function renderLivreJournalInline(titre, dateDebut, dateFin) {
  const { rows, tauxColonnes } = buildLivreJournalRows(dateDebut, dateFin);
  const { tableHtml } = generateLivreJournalTableHTML(rows, tauxColonnes);

  const box = document.getElementById("lj-resultat");
  box.innerHTML = `
    <div class="ticket-title">${titre}</div>
    <div class="lj-table-wrap">${tableHtml}</div>
    ${rows.length > 0 ? `<button type="button" id="lj-imprimer-btn" class="secondary">Imprimer / Enregistrer en PDF</button>` : ""}
  `;

  if (rows.length > 0) {
    document.getElementById("lj-imprimer-btn").addEventListener("click", () => {
      ouvrirLivreJournalImprimable(titre, dateDebut, dateFin);
    });
  }
}

// Ouvre un document imprimable dans un nouvel onglet — action explicite et séparée,
// déclenchée uniquement si l'utilisateur clique sur "Imprimer" après avoir consulté.
function ouvrirLivreJournalImprimable(titre, dateDebut, dateFin) {
  const { rows, tauxColonnes } = buildLivreJournalRows(dateDebut, dateFin);
  const { tableHtml } = generateLivreJournalTableHTML(rows, tauxColonnes);
  const win = window.open("", "_blank");
  if (!win) {
    alert("Impossible d'ouvrir la fenêtre d'impression (bloquée ?). Vous pouvez toujours consulter le document directement dans l'app.");
    return;
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${titre}</title>
<style>
  body { font-family: -apple-system, sans-serif; padding: 20px; color: #222; }
  h2 { margin-bottom: 4px; }
  .sub { color: #666; margin-bottom: 16px; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: right; }
  th:first-child, td:first-child { text-align: left; }
  thead { background: #eee; }
  tfoot td { background: #f5f5f5; }
  @media print { button { display: none; } }
</style>
</head>
<body>
  <h2>${titre}</h2>
  <div class="sub">Journal Mode complet uniquement — généré le ${formatDateFRCourt(new Date().toISOString().slice(0, 10))}</div>
  <button onclick="window.print()">Imprimer / Enregistrer en PDF</button>
  ${tableHtml}
</body></html>`;

  win.document.write(html);
  win.document.close();
}

function handleLivreJournalJour() {
  const date = document.getElementById("lj-jour-date").value;
  if (!date) { alert("Choisissez d'abord une date."); return; }
  renderLivreJournalInline(`Livre journal — ${formatDateFRCourt(date)}`, date, date);
}

function handleLivreJournalMois() {
  const val = document.getElementById("lj-mois-valeur").value; // format "YYYY-MM"
  if (!val) { alert("Choisissez d'abord un mois."); return; }
  const [annee, mois] = val.split("-");
  const dernierJour = new Date(parseInt(annee, 10), parseInt(mois, 10), 0).getDate();
  const dateDebut = `${val}-01`;
  const dateFin = `${val}-${String(dernierJour).padStart(2, "0")}`;
  renderLivreJournalInline(`Livre journal — ${mois}/${annee}`, dateDebut, dateFin);
}

function handleLivreJournalPeriode() {
  const debut = document.getElementById("lj-periode-debut").value;
  const fin = document.getElementById("lj-periode-fin").value;
  if (!debut || !fin) { alert("Choisissez une date de début et de fin."); return; }
  if (debut > fin) { alert("La date de début doit être avant la date de fin."); return; }
  renderLivreJournalInline(`Livre journal — du ${formatDateFRCourt(debut)} au ${formatDateFRCourt(fin)}`, debut, fin);
}

/* ============================================================
   Mode Nespresso — bénéfice brut simplifié (ventes TTC − achats TTC, rien d'autre)
   ============================================================ */
function computeDayNespresso(entry, liveProducts, liveIngredients) {
  const { products, ingredients } = resolveParams(entry, null, liveProducts, liveIngredients, null);
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));
  const lignes = [];
  let ventesTTCTotal = 0;
  let coutTotalGlobal = 0;

  (entry.ventes || []).forEach((v) => {
    const p = productsById[v.productId];
    if (!p) return;
    const qteTotal = (v.qteSurPlace || 0) + (v.qteEmporter || 0);
    if (qteTotal === 0) return;

    const ventesTTC = qteTotal * p.prixVente;
    const coutUnitaire = coutMatiereUnitaire(p, ingredients);
    const coutTotal = coutUnitaire * qteTotal;
    const marge = ventesTTC - coutTotal;

    ventesTTCTotal += ventesTTC;
    coutTotalGlobal += coutTotal;
    lignes.push({ productId: p.id, nom: p.nom, qteTotal, ventesTTC, coutTotal, marge });
  });

  lignes.sort((a, b) => b.marge - a.marge);
  const beneficeNespresso = ventesTTCTotal - coutTotalGlobal;
  return { lignes, ventesTTCTotal, coutTotalGlobal, beneficeNespresso };
}

function isModeNespresso() { return localStorage.getItem(KEYS.modeNespresso) === "1"; }
function setModeNespresso(on) { localStorage.setItem(KEYS.modeNespresso, on ? "1" : "0"); }


/* ============================================================
   Navigation
   ============================================================ */
function showScreen(name) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll("nav.tabbar button").forEach((el) => el.classList.remove("active"));
  document.getElementById("screen-" + name).classList.add("active");
  document.getElementById("tab-" + name).classList.add("active");
  if (name === "saisie") renderSaisieScreen();
  if (name === "dashboard") renderDashboard();
  if (name === "produits") renderProduitsScreen();
  if (name === "investissements") renderInvestissementsScreen();
  if (name === "cumuls") renderCumulsScreen();
  if (name === "settings") renderSettingsForm();
}

/* ============================================================
   Écran Saisie
   ============================================================ */
function getSalesRanking() {
  // Popularité = quantité totale vendue toute la période DANS LE JOURNAL ACTIF, pour trier "Ma carte" à la saisie.
  const entries = loadCurrentJournal();
  const totals = {};
  entries.forEach((e) => (e.ventes || []).forEach((v) => {
    totals[v.productId] = (totals[v.productId] || 0) + (v.qteSurPlace || 0) + (v.qteEmporter || 0);
  }));
  return totals;
}

let currentEntryDraft = {};

function renderSaisieScreen() {
  document.getElementById("input-date").value = todayISO();
  document.getElementById("saisie-ticket-title").textContent = "Saisie du jour — Journal : " + (isModeNespresso() ? "Mode Nespresso" : "Mode complet");
  document.getElementById("champs-complet-only").style.display = isModeNespresso() ? "none" : "block";
  renderProductCounters(todayISO());
  document.getElementById("result-box").style.display = "none";
}

// Reconstruit la liste des compteurs pour une date donnée — appelé au chargement
// de l'écran ET quand la date est changée manuellement, pour ne jamais écraser
// une journée déjà enregistrée sans recharger ses quantités.
function renderProductCounters(date) {
  const products = loadProducts();
  const totals = getSalesRanking();
  const sorted = products.slice().sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0));

  const existing = loadCurrentJournal().find((e) => e.date === date);
  currentEntryDraft = {};
  if (existing) {
    (existing.ventes || []).forEach((v) => (currentEntryDraft[v.productId] = { qteSurPlace: v.qteSurPlace || 0, qteEmporter: v.qteEmporter || 0 }));
  }
  // Recharge aussi les autres champs de la journée (sinon une correction de quantité
  // écraserait silencieusement les achats/heures/charges déjà enregistrés pour ce jour).
  document.getElementById("input-heures-etudiants").value = existing ? (existing.heuresEtudiants || "") : "";
  document.getElementById("input-achats").value = existing ? (existing.achats || "") : "";
  document.getElementById("input-charges-except").value = existing ? (existing.chargesExceptionnelles || "") : "";

  const list = document.getElementById("produits-saisie-list");
  if (sorted.length === 0) {
    list.innerHTML = `<div class="empty-state">Aucun produit dans "Ma carte" pour l'instant.<br>Ajoutez-en dans l'onglet Produits.</div>`;
  } else {
    list.innerHTML = sorted.map((p) => {
      const d = currentEntryDraft[p.id] || { qteSurPlace: 0, qteEmporter: 0 };
      return `
        <div class="product-row" data-product="${p.id}">
          <div class="product-row-name">${p.nom}</div>
          <div class="counter-line">
            <span class="counter-label">Sur place</span>
            <div class="counter">
              <button type="button" class="ctr-minus" data-product="${p.id}" data-lieu="surPlace">−</button>
              <span class="ctr-value" data-product="${p.id}" data-lieu="surPlace">${d.qteSurPlace}</span>
              <button type="button" class="ctr-plus" data-product="${p.id}" data-lieu="surPlace">+</button>
            </div>
          </div>
          <div class="counter-line">
            <span class="counter-label">À emporter</span>
            <div class="counter">
              <button type="button" class="ctr-minus" data-product="${p.id}" data-lieu="emporter">−</button>
              <span class="ctr-value" data-product="${p.id}" data-lieu="emporter">${d.qteEmporter}</span>
              <button type="button" class="ctr-plus" data-product="${p.id}" data-lieu="emporter">+</button>
            </div>
          </div>
        </div>`;
    }).join("");

    list.querySelectorAll(".ctr-plus, .ctr-minus").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.dataset.product;
        const lieu = btn.dataset.lieu;
        const key = lieu === "surPlace" ? "qteSurPlace" : "qteEmporter";
        if (!currentEntryDraft[pid]) currentEntryDraft[pid] = { qteSurPlace: 0, qteEmporter: 0 };
        const delta = btn.classList.contains("ctr-plus") ? 1 : -1;
        currentEntryDraft[pid][key] = Math.max(0, currentEntryDraft[pid][key] + delta);
        list.querySelector(`.ctr-value[data-product="${pid}"][data-lieu="${lieu}"]`).textContent = currentEntryDraft[pid][key];
      });
    });
  }
}

function handleSaveEntry(evt) {
  evt.preventDefault();
  const settings = loadSettings();
  const products = loadProducts();
  const ingredients = loadIngredients();

  const ventes = Object.entries(currentEntryDraft)
    .filter(([, v]) => (v.qteSurPlace || 0) + (v.qteEmporter || 0) > 0)
    .map(([productId, v]) => ({ productId, qteSurPlace: v.qteSurPlace || 0, qteEmporter: v.qteEmporter || 0 }));

  const entry = {
    date: document.getElementById("input-date").value || todayISO(),
    ventes,
    heuresEtudiants: parseFloat(document.getElementById("input-heures-etudiants").value) || 0,
    achats: parseFloat(document.getElementById("input-achats").value) || 0,
    chargesExceptionnelles: parseFloat(document.getElementById("input-charges-except").value) || 0,
    savedAt: new Date().toISOString(),
    synced: false
  };

  const entries = loadCurrentJournal();
  const idx = entries.findIndex((e) => e.date === entry.date);
  if (idx >= 0) {
    // Correction d'une journée déjà enregistrée : on garde SES paramètres figés d'origine,
    // on ne change que ce que l'utilisateur vient de modifier (ventes/achats/heures/charges).
    entry.snapshotParams = entries[idx].snapshotParams || buildSnapshotParams();
    entries[idx] = entry;
  } else {
    // Nouvelle journée : on fige les paramètres actuels, pour toujours.
    entry.snapshotParams = buildSnapshotParams();
    entries.push(entry);
  }
  entries.sort((a, b) => a.date.localeCompare(b.date));
  saveCurrentJournal(entries);
  markPendingSync();
  showSavedMsg("entry-saved-msg");

  renderResult(entry, settings, products, ingredients);
  document.getElementById("input-heures-etudiants").value = "";
  document.getElementById("input-achats").value = "";
  document.getElementById("input-charges-except").value = "";
}

function renderResult(entry, settings, products, ingredients) {
  const box = document.getElementById("result-box");

  if (isModeNespresso()) {
    const rn = computeDayNespresso(entry, products, ingredients);
    const negative = rn.beneficeNespresso < 0;
    const lignesHtml = rn.lignes.map((l, i) => `
      <div class="detail-line">
        <span>${i + 1}. ${l.nom} (${l.qteTotal})</span>
        <span>${eur(l.marge)}</span>
      </div>`).join("");
    box.innerHTML = `
      <div class="nespresso-banner">Mode Nespresso — bénéfice brut simplifié</div>
      <div class="stamp-wrap">
        <div class="stamp ${negative ? "negative" : ""}">
          <span class="label">Bénéfice Nespresso du ${formatDateFR(entry.date)}</span>
          <span class="amount">${eur(rn.beneficeNespresso)}</span>
        </div>
      </div>
      <div class="detail-line"><span>Ventes (prix TTC tel vendu)</span><span>${eur(rn.ventesTTCTotal)}</span></div>
      <div class="detail-line"><span>Achats matières (coût tel qu'entré)</span><span>-${eur(rn.coutTotalGlobal)}</span></div>
      <div class="field-note section-gap">Aucune TVA, charge fixe, amortissement, cotisation ou provision impôt n'est prise en compte ici — uniquement ventes moins achats de marchandise.</div>
      <div class="ticket-title section-gap">Marge par produit</div>
      ${lignesHtml || '<div class="field-note">Aucune vente saisie.</div>'}
    `;
    box.style.display = "block";
    return;
  }

  const r = computeDay(entry, settings, products, ingredients);
  const negative = r.beneficeNet < 0;

  const lignesHtml = r.lignes.map((l, i) => `
    <div class="detail-line">
      <span>${i + 1}. ${l.nom} (${l.qteTotal})</span>
      <span>${eur(l.marge)}${l.margeParMinute != null ? ` · ${eur(l.margeParMinute)}/min` : ""}</span>
    </div>`).join("");

  const conseil = r.lignes.length > 1
    ? `<div class="field-note section-gap">${buildAdvice(r.lignes)}</div>`
    : "";

  const tauxJour = r.beneficeAvantImpot > 0 ? ((r.provisionImpot / r.beneficeAvantImpot) * 100).toFixed(1) : "0";
  const alerteTranche = r.changementTranche
    ? `<div class="field-note section-gap" style="border-left:3px solid var(--green); padding-left:8px;">⚠️ ${r.changementTranche.message}</div>`
    : "";

  box.innerHTML = `
    <div class="stamp-wrap">
      <div class="stamp ${negative ? "negative" : ""}">
        <span class="label">Bénéfice net du ${formatDateFR(entry.date)}</span>
        <span class="amount">${eur(r.beneficeNet)}</span>
      </div>
    </div>
    <div class="detail-line"><span>Ventes HTVA</span><span>${eur(r.ventesHTTotal)}</span></div>
    <div class="detail-line"><span>Achats matières (réel)</span><span>-${eur(entry.achats)}</span></div>
    <div class="detail-line"><span>Coût étudiants du jour</span><span>-${eur(r.coutEtudiantsJour)}</span></div>
    <div class="detail-line"><span>Charges fixes (quote-part jour)</span><span>-${eur(r.chargesFixesJour)}</span></div>
    <div class="detail-line"><span>Amortissement investissements (quote-part jour)</span><span>-${eur(r.amortissementJour)}</span></div>
    <div class="detail-line"><span>Cotisations sociales (quote-part jour)</span><span>-${eur(r.cotisationsJour)}</span></div>
    <div class="detail-line"><span>Provision impôt (${tauxJour}% de ce jour)</span><span>-${eur(r.provisionImpot)}</span></div>
    ${alerteTranche}
    <div class="ticket-title section-gap">Rentabilité par produit (marge € · marge/min)</div>
    ${lignesHtml || '<div class="field-note">Aucune vente saisie.</div>'}
    ${conseil}
  `;
  box.style.display = "block";
}

function buildAdvice(lignes) {
  if (lignes.length < 2) return "";
  const best = lignes[0];
  const worst = lignes[lignes.length - 1];
  if (best.margeParMinute != null && worst.margeParMinute != null && worst.margeParMinute > 0) {
    const ratio = (best.margeParMinute / worst.margeParMinute).toFixed(1);
    return `"${best.nom}" rapporte ${ratio}x plus par minute de préparation que "${worst.nom}" — à privilégier aux heures de rush.`;
  }
  return `"${best.nom}" est le produit le plus rentable aujourd'hui.`;
}

/* ============================================================
   Écran Résultats (historique)
   ============================================================ */
function renderDashboard() {
  const settings = loadSettings();
  const products = loadProducts();
  const ingredients = loadIngredients();
  const nespresso = isModeNespresso();
  const entries = loadCurrentJournal().slice().sort((a, b) => b.date.localeCompare(a.date));
  const list = document.getElementById("dashboard-list");
  document.getElementById("dashboard-ticket-title").textContent = "Historique — Journal : " + (nespresso ? "Mode Nespresso" : "Mode complet");

  if (entries.length === 0) {
    list.innerHTML = `<div class="empty-state">Aucune saisie pour l'instant dans ce journal.<br>Commencez par l'onglet "Saisie du jour".</div>`;
    document.getElementById("dashboard-month-total").textContent = "";
    return;
  }

  const results = entries.map((e) => ({
    e,
    benefice: nespresso
      ? computeDayNespresso(e, products, ingredients).beneficeNespresso
      : computeDay(e, settings, products, ingredients).beneficeNet
  }));
  const maxAbs = Math.max(...results.map((x) => Math.abs(x.benefice)), 1);

  list.innerHTML = results.map(({ e, benefice }) => {
    const negative = benefice < 0;
    const widthPct = Math.min(100, (Math.abs(benefice) / maxAbs) * 100);
    return `
      <div class="summary-card">
        <div style="flex:1">
          <div class="day">${formatDateFR(e.date)} ${e.synced ? '<span class="badge ok">OneDrive ✓</span>' : '<span class="badge pending">en attente</span>'}</div>
          <div class="bar-row"><div class="bar-track"><div class="bar-fill ${negative ? "negative" : ""}" style="width:${widthPct}%"></div></div></div>
        </div>
        <div class="value ${negative ? "negative" : "positive"}">${eur(benefice)}</div>
      </div>`;
  }).join("");

  const currentMonth = todayISO().slice(0, 7);
  const monthTotal = results.filter(({ e }) => e.date.startsWith(currentMonth)).reduce((s, { benefice }) => s + benefice, 0);
  document.getElementById("dashboard-month-total").textContent = (nespresso ? "Cumul Nespresso du mois : " : "Cumul du mois : ") + eur(monthTotal);
}

/* ============================================================
   Écran Produits (ingrédients + carte)
   ============================================================ */
let editingProductId = null;
let recetteDraft = [];

function renderProduitsScreen() {
  renderIngredientsList();
  renderProductsList();
  closeProductForm();
}

function renderIngredientsList() {
  const ingredients = loadIngredients();
  const el = document.getElementById("ingredients-list");
  if (ingredients.length === 0) {
    el.innerHTML = `<div class="empty-state">Aucun ingrédient. Ajoutez-en un ci-dessus.</div>`;
    return;
  }
  const unitLabel = { kg: "€/kg", l: "€/l", piece: "€/pièce" };
  el.innerHTML = ingredients.map((i) => `
    <div class="summary-card">
      <div style="flex:1">
        <div class="day">${i.nom}</div>
        <div class="field-note">${eur(i.coutParUnite)} ${unitLabel[i.unite] || ""}</div>
      </div>
      <button type="button" class="secondary ing-delete" data-id="${i.id}" style="width:auto;margin:0;padding:6px 12px;">Suppr.</button>
    </div>`).join("");

  el.querySelectorAll(".ing-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const list = loadIngredients().filter((i) => i.id !== btn.dataset.id);
      saveIngredients(list);
      renderIngredientsList();
      renderProductsList();
    });
  });
}

function handleAddIngredient(evt) {
  evt.preventDefault();
  const nom = document.getElementById("ing-nom").value.trim();
  const unite = document.getElementById("ing-unite").value;
  const cout = parseFloat(document.getElementById("ing-cout").value) || 0;
  if (!nom) return;
  const { ingredient, ancienCout, estNouveau } = mettreAJourOuAjouterIngredient(nom, unite, cout);
  document.getElementById("ingredient-form").reset();
  showSavedMsg("ingredient-saved-msg");
  renderIngredientsList();
  renderProductsList();
  const zoneAlerte = document.getElementById("ingredient-impact-alerte");
  if (!estNouveau && ancienCout !== cout) {
    const impacts = produitsImpactesParIngredient(ingredient.id, ancienCout);
    zoneAlerte.innerHTML = htmlAlerteImpactPrix(impacts);
  } else {
    zoneAlerte.innerHTML = "";
  }
}

// --------------------------------------------------------------------------
// Import des lignes de factures scannees par l'app "Scan Facture", via le
// stockage local du navigateur partage entre les deux apps (meme domaine
// gerar04577.github.io). Aucun reseau requis : lecture directe de la meme
// cle localStorage que celle utilisee par Scan Facture.
// --------------------------------------------------------------------------
const CLE_HISTORIQUE_SCANFACTURE = "scanfacture:historique";

function echapperHtmlBenefice(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function chargerHistoriqueScanFacture() {
  try {
    const raw = localStorage.getItem(CLE_HISTORIQUE_SCANFACTURE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function toggleImportScanFacturePanel() {
  const panel = document.getElementById("import-scanfacture-panel");
  const estOuvert = panel.style.display !== "none";
  if (estOuvert) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "block";
  renderImportScanFacture();
}

function renderImportScanFacture() {
  const contenu = document.getElementById("import-scanfacture-content");
  const historique = chargerHistoriqueScanFacture().filter((h) => Array.isArray(h.items) && h.items.length > 0);

  if (historique.length === 0) {
    contenu.innerHTML = `<div class="empty-state">Aucune facture scannée avec des produits détectés pour l'instant. Utilisez d'abord l'app "Scan Facture" sur cet iPhone, puis revenez ici.</div>`;
    return;
  }

  contenu.innerHTML = historique.slice(0, 10).map((h, indexFacture) => {
    const fournisseur = echapperHtmlBenefice(h.final?.fournisseur || h.ocr?.fournisseur || "Fournisseur inconnu");
    const dateStr = h.date ? new Date(h.date).toLocaleDateString("fr-BE") : "";
    const lignesHtml = h.items.map((it, indexLigne) => {
      const nomPrefill = echapperHtmlBenefice(it.description || "");
      const coutPrefill = it.prixUnitaire != null ? Number(it.prixUnitaire).toFixed(2) : "";
      const uidLigne = `import-${indexFacture}-${indexLigne}`;
      return `
        <div class="summary-card" style="flex-wrap:wrap;">
          <div style="flex:1; min-width:100%;">
            <input type="text" id="${uidLigne}-nom" value="${nomPrefill}" placeholder="Nom de l'ingrédient" style="margin-bottom:6px;">
            <div class="row-split">
              <select id="${uidLigne}-unite">
                <option value="piece">pièce</option>
                <option value="kg">kg</option>
                <option value="l">litre</option>
              </select>
              <input type="number" step="0.01" min="0" id="${uidLigne}-cout" value="${coutPrefill}" placeholder="Coût/unité €">
            </div>
          </div>
          <button type="button" class="secondary import-ligne-btn" data-uid="${uidLigne}" style="width:100%;margin-top:6px;">+ Ajouter cet ingrédient</button>
        </div>`;
    }).join("");

    return `
      <div class="ticket-title-row" style="margin-top:10px;">
        <div class="ticket-title" style="font-size:14px;">${fournisseur} ${dateStr ? "— " + dateStr : ""}</div>
      </div>
      ${lignesHtml}`;
  }).join("");

  contenu.querySelectorAll(".import-ligne-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uidLigne = btn.dataset.uid;
      const nom = document.getElementById(`${uidLigne}-nom`).value.trim();
      const unite = document.getElementById(`${uidLigne}-unite`).value;
      const cout = parseFloat(document.getElementById(`${uidLigne}-cout`).value) || 0;
      if (!nom) return;
      const { ingredient, ancienCout, estNouveau } = mettreAJourOuAjouterIngredient(nom, unite, cout);
      renderIngredientsList();
      renderProductsList();
      btn.textContent = estNouveau ? "Ajouté ✓" : "Coût mis à jour ✓";
      btn.disabled = true;
      const zoneAlerte = document.getElementById("import-scanfacture-impact");
      if (!estNouveau && ancienCout !== cout) {
        const impacts = produitsImpactesParIngredient(ingredient.id, ancienCout);
        zoneAlerte.innerHTML = htmlAlerteImpactPrix(impacts);
      }
    });
  });
}

// Cherche un ingredient existant par nom (insensible a la casse/espaces).
// Si trouve : met a jour son cout (garde le meme id, donc les recettes restent
// liees) et renvoie l'ancien cout pour permettre d'alerter sur l'impact prix.
// Si absent : cree un nouvel ingredient, comme avant.
// Normalise un nom pour comparaison : minuscules, accents retires, espaces
// superflus reduits. Utile car les tickets de caisse sont souvent en
// MAJUSCULES SANS ACCENTS (ex. "FRITES SURGELEES") alors que l'ingredient
// existant peut avoir ete saisi avec accents ("Frites surgelées").
function normaliserNomIngredient(nom) {
  return nom
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // retire les accents
    .trim().toLowerCase().replace(/\s+/g, " ");
}

function mettreAJourOuAjouterIngredient(nom, unite, cout) {
  const list = loadIngredients();
  const nomNormalise = normaliserNomIngredient(nom);
  const existant = list.find((i) => normaliserNomIngredient(i.nom) === nomNormalise);
  if (existant) {
    const ancienCout = existant.coutParUnite;
    existant.coutParUnite = cout;
    existant.unite = unite;
    saveIngredients(list);
    return { ingredient: existant, ancienCout, estNouveau: false };
  }
  const nouvel = { id: uid(), nom: nom.trim(), unite, coutParUnite: cout };
  list.push(nouvel);
  saveIngredients(list);
  return { ingredient: nouvel, ancienCout: null, estNouveau: true };
}

// Pour un ingredient donne, liste les produits dont la recette l'utilise,
// avec leur marge AVANT (au cout donne en 2e argument) et APRES (cout actuel
// de l'ingredient) — sert a alerter sur les produits dont la rentabilite
// vient de changer suite a une nouvelle facture.
function produitsImpactesParIngredient(ingredientId, ancienCoutParUnite) {
  const produits = loadProducts();
  const ingredients = loadIngredients();
  return produits
    .filter((p) => (p.recette || []).some((l) => l.ingredientId === ingredientId))
    .map((p) => {
      const ligneRecette = p.recette.find((l) => l.ingredientId === ingredientId);
      const coutApres = coutMatiereUnitaire(p, ingredients);
      const coutAvant = coutApres - ligneRecette.quantite * (ingredients.find(i => i.id === ingredientId).coutParUnite - ancienCoutParUnite);
      return {
        nom: p.nom,
        prixVente: p.prixVente,
        margeAvant: p.prixVente - coutAvant,
        margeApres: p.prixVente - coutApres
      };
    });
}

// Construit le HTML d'alerte "prix a revoir" pour les produits impactes par
// un changement de cout d'ingredient (affichee apres ajout/import d'une
// facture qui modifie un cout deja connu).
function htmlAlerteImpactPrix(produitsImpactes) {
  if (produitsImpactes.length === 0) return "";
  const lignes = produitsImpactes.map((p) => {
    const variation = p.margeApres - p.margeAvant;
    const couleur = variation < 0 ? "var(--rust)" : "var(--green)";
    const signe = variation >= 0 ? "+" : "";
    return `<div class="field-note">${echapperHtmlBenefice(p.nom)} — marge ${eur(p.margeAvant)} → ${eur(p.margeApres)} <span style="color:${couleur}">(${signe}${eur(variation)})</span></div>`;
  }).join("");
  return `
    <div class="summary-card" style="border:1px solid var(--gold); background:var(--gold-soft);">
      <div style="flex:1">
        <div class="day">💡 Prix de vente à revoir ?</div>
        <div class="field-note">Cet ingrédient est utilisé dans ${produitsImpactes.length} produit(s) de votre carte :</div>
        ${lignes}
      </div>
    </div>`;
}

function renderProductsList() {
  const products = loadProducts();
  const ingredients = loadIngredients();
  const el = document.getElementById("products-list");
  if (products.length === 0) {
    el.innerHTML = `<div class="empty-state">Aucun produit dans "Ma carte".</div>`;
    return;
  }
  el.innerHTML = products.map((p) => {
    const cout = coutMatiereUnitaire(p, ingredients);
    const marge = p.prixVente - cout; // marge TTC-coût, indicatif dans la liste
    const margePct = p.prixVente > 0 ? (marge / p.prixVente) * 100 : 0;
    const couleurMarge = marge <= 0 ? "var(--rust)" : "var(--ink)";
    return `
      <div class="summary-card">
        <div style="flex:1">
          <div class="day">${p.nom} <span class="field-note">(${TYPE_LABELS[p.type]})</span></div>
          <div class="field-note">Vente ${eur(p.prixVente)} · Coût matière ${eur(cout)} · Marge indicative <span style="color:${couleurMarge}">${eur(marge)} (${margePct.toFixed(0)}%)</span></div>
        </div>
        <div style="display:flex; gap:6px;">
          <button type="button" class="secondary prod-edit" data-id="${p.id}" style="width:auto;margin:0;padding:6px 10px;">Modifier</button>
          <button type="button" class="secondary prod-delete" data-id="${p.id}" style="width:auto;margin:0;padding:6px 10px;">Suppr.</button>
        </div>
      </div>`;
  }).join("");

  el.querySelectorAll(".prod-edit").forEach((btn) => btn.addEventListener("click", () => openProductForm(btn.dataset.id)));
  el.querySelectorAll(".prod-delete").forEach((btn) => btn.addEventListener("click", () => {
    saveProducts(loadProducts().filter((p) => p.id !== btn.dataset.id));
    renderProductsList();
  }));
}

function openProductForm(productId) {
  editingProductId = productId || null;
  const product = productId ? loadProducts().find((p) => p.id === productId) : null;
  recetteDraft = product ? JSON.parse(JSON.stringify(product.recette || [])) : [];

  document.getElementById("product-form-title").textContent = product ? "Modifier le produit" : "Ajouter un produit";
  document.getElementById("prod-nom").value = product ? product.nom : "";
  document.getElementById("prod-type").value = product ? product.type : "repas";
  document.getElementById("prod-prix").value = product ? product.prixVente : "";
  document.getElementById("prod-temps").value = product && product.tempsPreparationMin != null ? product.tempsPreparationMin : "";

  renderRecetteBuilder();
  document.getElementById("product-form-panel").style.display = "block";
  document.getElementById("product-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeProductForm() {
  editingProductId = null;
  recetteDraft = [];
  const panel = document.getElementById("product-form-panel");
  if (panel) panel.style.display = "none";
}

function renderRecetteBuilder() {
  const ingredients = loadIngredients();
  const byId = Object.fromEntries(ingredients.map((i) => [i.id, i]));
  const select = document.getElementById("recette-ingredient-select");
  select.innerHTML = ingredients.map((i) => `<option value="${i.id}">${i.nom}</option>`).join("");

  const list = document.getElementById("recette-lines");
  if (recetteDraft.length === 0) {
    list.innerHTML = `<div class="field-note">Aucun ingrédient ajouté à la recette.</div>`;
  } else {
    list.innerHTML = recetteDraft.map((l, idx) => {
      const ing = byId[l.ingredientId];
      const unitLabel = { kg: "kg", l: "l", piece: "pièce(s)" };
      return `
        <div class="detail-line">
          <span>${ing ? ing.nom : "?"} — ${l.quantite} ${ing ? (unitLabel[ing.unite] || "") : ""}</span>
          <span><button type="button" class="recette-remove" data-idx="${idx}" style="border:none;background:none;color:var(--rust);">supprimer</button></span>
        </div>`;
    }).join("");
    list.querySelectorAll(".recette-remove").forEach((btn) => btn.addEventListener("click", () => {
      recetteDraft.splice(parseInt(btn.dataset.idx, 10), 1);
      renderRecetteBuilder();
    }));
  }
}

function handleAddRecetteLine() {
  const ingredientId = document.getElementById("recette-ingredient-select").value;
  const quantite = parseFloat(document.getElementById("recette-quantite").value);
  if (!ingredientId || !quantite || quantite <= 0) return;
  const existing = recetteDraft.find((l) => l.ingredientId === ingredientId);
  if (existing) existing.quantite += quantite; else recetteDraft.push({ ingredientId, quantite });
  document.getElementById("recette-quantite").value = "";
  renderRecetteBuilder();
}

function handleSaveProduct(evt) {
  evt.preventDefault();
  const product = {
    id: editingProductId || uid(),
    nom: document.getElementById("prod-nom").value.trim(),
    type: document.getElementById("prod-type").value,
    prixVente: parseFloat(document.getElementById("prod-prix").value) || 0,
    tempsPreparationMin: document.getElementById("prod-temps").value ? parseFloat(document.getElementById("prod-temps").value) : null,
    recette: recetteDraft
  };
  if (!product.nom) return;

  const products = loadProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) products[idx] = product; else products.push(product);
  saveProducts(products);
  closeProductForm();
  showSavedMsg("product-saved-msg");
  renderProductsList();
}

/* ============================================================
   Écran Investissements
   ============================================================ */
function renderInvestissementsScreen() {
  const options = Object.entries(CATEGORIES_INVESTISSEMENT)
    .map(([key, c]) => `<option value="${key}">${c.label} (${c.duree} ans)</option>`).join("");
  document.getElementById("inv-categorie").innerHTML = options;
  renderInvestissementsList();
}

function renderInvestissementsList() {
  const list = loadInvestissements().slice().sort((a, b) => (b.dateMiseEnService || "").localeCompare(a.dateMiseEnService || ""));
  const el = document.getElementById("investissements-list");
  if (list.length === 0) {
    el.innerHTML = `<div class="empty-state">Aucun investissement enregistré.</div>`;
    return;
  }
  el.innerHTML = list.map((inv) => {
    if (estPetitMateriel(inv)) {
      return `
        <div class="detail-line">
          <span>${inv.nom} — Petit matériel<br><span class="field-note">${eur(inv.montant)} · déduit en une fois le mois du ${inv.dateMiseEnService} (< ${SEUIL_PETIT_MATERIEL} €)</span></span>
          <span>-${eur(inv.montant)} (1 mois) <button type="button" class="link-btn" data-del-inv="${inv.id}">supprimer</button></span>
        </div>`;
    }
    const cat = CATEGORIES_INVESTISSEMENT[inv.categorie] || CATEGORIES_INVESTISSEMENT.autre;
    const duree = inv.dureeAnnees || cat.duree;
    const mensuel = (inv.montant || 0) / duree / 12;
    return `
      <div class="detail-line">
        <span>${inv.nom} — ${cat.label}<br><span class="field-note">${eur(inv.montant)} · dès le ${inv.dateMiseEnService} · sur ${duree} ans</span></span>
        <span>-${eur(mensuel)}/mois <button type="button" class="link-btn" data-del-inv="${inv.id}">supprimer</button></span>
      </div>`;
  }).join("");
  el.querySelectorAll("[data-del-inv]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const list = loadInvestissements().filter((i) => i.id !== btn.dataset.delInv);
      saveInvestissements(list);
      renderInvestissementsList();
    });
  });
}

function handleAddInvestissement(evt) {
  evt.preventDefault();
  const nom = document.getElementById("inv-nom").value.trim();
  const montant = parseFloat(document.getElementById("inv-montant").value) || 0;
  const categorie = document.getElementById("inv-categorie").value;
  const dateMiseEnService = document.getElementById("inv-date").value || todayISO();
  if (!nom || montant <= 0) return;

  const list = loadInvestissements();
  list.push({ id: uid(), nom, montant, categorie, dateMiseEnService });
  saveInvestissements(list);

  document.getElementById("inv-nom").value = "";
  document.getElementById("inv-montant").value = "";
  document.getElementById("inv-date").value = "";
  showSavedMsg("investissement-saved-msg");
  renderInvestissementsList();
}

/* ============================================================
   Aide contextuelle (icône "?")
   ============================================================ */
function showHelp(key) {
  const help = HELP_TEXTS[key];
  if (!help) return;
  document.getElementById("help-modal-title").textContent = help.titre;
  document.getElementById("help-modal-body").innerHTML = help.corps;
  document.getElementById("help-modal").style.display = "flex";
}
function hideHelp() {
  document.getElementById("help-modal").style.display = "none";
}

/* ============================================================
   Écran Cumuls (jour / mois / année, deux comptabilités séparées)
   ============================================================ */
function renderCumulsScreen() {
  const settings = loadSettings();
  const products = loadProducts();
  const ingredients = loadIngredients();
  const c = buildCumuls(products, ingredients, settings);

  // Par jour (les 30 derniers, les deux journaux côte à côte — "—" si absent d'un journal)
  const jourEl = document.getElementById("cumuls-jour-list");
  if (c.daily.length === 0) {
    jourEl.innerHTML = `<div class="empty-state">Aucune journée saisie.</div>`;
  } else {
    jourEl.innerHTML = c.daily.slice(0, 30).map((d) => `
      <div class="detail-line">
        <span>${formatDateFR(d.date)}</span>
        <span>Complet : ${eurOuTiret(d.complet)} &nbsp;·&nbsp; Nespresso : ${eurOuTiret(d.nespresso)}</span>
      </div>`).join("");
  }

  // Par mois
  const moisEl = document.getElementById("cumuls-mois-list");
  if (c.mois.length === 0) {
    moisEl.innerHTML = `<div class="empty-state">Aucune donnée.</div>`;
  } else {
    moisEl.innerHTML = c.mois.map((m) => `
      <div class="detail-line" style="flex-direction:column; align-items:flex-start; gap:2px;">
        <span style="font-weight:600;">${m.cle}${m.estMoisEnCours ? " (mois en cours)" : ""}</span>
        <span>Complet : ${eurOuTiret(m.complet)}${m.projectionComplet != null ? ` (projection fin de mois : ${eur(m.projectionComplet)})` : ""}</span>
        <span>Nespresso : ${eurOuTiret(m.nespresso)}${m.projectionNespresso != null ? ` (projection fin de mois : ${eur(m.projectionNespresso)})` : ""}</span>
      </div>`).join("");
  }

  // Par année fiscale
  const anneeEl = document.getElementById("cumuls-annee-list");
  if (c.annees.length === 0) {
    anneeEl.innerHTML = `<div class="empty-state">Aucune donnée.</div>`;
  } else {
    anneeEl.innerHTML = c.annees.map((y) => `
      <div class="detail-line" style="flex-direction:column; align-items:flex-start; gap:2px;">
        <span style="font-weight:600;">${y.cle}${y.estAnneeEnCours ? " (année en cours)" : ""}</span>
        <span>Complet : ${eurOuTiret(y.complet)}${y.projectionComplet != null ? ` (projection fin d'année : ${eur(y.projectionComplet)})` : ""}</span>
        <span>Nespresso : ${eurOuTiret(y.nespresso)}${y.projectionNespresso != null ? ` (projection fin d'année : ${eur(y.projectionNespresso)})` : ""}</span>
        ${(y.estAnneeEnCours && !y.projectionDisponible) ? '<span class="field-note">Projection disponible dès que janvier sera terminé.</span>' : ""}
      </div>`).join("");
  }

  // Graphique jour (les 30 derniers, ordre chronologique croissant pour la courbe)
  const daily30 = c.daily.slice(0, 30).slice().reverse();
  drawLineChart("chart-jour", daily30.map((d) => d.date.slice(8, 10) + "/" + d.date.slice(5, 7)), daily30.map((d) => d.complet || 0), daily30.map((d) => d.nespresso || 0));

  // Graphique mois (ordre chronologique croissant pour les barres)
  const moisChrono = c.mois.slice().reverse();
  drawGroupedBarChart("chart-mois", moisChrono.map((m) => m.cle.slice(5, 7) + "/" + m.cle.slice(2, 4)), moisChrono.map((m) => m.complet || 0), moisChrono.map((m) => m.nespresso || 0));

  // Graphique année (ordre chronologique croissant)
  const anneesChrono = c.annees.slice().reverse();
  drawGroupedBarChart("chart-annee", anneesChrono.map((y) => y.cle), anneesChrono.map((y) => y.complet || 0), anneesChrono.map((y) => y.nespresso || 0));

  renderAnalyseMensuelle(settings, products, ingredients, false);
}

function renderAnalyseMensuelle(settings, products, ingredients, autoPopup) {
  const moisCle = moisPrecedentCle(todayISO());
  const analyse = analyseMensuelleProduits(moisCle, settings, products, ingredients);
  const el = document.getElementById("analyse-mensuelle-box");

  if (!analyse) {
    el.innerHTML = `<div class="empty-state">Pas encore assez de données pour le mois précédent (${moisCle}).</div>`;
    clearSvg("chart-produits");
    return;
  }

  const listeTriee = analyse.liste.slice().sort((a, b) => b.margeTotale - a.margeTotale);
  const lignesHtml = listeTriee
    .map((p, i) => `
      <div class="detail-line">
        <span>${i + 1}. ${p.nom}</span>
        <span>${eur(p.margeTotale)}${p.margeParMinute != null ? ` · ${eur(p.margeParMinute)}/min` : ""}</span>
      </div>`).join("");

  drawHorizontalBarChart("chart-produits", listeTriee.map((p) => p.nom), listeTriee.map((p) => Math.round(p.margeTotale * 100) / 100));

  el.innerHTML = `
    <div class="field-note">${analyse.message}</div>
    <div class="section-gap"></div>
    ${lignesHtml}
  `;

  if (autoPopup) {
    const vueKey = cleAlerteVue(analyse.moisCle);
    if (localStorage.getItem(vueKey) !== "1") {
      document.getElementById("help-modal-title").textContent = "Analyse du mois écoulé";
      document.getElementById("help-modal-body").innerHTML = `<div>${analyse.message}</div><div class="section-gap"></div>${lignesHtml}`;
      document.getElementById("help-modal").style.display = "flex";
      localStorage.setItem(vueKey, "1");
    }
  }
}


/* ============================================================
   Écran Paramètres
   ============================================================ */
function renderSettingsForm() {
  const s = loadSettings();
  document.getElementById("set-tva-repas-sp").value = s.tvaRepasSurPlace;
  document.getElementById("set-tva-repas-emp").value = s.tvaRepasEmporter;
  document.getElementById("set-tva-alcool").value = s.tvaAlcool;
  document.getElementById("set-tva-nonalcool-sp").value = s.tvaNonAlcoolSurPlace;
  document.getElementById("set-tva-nonalcool-emp").value = s.tvaNonAlcoolEmporter;

  document.getElementById("set-charge-loyer").value = s.chargeLoyer;
  document.getElementById("set-charge-electricite").value = s.chargeElectricite;
  document.getElementById("set-charge-gaz").value = s.chargeGaz;
  document.getElementById("set-charge-eau").value = s.chargeEau;
  document.getElementById("set-charge-assurance-incendie").value = s.chargeAssuranceIncendie;
  document.getElementById("set-charge-assurance-accident").value = s.chargeAssuranceAccident;
  document.getElementById("set-charge-comptable").value = s.chargeComptable;
  document.getElementById("set-charge-secretariat-social").value = s.chargeSecretariatSocial;
  document.getElementById("set-charge-abonnements").value = s.chargeAbonnements;
  document.getElementById("set-charge-entretien").value = s.chargeEntretien;
  document.getElementById("set-charge-taxe-commune").value = s.chargeTaxeCommune;
  document.getElementById("set-charge-taxe-enseigne").value = s.chargeTaxeEnseigne;
  document.getElementById("set-charge-taxe-terrasse").value = s.chargeTaxeTerrasse;
  document.getElementById("set-charge-emprunt").value = s.chargeEmprunt;
  updateChargesFixesTotal();

  document.getElementById("set-jours-mois").value = s.joursOuvresParMois;
  document.getElementById("set-cotisations").value = s.cotisationsTrimestrielles;
  document.getElementById("set-jours-trimestre").value = s.joursOuvresParTrimestre;

  document.getElementById("set-quotite-exemptee").value = s.quotiteExemptee;
  document.getElementById("set-tranche-seuil1").value = s.trancheSeuil1;
  document.getElementById("set-tranche-seuil2").value = s.trancheSeuil2;
  document.getElementById("set-tranche-seuil3").value = s.trancheSeuil3;
  document.getElementById("set-tranche-taux1").value = s.trancheTaux1;
  document.getElementById("set-tranche-taux2").value = s.trancheTaux2;
  document.getElementById("set-tranche-taux3").value = s.trancheTaux3;
  document.getElementById("set-tranche-taux4").value = s.trancheTaux4;
  document.getElementById("set-additionnels-communaux").value = s.additionnelsCommunaux;

  document.getElementById("set-cout-etudiant").value = s.coutHoraireEtudiant;
  document.getElementById("set-webhook").value = s.webhookUrl;
}

function updateChargesFixesTotal() {
  const val = (id) => parseFloat(document.getElementById(id).value) || 0;
  const total = val("set-charge-loyer") +
    val("set-charge-electricite") + val("set-charge-gaz") + val("set-charge-eau") +
    val("set-charge-assurance-incendie") + val("set-charge-assurance-accident") +
    val("set-charge-comptable") + val("set-charge-secretariat-social") +
    val("set-charge-abonnements") + val("set-charge-entretien") +
    val("set-charge-taxe-commune") + val("set-charge-taxe-enseigne") + val("set-charge-taxe-terrasse") +
    val("set-charge-emprunt");
  document.getElementById("charges-fixes-total").textContent = eur(total) + " / mois";
}

function handleSaveSettings(evt) {
  evt.preventDefault();
  const settings = {
    tvaRepasSurPlace: parseFloat(document.getElementById("set-tva-repas-sp").value) || 0,
    tvaRepasEmporter: parseFloat(document.getElementById("set-tva-repas-emp").value) || 0,
    tvaAlcool: parseFloat(document.getElementById("set-tva-alcool").value) || 0,
    tvaNonAlcoolSurPlace: parseFloat(document.getElementById("set-tva-nonalcool-sp").value) || 0,
    tvaNonAlcoolEmporter: parseFloat(document.getElementById("set-tva-nonalcool-emp").value) || 0,

    chargeLoyer: parseFloat(document.getElementById("set-charge-loyer").value) || 0,
    chargeElectricite: parseFloat(document.getElementById("set-charge-electricite").value) || 0,
    chargeGaz: parseFloat(document.getElementById("set-charge-gaz").value) || 0,
    chargeEau: parseFloat(document.getElementById("set-charge-eau").value) || 0,
    chargeAssuranceIncendie: parseFloat(document.getElementById("set-charge-assurance-incendie").value) || 0,
    chargeAssuranceAccident: parseFloat(document.getElementById("set-charge-assurance-accident").value) || 0,
    chargeComptable: parseFloat(document.getElementById("set-charge-comptable").value) || 0,
    chargeSecretariatSocial: parseFloat(document.getElementById("set-charge-secretariat-social").value) || 0,
    chargeAbonnements: parseFloat(document.getElementById("set-charge-abonnements").value) || 0,
    chargeEntretien: parseFloat(document.getElementById("set-charge-entretien").value) || 0,
    chargeTaxeCommune: parseFloat(document.getElementById("set-charge-taxe-commune").value) || 0,
    chargeTaxeEnseigne: parseFloat(document.getElementById("set-charge-taxe-enseigne").value) || 0,
    chargeTaxeTerrasse: parseFloat(document.getElementById("set-charge-taxe-terrasse").value) || 0,
    chargeEmprunt: parseFloat(document.getElementById("set-charge-emprunt").value) || 0,

    joursOuvresParMois: parseFloat(document.getElementById("set-jours-mois").value) || 26,
    cotisationsTrimestrielles: parseFloat(document.getElementById("set-cotisations").value) || 0,
    joursOuvresParTrimestre: parseFloat(document.getElementById("set-jours-trimestre").value) || 78,

    quotiteExemptee: parseFloat(document.getElementById("set-quotite-exemptee").value) || 0,
    trancheSeuil1: parseFloat(document.getElementById("set-tranche-seuil1").value) || 0,
    trancheSeuil2: parseFloat(document.getElementById("set-tranche-seuil2").value) || 0,
    trancheSeuil3: parseFloat(document.getElementById("set-tranche-seuil3").value) || 0,
    trancheTaux1: parseFloat(document.getElementById("set-tranche-taux1").value) || 0,
    trancheTaux2: parseFloat(document.getElementById("set-tranche-taux2").value) || 0,
    trancheTaux3: parseFloat(document.getElementById("set-tranche-taux3").value) || 0,
    trancheTaux4: parseFloat(document.getElementById("set-tranche-taux4").value) || 0,
    additionnelsCommunaux: parseFloat(document.getElementById("set-additionnels-communaux").value) || 0,

    coutHoraireEtudiant: parseFloat(document.getElementById("set-cout-etudiant").value) || 0,
    webhookUrl: document.getElementById("set-webhook").value.trim()
  };
  saveSettings(settings);
  showSavedMsg("settings-saved-msg");
}

/* Affiche un message de confirmation "Enregistré ✓" pendant 2 secondes. */
function showSavedMsg(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 2000);
}

/* ============================================================
   Sauvegarde OneDrive automatique (via Make.com)
   ============================================================ */
function markPendingSync() { localStorage.setItem(KEYS.pendingSync, "1"); }
function clearPendingSync() { localStorage.removeItem(KEYS.pendingSync); }
function hasPendingSync() { return localStorage.getItem(KEYS.pendingSync) === "1"; }

function attemptBackgroundSync(reason) {
  if (!hasPendingSync()) return;
  const settings = loadSettings();
  if (!settings.webhookUrl) return;
  if (!navigator.onLine) return;

  const innerData = {
    source: "benefice-snack",
    reason,
    exportedAt: new Date().toISOString(),
    settings,
    entries: loadEntries(),
    entriesNespresso: loadEntriesNespresso(),
    ingredients: loadIngredients(),
    products: loadProducts(),
    investissements: loadInvestissements()
  };

  const payload = {
    action: "save",
    data: JSON.stringify(innerData)
  };

  fetch(settings.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true
  })
    .then((res) => {
      if (res.ok) {
        const entries = loadEntries();
        entries.forEach((e) => (e.synced = true));
        saveEntries(entries);
        const entriesN = loadEntriesNespresso();
        entriesN.forEach((e) => (e.synced = true));
        saveEntriesNespresso(entriesN);
        clearPendingSync();
      }
    })
    .catch(() => {});
}

function initBackgroundSyncTriggers() {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") attemptBackgroundSync("app-en-arriere-plan");
  });
  window.addEventListener("pagehide", () => attemptBackgroundSync("app-fermee"));
  window.addEventListener("online", () => attemptBackgroundSync("retour-reseau"));
  attemptBackgroundSync("ouverture-app");
}

function handleRestore() {
  const settings = loadSettings();
  if (!settings.webhookUrl) {
    alert("Configurez d'abord l'adresse de sauvegarde dans Paramètres.");
    return;
  }
  fetch(settings.webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "import" }) })
    .then((res) => res.json())
    .then((raw) => {
      // Nouveau format Make.com : { data: "<json string>" }. Ancien format à plat conservé en repli.
      let data = raw;
      if (raw && typeof raw.data === "string") {
        try {
          data = JSON.parse(raw.data);
        } catch (e) {
          data = null;
        }
      }
      if (data && (data.entries || data.entriesNespresso)) {
        if (data.entries) saveEntries(data.entries);
        if (data.entriesNespresso) saveEntriesNespresso(data.entriesNespresso);
        if (data.settings) saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        if (data.ingredients) saveIngredients(data.ingredients);
        if (data.products) saveProducts(data.products);
        if (data.investissements) saveInvestissements(data.investissements);
        clearPendingSync();
        alert("Historique restauré depuis OneDrive (les 2 journaux).");
        renderDashboard();
      } else {
        alert("Aucune donnée trouvée sur OneDrive.");
      }
    })
    .catch(() => alert("Impossible de contacter OneDrive pour l'instant. Réessayez avec une connexion internet."));
}

/* ============================================================
   Démarrage
   ============================================================ */
function updateNespressoToggleUI() {
  const btn = document.getElementById("nespresso-toggle");
  const on = isModeNespresso();
  btn.textContent = "Journal : " + (on ? "Nespresso" : "Mode complet");
  btn.classList.toggle("active", on);
}

function currentScreenName() {
  const active = document.querySelector(".screen.active");
  return active ? active.id.replace("screen-", "") : "saisie";
}

document.addEventListener("DOMContentLoaded", () => {
  seedExampleData();

  showScreen("saisie");
  updateNespressoToggleUI();

  document.getElementById("nespresso-toggle").addEventListener("click", () => {
    const activerMaintenant = !isModeNespresso();
    const message = activerMaintenant
      ? "⚠️ Vous allez PASSER SUR LE JOURNAL NESPRESSO.\n\nC'est un journal de ventes complètement SÉPARÉ du Mode complet — les ventes que vous saisirez ici n'apparaîtront jamais dans le Mode complet, et inversement. Le bénéfice affiché ne retire que le coût d'achat des produits, rien d'autre.\n\nConfirmez-vous le passage sur ce journal ?"
      : "Vous allez REVENIR SUR LE JOURNAL MODE COMPLET (calcul avec charges, impôt, etc.), séparé du journal Nespresso.\n\nConfirmez-vous ?";
    if (!window.confirm(message)) return;
    setModeNespresso(activerMaintenant);
    updateNespressoToggleUI();
    showScreen(currentScreenName());
  });

  document.getElementById("tab-saisie").addEventListener("click", () => showScreen("saisie"));
  document.getElementById("tab-dashboard").addEventListener("click", () => showScreen("dashboard"));
  document.getElementById("tab-cumuls").addEventListener("click", () => showScreen("cumuls"));
  document.getElementById("tab-produits").addEventListener("click", () => showScreen("produits"));
  document.getElementById("tab-investissements").addEventListener("click", () => showScreen("investissements"));
  document.getElementById("tab-settings").addEventListener("click", () => showScreen("settings"));

  document.getElementById("investissement-form").addEventListener("submit", handleAddInvestissement);

  document.querySelectorAll("[data-help]").forEach((btn) => {
    btn.addEventListener("click", () => showHelp(btn.dataset.help));
  });
  document.getElementById("help-modal-close").addEventListener("click", hideHelp);
  document.getElementById("help-modal").addEventListener("click", (e) => {
    if (e.target.id === "help-modal") hideHelp();
  });

  document.querySelectorAll("#settings-form input[id^='set-charge-']").forEach((input) => {
    input.addEventListener("input", updateChargesFixesTotal);
  });

  document.getElementById("save-form").addEventListener("submit", handleSaveEntry);
  document.getElementById("input-date").addEventListener("change", (e) => renderProductCounters(e.target.value || todayISO()));
  document.getElementById("settings-form").addEventListener("submit", handleSaveSettings);
  document.getElementById("restore-btn").addEventListener("click", handleRestore);

  document.getElementById("ingredient-form").addEventListener("submit", handleAddIngredient);
  document.getElementById("import-scanfacture-btn").addEventListener("click", toggleImportScanFacturePanel);
  document.getElementById("add-product-btn").addEventListener("click", () => openProductForm(null));
  document.getElementById("product-form").addEventListener("submit", handleSaveProduct);
  document.getElementById("product-form-cancel").addEventListener("click", closeProductForm);
  document.getElementById("recette-add-btn").addEventListener("click", handleAddRecetteLine);

  document.getElementById("lj-jour-btn").addEventListener("click", handleLivreJournalJour);
  document.getElementById("lj-mois-btn").addEventListener("click", handleLivreJournalMois);
  document.getElementById("lj-periode-btn").addEventListener("click", handleLivreJournalPeriode);

  initBackgroundSyncTriggers();

  // Alerte mensuelle automatique (une seule fois par mois écoulé, silencieuse si déjà vue).
  renderAnalyseMensuelle(loadSettings(), loadProducts(), loadIngredients(), true);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
});
