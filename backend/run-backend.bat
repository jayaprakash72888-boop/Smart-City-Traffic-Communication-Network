@echo off
title Smart City Traffic - Java Backend
color 0A

echo [*] Compiling and starting Java Server via Maven...
cd /d "%~dp0"
if exist pom.xml (
    mvn compile exec:java
) else (
    javac -d target\classes src\main\java\com\smartcity\traffic\*.java
    java -cp target\classes com.smartcity.traffic.TrafficServer
)
pause
