from typing import Optional, List
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


class GPUStats(BaseModel):
    index: int
    name: str
    vram_used: int
    vram_total: int
    gpu_percent: float


class SystemStats(BaseModel):
    cpu_percent: float
    memory_used: int
    memory_total: int
    gpus: List[GPUStats] = []
    idle_duration: float = 0.0
    is_active: bool = False


class AppSettings(BaseModel):
    idle_timeout: int = 300  # seconds
