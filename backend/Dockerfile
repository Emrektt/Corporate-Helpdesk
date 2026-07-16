# ─── Stage 1: Builder ───────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Sistem bağımlılıkları
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# pip ile bağımlılıkları yükle
COPY pyproject.toml ./
COPY README.md ./
COPY app ./app
RUN pip install --upgrade pip && \
    pip install --no-cache-dir hatchling && \
    pip install --no-cache-dir "fastapi>=0.111.0" "uvicorn[standard]>=0.30.1" \
    "sqlalchemy>=2.0.31" "psycopg[binary]>=3.2.1" "alembic>=1.13.2" \
    "pydantic[email]>=2.8.2" "pydantic-settings>=2.3.4" \
    "python-multipart>=0.0.9" "PyJWT>=2.8.0" "httpx>=0.27.0" "passlib[bcrypt]>=1.7.4" \
    "pytest>=8.0.0" "pytest-asyncio>=0.23.0"

# ─── Stage 2: Runtime ───────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Python paketlerini builder'dan kopyala
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Uygulama kodunu kopyala
COPY . .

# Başlangıç scripti
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8001

ENTRYPOINT ["/entrypoint.sh"]
