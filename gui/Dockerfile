ARG INSTALL_AI=false
# AI base flavor: "cuda" (NVIDIA, default) or "plain" (CPU-only AI or AMD/ROCm -
# ROCm torch wheels bundle the runtime, no ROCm base image needed)
ARG AI_BASE=cuda

# Standard base: official Python 3.12 slim (Debian)
FROM python:3.12-slim AS base-false

# AI+CUDA base: Ubuntu 24.04 ships Python 3.12; CUDA 12.6 runtime for GPU inference
FROM nvidia/cuda:12.6.3-runtime-ubuntu24.04 AS ai-cuda
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.12 python3.12-venv python3-pip \
  && python3.12 -m venv /venv \
  && rm -rf /var/lib/apt/lists/*
ENV PATH="/venv/bin:$PATH"

# AI plain base: CPU-only inference or AMD GPUs via ROCm torch wheels
FROM python:3.12-slim AS ai-plain

FROM ai-${AI_BASE} AS base-true

FROM base-${INSTALL_AI}
ARG INSTALL_AI
# Optional torch wheel index, e.g. https://download.pytorch.org/whl/rocm6.4 for
# AMD GPUs. Empty = default PyPI wheels (CUDA-enabled).
ARG TORCH_INDEX_URL=

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt requirements-ai.txt ./
RUN pip install --no-cache-dir -r requirements.txt
# Torch pins come from requirements-ai.txt (single source of truth); the index
# URL only decides the build flavor (e.g. 2.9.1 vs 2.9.1+rocm6.4).
RUN if [ "$INSTALL_AI" = "true" ] && [ -n "$TORCH_INDEX_URL" ]; then \
      pip install --no-cache-dir --index-url "$TORCH_INDEX_URL" \
        $(grep -E '^(torch|torchvision)==' requirements-ai.txt); \
    fi
RUN if [ "$INSTALL_AI" = "true" ]; then pip install --no-cache-dir -r requirements-ai.txt; fi
