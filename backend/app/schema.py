from pydantic import BaseModel


class DownloadRequest(BaseModel):
    repo_id: str
    filename: str


class ModelInfo(BaseModel):
    filename: str
    size: int
    path: str
