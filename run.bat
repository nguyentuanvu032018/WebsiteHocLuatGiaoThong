@echo off
setlocal
set "PROJECT_DIR=%~dp0"

if not exist "%PROJECT_DIR%backend\package.json" (
    echo Khong tim thay thu muc backend trong "%PROJECT_DIR%".
    pause
    exit /b 1
)

if not exist "%PROJECT_DIR%frontend\package.json" (
    echo Khong tim thay thu muc frontend trong "%PROJECT_DIR%".
    pause
    exit /b 1
)

where ngrok >nul 2>nul
if errorlevel 1 (
    echo Khong tim thay ngrok trong PATH. Hay cai dat ngrok hoac them ngrok vao PATH.
    pause
    exit /b 1
)

start "Backend - CT466_NLN" /D "%PROJECT_DIR%backend" cmd /k "title Backend - CT466_NLN && npm.cmd start"
start "Hoc vien - CT466_NLN" /D "%PROJECT_DIR%frontend" cmd /k "title Hoc vien - CT466_NLN && npm.cmd run dev -- --host 0.0.0.0 --port 5173 --strictPort"
start "Admin - CT466_NLN" /D "%PROJECT_DIR%frontend" cmd /k "title Admin - CT466_NLN && npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort"
start "Ngrok - CT466_NLN" /D "%PROJECT_DIR%" cmd /k "title Ngrok - CT466_NLN && ngrok http 5173 --url https://sector-factsheet-uncombed.ngrok-free.dev"
