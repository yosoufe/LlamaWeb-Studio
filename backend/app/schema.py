from typing import Optional
from pydantic import BaseModel


class DownloadRequest(BaseModel):
    repo_id: str
    filename: str


class ModelInfo(BaseModel):
    filename: str
    size: int
    path: str
    is_loaded: bool = False
    status: str = "unloaded"  # loaded, loading, sleeping, unloaded, not_registered


class DownloadTask(BaseModel):
    task_id: str
    repo_id: str
    filename: str
    progress: float = 0.0
    status: str = "pending"  # pending, downloading, completed, failed
    total_size: Optional[int] = None
    error: Optional[str] = None


class SystemStats(BaseModel):
    cpu_percent: float
    memory_used: int
    memory_total: int
    gpu_percent: Optional[float] = None
    vram_used: Optional[int] = None
    vram_total: Optional[int] = None
