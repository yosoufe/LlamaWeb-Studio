# HF Model Downloader UI

A lightweight, premium web interface for downloading Hugging Face models directly to your local machine. Ideal for self-hosting and TrueNAS users who need a reliable, single-port solution for managing model downloads.

## Project Description

**HF Model Downloader UI** is a specialized tool designed to simplify gathering AI models from the Hugging Face Hub. While many model managers are bloated with inference engines, this project focuses on doing one thing exceptionally well: **Downloading.**

Built with a **FastAPI** backend that now serves a reactive **React** frontend, it provides a seamless single-container experience. It tracks large downloads (like GGUF files) with real-time progress bars, multi-tasking support, and a persistent history that survives page refreshes.

### Key Features
- **Single Port (5173)**: Both UI and API run on the same port, making it ideal for firewalled or remote environments.
- **Real-time Progress**: Live percentage and byte-tracking for all active downloads.
- **Concurrent Tasks**: Manages multiple downloads simultaneously without blocking the UI.
- **Persistence**: Your download queue and history are stored on the backend.
- **Dark-Themed UI**: A modern aesthetic built with Tailwind CSS and Lucide icons.
- **Docker-First**: Easy to deploy as a single container.

## Quick Start

The project provides two Docker Compose configurations to suit your needs:

### 1. Production (Pre-built)
Use this if you just want to run the application using the latest stable image from our registry.
```bash
docker compose up -d
```
*Port `5173` will be exposed. Access via `http://localhost:5173`.*

### 2. Development (Local Build & Hot-Reload)
Use this if you are making changes to the code. It builds the image locally and enables **hot-reloading** for the backend (FastAPI).
```bash
docker compose -f docker-compose.dev.yml up --build
```
*Changes to `./backend/app` will be reflected immediately without restarting the container.*

---

## Configuration

Both configurations use the following volumes and environment variables:
- **Volumes**: `./models:/models` stores your downloaded GGUF files persistently.
- **Environment**:
    - `MODELS_DIR`: Path where models are stored (default: `/models`).
    - `HF_TOKEN`: (Optional) Your Hugging Face API token for private repos.

## Prerequisites

- Docker & Docker Compose

## Usage

1. Enter the **Hugging Face Repo ID** (e.g. `microsoft/Phi-3-mini-4k-instruct-gguf`)
2. Enter the **Filename** (e.g. `Phi-3-mini-4k-instruct-q4.gguf`)
3. Click **Start Download**
4. Observe real-time progress bars. Once finished, models appear in the "Downloaded Models" list.

## Architecture

- **Unified Surface** — FastAPI serves the React frontend as static files under `/` and the API under `/api`.
- **Backend** — Python FastAPI (asynchronous background tasks).
- **Engine** — `huggingface_hub` for reliable chunked downloads.

---

## Production Deployment

### 1. Build and Push to GitHub Container Registry

This project is hosted at: [https://github.com/yosoufe/hf-downloader-ui](https://github.com/yosoufe/hf-downloader-ui)

```bash
# 1. Login to GHCR (Use a PAT with write:packages scope)
echo $CR_PAT | docker login ghcr.io -u yosoufe --password-stdin

# 2. Build and Tag
docker build -t ghcr.io/yosoufe/hf-downloader-ui:latest .

# 3. Push
docker push ghcr.io/yosoufe/hf-downloader-ui:latest
```

### 2. Example Production `docker-compose.yml`

This setup pulls the unified image from the registry.

```yaml
version: '3.8'

services:
  hf-downloader-ui:
    image: ghcr.io/yosoufe/hf-downloader-ui:latest
    container_name: hf-downloader-ui
    ports:
      - "5173:5173"
    volumes:
      - ./models:/models
    environment:
      - MODELS_DIR=/models
      - HF_TOKEN=${HF_TOKEN:-}
    restart: unless-stopped
```