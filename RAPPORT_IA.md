# Rapport — Système de Prédiction IA pour SmartBin

## Soutenance — Projet SmartBin

---

# Sommaire

1. [Présentation du projet](#1-présentation-du-projet)
2. [Architecture générale](#2-architecture-générale)
3. [L'algorithme de prédiction (régression linéaire)](#3-lalgorithme-de-prédiction-régression-linéaire)
4. [Le service Python (FastAPI)](#4-le-service-python-fastapi)
5. [Le contrôleur Laravel](#5-le-contrôleur-laravel)
6. [Le frontend React](#6-le-frontend-react)
7. [Schéma du flux complet](#7-schéma-du-flux-complet)
8. [Comment exécuter le projet](#8-comment-exécuter-le-projet)
9. [Pistes d'amélioration](#9-pistes-damélioration)

---

## 1. Présentation du projet

SmartBin est un système de gestion intelligente de bennes à ordures. Le projet comprend :

- **Des capteurs** mesurent le niveau de remplissage des bennes en temps réel
- **Un backend Laravel** qui stocke les données et sert les pages web
- **Un frontend React** qui affiche les données dans un tableau de bord
- **Un service IA Python** qui prédit quand les bennes vont déborder

### Objectif de la prédiction IA

Éviter les débordements de bennes en anticipant le moment où une benne atteindra 100% de remplissage. Cela permet aux équipes de collecte d'intervenir avant le débordement, plutôt que de réagir après.

---

## 2. Architecture générale

Le système utilise une architecture **client-serveur** avec deux serveurs qui communiquent :

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Machine unique (ordinateur)                      │
│                                                                     │
│  ┌─────────────────────┐          ┌──────────────────────────────┐  │
│  │   Terminal 1         │          │   Terminal 2                  │  │
│  │   Serveur Python     │          │   Serveur Laravel             │  │
│  │   FastAPI            │          │   PHP + React                 │  │
│  │   Port 8001          │◄────HTTP─│   Port 8000                   │  │
│  │                      │ POST     │                               │  │
│  │  predict.py          │ /api/    │  PredictionController.php     │  │
│  │  numpy (régression)  │ predict  │  Lit la BD MySQL              │  │
│  └──────────────────────┘          │  Stocke les résultats         │  │
│                                    │  Rend la page Inertia/React   │  │
│                                    └──────────┬────────────────────┘  │
│                                               │                        │
│                                               ▼                        │
│                                    ┌──────────────────────┐           │
│                                    │   MySQL               │           │
│                                    │   Base de données     │           │
│                                    │   sensor_readings     │           │
│                                    │   predictions         │           │
│                                    │   bins                │           │
│                                    └──────────────────────┘           │
└───────────────────────────────────────────────────────────────────────┘
```

### Pourquoi deux serveurs ?

| Serveur | Langage | Rôle |
|---------|---------|------|
| **Laravel** (PHP) | PHP 8.2 | Site web, BD, authentification, logique métier |
| **Python IA** (FastAPI) | Python 3.12 | Calculs mathématiques, régression linéaire |

**Pourquoi Python pour l'IA ?** Python est le langage standard pour le calcul scientifique. La bibliothèque `numpy` permet d'effectuer des calculs mathématiques complexes (régression linéaire, matrices, statistiques) avec des performances optimales. PHP n'est pas conçu pour ce type de calculs.

### Communication entre les serveurs

Les deux serveurs communiquent via le protocole **HTTP**, exactement comme un navigateur communique avec un site web :

```
Laravel ──POST──► Python : { bin_id, readings }
Python ──Réponse──► Laravel : { risk_level, estimated_hours, confidence }
```

Laravel utilise la classe `Http` (basée sur Guzzle) pour envoyer une requête HTTP au service Python. Celui-ci répond avec un JSON structuré.

---

## 3. L'algorithme de prédiction (régression linéaire)

### 3.1 Principe général

L'algorithme utilisé est la **régression linéaire simple**. C'est la méthode la plus fondamentale en apprentissage automatique (machine learning).

Le principe : à partir de relevés passés (niveau de remplissage mesuré toutes les 30 minutes), on trouve une **droite** qui représente la tendance. En prolongeant cette droite dans le futur, on peut **projeter** le moment où la benne atteindra 100%.

**Équation d'une droite :** `y = a·x + b`

- `y` = niveau de remplissage (en %)
- `x` = temps écoulé (en heures depuis la première mesure)
- `a` = **pente** : la vitesse de remplissage (en % par heure)
- `b` = niveau théorique au temps zéro

---

### 3.2 Exemple concret — pas à pas

Prenons une benne qui a produit 5 relevés espacés de 30 minutes :

| created_at | fill_level | x (heures) | y (%) |
|---|---|---|---|
| 08:00 | 12% | 0,0 | 12 |
| 08:30 | 18% | 0,5 | 18 |
| 09:00 | 23% | 1,0 | 23 |
| 09:30 | 29% | 1,5 | 29 |
| 10:00 | 35% | 2,0 | 35 |

---

#### Étape 1 — Transformation des données brutes

Dans `PredictionController.php:56-59`, chaque relevé est converti en coordonnées `(x, y)` :

```php
'x' => $i * 0.5,         // 0, 0.5, 1.0, 1.5, 2.0 (heures depuis le début)
'y' => $r->fill_level,   // 12, 18, 23, 29, 35 (pourcentage)
```

On obtient le tableau JSON envoyé à Python :
```json
{"readings": [
  {"x": 0, "y": 12},
  {"x": 0.5, "y": 18},
  {"x": 1.0, "y": 23},
  {"x": 1.5, "y": 29},
  {"x": 2.0, "y": 35}
]}
```

---

#### Étape 2 — Conversion en tableaux numpy

Dans `predict.py:16-17`, les listes sont converties en tableaux numpy pour les calculs :

```python
x = np.array([0, 0.5, 1.0, 1.5, 2.0])   # heures
y = np.array([12, 18, 23, 29, 35])       # fill_level
```

---

#### Étape 3 — Régression linéaire (le cœur)

**Ligne 28 :**

```python
a, b = np.polyfit(x, y, 1)
```

`polyfit` signifie *polynomial fit* avec degré **1** (une droite). Numpy calcule la **meilleure droite** qui minimise la distance à tous les points.

**Formule mathématique exacte** (ce que numpy exécute derrière) :

```
a = (n·Σ(x·y) - Σx·Σy) / (n·Σ(x²) - (Σx)²)
b = (Σy - a·Σx) / n
```

**Application chiffrée :**

| x | y | x·y | x² |
|---|---:|---:|---:|
| 0,0 | 12 | 0 | 0,00 |
| 0,5 | 18 | 9 | 0,25 |
| 1,0 | 23 | 23 | 1,00 |
| 1,5 | 29 | 43,5 | 2,25 |
| 2,0 | 35 | 70 | 4,00 |
| **Σ=5,0** | **Σ=117** | **Σ=145,5** | **Σ=7,50** |

```
n = 5
a = (5 × 145,5 - 5,0 × 117) / (5 × 7,50 - 5,0²)
  = (727,5 - 585) / (37,5 - 25)
  = 142,5 / 12,5
  = 11,4

b = (117 - 11,4 × 5,0) / 5
  = (117 - 57) / 5
  = 12,0
```

**Résultat :** `y = 11,4·x + 12,0`

- **Pente `a` = 11,4** : la benne se remplit de **11,4% par heure**
- **Ordonnée `b` = 12,0** : au temps zéro, le niveau théorique était de 12%

---

#### Étape 4 — Vérification de la pente

```python
if a <= 0:
    return {"risk_level": "LOW", ...}
```

Si la pente est négative (remplissage qui diminue → une collecte est en cours), on s'arrête : il n'y a **pas de risque de débordement**.

Ici `a = 11,4` → positif → on continue.

---

#### Étape 5 — Projection jusqu'à 100%

```python
dernier_fill = float(y[-1])         # 35 (dernier relevé)
heures_restantes = (100 - 35) / 11,4  # = 65 / 11,4 = 5,7 heures
```

**Raisonnement :** Il reste 65% à remplir avant d'atteindre 100%. À raison de 11,4% par heure, cela prendra :

```
65 ÷ 11,4 = 5,7 heures
```

→ La benne sera pleine dans **environ 5 heures et 42 minutes**.

---

#### Étape 6 — Calcul de la confiance (R²)

Le coefficient **R²** (R-squared) mesure la **qualité de la régression**. Il répond à la question : *"Est-ce que les points sont bien alignés sur une droite ?"*

**Formule :**
```
R² = 1 - (somme_des_erreurs² / somme_totale²)
```

- **Somme des erreurs (ss_res)** : distance entre chaque point réel et la droite
- **Somme totale (ss_tot)** : distance entre chaque point réel et la moyenne

**Application chiffrée :**

| x | y réel | y prédit (11,4·x+12) | erreur | erreur² | écart à la moyenne | écart² |
|---|---:|---:|---:|---:|---:|---:|
| 0,0 | 12 | 12,0 | 0,0 | 0,00 | -11,4 | 129,96 |
| 0,5 | 18 | 17,7 | 0,3 | 0,09 | -5,4 | 29,16 |
| 1,0 | 23 | 23,4 | -0,4 | 0,16 | 0,6 | 0,36 |
| 1,5 | 29 | 29,1 | -0,1 | 0,01 | 5,6 | 31,36 |
| 2,0 | 35 | 34,8 | 0,2 | 0,04 | 11,6 | 134,56 |
| | | | **Σ=0,00** | **ss_res=0,30** | | **ss_tot=325,40** |

```python
y_pred = a * x + b          # droite théorique
ss_res = Σ(y - y_pred)²    # = 0,30
ss_tot = Σ(y - moyenne(y))² # = 325,40
r2 = 1 - 0,30 / 325,40     # = 0,999
confidence = r2 × 100       # = 99,9%
```

**R² = 99,9%** → les points sont presque parfaitement alignés. La prédiction est très fiable.

Interprétation :
- **R² = 100%** → points parfaitement alignés (confiance parfaite)
- **R² > 90%** → forte corrélation (bonne confiance)
- **R² = 50%** → relation faible (confiance moyenne)
- **R² = 0%** → aucune relation linéaire (prédiction impossible)

---

#### Étape 7 — Niveau de risque

```python
if heures_restantes <= 3:
    risk = "HIGH"
elif heures_restantes <= 12:
    risk = "MEDIUM"
else:
    risk = "LOW"
```

| Temps restant | Risque | Action |
|:---:|:---:|:---|
| **< 3 heures** | **🔴 HIGH** | Intervention immédiate — urgence |
| **3 à 12 heures** | **🟡 MEDIUM** | Planifier une collecte |
| **> 12 heures** | **🟢 LOW** | Surveillance de routine |

Ici `5,7 heures` → **RISQUE MEDIUM**.

---

#### Étape 8 — Génération de la recommandation

```python
recommandations = {
    "HIGH":   f"Intervention immédiate requise — débordement prévu dans {round(h)}h.",
    "MEDIUM": f"Débordement estimé dans {round(h)}h. Planifier une collecte.",
    "LOW":    f"Surveillance de routine. Niveau critique estimé dans {round(h)}h.",
}
```

Message retourné : **"Débordement estimé dans 6h. Planifier une collecte dans les prochaines heures."**

---

#### Étape 9 — Retour à Laravel

Python répond avec ce JSON :

```json
{
    "bin_id": "uuid-de-la-benne",
    "risk_level": "MEDIUM",
    "estimated_hours": 5.7,
    "confidence": 99.9,
    "recommendation": "Débordement estimé dans 6h. Planifier une collecte dans les prochaines heures."
}
```

---

#### Étape 10 — Stockage et affichage

Laravel reçoit la réponse (ligne 80-90 de `PredictionController.php`), stocke dans la table `predictions`, et la page React l'affiche.

---

### 3.3 Résumé visuel

```
fill_level (%)
    |
100 ─╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌★ (projection : dans 5,7h)
    |                    ╱
    |                   ╱
 80 ─                  ╱
    |                 ╱
    |                ╱
 60 ─               ╱
    |              ╱
    |             ╱
 40 ─            ╱
    |           ╱
 35 ──────────★ (dernier relevé à 2h)
 29 ────────★
 23 ──────★
 18 ────★
 12 ──★
    |
    └────┼────┼────┼────┼────┼────┼────→ temps (heures)
        0    1    2    3    4    5    6
        ↑                             ↑
     1er relevé                débordement prédit
     (08:00)                    (dans ~5,7h → ~15h42)
```

---

### 3.4 Le code complet commenté

```python
import numpy as np

def predict(readings: list[dict]) -> dict:
    # Étape 1-2 : Convertir les relevés en tableaux numpy
    x = np.array([r["x"] for r in readings])  # heures
    y = np.array([r["y"] for r in readings])  # fill_level

    # Vérifier qu'il y a assez de points
    if len(readings) < 2 or np.std(x) == 0:
        return {"risk_level": "LOW", "estimated_hours": None, "confidence": 0}

    # Étape 3 : Régression linéaire — LE CŒUR DE L'IA
    a, b = np.polyfit(x, y, 1)  # a = pente (%/h), b = niveau initial

    # Étape 4 : Si pente négative, pas de risque
    if a <= 0:
        return {"risk_level": "LOW", ...}

    # Étape 5 : Projection linéaire
    heures_restantes = (100 - float(y[-1])) / a

    # Étape 6 : Calcul de la confiance (R²)
    y_pred = a * x + b
    ss_res = np.sum((y - y_pred) ** 2)
    ss_tot = np.sum((y - np.mean(y)) ** 2)
    r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

    # Étape 7 : Niveau de risque
    if heures_restantes <= 3:          risk = "HIGH"
    elif heures_restantes <= 12:       risk = "MEDIUM"
    else:                              risk = "LOW"

    # Étape 8 : Recommandation
    return {
        "risk_level": risk,
        "estimated_hours": round(heures_restantes, 1),
        "confidence": round(max(0, r2 * 100), 1),
        "recommendation": f"Intervention dans {round(heures_restantes)}h",
    }
```

**Ce qu'il faut retenir :** Toute l'intelligence du système tient dans **une seule ligne** de code : `a, b = np.polyfit(x, y, 1)`. Le reste n'est que mise en forme, stockage et décision métier autour de cette projection.

---

## 4. Le service Python (FastAPI)

### 4.1 Rôle

Le service Python est un **micro-serveur** qui expose une API REST. Il ne fait rien d'autre que des calculs mathématiques. Il ne connaît ni la base de données, ni l'application Laravel.

### 4.2 Code de `main.py`

```python
from fastapi import FastAPI
from predict import predict

app = FastAPI(title="SmartBin AI Service")

@app.get("/health")
def health():
    """Endpoint de vérification"""
    return {"status": "ok"}

@app.post("/api/predict")
def get_prediction(req: PredictionRequest):
    """Reçoit des relevés, retourne une prédiction"""
    result = predict(req.readings)
    result["bin_id"] = req.bin_id
    return result
```

### 4.3 Endpoints exposés

| Méthode | URL | Description |
|:---:|:---|:---|
| `GET` | `/health` | Vérifier que le service fonctionne |
| `POST` | `/api/predict` | Effectuer une prédiction |

### 4.4 Format des requêtes/réponses

**Requête** (envoyée par Laravel) :
```json
{
    "bin_id": "uuid-de-la-benne",
    "readings": [
        {"x": 0, "y": 15},
        {"x": 0.5, "y": 22},
        {"x": 1, "y": 28}
    ]
}
```

**Réponse** (retournée à Laravel) :
```json
{
    "bin_id": "uuid-de-la-benne",
    "risk_level": "MEDIUM",
    "estimated_hours": 4.3,
    "confidence": 99.9,
    "recommendation": "Prévoir une collecte dans les 4h à venir"
}
```

---

## 5. Le contrôleur Laravel

### 5.1 Rôle

Le `PredictionController` est le **chef d'orchestre** : il lit les données de la base, les envoie au service Python, stocke les résultats et les transmet à la page web.

### 5.2 Fonction `index()` — Afficher les prédictions

```php
public function index(Request $request)
{
    // 1. Récupérer les prédictions depuis la BD
    $predictions = Prediction::with('bin')
        ->latest('created_at')
        ->paginate(8);

    // 2. Récupérer la liste des bennes
    $bins = Bin::select('id', 'code', 'name', 'location', 'fill_level')->get();

    // 3. Transmettre à la page Inertia/React
    return Inertia::render('Predictions/Index', [
        'predictions' => $predictions->through(fn($p) => $this->mapPrediction($p)),
        'bins'        => $bins,
        'filters'     => $request->only(['search', 'priority']),
    ]);
}
```

### 5.3 Fonction `generate()` — Lancer l'IA

C'est la fonction la plus importante : elle boucle sur toutes les bennes actives, récupère leurs mesures et appelle le service Python pour chaque benne.

```php
public function generate()
{
    // 1. Récupérer toutes les bennes actives
    $bins = Bin::whereIn('status', ['NORMAL', 'WARNING'])->get();

    foreach ($bins as $bin) {
        // 2. Récupérer les 24 dernières lectures
        $readings = $bin->sensorReadings()
            ->latest('created_at')
            ->take(24)
            ->get()
            ->reverse()
            ->values()
            ->map(fn($r, $i) => [
                'x' => $i * 0.5,      // 0, 0.5, 1.0, 1.5... heures
                'y' => $r->fill_level, // niveau de remplissage
            ]);

        // 3. Ignorer si pas assez de données
        if ($readings->count() < 2) continue;

        // 4. Appeler le service Python
        $response = Http::timeout(5)->post(
            'http://127.0.0.1:8001/api/predict',
            ['bin_id' => $bin->id, 'readings' => $readings]
        );

        // 5. Stocker le résultat en BD
        Prediction::updateOrCreate(
            ['bin_id' => $bin->id],  // clé : une prédiction par benne
            [
                'predicted_fill_time' => now()->addHours($data['estimated_hours']),
                'fill_probability'    => $data['confidence'] / 100,
                'risk_level'          => $data['risk_level'],
                'recommendation'      => $data['recommendation'],
            ]
        );
    }
}
```

### 5.4 Appel HTTP de Laravel vers Python

```php
$response = Http::timeout(5)->post('http://127.0.0.1:8001/api/predict', [
    'bin_id'   => $bin->id,
    'readings' => $readings,  // tableau des mesures
]);
```

Ce code :
1. Envoie une requête HTTP POST à l'adresse `http://127.0.0.1:8001/api/predict`
2. Attend la réponse (timeout de 5 secondes maximum)
3. La réponse est un JSON contenant le résultat de la prédiction

---

## 6. Le frontend React (Inertia)

### 6.1 Rôle

La page `Predictions/Index.tsx` affiche les prédictions dans une interface utilisateur. Elle reçoit les données du `PredictionController` via Inertia.

### 6.2 Fonctionnement avec Inertia

Inertia est un outil qui permet d'utiliser React sans avoir à créer une API REST séparée. Le contrôleur renvoie directement les données à la page React :

```php
// Côté Laravel (PHP)
return Inertia::render('Predictions/Index', [
    'predictions' => $predictions,
]);

// Côté React (TypeScript)
const { predictions } = usePage().props;
predictions.data.map(...)  // ← les données sont directement disponibles
```

### 6.3 Composants de la page

La page `Predictions/Index.tsx` (250 lignes) est structurée ainsi :

1. **En-tête** : titre + bouton "Lancer l'IA"
2. **Analyse IA** : résumé du nombre de bennes à risque
3. **KPI cards** : nombre de prédictions, haute priorité, confiance, précision
4. **Timeline** : barres horizontales montrant le temps restant par benne
5. **Filtres** : recherche textuelle + filtre par priorité
6. **Cartes de prédictions** : pour chaque prédiction, on affiche :
   - ID de la prédiction, nom de la benne
   - Priorité (HIGH/MEDIUM/LOW)
   - Message de recommandation
   - Barre de progression (temps restant)
   - Métriques IA : confiance, score de risque, localisation
7. **Pagination**
8. **Pied de page** : informations sur le modèle IA

### 6.4 Interaction utilisateur

L'utilisateur clique sur **"Lancer l'IA"** → le bouton envoie une requête POST à `/predictions/generate` → le contrôleur appelle le service Python pour chaque benne → une fois terminé, la page se recharge automatiquement avec les nouvelles prédictions.

---

## 7. Schéma du flux complet

```
                  CHRONOLOGIE D'UNE PRÉDICTION

T=0 : L'utilisateur clique sur "Lancer l'IA"
        │
        ▼
T=1 : POST /predictions/generate
        │
        ▼
T=2 : PredictionController::generate()
        │
        ├── Boucle sur chaque benne active
        │      │
        │      ├── Récupère 24 lectures SensorReading
        │      │      └── SELECT * FROM sensor_readings WHERE bin_id = ?
        │      │             ORDER BY created_at DESC LIMIT 24
        │      │
        │      ├── Envoie à Python
        │      │      └── POST http://127.0.0.1:8001/api/predict
        │      │             Body: { bin_id, readings: [...] }
        │      │                    │
        │      │                    ▼
        │      │             Service Python (port 8001)
        │      │                    │
        │      │             predict.py ← numpy.polyfit()
        │      │                    │
        │      │             Retourne JSON :
        │      │             { risk_level, estimated_hours,
        │      │               confidence, recommendation }
        │      │                    │
        │      │◄────────────────────┘
        │      │
        │      └── Stocke le résultat
        │             └── UPDATE/INSERT INTO predictions
        │                    SET bin_id = ?, risk_level = ?, ...
        │
        └── Fin de la boucle
               │
               ▼
T=3 : Redirection vers GET /predictions
               │
               ▼
T=4 : PredictionController::index()
        │
        ├── SELECT * FROM predictions ORDER BY created_at DESC
        │      → Paginated collection
        │
        └── Transmet à Inertia/React
               │
               ▼
T=5 : Affichage dans le navigateur
        └── Page Predictions/Index.tsx
               │
               ├── En-tête + bouton
               ├── Analyse IA (risques critiques)
               ├── KPI cards (confiance, priorité...)
               ├── Timeline des risques
               ├── Filtres (recherche, priorité)
               ├── Cartes de prédictions × 8 par page
               └── Pagination
```

---

## 8. Comment exécuter le projet

### 8.1 Prérequis

- PHP 8.2+
- Composer
- Node.js 20+
- Python 3.12+
- MySQL

### 8.2 Installation

```bash
# 1. Installer les dépendances Laravel
composer install

# 2. Installer les dépendances frontend
npm install

# 3. Copier le fichier .env
cp .env.example .env
# Configurer la base de données dans .env

# 4. Lancer les migrations
php artisan migrate

# 5. Lancer les seeders (données de démonstration)
php artisan db:seed

# 6. Installer les dépendances Python
cd ai_service
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
cd ..
```

### 8.3 Démarrage (deux terminaux nécessaires)

**Terminal 1 — Service IA Python :**
```bash
cd ai_service
.venv\Scripts\python main.py
# Le service démarre sur http://127.0.0.1:8001
```

**Terminal 2 — Laravel :**
```bash
php artisan serve
# Le site démarre sur http://127.0.0.1:8000
```

**Alternative :** double-cliquer sur `start-ai.bat` pour lancer Python automatiquement.

### 8.4 Utilisation

1. Ouvrir `http://127.0.0.1:8000` dans un navigateur
2. Se connecter avec un compte administrateur
3. Naviguer vers **IA Prédictions** (dans la sidebar)
4. Cliquer sur **"Lancer l'IA"**
5. Les prédictions s'affichent dans les cartes

---

## 9. Limitations du système actuel

### 9.1 Modèle — Régression linéaire simple

L'algorithme actuel (`numpy.polyfit`) est une régression linéaire simple. Ses limites :

| Limitation | Explication | Impact |
|---|---|---|
| **Aucune saisonnalité** | Le modèle ne sait pas qu'une benne se remplit plus vite le week-end ou pendant les fêtes | Prédictions moins précises le week-end |
| **Pas de gestion des outliers** | Une mesure aberrante (ex: capteur bloqué à 95% puis revenu à 20%) fausse toute la projection | Fausses alertes |
| **Aucune donnée externe** | Température, météo, jours fériés, événements locaux ne sont pas pris en compte | Modèle aveugle au contexte |
| **Modèle non versionné** | À chaque requête, on recalcule `polyfit` depuis zéro. On ne sauvegarde pas l'état du modèle (pente, R², historique) | Impossible de comparer les performances dans le temps |

### 9.2 Robustesse et qualité de code

| Problème | Détail | Gravité |
|---|---|---|
| **Aucun test** | `predict.py` n'a aucun test unitaire. Modifier l'algorithme = risque de régression | Haute |
| **Pas de validation des entrées Python** | Si `y > 100` ou `y < 0`, le calcul continue sans avertir | Moyenne |
| **Perte de précision** | `(int) $data['estimated_hours']` dans `PredictionController.php:84` arrondit `4.3h` → `4h` | Haute |
| **`riskScore` fake** | Ligne 125 : `rand(75, 95)` → le score affiché n'a rien de réel, c'est un nombre aléatoire | Haute |
| **Erreurs silencieuses** | Si Python est down, `generate()` continue sans aucun message pour l'utilisateur | Haute |
| **Aucune authentification** | L'API Python (`/api/predict`) est accessible sans aucun token sur le port 8001 | Haute |
| **Aucun logging/monitoring** | Impossible de savoir si le service Python a planté, combien de temps il répond, etc. | Moyenne |

### 9.3 Automatisation et maintenance

| Problème | Détail | Gravité |
|---|---|---|
| **Pas de scheduler** | Les prédictions ne se lancent que manuellement via le bouton "Lancer l'IA" | Haute |
| **Pas de nettoyage** | Les vieilles prédictions s'accumulent sans limite en base de données | Basse |
| **Pas de métriques de performance** | On ne mesure jamais si les prédictions étaient correctes (MAE, RMSE, taux de faux positifs) | Haute |

---

## 10. Axes d'amélioration

### 10.1 Court terme (faible effort)

| Amélioration | Description | Effort |
|---|---|---|
| **Correction précision** | Remplacer `(int)` par `(float)` + `addMinutes()` pour conserver les décimales dans `estimated_hours` | 5 min |
| **Vrai `riskScore`** | Calculer un score réel basé sur la pente, R², et heures restantes au lieu de `rand()` | 30 min |
| **Tests unitaires Python** | Ajouter des tests avec `pytest` pour `predict.py` : cas normal, pente négative, données insuffisantes, outliers | 1h |
| **Authentification simple** | Ajouter une clé API statique (header `X-API-Key`) entre Laravel et Python | 30 min |
| **Message flash erreur** | Si Python ne répond pas, afficher un message d'erreur dans l'interface au lieu de rester silencieux | 30 min |
| **Scheduler Laravel** | Ajouter une tâche planifiée (`php artisan schedule:run`) pour lancer `generate()` toutes les heures | 30 min |

### 10.2 Moyen terme (effort modéré)

| Amélioration | Description | Effort |
|---|---|---|
| **Benchmark et métriques** | Ajouter une table `prediction_logs` pour stocker l'historique des prédictions avec la date de collecte réelle, puis calculer MAE, RMSE, précision | 1-2 jours |
| **Nettoyage automatique** | Supprimer les prédictions de plus de 7 jours via le scheduler | 1h |
| **Notifications** | Envoyer un email/Telegram automatiquement quand une prédiction HIGH est générée | 1-2 jours |
| **Docker Compose** | Conteneuriser Laravel + Python + MySQL + Redis | 2-3 jours |
| **Données externes** | Ajouter la météo, le jour de la semaine, les jours fériés comme variables d'entrée de `predict()` | 2-3 jours |

### 10.3 Long terme (effort important)

| Amélioration | Description | Effort |
|---|---|---|
| **Modèle LSTM** | Remplacer la régression linéaire par un réseau de neurones récurrent (LSTM) qui apprend les cycles journaliers et hebdomadaires | 1-2 semaines |
| **Détection d'outliers** | Ajouter une étape de prétraitement (Z-score, IQR) pour filtrer les mesures aberrantes avant la prédiction | 2-3 jours |
| **Entraînement périodique** | Ré-entraîner automatiquement le modèle chaque semaine avec toutes les données historiques collectées | 3-5 jours |
| **API sécurisée** | Remplacer la clé statique par JWT ou OAuth2 entre Laravel et Python | 2-3 jours |
| **Dashboard monitoring** | Page dédiée pour visualiser la santé du service IA (temps de réponse, erreurs, nombre de prédictions) | 2-3 jours |

### 10.4 Tableau récapitulatif

| Amélioration | Effort | Impact | Priorité |
|---|---|---|---|
| Correction précision `(int)` → `(float)` | 5 min | Élevé | ⭐ Prioritaire |
| Vrai `riskScore` au lieu de `rand()` | 30 min | Élevé | ⭐ Prioritaire |
| Tests unitaires `predict.py` | 1h | Moyen | ✅ Important |
| Authentification Python | 30 min | Élevé | ✅ Important |
| Message flash erreur | 30 min | Moyen | ✅ Important |
| Scheduler automatique | 30 min | Élevé | ✅ Important |
| Benchmark + métriques | 1-2 jours | Élevé | 🔶 Souhaitable |
| Docker Compose | 2-3 jours | Moyen | 🔶 Souhaitable |
| LSTM | 1-2 semaines | Très élevé | 🔷 Vision |
| Notifications | 1-2 jours | Moyen | 🔷 Vision |

---

## Annexe — Structure des fichiers du projet IA

```
smartbin/
│
├── ai_service/                          # Service IA Python
│   ├── main.py                          # Serveur FastAPI
│   ├── predict.py                       # Algorithme de régression
│   ├── requirements.txt                 # Dépendances Python
│   └── .venv/                           # Environnement virtuel
│
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── PredictionController.php # Contrôleur de prédictions
│   │
│   └── Models/
│       ├── Prediction.php               # Modèle Eloquent
│       ├── Bin.php                      # Modèle Benne
│       └── SensorReading.php            # Modèle Lecture capteur
│
├── database/
│   ├── migrations/
│   │   └── *_create_predictions_table.php
│   └── factories/
│       └── PredictionFactory.php
│
├── resources/
│   └── js/
│       └── Pages/
│           └── Predictions/
│               └── Index.tsx            # Page React des prédictions
│
├── routes/
│   └── web.php                          # Routes (dont /predictions)
│
├── start-ai.bat                         # Script de démarrage Python
└── RAPPORT_IA.md                        # Ce document
```

---

*Document rédigé pour la soutenance du projet SmartBin — Juin 2026*
