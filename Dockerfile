
# Use an official Python runtime as a parent image
# FROM python:3.10-slim
FROM nvcr.io/nvidia/pytorch:24.05-py3

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Important for CUDA build
ENV CMAKE_ARGS="-DGGML_CUDA=on -DLLAMA_CUBLAS=on"
ENV FORCE_CMAKE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
# We install llama-cpp-python separately to ensure CMAKE_ARGS are picked up
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir llama-cpp-python

# Install other requirements
# fastapi, uvicorn, huggingface_hub, pydantic, python-multipart, requests, httpx
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    huggingface_hub \
    pydantic \
    python-multipart \
    requests \
    httpx \
    sse-starlette

# Copy the backend code
COPY backend/app /app/app

# Expose the API port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
