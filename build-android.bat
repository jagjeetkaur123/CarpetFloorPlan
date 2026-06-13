@echo off
title Carpet Floor Plan — Build Android APK

set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo.
echo [1/3] Building web assets...
call npm run build
if errorlevel 1 ( echo BUILD FAILED at step 1 & pause & exit /b 1 )

echo.
echo [2/3] Syncing to Android...
call npx cap sync android
if errorlevel 1 ( echo BUILD FAILED at step 2 & pause & exit /b 1 )

echo.
echo [3/3] Compiling APK...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 ( echo BUILD FAILED at step 3 & pause & exit /b 1 )
cd ..

echo.
echo ============================================================
echo  APK ready:
echo  android\app\build\outputs\apk\debug\app-debug.apk
echo ============================================================
echo.
pause
