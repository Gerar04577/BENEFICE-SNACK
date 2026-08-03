# Bénéfice du Jour — Mode d'emploi simple

Ce guide explique, avec des exemples concrets, comment utiliser les parties les plus importantes de l'app au quotidien.

---

## 1. Les "Matières premières" — le prix de ce que vous achetez

C'est la liste de tout ce que vous achetez chez le fournisseur : pain, viande, frites, sauces, boissons...

Pour chaque ingrédient, vous indiquez :
- **le nom**
- **l'unité** : pièce (ex. un pain), kg (ex. les frites), ou litre (ex. la sauce)
- **le coût** : ce que **vous** payez pour **une seule** unité

### Exemple concret
Vous achetez un sac de frites de 10 kg pour 15 €.
👉 Le coût à indiquer n'est **pas** 15 €, mais **1,50 €/kg** (15 € ÷ 10 kg).

| Ingrédient | Unité | Coût à indiquer |
|---|---|---|
| Pain baguette | pièce | 0,40 € (prix d'1 pain) |
| Fricadelle | pièce | 0,90 € (prix d'1 fricadelle) |
| Frites surgelées | kg | 1,50 € (prix d'1 kg) |
| Sauce (bidon) | litre | 3,00 € (prix d'1 litre) |

---

## 2. "Ma carte" — vos produits vendus, et leur recette

Pour chaque produit que vous vendez (ex. "Fricadelle sauce"), vous indiquez :
- **le prix de vente** (ce que paie le client)
- **la recette** : quels ingrédients, et **en quelle quantité**, entrent dans une portion

### Exemple concret : "Fricadelle sauce"

| Ingrédient | Quantité dans la recette |
|---|---|
| Pain baguette | 1 pièce |
| Fricadelle | 1 pièce |
| Frites surgelées | 0,2 kg |
| Sauce | 0,03 l |

**Le calcul du coût matière, automatique :**

```
Pain      : 1    pièce × 0,40 €/pièce = 0,40 €
Fricadelle: 1    pièce × 0,90 €/pièce = 0,90 €
Frites    : 0,2  kg    × 1,50 €/kg    = 0,30 €
Sauce     : 0,03 l     × 3,00 €/l     = 0,09 €
                              TOTAL   = 1,69 €
```

Si ce produit se vend **4,50 €**, l'app affiche :

> Vente 4,50 € · Coût matière 1,69 € · **Marge indicative 2,81 € (62 %)**

👉 **62 %** veut dire : sur 100 € de vente de ce produit, il vous reste 62 € une fois la matière première payée (avant charges, TVA, salaire...).

**Repère simple** : si le chiffre est écrit en **rouge**, la marge est nulle ou négative — ce produit **coûte plus cher à préparer qu'il ne rapporte**. À corriger en priorité (augmenter le prix, ou revoir la recette).

---

## 3. Où trouver le prix à indiquer

La plupart du temps, vous connaissez déjà le prix (ticket de caisse, facture papier, ou ce que vous a dit le fournisseur) : ouvrez simplement **Produits → Matières premières** et saisissez-le à la main, comme dans l'exemple ci-dessus.

---

## 4. L'alerte "Prix de vente à revoir ?"

Dès qu'un prix d'ingrédient **déjà connu** change, une alerte apparaît automatiquement :

> 💡 **Prix de vente à revoir ?**
> Cet ingrédient est utilisé dans 1 produit(s) de votre carte :
> Fricadelle sauce — marge 2,81 € → 2,51 € (−0,30 €)

### Comment lire cette alerte
Elle vous montre, pour chaque produit concerné, la marge **avant** et **après** le changement de prix.

👉 **C'est le bon moment pour se demander** : est-ce que je dois augmenter mon prix de vente pour garder la même marge, ou est-ce que j'accepte de gagner un peu moins sur ce produit ?

---

## 5. Résumé — les 3 réflexes à avoir

1. **Un nouveau fournisseur ou un prix qui change** → mettez à jour "Matières premières"
2. **Une alerte "Prix de vente à revoir ?" apparaît** → regardez les produits concernés et décidez si le prix de vente doit changer
3. **Un chiffre en rouge dans "Ma carte"** → ce produit ne rapporte rien (ou pire) — à corriger sans attendre
