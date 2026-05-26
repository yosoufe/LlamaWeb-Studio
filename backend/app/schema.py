from typing import Optional
from pydantic import BaseModel


class DownloadRequest(BaseModel):
    repo_id: str
    filename: str


class ModelInfo(BaseModel):
    filename: str
    size: int
    path: str


class DownloadTask(BaseModel):
    task_id: str
    repo_id: str
    filename: str
    progress: float = 0.0
    status: str = "pending"  # pending, downloading, completed, failed
    total_size: Optional[int] = None
    error: Optional[str] = None
