import logging
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.manager import ModelManager
from app.schema import DownloadRequest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="HF Model Downloader")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ModelManager()


from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# ... around line 23
@app.get("/api")
async def root():
    return {"message": "HF Model Downloader API is running"}


@app.get("/api/models")
async def list_models():
    return await manager.list_downloaded_models()


@app.get("/api/tasks")
async def list_tasks():
    return manager.get_tasks()


@app.get("/api/system/stats")
async def system_stats():
    return manager.get_system_stats()


@app.post("/api/models/{filename}/load")
async def load_model(filename: str):
    try:
        await manager.load_model(filename)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/models/{filename}/unload")
async def unload_model(filename: str):
    try:
        await manager.unload_model(filename)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/models/download")
async def download_model(req: DownloadRequest, background_tasks: BackgroundTasks):
    # Check if already downloading
    task_id = f"{req.repo_id}/{req.filename}"
    active_tasks = manager.get_tasks()
    if any(t.task_id == task_id and t.status == "downloading" for t in active_tasks):
        return {"status": "already_downloading", "task_id": task_id}

    background_tasks.add_task(manager.download_model, req.repo_id, req.filename)
    return {"status": "started", "task_id": task_id}


@app.delete("/api/models/{filename}")
async def delete_model(filename: str):
    try:
        manager.delete_model(filename)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/tasks")
async def clear_tasks():
    manager.clear_tasks()
    return {"status": "success"}


# Serve static files from the 'static' directory (compiled frontend)
# We use a catch-all route for the frontend SPA to handle client-side routing
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(STATIC_DIR) and os.path.exists("/app/static"):
    STATIC_DIR = "/app/static"

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # If the path looks like a direct file request, let FastAPI handle it normally or 404
        # Otherwise, serve index.html for React Router
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    logger.warning(f"Static directory {STATIC_DIR} not found. Frontend will not be served.")
