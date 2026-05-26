# HF Model Downloader UI

A lightweight, premium web interface for downloading Hugging Face models directly to your local machine. 

## Project Description

**HF Downloader UI** is a specialized tool designed to simplify the process of gathering AI models from the Hugging Face Hub. While many model managers are bloated with inference engines and complex configurations, this project focuses on doing one thing exceptionally well: **Downloading.**

Built with a fast **FastAPI** backend and a reactive **React** frontend, it provides a seamless experience for tracking large downloads (like GGUF files) with real-time progress bars, multi-tasking support, and a persistent history that survives page refreshes. Whether you are building a local LLM library or just need a reliable way to pull models in a headless environment, HF Downloader UI provides the visual feedback and reliability you need.

### Key Features
- **Real-time Progress**: Live percentage and byte-tracking for all active downloads.
- **Concurrent Tasks**: Managers multiple downloads simultaneously without blocking the UI.
- **Persistence**: Your download queue and history are stored on the backend, so you never lose track of a long-running task.
- **Dark-Themed UI**: A modern, premium aesthetic built with Tailwind CSS and Lucide icons.
- **Docker-First**: Easy to deploy on any system using Docker and Docker Compose.

## Quick Start

### Production (Pull from GitHub Container Registry)

```bash
docker compose up -d
```

### Development (Build Locally)

```bash
docker compose -f docker-compose.dev.yml up --build
```

Then open **http://localhost:5173** in your browser.

## Prerequisites

- Docker & Docker Compose

## Usage

1. Enter the **Hugging Face Repo ID** (e.g. `microsoft/Phi-3-mini-4k-instruct-gguf`)
2. Enter the **Filename** (e.g. `Phi-3-mini-4k-instruct-q4.gguf`)
3. Click **Start Download**
4. Observe real-time progress bars. Once finished, models appear in the "Downloaded Models" list.

## Architecture

- **Frontend** — React + Vite + Tailwind CSS
- **Backend** — Python FastAPI (asynchronous background tasks)
- **Engine** — `huggingface_hub` for reliable chunked downloads

## Files Overview

- `docker-compose.yml` — Production deployment
- `docker-compose.dev.yml` — Development setup
- `Dockerfile` — Backend container definition
- `Dockerfile.frontend` — Frontend container definition

---

## Production Deployment

### 1. Build and Push to GitHub Container Registry

This project is hosted at: [https://github.com/yosoufe/hf-downloader-ui](https://github.com/yosoufe/hf-downloader-ui)

```bash
# 1. Login to GHCR (Use a PAT with write:packages scope)
echo $CR_PAT | docker login ghcr.io -u yosoufe --password-stdin

# 2. Build and Tag
docker build -t ghcr.io/yosoufe/hf-downloader-ui-backend:latest -f Dockerfile .
docker build -t ghcr.io/yosoufe/hf-downloader-ui-frontend:latest -f Dockerfile.frontend .

# 3. Push
docker push ghcr.io/yosoufe/hf-downloader-ui-backend:latest
docker push ghcr.io/yosoufe/hf-downloader-ui-frontend:latest
```

### 2. Example Production `docker-compose.yml`

This setup pulls pre-built images from the registry.

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/yosoufe/hf-downloader-ui-backend:latest
    container_name: hf-downloader-backend
    ports:
      - "8000:8000"
    volumes:
      - ./models:/models
    environment:
      - MODELS_DIR=/models
    restart: unless-stopped

  frontend:
    image: ghcr.io/yosoufe/hf-downloader-ui-frontend:latest
    container_name: hf-downloader-frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    restart: unless-stopped
```