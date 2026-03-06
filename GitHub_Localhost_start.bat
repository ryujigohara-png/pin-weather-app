@echo off
cd /d "%~dp0"
:: python実行後も、その場所でプロンプトを維持
cmd /k "python app.py"