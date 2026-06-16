import numpy as np

COEFF_JOUR = {0: 1.3, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 0.8, 6: 0.7}
COEFF_HEURE = {
    0: 1.2, 1: 1.2, 2: 1.2, 3: 1.2, 4: 1.2, 5: 1.2,
    6: 0.85, 7: 0.85, 8: 0.85, 9: 0.85, 10: 0.85, 11: 0.85,
    12: 1.0, 13: 1.0, 14: 1.0, 15: 1.0, 16: 1.0, 17: 1.0,
    18: 1.1, 19: 1.1, 20: 1.1, 21: 1.1, 22: 1.1, 23: 1.1,
}

def predict(readings: list[dict], day_of_week: int | None = None, hour_of_day: int | None = None) -> dict:
    """
    readings = [{"x": hours_since_start, "y": fill_level}, ...]
    day_of_week : 0=dimanche, 1=lundi ... 6=samedi
    hour_of_day : 0-23
    Retourne: { risk_level, estimated_hours, confidence, recommendation }
    """
    if len(readings) < 2:
        return {
            "risk_level": "LOW",
            "estimated_hours": None,
            "confidence": 0,
            "recommendation": "Pas assez de données pour une prédiction (min 2 relevés)",
        }

    x = np.array([r["x"] for r in readings])
    y = np.array([r["y"] for r in readings])

    if np.std(x) == 0:
        return {
            "risk_level": "LOW",
            "estimated_hours": None,
            "confidence": 0,
            "recommendation": "Données insuffisantes (pas de variation temporelle)",
        }

    # ──────────────────────────────────────────────
    # FILTRE ANTI-OUTLIERS (méthode IQR)
    # ──────────────────────────────────────────────
    # Objectif : supprimer les relevés aberrants qui fausseraient la
    # régression linéaire. Un outlier = capteur bruyant / défaillant
    # qui envoie une valeur farfelue (ex: fill_level = 95 alors que
    # les voisins sont à 30-45). Sans filtre, la pente serait
    # artificiellement gonflée → fausse prédiction, fausse alerte.
    #
    # Méthode IQR (InterQuartile Range) :
    #   1. Trier les fill_level (y) et calculer les quartiles Q1, Q3
    #   2. IQR = Q3 - Q1  (largeur de l'intervalle "normal")
    #   3. Borne basse = Q1 - 1.5 * IQR
    #   4. Borne haute = Q3 + 1.5 * IQR
    #   5. Conserver uniquement les relevés où Q1 - 1.5*IQR ≤ y ≤ Q3 + 1.5*IQR
    #
    # Pourquoi 1.5 ? C'est le seuil standard de Tukey, reconnu comme
    # robuste même sur des petits échantillons (≥5 points).
    # Pourquoi pas Z-score ? Z-score suppose une distribution normale,
    # ce qui est faux sur 5-24 relevés. IQR est non-paramétrique.
    #
    # Si le filtre supprime trop de points (< 3 restants), on préfère
    # garder les données brutes pour éviter de faire une prédiction
    # sur un échantillon trop petit.
    # ──────────────────────────────────────────────
    valeurs_y = np.array([r["y"] for r in readings])
    q1, q3 = np.percentile(valeurs_y, [25, 75])
    iqr = q3 - q1
    borne_basse = q1 - 1.5 * iqr
    borne_haute = q3 + 1.5 * iqr
    # Appliquer le filtre — on garde les points dans l'intervalle normal
    readings_filtrees = [r for r in readings if borne_basse <= r["y"] <= borne_haute]
    if len(readings_filtrees) >= 3:
        readings = readings_filtrees
        # Recalculer x et y à partir des données filtrées
        x = np.array([r["x"] for r in readings])
        y = np.array([r["y"] for r in readings])

    # ──────────────────────────────────────────────
    # RÉGRESSION LINÉAIRE
    # ──────────────────────────────────────────────
    # Modèle : fill_level(y) = pente(a) * heures(x) + ordonnée_origine(b)
    # numpy.polyfit(x, y, 1) calcule a et b par la méthode des moindres carrés
    # ──────────────────────────────────────────────
    a, b = np.polyfit(x, y, 1)

    # Si la pente est négative (remplissage diminue), Overflow non prévu
    if a <= 0:
        return {
            "risk_level": "LOW",
            "estimated_hours": None,
            "confidence": round(abs(a) * 10, 1),
            "recommendation": "Niveau de remplissage stable ou en baisse — aucune intervention nécessaire",
        }

    dernier_fill = float(y[-1])
    heures_restantes = (100 - dernier_fill) / a

    # Saisonnalité — ajustement selon jour + heure courants
    coeff = COEFF_JOUR.get(day_of_week, 1.0) * COEFF_HEURE.get(hour_of_day, 1.0)
    heures_restantes *= coeff

    # Calcul R² (qualité de la régression)
    y_pred = a * x + b
    ss_res = np.sum((y - y_pred) ** 2)
    ss_tot = np.sum((y - np.mean(y)) ** 2)
    r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
    confidence = round(max(0, min(100, r2 * 100)), 1)

    # Niveau de risque
    if heures_restantes <= 3:
        risk = "HIGH"
    elif heures_restantes <= 12:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    # Recommandation
    recommandations = {
        "HIGH": f"Intervention immédiate requise — débordement prévu dans {round(heures_restantes)}h. Dépêcher une équipe de collecte en priorité.",
        "MEDIUM": f"Débordement estimé dans {round(heures_restantes)}h. Planifier une collecte dans les prochaines heures.",
        "LOW": f"Surveillance de routine. Niveau critique estimé dans {round(heures_restantes)}h.",
    }

    return {
        "risk_level": risk,
        "estimated_hours": round(heures_restantes, 1),
        "confidence": confidence,
        "recommendation": recommandations[risk],
    }
