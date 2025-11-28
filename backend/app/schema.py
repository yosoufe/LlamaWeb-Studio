from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class DownloadRequest(BaseModel):
    repo_id: str
    filename: str

class ModelInfo(BaseModel):
    filename: str
    size: int
    path: str

class RunningModelInfo(BaseModel):
    model_id: str
    port: int
    status: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    stream: Optional[bool] = False

class LoadModelRequest(BaseModel):
    filename: str
