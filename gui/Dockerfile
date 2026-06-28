ARG INSTALL_AI=false

# Standard base: official Python 3.12 slim (Debian)
FROM python:3.12-slim AS base-false

# AI+CUDA base: Ubuntu 24.04 ships Python 3.12; CUDA 12.6 runtime for GPU inference
FROM nvidia/cuda:12.6.3-runtime-ubuntu24.04 AS base-true
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.12 python3.12-venv python3-pip \
  && python3.12 -m venv /venv \
  && rm -rf /var/lib/apt/lists/*
ENV PATH="/venv/bin:$PATH"

FROM base-${INSTALL_AI}
ARG INSTALL_AI

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt requirements-ai.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN if [ "$INSTALL_AI" = "true" ]; then pip install --no-cache-dir -r requirements-ai.txt; fi
