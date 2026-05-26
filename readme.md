# HF Model Downloader

Download Hugging Face models to a local folder through a simple web UI.

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

1. Enter the **Hugging Face Repo ID** (e.g. `TheBloke/Mistral-7B-v0.1-GGUF`)
2. Enter the **Filename** (e.g. `mistral-7b-v0.1.Q4_K_M.gguf`)
3. Click **Download Model**
4. Downloaded models appear in the list below and are saved to the `./models` directory

## Architecture

- **Frontend** — React + Vite + Tailwind CSS, served on port `5173`
- **Backend** — Python FastAPI, served on port `8000`, uses `huggingface_hub` to download models

## Files Overview

- `docker-compose.yml` — Production deployment (pulls from GitHub Container Registry)
- `docker-compose.dev.yml` — Development setup (builds locally with hot-reload)
- `Dockerfile` — Backend container definition
- `Dockerfile.frontend` — Frontend container definition