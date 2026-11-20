@echo off
pushd "C:\Users\HÜSEYİN KORU\OneDrive\Desktop\Yeni klasör (2)\dynamic-island-windows"
if errorlevel 1 (
  echo HATA: Klasor bulunamadi!
  pause
  exit /b 1
)
echo Mevcut klasor: %CD%
call npm install
echo.
echo Tamamlandi! Calistirmak icin: npm start
popd
pause
