@echo off
cd /d "%~dp0"
del /q "%~dp0board-url.txt" 2>nul
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
