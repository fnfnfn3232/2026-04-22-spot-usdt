@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0open-board.ps1"
