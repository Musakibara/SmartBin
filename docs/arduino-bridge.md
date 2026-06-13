# Arduino → SmartBin : Architecture de collecte des données

```
┌──────────────────┐     USB Serial      ┌────────────────────┐     HTTP POST      ┌──────────────────────┐
│   Arduino Uno    │ ──────────────────→ │   Bridge Script    │ ─────────────────→ │   Laravel API        │
│  (capteurs +     │    COM3 (exemple)   │  (Python / Node)   │   /api/readings   │   /api/sensor-readings│
│   ultrasons)     │                     │                    │                   │                       │
└──────────────────┘                     └────────────────────┘                   └──────────────────────┘
                                                                                           │
                                                                                           ▼
                                                                                   ┌──────────────────────┐
                                                                                   │   MySQL (smartbin)    │
                                                                                   │   sensor_readings     │
                                                                                   └──────────────────────┘
```

## Ce que l'Arduino envoie (via Serial)

Un format simple, exemple toutes les 5 minutes :

```
BIN-001|45|24.5|85
```

Soit : `ID_Benne|FillLevel%|Température°C|Batterie%`

## Le Bridge Script (Python recommandé)

- Lit le port COM en continu
- Parse chaque ligne
- POST vers `POST /api/sensor-readings` avec un token API
- Peut tourner en tâche de fond (Windows Service / tâche planifiée)

## Ce qu'il faudra créer côté Laravel

- **Route API** : `POST /api/sensor-readings` (protégée par token)
- **Controller** : `SensorReadingController@store` qui crée l'enregistrement
- Optionnel : une **API endpoint** `GET /api/bins/{code}/data` pour que l'Arduino avec WiFi puisse pull ses propres données

## Questions en attente

1. **Quel langage pour le bridge ?** Python (pyserial) ou PHP (php-serial) ?
2. **L'Arduino a-t-il un shield WiFi/Ethernet**, ou on reste en USB filaire ?
