@echo off
chcp 65001 >nul
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%LOCALAPPDATA%\Programs\gh;%PATH%"

echo =======================================================
echo   DANG QUET DU LIEU GIF & DAY LEN GITHUB
echo =======================================================

powershell -ExecutionPolicy Bypass -File "%~dp0scan_gifs.ps1"

git add .
git commit -m "Cap nhat asset va danh sach GIF"
git pull --rebase origin main
git push origin main

echo.
echo =======================================================
echo   HOAN TAT! Da day tat ca len GitHub thanh cong.
echo =======================================================
pause

