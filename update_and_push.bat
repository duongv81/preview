@echo off
chcp 65001 >nul
echo ==============================================
echo   DANG CAP NHAT DU LIEU GIF & PUSH LEN GITHUB
echo ==============================================

powershell -ExecutionPolicy Bypass -File "%~dp0scan_gifs.ps1"

git add .
git commit -m "Update GIFs and gallery assets"
git push origin main

echo.
echo ==============================================
echo   HOAN TAT! Da day tat ca len GitHub.
echo ==============================================
pause