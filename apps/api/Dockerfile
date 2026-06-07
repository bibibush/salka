# syntax=docker/dockerfile:1
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

# uv 설치
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# 의존성 레이어 캐싱
COPY pyproject.toml uv.lock* ./
RUN uv sync --no-dev --frozen --no-install-project || uv sync --no-dev --no-install-project

# 애플리케이션 코드
COPY src ./src

EXPOSE 8000

# 운영: gunicorn + uvicorn workers
CMD ["uv", "run", "gunicorn", "src.main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "2", \
     "--bind", "0.0.0.0:8000"]
