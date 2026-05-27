# Stage 1: Build the React frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Final image
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY ./backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt

# Copy the backend code
COPY ./backend/app ./app

# Copy the build artifacts from stage 1
COPY --from=frontend-builder /app/dist ./app/static

# Final configuration
RUN mkdir -p /models
ENV MODELS_DIR=/models
ENV PYTHONUNBUFFERED=1

EXPOSE 5173

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5173"]
