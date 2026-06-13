@echo off
title UniSchedule Africa
color 0E
cls
echo.
echo  ============================================================
echo   Ce mode n'est plus necessaire.
echo  ============================================================
echo.
echo   L'application fonctionne maintenant entierement sur
echo   votre ordinateur, sans Docker ni serveur.
echo.
echo   Lancement de l'application dans 3 secondes...
echo  ============================================================
timeout /t 3 /nobreak >nul
cd /d "%~dp0"
call START.bat
