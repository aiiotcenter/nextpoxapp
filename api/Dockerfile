# -------- Base image --------
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    CUDA_VISIBLE_DEVICES=-1 \
    TF_CPP_MIN_LOG_LEVEL=2

WORKDIR /app

# Runtime libs you may need (jpeg/png/xml/zlib)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo libpng16-16 libxml2 libxslt1.1 zlib1g \
 && rm -rf /var/lib/apt/lists/*

# -------- Build stage --------
FROM base AS build

# Build tools for any native deps (if none, you can remove this)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc \
 && rm -rf /var/lib/apt/lists/*

# Virtualenv
ENV VENV_PATH=/opt/venv
RUN python -m venv $VENV_PATH
ENV PATH="$VENV_PATH/bin:$PATH"

# Copy requirements first (to leverage cache)
COPY requirements.txt .

# Use exec-form so /bin/sh isn't required
RUN ["/opt/venv/bin/python", "-m", "pip", "install", "--upgrade", "pip"]
RUN ["/opt/venv/bin/python", "-m", "pip", "install", "-r", "requirements.txt"]

# Copy the rest of the app code
COPY . /app

# -------- Runtime stage --------
FROM base AS runtime

ENV VENV_PATH=/opt/venv
COPY --from=build $VENV_PATH $VENV_PATH
ENV PATH="$VENV_PATH/bin:$PATH"

# Copy app code
COPY --from=build /app /app

# Non-root
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 7135

# If your FastAPI app is `application = FastAPI()` in fast.py:
CMD ["uvicorn", "fast:application", "--host", "0.0.0.0", "--port", "7135"]