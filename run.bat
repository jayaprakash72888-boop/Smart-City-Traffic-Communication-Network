@echo off
title Smart City Traffic Communication Network - Runner
color 0B

echo ======================================================================
echo    SMART CITY TRAFFIC COMMUNICATION NETWORK
echo    Computer Networks and Internet Protocols (CNIP) College Project
echo ======================================================================
echo.

echo [*] Compiling Java Backend Server...
javac -d backend\target\classes backend\src\main\java\com\smartcity\traffic\*.java

if %ERRORLEVEL% NEQ 0 (
    echo [!] Compilation failed. Please ensure JDK 17+ is installed.
    pause
    exit /b %ERRORLEVEL%
)

echo [✓] Java classes compiled successfully!
echo.
echo [*] Starting Java Backend Server on http://localhost:8085/ ...
echo [*] Opening Login Portal in default browser...
start http://localhost:8085/login.html

java -cp backend\target\classes com.smartcity.traffic.TrafficServer
pause
