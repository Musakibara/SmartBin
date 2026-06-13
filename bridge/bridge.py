import os
import sys
import time
import logging
import signal
from datetime import datetime

import serial
import requests

# ─── Configuration ───────────────────────────────────────────────────────────

SERIAL_PORT = os.getenv('SERIAL_PORT', 'COM3')
BAUD_RATE = int(os.getenv('BAUD_RATE', '9600'))
READ_INTERVAL = int(os.getenv('READ_INTERVAL', '60'))  # secondes entre chaque envoi
API_URL = os.getenv('API_URL', 'http://127.0.0.1:8000/api/sensor-readings')
API_TOKEN = os.getenv('API_TOKEN', '')

LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# ─── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
log = logging.getLogger('bridge')

# ─── Signal handler pour arrêt propre ────────────────────────────────────────

running = True

def handle_exit(sig, frame):
    global running
    log.info('Signal reçu, arrêt en cours...')
    running = False

signal.signal(signal.SIGINT, handle_exit)
signal.signal(signal.SIGTERM, handle_exit)

# ─── Parsing ─────────────────────────────────────────────────────────────────

def parse_line(line: str) -> dict | None:
    try:
        parts = line.strip().split('|')
        if len(parts) < 4:
            log.warning('Format invalide (trop peu de champs) : %s', line.strip())
            return None

        return {
            'bin_code': parts[0],
            'fill_level': float(parts[1]),
            'temperature': float(parts[2]),
            'battery': float(parts[3]),
        }
    except (ValueError, IndexError) as e:
        log.warning('Erreur de parsing : %s — ligne : %s', e, line.strip())
        return None

# ─── Envoi vers Laravel ──────────────────────────────────────────────────────

def send_to_api(data: dict) -> bool:
    try:
        headers = {'Authorization': f'Bearer {API_TOKEN}'} if API_TOKEN else {}
        resp = requests.post(API_URL, json=data, headers=headers, timeout=10)
        if resp.status_code in (200, 201):
            log.info('OK — %s | fill=%s%% temp=%s°C batt=%s%%',
                      data['bin_code'], data['fill_level'], data['temperature'], data['battery'])
            return True
        else:
            log.warning('HTTP %s — %s', resp.status_code, resp.text[:200])
            return False
    except requests.exceptions.RequestException as e:
        log.error('Erreur réseau : %s', e)
        return False

# ─── Boucle principale ───────────────────────────────────────────────────────

def main():
    log.info('Démarrage du pont Arduino → SmartBin')
    log.info('Port : %s | Baud : %s | Intervalle : %ss', SERIAL_PORT, BAUD_RATE, READ_INTERVAL)
    log.info('API  : %s', API_URL)

    while running:
        try:
            ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
            log.info('Connecté à %s', SERIAL_PORT)
        except serial.SerialException as e:
            log.error('Impossible d\'ouvrir %s : %s', SERIAL_PORT, e)
            log.info('Nouvelle tentative dans %ss...', READ_INTERVAL)
            time.sleep(READ_INTERVAL)
            continue

        last_send = 0.0

        while running:
            try:
                line = ser.readline().decode('utf-8', errors='replace')
                if not line:
                    continue

                data = parse_line(line)
                if not data:
                    continue

                now = time.time()
                if now - last_send >= READ_INTERVAL:
                    send_to_api(data)
                    last_send = now

            except serial.SerialException as e:
                log.error('Perte de connexion : %s', e)
                break

        ser.close()

    log.info('Pont arrêté.')

if __name__ == '__main__':
    main()
