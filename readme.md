# LlamaWeb-Studio

Self-hosted AI Cluster Manager - Download and run multiple GGUF models with an OpenAI-compatible API.

## Quick Start

```bash
# Start everything (backend + frontend)
docker-compose up --build
```

Then open **http://localhost:5173** in your browser.

## Prerequisites

- Docker & Docker Compose
- NVIDIA Drivers & NVIDIA Container Toolkit (for GPU support)

## Usage

1. **Download a Model**: Enter Hugging Face Repo ID and filename
2. **Load the Model**: Click "Load" to start the model server
3. **Chat**: Select the model and start chatting

## API Access

The backend exposes an OpenAI-compatible API at `http://localhost:8000/v1/*`

Example:
```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "your-model.gguf",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```