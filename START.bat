@echo off
setlocal EnableExtensions
title UniSchedule Africa - Demarrage
color 0A
cls

echo.
echo  ============================================================
echo   UniSchedule Africa - Systeme de Gestion des Emplois du Temps
echo  ============================================================
echo.

REM --- Node.js (try PATH, then default install folder) ---
set "NODE_OK=0"
where node >nul 2>&1
if not errorlevel 1 set "NODE_OK=1"

if "%NODE_OK%"=="0" if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    set "NODE_OK=1"
)

if "%NODE_OK%"=="0" (
    color 0C
    echo  [ERREUR] Node.js n'est pas installe ou introuvable.
    echo.
    echo  1. Telechargez Node.js LTS depuis https://nodejs.org
    echo  2. Installez avec les options par defaut
    echo  3. Redemarrez le PC, puis relancez ce fichier
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  [ERREUR] npm introuvable. Reinstallez Node.js depuis https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo  [1/3] Verification des dependances...
cd /d "%~dp0frontend"
if errorlevel 1 (
    color 0C
    echo  [ERREUR] Dossier frontend introuvable.
    echo  Assurez-vous que le dossier frontend est a cote de START.bat
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo  [2/3] Installation des modules - premiere fois, patientez...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        color 0C
        echo  [ERREUR] Installation des dependances echouee.
        echo  Verifiez votre connexion internet et relancez.
        echo.
        pause
        exit /b 1
    )
) else (
    echo  [2/3] Modules deja installes - OK
)

echo  [3/3] Demarrage de l'application...
echo.
echo  ============================================================
echo   L'application va s'ouvrir dans votre navigateur dans 3s...
echo   Adresse: http://localhost:5173
echo.
echo   Fonctionne entierement sur votre ordinateur.
echo   Aucun serveur, Docker ou internet requis.
echo.
echo   Premiere utilisation: creez votre mot de passe admin.
echo   Pour arreter: fermez cette fenetre ou appuyez Ctrl+C
echo  ============================================================
echo.

timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"

call npm run dev
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERREUR] Le serveur n'a pas demarre correctement.
    echo  Gardez cette fenetre ouverte et contactez le support.
    echo.
)

pause
endlocal