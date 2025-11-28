# LlamaWeb-Studio

Self-hosted AI Cluster Manager - Download and run multiple GGUF models with an OpenAI-compatible API.

## Quick Start

### Production (Pull from GitHub Container Registry)

```bash
# Pull and run pre-built images from GitHub Container Registry
docker compose up -d
```

### Development (Build Locally)

```bash
# Build and run with hot-reload for development
docker compose -f docker-compose.dev.yml up --build
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

## Docker Image Publishing

### Prerequisites for Publishing

1. **GitHub Personal Access Token (PAT)** with `write:packages` permission
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `write:packages` scope
   - Save the token securely

2. **Login to GitHub Container Registry**
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
   ```

### Building and Pushing Images

#### Option 1: Manual Build and Push

```bash
# Build the backend image
docker build -t ghcr.io/yosoufe/llamaweb-studio-backend:latest .

# Build the frontend image
docker build -f Dockerfile.frontend -t ghcr.io/yosoufe/llamaweb-studio-frontend:latest .

# Push both images to GitHub Container Registry
docker push ghcr.io/yosoufe/llamaweb-studio-backend:latest
docker push ghcr.io/yosoufe/llamaweb-studio-frontend:latest
```

#### Option 2: Build and Push with Version Tags

```bash
# Set version (e.g., v1.0.0)
VERSION=v1.0.0

# Build and tag backend
docker build -t ghcr.io/yosoufe/llamaweb-studio-backend:latest \
             -t ghcr.io/yosoufe/llamaweb-studio-backend:$VERSION .

# Build and tag frontend
docker build -f Dockerfile.frontend \
             -t ghcr.io/yosoufe/llamaweb-studio-frontend:latest \
             -t ghcr.io/yosoufe/llamaweb-studio-frontend:$VERSION .

# Push all tags
docker push ghcr.io/yosoufe/llamaweb-studio-backend:latest
docker push ghcr.io/yosoufe/llamaweb-studio-backend:$VERSION
docker push ghcr.io/yosoufe/llamaweb-studio-frontend:latest
docker push ghcr.io/yosoufe/llamaweb-studio-frontend:$VERSION
```

#### Option 3: Using Docker Compose to Build

```bash
# Build images using docker-compose
docker compose -f docker-compose.dev.yml build

# Tag the built images for GitHub Container Registry
docker tag llamaweb-studio-backend:latest ghcr.io/yosoufe/llamaweb-studio-backend:latest
docker tag llamaweb-studio-frontend:latest ghcr.io/yosoufe/llamaweb-studio-frontend:latest

# Push to registry
docker push ghcr.io/yosoufe/llamaweb-studio-backend:latest
docker push ghcr.io/yosoufe/llamaweb-studio-frontend:latest
```

### Making Images Public

By default, packages are private. To make them public:

1. Go to https://github.com/yosoufe?tab=packages
2. Click on the package (llamaweb-studio-backend or llamaweb-studio-frontend)
3. Go to "Package settings"
4. Scroll down to "Danger Zone"
5. Click "Change visibility" → "Public"

### Automated Publishing with GitHub Actions

For automated builds on push/release, create `.github/workflows/docker-publish.yml`:

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME_BACKEND: ${{ github.repository }}-backend
  IMAGE_NAME_FRONTEND: ${{ github.repository }}-frontend

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata for Backend
        id: meta-backend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_BACKEND }}

      - name: Build and push Backend
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta-backend.outputs.tags }}
          labels: ${{ steps.meta-backend.outputs.labels }}

      - name: Extract metadata for Frontend
        id: meta-frontend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_FRONTEND }}

      - name: Build and push Frontend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: Dockerfile.frontend
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta-frontend.outputs.tags }}
          labels: ${{ steps.meta-frontend.outputs.labels }}
```

## Files Overview

- `docker-compose.yml` - Production deployment (pulls from GitHub Container Registry)
- `docker-compose.dev.yml` - Development setup (builds locally with hot-reload)
- `Dockerfile` - Backend container definition
- `Dockerfile.frontend` - Frontend container definition