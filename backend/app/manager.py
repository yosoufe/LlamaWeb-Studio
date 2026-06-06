import os
import logging
from typing import List, Dict, Optional
from huggingface_hub import hf_hub_download
import httpx
import psutil
try:
    import pynvml
    pynvml.nvmlInit()
    HAS_PYNVML = True
except Exception:
    HAS_PYNVML = False

from app.schema import ModelInfo, DownloadTask, SystemStats, GPUStats

logger = logging.getLogger(__name__)

MODELS_DIR = os.getenv("MODELS_DIR", "/models")
LLAMA_CPP_SERVER_URL = os.getenv("LLAMA_CPP_SERVER_URL", "http://localhost:8080")


class ProgressWrapper:
    def __init__(self, task_id: str, manager: 'ModelManager'):
        self.task_id = task_id
        self.manager = manager
        self.total = 0
        self.current = 0

    def __call__(self, iterable=None, total=None, **kwargs):
        self.total = total or 0
        self.manager.update_task(self.task_id, total_size=self.total, status="downloading")
        return self

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def update(self, n=1):
        self.current += n
        if self.total > 0:
            progress = round((self.current / self.total) * 100, 1)
            self.manager.update_task(self.task_id, progress=progress)

    def close(self):
        pass

    def __iter__(self):
        return self


class ModelManager:
    def __init__(self):
        os.makedirs(MODELS_DIR, exist_ok=True)
        self.tasks: Dict[str, DownloadTask] = {}

    async def get_server_models(self) -> Dict[str, str]:
        """Fetches all models from the llama.cpp server, returning alias -> status.value map."""
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(f"{LLAMA_CPP_SERVER_URL}/v1/models", timeout=2.0)
                if res.status_code == 200:
                    data = res.json()
                    # data format: {"object": "list", "data": [{"id": "alias", "status": {"value": "loaded|unloaded|loading|sleeping"}, ...}]}
                    if "data" in data:
                        return {
                            m["id"]: m.get("status", {}).get("value", "unloaded")
                            for m in data["data"]
                        }
        except Exception as e:
            logger.warning(f"Could not fetch models from {LLAMA_CPP_SERVER_URL}: {e}")
        return {}

    async def list_downloaded_models(self) -> List[ModelInfo]:
        """Lists models from the llama.cpp server + any local .gguf files not yet registered."""
        # Build a map of local files: alias -> (filename, size, path)
        local_files: Dict[str, tuple] = {}
        if os.path.exists(MODELS_DIR):
            for f in os.listdir(MODELS_DIR):
                if f.endswith(".gguf"):
                    path = os.path.join(MODELS_DIR, f)
                    alias = f[:-5]  # strip .gguf
                    local_files[alias] = (f, os.path.getsize(path), path)

        # Get all models the server knows about (alias -> status)
        server_models = await self.get_server_models()

        seen_aliases = set()
        models = []

        # First: all server-known models (they can be loaded/unloaded)
        for alias, status_val in server_models.items():
            seen_aliases.add(alias)
            is_loaded = status_val in ("loaded", "loading", "sleeping")
            if alias in local_files:
                filename, size, path = local_files[alias]
            else:
                # Server knows about it but we don't have it locally — show with alias as filename
                filename = f"{alias}.gguf"
                size = 0
                path = ""
            models.append(ModelInfo(
                filename=filename,
                size=size,
                path=path,
                is_loaded=is_loaded,
                status=status_val,
            ))

        # Second: local files the server doesn't know about (downloaded but not registered)
        for alias, (filename, size, path) in local_files.items():
            if alias not in seen_aliases:
                models.append(ModelInfo(
                    filename=filename,
                    size=size,
                    path=path,
                    is_loaded=False,
                    status="not_registered",
                ))

        return models

    def get_tasks(self) -> List[DownloadTask]:
        return list(self.tasks.values())

    def update_task(self, task_id: str, **kwargs):
        if task_id in self.tasks:
            task = self.tasks[task_id]
            for key, value in kwargs.items():
                setattr(task, key, value)

    def download_model(self, repo_id: str, filename: str) -> str:
        """Downloads a model from Hugging Face."""
        task_id = f"{repo_id}/{filename}"
        if task_id in self.tasks and self.tasks[task_id].status == "downloading":
            return task_id

        self.tasks[task_id] = DownloadTask(
            task_id=task_id,
            repo_id=repo_id,
            filename=filename,
            status="pending"
        )

        logger.info(f"Starting download for {filename} from {repo_id}...")
        try:
            progress = ProgressWrapper(task_id, self)
            path = hf_hub_download(
                repo_id=repo_id,
                filename=filename,
                local_dir=MODELS_DIR,
                local_dir_use_symlinks=False,
                tqdm_class=progress
            )
            self.update_task(task_id, status="completed", progress=100.0)
            return path
        except Exception as e:
            error_msg = f"Download failed for {repo_id}/{filename}: {type(e).__name__}: {str(e)}"
            logger.error(error_msg)
            self.update_task(task_id, status="failed", error=error_msg)
            raise e

    def delete_model(self, filename: str):
        """Deletes a model file from disk."""
        path = os.path.join(MODELS_DIR, filename)
        if os.path.exists(path):
            os.remove(path)
            task_id_matches = [tid for tid, t in self.tasks.items() if t.filename == filename]
            for tid in task_id_matches:
                del self.tasks[tid]
        else:
            raise Exception("File not found")

    def clear_tasks(self):
        """Clears finished or failed tasks from history."""
        to_delete = [tid for tid, t in self.tasks.items() if t.status in ["completed", "failed"]]
        for tid in to_delete:
            del self.tasks[tid]

    async def load_model(self, filename: str):
        """Sends a request to load a model to the external llama.cpp server."""
        alias = filename[:-5] if filename.endswith(".gguf") else filename
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{LLAMA_CPP_SERVER_URL}/models/load",
                json={"model": alias},
                timeout=60.0
            )
            res.raise_for_status()

    async def unload_model(self, filename: str):
        """Sends a request to unload a model from the external llama.cpp server."""
        alias = filename[:-5] if filename.endswith(".gguf") else filename
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{LLAMA_CPP_SERVER_URL}/models/unload",
                json={"model": alias},
                timeout=10.0
            )
            res.raise_for_status()

    def get_system_stats(self) -> SystemStats:
        """Gets CPU, Memory, GPU and VRAM stats for all GPUs."""
        # CPU & RAM
        cpu_percent = psutil.cpu_percent(interval=None) # Non-blocking
        mem = psutil.virtual_memory()
        
        gpu_stats_list = []
        
        if HAS_PYNVML:
            try:
                device_count = pynvml.nvmlDeviceGetCount()
                for i in range(device_count):
                    handle = pynvml.nvmlDeviceGetHandleByIndex(i)
                    name = pynvml.nvmlDeviceGetName(handle)
                    if isinstance(name, bytes):
                        name = name.decode('utf-8')
                        
                    mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                    util = pynvml.nvmlDeviceGetUtilizationRates(handle)
                    
                    gpu_stats_list.append(GPUStats(
                        index=i,
                        name=name,
                        vram_used=mem_info.used,
                        vram_total=mem_info.total,
                        gpu_percent=float(util.gpu)
                    ))
            except Exception as e:
                logger.warning(f"Failed to get GPU stats: {e}")
                
        return SystemStats(
            cpu_percent=cpu_percent,
            memory_used=mem.used,
            memory_total=mem.total,
            gpus=gpu_stats_list
        )
