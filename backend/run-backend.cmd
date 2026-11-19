@echo off
setlocal
cd /d "%~dp0"

REM Add Maven to PATH for this session if it exists in user programs
if exist "C:\Users\Bhanu\AppData\Local\Programs\Apache\apache-maven-3.10.0\bin" (
    set "PATH=C:\Users\Bhanu\AppData\Local\Programs\Apache\apache-maven-3.10.0\bin;%PATH%"
)

REM Load environment variables from .env if present (root or backend)
if exist "..\.env" (
    for /f "usebackq tokens=1* delims==" %%A in (`findstr /v "^#" "..\.env" 2^>nul`) do (
        if not "%%A"=="" set "%%A=%%B"
    )
)
if exist ".env" (
    for /f "usebackq tokens=1* delims==" %%A in (`findstr /v "^#" ".env" 2^>nul`) do (
        if not "%%A"=="" set "%%A=%%B"
    )
)

echo ===================================================
echo   Starting MushroomHub Spring Boot Backend (:8080)
echo ===================================================

where mvn >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Using Maven to run Spring Boot...
    mvn spring-boot:run
) else (
    echo Maven not found in PATH, running pre-built JAR...
    java -jar target\mushroomhub-api-1.0.0.jar
)

pause
