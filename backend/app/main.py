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


@app.get("/")
async def root():
    return {"message": "HF Model Downloader backend is running"}


@app.get("/models")
async def list_models():
    return manager.list_downloaded_models()


@app.get("/tasks")
async def list_tasks():
    return manager.get_tasks()


@app.post("/models/download")
async def download_model(req: DownloadRequest, background_tasks: BackgroundTasks):
    # Check if already downloading
    task_id = f"{req.repo_id}/{req.filename}"
    active_tasks = manager.get_tasks()
    if any(t.task_id == task_id and t.status == "downloading" for t in active_tasks):
        return {"status": "already_downloading", "task_id": task_id}

    background_tasks.add_task(manager.download_model, req.repo_id, req.filename)
    return {"status": "started", "task_id": task_id}


@app.delete("/models/{filename}")
async def delete_model(filename: str):
    try:
        manager.delete_model(filename)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
