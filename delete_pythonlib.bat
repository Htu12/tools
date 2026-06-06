@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "REQ_FILE=%TEMP%\pip_freeze_%RANDOM%_%RANDOM%.txt"

where py >nul 2>nul
if %errorlevel%==0 (
    set "PY_CMD=py -m pip"
) else (
    where python >nul 2>nul
    if %errorlevel%==0 (
        set "PY_CMD=python -m pip"
    ) else (
        echo ERROR: Python was not found in PATH.
        pause
        exit /b 1
    )
)

echo Checking pip...
%PY_CMD% --version >nul 2>nul
if not %errorlevel%==0 (
    echo ERROR: pip was not found for this Python.
    echo Try: python -m ensurepip --upgrade
    pause
    exit /b 1
)

echo Exporting installed packages...
%PY_CMD% freeze > "%REQ_FILE%"

for %%F in ("%REQ_FILE%") do set "REQ_SIZE=%%~zF"
if "%REQ_SIZE%"=="0" (
    echo No pip packages found.
    del "%REQ_FILE%" >nul 2>nul
    pause
    exit /b 0
)

echo.
echo The following packages will be uninstalled:
type "%REQ_FILE%"
echo.
set /p "CONFIRM=Type YES to uninstall all packages: "
if /i not "%CONFIRM%"=="YES" (
    echo Cancelled.
    del "%REQ_FILE%" >nul 2>nul
    pause
    exit /b 0
)

echo.
echo Uninstalling packages...
%PY_CMD% uninstall -y -r "%REQ_FILE%"
set "UNINSTALL_CODE=%errorlevel%"

del "%REQ_FILE%" >nul 2>nul

if not "%UNINSTALL_CODE%"=="0" (
    echo.
    echo WARNING: Some packages may not have been uninstalled.
    pause
    exit /b %UNINSTALL_CODE%
)

echo.
echo Done.
pause
exit /b 0