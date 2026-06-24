@echo off
title SmartBin - All-in-One Dev Server
echo.
echo  ****************************************************
echo  *          SmartBin - Dev Environment              *
echo  ****************************************************
echo.
echo  Starting servers...
echo    [1/6] Laravel HTTP  ... php artisan serve
echo    [2/6] Queue worker  ... php artisan queue:listen
echo    [3/6] Vite HMR      ... npm run dev
echo    [4/6] Reverb WS     ... php artisan reverb:start
echo    [5/6] AI Service    ... FastAPI :8001
echo    [6/6] Scheduler     ... php artisan schedule:work
echo.
echo  Press Ctrl+C in this window to stop all servers.
echo  ****************************************************
echo.

npx concurrently -c "#93c5fd,#c4b5fd,#34d399,#fb7185,#a78bfa,#f472b6" ^
  "php artisan serve" ^
  "php artisan queue:listen --tries=1 --timeout=0" ^
  "npm run dev" ^
  "php artisan reverb:start" ^
  "ai_service\.venv\Scripts\python.exe ai_service\main.py" ^
  "php artisan schedule:work" ^
  --names=server,queue,vite,reverb,ai,scheduler --kill-others

pause
