"""Test complet : train + predict v2 via l'API FastAPI"""
import json
import urllib.request
import numpy as np
import pandas as pd

BASE = "http://127.0.0.1:8001"

def post(url, data, timeout=60):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())

# 1. Créer des données réalistes (7 jours, toutes les heures)
dates = pd.date_range("2026-06-15", periods=168, freq="h")
fill = 15 + np.arange(168) * 0.45 + np.random.normal(0, 2, 168)
fill = np.clip(fill, 0, 100)

readings = [{"ds": d.isoformat(), "y": float(f)} for d, f in zip(dates, fill)]

# 2. Train
print("=== Train ===")
result = post(f"{BASE}/api/train/prophet", {"bin_id": "test-bin-001", "readings": readings})
print(json.dumps(result, indent=2))

# 3. Predict v2
print("\n=== Predict v2 ===")
result = post(f"{BASE}/api/predict/v2", {"bin_id": "test-bin-001", "readings": readings[-24:]})
print(json.dumps(result, indent=2))
