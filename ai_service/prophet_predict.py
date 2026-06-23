"""
Prédiction de débordement avec un modèle Prophet pré-entraîné.

Déroulement :
  1. Charger le modèle .pkl de la benne (s'il existe)
  2. Faire un forecast sur 168h (7 jours) avec Prophet
  3. Détecter quand yhat ≥ 100 (débordement)
  4. Calculer le niveau de risque (HIGH ≤ 3h, MEDIUM ≤ 12h, LOW > 12h)
  5. Calculer la confiance = 100 - largeur_IC (plus l'IC est étroit, plus on est sûr)

Si le modèle n'existe pas, le fallback est signalé (fallback=True) pour que
l'appelant (PHP PredictionService ou main.py) utilise la régression linéaire.

Sortie :
  - { "bin_id", "model": "prophet", "available": true/false,
      "fallback": true/false, "risk_level", "estimated_hours",
      "confidence": 0-100, "recommendation", "interval": { "earliest", "latest" },
      "last_fill" }
"""

import json
import os
import joblib
import numpy as np
import pandas as pd
from prophet import Prophet

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def _model_path(bin_id: str) -> str:
    """Chemin vers le fichier .pkl du modèle Prophet pour une benne."""
    return os.path.join(MODELS_DIR, f"bin_{bin_id}_prophet.pkl")


def _metadata_path(bin_id: str) -> str:
    """Chemin vers le fichier metadata.json du modèle Prophet pour une benne."""
    return os.path.join(MODELS_DIR, f"bin_{bin_id}_metadata.json")


def predict(readings: list[dict], bin_id: str) -> dict:
    """
    Prédit le risque de débordement avec Prophet.

    Parameters
    ----------
    readings : list[dict]
        Relevés récents [{ "ds": "2026-06-22T10:00:00", "y": 73.5 }, ...]
    bin_id : str
        Identifiant UUID de la benne

    Returns
    -------
    dict : Résultat de la prédiction (voir détail ci-dessous)
    """
    model_path = _model_path(bin_id)

    # ─── Vérification : le modèle existe-t-il ? ───
    # Si pas de modèle, on signale fallback=True pour que l'appelant utilise
    # la régression linéaire (Tier 1) en attendant l'entraînement nocturne.
    if not os.path.exists(model_path):
        return {
            "bin_id": bin_id,
            "model": "prophet",
            "available": False,
            "fallback": True,
        }

    try:
        model: Prophet = joblib.load(model_path)
    except Exception:
        return {
            "bin_id": bin_id,
            "model": "prophet",
            "available": False,
            "fallback": True,
        }

    # ─── Chargement des métadonnées ───
    metadata = {}
    meta_path = _metadata_path(bin_id)
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            metadata = json.load(f)

    last_fill = metadata.get("last_fill", 50)

    # ─── Préparation du DataFrame de prédiction ───
    # On prend les lectures les plus récentes pour s'assurer que Prophet
    # part de la situation actuelle.
    df = pd.DataFrame(readings)
    df["ds"] = pd.to_datetime(df["ds"])
    latest = df["ds"].max()

    # ─── Forecast sur 7 jours (168h) ───
    # make_future_dataframe crée 168 pas horaires dans le futur.
    # include_history=False : on ne veut que le futur, pas le passé.
    # On filtre pour garder uniquement les dates > dernier relevé connu
    # (Prophet peut inclure la dernière date dans le futur si elle coïncide).
    future = model.make_future_dataframe(periods=168, freq="h", include_history=False)
    future = future[future["ds"] > latest]

    forecast = model.predict(future)

    # ─── Détection du débordement ───
    # yhat = prediction moyenne (meilleure estimation)
    # yhat_lower = borne inférieure de l'intervalle de confiance à 80%
    # yhat_upper = borne supérieure de l'intervalle de confiance à 80%
    # On cherche la première heure où yhat ≥ 100 (benne pleine).
    crossover = forecast[forecast["yhat"] >= 100]

    if crossover.empty:
        # Pas de débordement prévu dans les 7 jours → risque LOW
        last = forecast.iloc[-1]
        hours_to_100 = None
        risk = "LOW"
        rec = "Remplissage stable, pas de débordement prévu dans les 7 jours."
        # Confiance basée sur le niveau final estimé (plus on est proche
        # de 100, plus le risque est potentiellement sous-estimé).
        confidence = round(max(0, min(100, (last["yhat"] / 100) * 50)), 1)
    else:
        first = crossover.iloc[0]
        # Nombre d'heures avant débordement
        hours_to_100 = round((first["ds"] - latest).total_seconds() / 3600, 1)

        # Intervalle de confiance du débordement :
        #   - upper_cross = yhat_upper ≥ 100 → débordement le PLUS TÔT possible
        #     (scénario pessimiste : remplissage rapide)
        #   - lower_cross = yhat_lower ≥ 100 → débordement le PLUS TARD possible
        #     (scénario optimiste : remplissage lent)
        upper_cross = forecast[forecast["yhat_upper"] >= 100]
        lower_cross = forecast[forecast["yhat_lower"] >= 100]
        hours_earliest = round((upper_cross.iloc[0]["ds"] - latest).total_seconds() / 3600, 1) if not upper_cross.empty else None
        hours_latest = round((lower_cross.iloc[0]["ds"] - latest).total_seconds() / 3600, 1) if not lower_cross.empty else None

        # Niveau de risque :
        #   HIGH   ≤ 3h   → intervention immédiate
        #   MEDIUM ≤ 12h  → planifier collecte
        #   LOW    > 12h  → surveillance routine
        if hours_to_100 <= 3:
            risk = "HIGH"
        elif hours_to_100 <= 12:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        # Recommandation adaptée au risque
        if risk == "HIGH":
            rec = f"Intervention immediate ! Debordement prevu dans {hours_to_100}h."
        elif risk == "MEDIUM":
            rec = f"Planifier collecte. Debordement estime dans {hours_to_100}h."
        else:
            rec = f"Surveillance routine. Niveau critique dans {hours_to_100}h."

        # Confiance : 100 - largeur_IC
        #   - Largeur IC = yhat_upper - yhat_lower (au point de croisement)
        #   - Plus l'IC est étroit (faible largeur) → plus la prédiction est fiable
        #   - Exemple : IC = [95, 105] → largeur = 10 → confiance = 90%
        ci_width = first["yhat_upper"] - first["yhat_lower"]
        confidence = round(max(0, min(100, 100 - ci_width)), 1)

    return {
        "bin_id": bin_id,
        "model": "prophet",
        "available": True,
        "fallback": False,
        "risk_level": risk,
        "estimated_hours": hours_to_100,
        "confidence": confidence,
        "recommendation": rec,
        "interval": {
            "earliest": hours_earliest,
            "latest": hours_latest,
        },
        "last_fill": last_fill,
    }
