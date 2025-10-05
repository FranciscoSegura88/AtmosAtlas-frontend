#!/bin/bash

# Azure App Service instala esto automáticamente, pero es una buena práctica asegurarlo.
pip install -r requirements.txt

# --- PASO 1: EJECUTAR EL ENTRENAMIENTO PESADO ---
# Esto creará los archivos del modelo dentro del servidor en la nube.
echo "--- Ejecutando script de entrenamiento (puede tardar varios minutos)... ---"
python train_predictor.py

# --- PASO 2: INICIAR LA API RÁPIDA ---
# Gunicorn iniciará Uvicorn y lo expondrá al mundo en el puerto correcto.
echo "--- Iniciando servidor de la API con Gunicorn... ---"
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT
