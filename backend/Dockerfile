# FROM python:3.11-slim

# ENV PYTHONDONTWRITEBYTECODE=1
# ENV PYTHONUNBUFFERED=1

# WORKDIR /app

# COPY requirements.txt .

# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#     curl \
#     && pip install --no-cache-dir -r requirements.txt \
#     && apt-get purge -y build-essential \
#     && apt-get autoremove -y \
#     && rm -rf /var/lib/apt/lists/*

# COPY . .

# RUN useradd -m appuser
# USER appuser

# EXPOSE 8000

# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]


FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/app/.cache/huggingface
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache/sentence_transformers

WORKDIR /app

COPY requirements.txt .

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && pip install --no-cache-dir -r requirements.txt \
    && apt-get purge -y build-essential \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN mkdir -p /app/.cache/huggingface /app/.cache/sentence_transformers \
    && useradd -m appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1