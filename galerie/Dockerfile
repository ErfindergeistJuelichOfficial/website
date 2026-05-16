FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ARG INSTALL_AI=false
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    if [ "$INSTALL_AI" = "true" ]; then \
      pip install --no-cache-dir "transformers>=4.40.0,<4.42.0" torch>=2.1.0 timm>=0.9.0 einops>=0.7.0; \
    fi

ENTRYPOINT ["python"]
