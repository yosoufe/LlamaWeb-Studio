import logging
from fastapi import FastAPI, HTTPException
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


@app.post("/models/download")
async def download_model(req: DownloadRequest):
    try:
        path = manager.download_model(req.repo_id, req.filename)
        return {"status": "success", "path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
