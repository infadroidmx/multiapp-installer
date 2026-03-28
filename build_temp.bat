@echo off
set "NODE_DIR=C:\Program Files\Microsoft Visual Studio\NodeJs"
set "PATH=%NODE_DIR%;%PATH%"
echo Using Node from: %NODE_DIR%
echo Starting Build...
call npm run build
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%
echo Starting Electron Builder...
call npx electron-builder --win dir
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%
echo Starting Inno Setup...
"C:\Program Files (x86)\Inno Setup 6\iscc.exe" /O"release\installer-1.0.24" installer.iss
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%
echo Build Complete!
