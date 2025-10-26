@echo off
for /f "delims=" %%a in ('pip freeze') do (
  pip uninstall -y %%a
)
