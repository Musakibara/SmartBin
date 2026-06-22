# Plan : Intégration Prophet pour prédictions IA

## Principe : deux-tier

| Tier | Modèle | Usage | Vitesse |
|------|--------|-------|---------|
| **Tier 1** (rapide) | Régression linéaire actuelle | Bouton "Launch AI" + prédictions immédiates | ~ms |
| **Tier 2** (précis) | Prophet | Tâche planifiée `predictions:generate` (toutes les heures) | ~secondes/benne |

## Nouveaux endpoints Python

```
POST /api/predict       → régression linéaire (inchangé)
POST /api/predict/v2    → Prophet si modèle disponible, sinon fallback linéaire
POST /api/train/prophet → entraîne Prophet pour une benne spécifique (ou toutes)
```

## Réponse Prophet enrichie

```json
{
  "bin_id": "...",
  "risk_level": "HIGH",
  "estimated_hours": 2.5,
  "confidence": 85.0,
  "recommendation": "Collecte urgente dans 2-4h",
  "model": "prophet",
  "interval": {"lower": 1.5, "upper": 4.0}
}
```

## Stockage des modèles

```
ai_service/models/
├─ bin_{uuid}_prophet.pkl     → modèle Prophet sérialisé (joblib)
├─ bin_{uuid}_metadata.json   → date dernier entraînement, nombre de lectures
```

## Cycle de vie

```
predictions:generate (hourly)
       │
       ├─ 1. Prédiction rapide (linéaire) pour temps réel ← bouton "Launch AI"
       │
       └─ 2. Prédiction précise (Prophet) pour chaque benne
              │
              ├─ Assez de données (>7j) ? → POST /api/predict/v2
              │                             → retourne risk + intervalle
              │
              └─ Pas assez ? → fallback linéaire

predictions:train-prophet (daily, minuit)
       │
       └─ Pour chaque benne :
              ├─ Récupérer 30 derniers jours de readings
              ├─ POST /api/train/prophet
              └─ Prophet.fit() → model.pkl sauvegardé sur disque
```

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `ai_service/prophet_predict.py` | **Nouveau** — prédiction Prophet chargée depuis le disque |
| `ai_service/prophet_train.py` | **Nouveau** — entraînement + sauvegarde du modèle |
| `ai_service/main.py` | **Modifié** — ajouter routes `/predict/v2` et `/train/prophet` |
| `ai_service/requirements.txt` | **Modifié** — ajouter `prophet` |
| `app/Services/PredictionService.php` | **Modifié** — appeler `/predict/v2` pour le mode "precise" |
| `app/Console/Commands/TrainProphetModels.php` | **Nouveau** — commande artisan pour lancer l'entraînement |
| `routes/console.php` | **Modifié** — ajouter `predictions:train-prophet` daily |
| `.gitignore` | **Modifié** — ajouter `ai_service/models/` |

## Points d'attention

1. **Temps d'entraînement** : Prophet ~2-5s/benne → 24 bennes = ~1-2 min. À faire en background.
2. **RAM** : pystan/prophet ~200-500 Mo au chargement.
3. **Cold start** : nouveau capteur = pas de prédiction Prophet pendant 7j.
4. **Dérive** : ré-entraînement daily nécessaire.
5. **Prophet nécessite ≥ 7 jours de données** avant de pouvoir être utilisé (fallback linéaire en attendant).
6. Les modèles sérialisés (`.pkl`) doivent être dans `.gitignore`.

## Améliorations futures possibles

- Détection d'anomalies (changement soudain de tendance)
- Prédiction à plusieurs horizons (1h, 3h, 12h)
- Dashboard : courbe de tendance réelle vs prédite
