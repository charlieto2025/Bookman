@echo off
cd /d "%~dp0"

echo Applying any pending database updates...
call npx prisma migrate deploy

echo Starting Bookman server...
start "Bookman Server (close this window to stop)" cmd /k "npm run dev"

echo Waiting for the server to start...
timeout /t 6 /nobreak >nul

start "" "http://localhost:3000"
