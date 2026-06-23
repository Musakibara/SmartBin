"""
API FastAPI du service IA SmartBin.

Architecture à 2 niveaux (tiers) :
  - Tier 1 (rapide) : /api/predict — régression linéaire simple
  - Tier 2 (précis) : /api/predict/v2 — Prophet (entraîné chaque nuit)
  - Entraînement    : /api/train/prophet — sauvegarde en .pkl

Flux de prédiction (appelé depuis Laravel via PredictionService) :
  1. PHP appelle POST /api/predict/v2 avec { bin_id, readings }
  2. Si modèle Prophet existe → prédiction Prophet
  3. Sinon → fallback vers régression linéaire

Lancement : uvicorn main:app --host 127.0.0.1 --port 8001
"""

from fastapi import FastAPI
from pydantic import BaseModel
from predict import predict as linear_predict
from prophet_train import train as prophet_train
from prophet_predict import predict as prophet_predict

app = FastAPI(title="SmartBin AI Service")


# ─── Schémas Pydantic (validation automatique des requêtes) ───

class Reading(BaseModel):
    """Un relevé de capteur. Soit x (heures), soit ds (timestamp ISO)."""
    x: float | None = None      # Heures depuis le début (régression linéaire)
    y: float                     # fill_level (0-100)
    ds: str | None = None        # Timestamp ISO8601 (Prophet)


class PredictionRequest(BaseModel):
    """Requête de prédiction (Tier 1 - régression linéaire)."""
    bin_id: str
    readings: list[Reading]
    day_of_week: int | None = None  # 0=dimanche...6=samedi (pour saisonnalité)
    hour_of_day: int | None = None  # 0-23


class PredictionResponse(BaseModel):
    """Réponse standardisée d'une prédiction (Tier 1)."""
    bin_id: str
    risk_level: str
    estimated_hours: float | None = None
    confidence: float
    recommendation: str


# ──────────────────────────────────────────────
# Tier 1 : Régression linéaire (fallback rapide)
# ──────────────────────────────────────────────
# Utilisée quand le modèle Prophet n'est pas encore entraîné
# (cold start) ou lorsque l'appel précédent (/api/predict) est
# fait explicitement.


@app.get("/health")
def health():
    """Point de contrôle — utilisé par Laravel/uptime monitor."""
    return {"status": "ok"}


@app.post("/api/predict", response_model=PredictionResponse)
def get_prediction(req: PredictionRequest):
    """
    Prédiction par régression linéaire (Tier 1).
    Simple et rapide, basée sur numpy.polyfit.
    """
    readings = [{"x": r.x, "y": r.y} for r in req.readings]
    result = linear_predict(readings, day_of_week=req.day_of_week, hour_of_day=req.hour_of_day)
    result["bin_id"] = req.bin_id
    return result


# ──────────────────────────────────────────────
# Tier 2 : Prophet (prédiction précise)
# ──────────────────────────────────────────────


class ProphetTrainRequest(BaseModel):
    """Requête d'entraînement d'un modèle Prophet."""
    bin_id: str
    readings: list[Reading]


class ProphetPredictRequest(BaseModel):
    """Requête de prédiction avec Prophet."""
    bin_id: str
    readings: list[Reading]


@app.post("/api/train/prophet")
def train_prophet(req: ProphetTrainRequest):
    """
    Entraîne un modèle Prophet pour une benne spécifique.
    Appelé chaque nuit à 02:00 par `php artisan predictions:train-prophet`.
    """
    readings = [{"ds": r.ds or r.x, "y": r.y} for r in req.readings]
    return prophet_train(readings, req.bin_id)


@app.post("/api/predict/v2")
def predict_prophet(req: ProphetPredictRequest):
    """
    Prédiction avec Prophet (Tier 2).
    Si aucun modèle Prophet n'existe pour cette benne,
    fallback automatique vers la régression linéaire (Tier 1).
    """
    readings = [{"ds": r.ds or r.x, "y": r.y} for r in req.readings]
    result = prophet_predict(readings, req.bin_id)

    if result.get("fallback"):
        # Pas de modèle Prophet trouvé → fallback vers régression linéaire
        # Pour la régression linéaire, on utilise un intervalle de 30 min
        # entre chaque relevé (i * 0.5 = heures)
        linear_readings = [{"x": i * 0.5, "y": r.y} for i, r in enumerate(req.readings)]
        linear_result = linear_predict(linear_readings)
        linear_result["bin_id"] = req.bin_id
        linear_result["model"] = "linear"
        linear_result["interval"] = None
        return linear_result

    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
