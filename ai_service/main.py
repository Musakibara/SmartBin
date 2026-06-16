from fastapi import FastAPI
from pydantic import BaseModel
from predict import predict

app = FastAPI(title="SmartBin AI Service")


class Reading(BaseModel):
    x: float
    y: float


class PredictionRequest(BaseModel):
    bin_id: str
    readings: list[Reading]
    day_of_week: int | None = None
    hour_of_day: int | None = None


class PredictionResponse(BaseModel):
    bin_id: str
    risk_level: str
    estimated_hours: float | None = None
    confidence: float
    recommendation: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/predict", response_model=PredictionResponse)
def get_prediction(req: PredictionRequest):
    readings = [{"x": r.x, "y": r.y} for r in req.readings]
    result = predict(readings, day_of_week=req.day_of_week, hour_of_day=req.hour_of_day)
    result["bin_id"] = req.bin_id
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
