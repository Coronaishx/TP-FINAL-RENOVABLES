@echo off
title Simulador de Energias Marinas - UNSAM ER1
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
echo ========================================================
echo   Simulador de Energias Marinas - UNSAM ER1 (2026)
echo   Abriendo servidor local offline...
echo ========================================================
start "" http://localhost:5173
npm run dev
pause
