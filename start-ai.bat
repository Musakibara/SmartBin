@echo off
REM ============================================================
REM SmartBin - Démarrer le service IA Python
REM Lance le serveur FastAPI sur http://127.0.0.1:8001
REM ============================================================
cd /d "%~dp0"

set TMP=D:\tmp
set TEMP=D:\tmp

if not exist "D:\tmp" mkdir "D:\tmp"

echo Demarrage du service SmartBin AI...
echo.
echo Service IA : http://127.0.0.1:8001
echo Health     : http://127.0.0.1:8001/health
echo.
echo Arreter avec Ctrl+C
echo.

ai_service\.venv\Scripts\python.exe ai_service\main.py

pause
