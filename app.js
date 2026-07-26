/* ============================================================
   Bénéfice du Jour — logique de l'application
   ============================================================ */

const KEYS = {
  entries: "benefice-snack:entries",
  settings: "benefice-snack:settings",
  ingredients: "benefice-snack:ingredients",
  products: "benefice-snack:products",
  investissements: "benefice-snack:investissements",
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
  chargeEnergie: 0,
  chargeAssurances: 0,
  chargeComptable: 0,
  chargeAbonnements: 0,
  chargeEntretien: 0,
  chargeTaxesLocales: 0,
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
  "charges-fixes": {
    titre: "Comment remplir les charges fixes",
    corps: `Indiquez ici vos frais qui reviennent chaque mois, même les jours où le snack est fermé.
<br><br>
<b>Loyer</b> : le loyer mensuel du local (+ charges locatives si séparées).<br>
<b>Énergie</b> : électricité, gaz et eau ensemble, en moyenne mensuelle.<br>
<b>Assurances</b> : RC professionnelle, incendie, matériel.<br>
<b>Comptable / secrétariat social</b> : ce que vous payez chaque mois pour la compta et les cotisations.<br>
<b>Abonnements</b> : logiciel de caisse, téléphone, internet.<br>
<b>Entretien</b> : nettoyage, enlèvement des déchets/graisses.<br>
<b>Taxes locales</b> : taxe commune, enseigne, terrasse.<br>
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
  return (settings.chargeLoyer || 0) + (settings.chargeEnergie || 0) + (settings.chargeAssurances || 0) +
    (settings.chargeComptable || 0) + (settings.chargeAbonnements || 0) + (settings.chargeEntretien || 0) +
    (settings.chargeTaxesLocales || 0) + (settings.chargeEmprunt || 0);
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

// Cumul du bénéfice avant impôt depuis le 1er janvier de l'année de `date`, en excluant
// cette date elle-même (pour connaître le point de départ AVANT le jour en cours).
function cumulBeneficeAvantImpotDepuisJanvier(dateStr, settings, products, ingredients) {
  const annee = dateStr.slice(0, 4);
  const entries = loadEntries().filter((e) => e.date.slice(0, 4) === annee && e.date < dateStr);
  return entries.reduce((sum, e) => sum + computeDayBeneficeAvantImpot(e, settings, products, ingredients), 0);
}

// Version allégée de computeDay qui ne calcule que le bénéfice avant impôt (utilisée
// pour reconstruire le cumul annuel sans recalculer toute la structure d'affichage).
function computeDayBeneficeAvantImpot(entry, settings, products, ingredients) {
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
  const amortissementJour = totalAmortissementMensuel(entry.date, loadInvestissements()) / (settings.joursOuvresParMois || 1);
  const cotisationsJour = settings.cotisationsTrimestrielles / (settings.joursOuvresParTrimestre || 1);
  const coutEtudiantsJour = (entry.heuresEtudiants || 0) * settings.coutHoraireEtudiant;
  return ventesHTTotal - (entry.achats || 0) - chargesFixesJour - amortissementJour - cotisationsJour - coutEtudiantsJour - (entry.chargesExceptionnelles || 0);
}

function todayISO() { return new Date().toISOString().slice(0, 10); }
function eur(n) {
  return (Math.round((n || 0) * 100) / 100).toLocaleString("fr-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
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
function computeDay(entry, settings, products, ingredients) {
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
  const amortissementJour = totalAmortissementMensuel(entry.date, loadInvestissements()) / (settings.joursOuvresParMois || 1);
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
  if (name === "settings") renderSettingsForm();
}

/* ============================================================
   Écran Saisie
   ============================================================ */
function getSalesRanking() {
  // Popularité = quantité totale vendue toute la période, pour trier "Ma carte" à la saisie.
  const entries = loadEntries();
  const totals = {};
  entries.forEach((e) => (e.ventes || []).forEach((v) => {
    totals[v.productId] = (totals[v.productId] || 0) + (v.qteSurPlace || 0) + (v.qteEmporter || 0);
  }));
  return totals;
}

let currentEntryDraft = {};

function renderSaisieScreen() {
  document.getElementById("input-date").value = todayISO();
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

  const existing = loadEntries().find((e) => e.date === date);
  currentEntryDraft = {};
  if (existing) {
    (existing.ventes || []).forEach((v) => (currentEntryDraft[v.productId] = { qteSurPlace: v.qteSurPlace || 0, qteEmporter: v.qteEmporter || 0 }));
  }

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

  const entries = loadEntries();
  const idx = entries.findIndex((e) => e.date === entry.date);
  if (idx >= 0) entries[idx] = entry; else entries.push(entry);
  entries.sort((a, b) => a.date.localeCompare(b.date));
  saveEntries(entries);
  markPendingSync();

  renderResult(entry, settings, products, ingredients);
  document.getElementById("input-heures-etudiants").value = "";
  document.getElementById("input-achats").value = "";
  document.getElementById("input-charges-except").value = "";
}

function renderResult(entry, settings, products, ingredients) {
  const r = computeDay(entry, settings, products, ingredients);
  const box = document.getElementById("result-box");
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
        <span class="label">Bénéfice net du ${entry.date}</span>
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
  const entries = loadEntries().slice().sort((a, b) => b.date.localeCompare(a.date));
  const list = document.getElementById("dashboard-list");

  if (entries.length === 0) {
    list.innerHTML = `<div class="empty-state">Aucune saisie pour l'instant.<br>Commencez par l'onglet "Saisie du jour".</div>`;
    document.getElementById("dashboard-month-total").textContent = "";
    return;
  }

  const results = entries.map((e) => ({ e, r: computeDay(e, settings, products, ingredients) }));
  const maxAbs = Math.max(...results.map((x) => Math.abs(x.r.beneficeNet)), 1);

  list.innerHTML = results.map(({ e, r }) => {
    const negative = r.beneficeNet < 0;
    const widthPct = Math.min(100, (Math.abs(r.beneficeNet) / maxAbs) * 100);
    return `
      <div class="summary-card">
        <div style="flex:1">
          <div class="day">${e.date} ${e.synced ? '<span class="badge ok">OneDrive ✓</span>' : '<span class="badge pending">en attente</span>'}</div>
          <div class="bar-row"><div class="bar-track"><div class="bar-fill ${negative ? "negative" : ""}" style="width:${widthPct}%"></div></div></div>
        </div>
        <div class="value ${negative ? "negative" : "positive"}">${eur(r.beneficeNet)}</div>
      </div>`;
  }).join("");

  const currentMonth = todayISO().slice(0, 7);
  const monthTotal = results.filter(({ e }) => e.date.startsWith(currentMonth)).reduce((s, { r }) => s + r.beneficeNet, 0);
  document.getElementById("dashboard-month-total").textContent = "Cumul du mois : " + eur(monthTotal);
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
  const list = loadIngredients();
  list.push({ id: uid(), nom, unite, coutParUnite: cout });
  saveIngredients(list);
  document.getElementById("ingredient-form").reset();
  renderIngredientsList();
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
    return `
      <div class="summary-card">
        <div style="flex:1">
          <div class="day">${p.nom} <span class="field-note">(${TYPE_LABELS[p.type]})</span></div>
          <div class="field-note">Vente ${eur(p.prixVente)} · Coût matière ${eur(cout)} · Marge indicative ${eur(marge)}</div>
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
  document.getElementById("set-charge-energie").value = s.chargeEnergie;
  document.getElementById("set-charge-assurances").value = s.chargeAssurances;
  document.getElementById("set-charge-comptable").value = s.chargeComptable;
  document.getElementById("set-charge-abonnements").value = s.chargeAbonnements;
  document.getElementById("set-charge-entretien").value = s.chargeEntretien;
  document.getElementById("set-charge-taxes-locales").value = s.chargeTaxesLocales;
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
  const total = val("set-charge-loyer") + val("set-charge-energie") + val("set-charge-assurances") +
    val("set-charge-comptable") + val("set-charge-abonnements") + val("set-charge-entretien") +
    val("set-charge-taxes-locales") + val("set-charge-emprunt");
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
    chargeEnergie: parseFloat(document.getElementById("set-charge-energie").value) || 0,
    chargeAssurances: parseFloat(document.getElementById("set-charge-assurances").value) || 0,
    chargeComptable: parseFloat(document.getElementById("set-charge-comptable").value) || 0,
    chargeAbonnements: parseFloat(document.getElementById("set-charge-abonnements").value) || 0,
    chargeEntretien: parseFloat(document.getElementById("set-charge-entretien").value) || 0,
    chargeTaxesLocales: parseFloat(document.getElementById("set-charge-taxes-locales").value) || 0,
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
  document.getElementById("settings-saved-msg").style.display = "block";
  setTimeout(() => (document.getElementById("settings-saved-msg").style.display = "none"), 2000);
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

  const payload = {
    action: "save",
    source: "benefice-snack",
    reason,
    exportedAt: new Date().toISOString(),
    settings,
    entries: loadEntries(),
    ingredients: loadIngredients(),
    products: loadProducts(),
    investissements: loadInvestissements()
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
    .then((data) => {
      if (data && data.entries) {
        saveEntries(data.entries);
        if (data.settings) saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        if (data.ingredients) saveIngredients(data.ingredients);
        if (data.products) saveProducts(data.products);
        if (data.investissements) saveInvestissements(data.investissements);
        clearPendingSync();
        alert("Historique restauré depuis OneDrive.");
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
document.addEventListener("DOMContentLoaded", () => {
  seedExampleData();

  showScreen("saisie");

  document.getElementById("tab-saisie").addEventListener("click", () => showScreen("saisie"));
  document.getElementById("tab-dashboard").addEventListener("click", () => showScreen("dashboard"));
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
  document.getElementById("add-product-btn").addEventListener("click", () => openProductForm(null));
  document.getElementById("product-form").addEventListener("submit", handleSaveProduct);
  document.getElementById("product-form-cancel").addEventListener("click", closeProductForm);
  document.getElementById("recette-add-btn").addEventListener("click", handleAddRecetteLine);

  initBackgroundSyncTriggers();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
});
