@echo off
title SmartBin - All-in-One Dev Server
echo.
echo  ****************************************************
echo  *          SmartBin - Dev Environment              *
echo  ****************************************************
echo.
echo  Starting servers...
echo    [1/4] Laravel HTTP  ... php artisan serve
echo    [2/4] Queue worker  ... php artisan queue:listen
echo    [3/4] Vite HMR      ... npm run dev
echo    [4/4] Reverb WS     ... php artisan reverb:start
echo.
echo  Press Ctrl+C in this window to stop all servers.
echo  ****************************************************
echo.

npx concurrently -c "#93c5fd,#c4b5fd,#34d399,#fb7185" ^
  "php artisan serve" ^
  "php artisan queue:listen --tries=1 --timeout=0" ^
  "npm run dev" ^
  "php artisan reverb:start" ^
  --names=server,queue,vite,reverb --kill-others

pause
