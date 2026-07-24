#!/bin/bash
set -e

echo "⏳ Veritabanı bağlantısı bekleniyor..."
until python -c "
import psycopg
import os
conn = psycopg.connect(
    host=os.environ.get('POSTGRES_HOST', 'postgres'),
    port=os.environ.get('POSTGRES_PORT', '5432'),
    dbname=os.environ.get('POSTGRES_DB', 'helpdesk'),
    user=os.environ.get('POSTGRES_USER', 'helpdesk_user'),
    password=os.environ.get('POSTGRES_PASSWORD', ''),
)
conn.close()
print('OK')
" 2>/dev/null; do
  echo "  DB hazır değil, 2sn bekleniyor..."
  sleep 2
done

echo "✅ Veritabanı hazır!"

echo "🚀 Alembic migration çalıştırılıyor..."
alembic upgrade head

echo "🎯 Uygulama başlatılıyor..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8001
