@echo off
rem ------------------------------------------------------------------
rem  Double-click this file to test the study site on this computer.
rem  It starts a small local web server and opens http://localhost:8080/
rem  Keep the window open while testing; press Ctrl+C in it to stop.
rem
rem  Use a different port:   serve.cmd -Port 5500
rem ------------------------------------------------------------------
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\serve.ps1" -Open %*
if errorlevel 1 pause
