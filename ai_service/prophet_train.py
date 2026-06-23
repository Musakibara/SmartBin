"""
Entraînement des modèles Prophet pour la prédiction de débordement des bennes.

Prophet (Meta/Facebook) est un modèle de prévision de séries temporelles qui
décompose les données en :
  - Tendance (trend) : évolution globale du remplissage
  - Saisonnalité (weekly) : variation selon le jour de la semaine
  - Jours fériés : jours fériés camerounais (CM) — plus de déchets ?

Architecture :
  - Chaque benne a son propre modèle Prophet (fichier .pkl + metadata.json)
  - Les modèles sont entraînés chaque nuit à 02:00
  - Minimum 14 relevés requis (sinon le modèle serait trop instable)
  - Les modèles sont sauvegardés dans ai_service/models/ (ignoré par git)

Sortie :
  - Succès : { "status": "trained", "bin_id": "...", "num_readings": N,
                "last_fill": 73.5 }
  - Échec :  { "status": "skipped", "reason": "...", "bin_id": "..." }
"""

import json
import os
import joblib
import numpy as np
import pandas as pd
from prophet import Prophet

# Dossier de sauvegarde des modèles (gitignoré via .gitignore)
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def _model_path(bin_id: str) -> str:
    """
    Chemin du fichier .pkl contenant le modèle Prophet sérialisé.
    Exemple : ai_service/models/bin_abc123_prophet.pkl
    """
    return os.path.join(MODELS_DIR, f"bin_{bin_id}_prophet.pkl")


def _metadata_path(bin_id: str) -> str:
    """
    Chemin du fichier JSON contenant les métadonnées du modèle :
      - bin_id, date d'entraînement, nombre de relevés, date min/max,
        dernier niveau de remplissage connu
    """
    return os.path.join(MODELS_DIR, f"bin_{bin_id}_metadata.json")


def train(readings: list[dict], bin_id: str, country_holidays: str | None = "CM") -> dict:
    """
    Entraîne un modèle Prophet pour une benne spécifique.

    Parameters
    ----------
    readings : list[dict]
        Liste de relevés [{ "ds": "2026-06-15T10:00:00", "y": 45.3 }, ...]
        "ds" = timestamp ISO8601, "y" = fill_level (0-100)
    bin_id : str
        Identifiant unique de la benne (UUID)
    country_holidays : str | None
        Code pays ISO 3166-1 alpha-2 pour les jours fériés (défaut: "CM" = Cameroun)

    Returns
    -------
    dict : statut de l'entraînement
    """
    # ─── Validation : minimum 14 relevés ───
    # Pourquoi 14 ? Prophet a besoin d'au moins 2 semaines de données (au pas
    # horaire, 24*7=168 serait l'idéal). 14 est le strict minimum pour que
    # la décomposition tendance + saisonnalité hebdomadaire ait un sens.
    if len(readings) < 14:
        return {
            "status": "skipped",
            "reason": f"Pas assez de lectures ({len(readings)}), minimum 14 requis",
            "bin_id": bin_id,
        }

    # ─── Préparation des données ───
    # Prophet exige un DataFrame avec deux colonnes nommées EXACTEMENT :
    #   - "ds" : datetime (timestamp)
    #   - "y"  : valeur numérique à prédire
    df = pd.DataFrame(readings)
    df["ds"] = pd.to_datetime(df["ds"])
    # Tri chronologique + dédoublonnage (même timestamp = doublon = erreur capteur)
    df = df.sort_values("ds").drop_duplicates(subset=["ds"]).reset_index(drop=True)

    if len(df) < 14:
        return {
            "status": "skipped",
            "reason": f"Pas assez de lectures apres dedup ({len(df)}), minimum 14",
            "bin_id": bin_id,
        }

    # ─── Configuration du modèle Prophet ───
    # yearly_seasonality=False : pas assez de données pour un cycle annuel
    # weekly_seasonality=True  : cycle hebdomadaire (plus de déchets le WE ?)
    # daily_seasonality=False  : pas nécessaire, les données sont horaires
    # seasonality_mode="multiplicative" : la saisonnalité augmente avec le niveau
    #   (plus la benne est pleine, plus l'effet jour/nuit est marqué)
    # changepoint_prior_scale=0.05 : flexibilité de la tendance
    #   (0.01 = très rigide, 0.5 = très flexible, 0.05 = bon équilibre)
    # interval_width=0.80 : intervalle de confiance à 80%
    #   (le "vrai" niveau a 80% de chances d'être dans [yhat_lower, yhat_upper])
    model = Prophet(
        yearly_seasonality=False,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode="multiplicative",
        changepoint_prior_scale=0.05,
        interval_width=0.80,
    )

    # Ajout des jours fériés camerounais pour éviter que le modèle
    # interprète une baisse d'activité (ex: jour férié) comme une tendance
    # générale à la baisse.
    if country_holidays:
        model.add_country_holidays(country_name=country_holidays)

    # ─── Entraînement ───
    # Prophet utilise Stan (MCMC) en backend — c'est ce qui le rend plus
    # lent mais plus robuste qu'une simple régression linéaire.
    # show_console=False : éviter la pollution des logs serveur
    model.fit(df, show_console=False)

    # ─── Sauvegarde ───
    # Le modèle est sérialisé avec joblib (plus efficace que pickle pour
    # les gros objets scikit-learn/prophet)
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(model, _model_path(bin_id))

    # Métadonnées : servent à savoir quand le modèle a été entraîné pour
    # la dernière fois, et quel était le dernier niveau connu.
    metadata = {
        "bin_id": bin_id,
        "trained_at": pd.Timestamp.now().isoformat(),
        "num_readings": len(df),
        "date_min": df["ds"].min().isoformat(),
        "date_max": df["ds"].max().isoformat(),
        "last_fill": float(df["y"].iloc[-1]),
    }
    with open(_metadata_path(bin_id), "w") as f:
        json.dump(metadata, f, indent=2)

    return {
        "status": "trained",
        "bin_id": bin_id,
        "num_readings": len(df),
        "last_fill": metadata["last_fill"],
    }
