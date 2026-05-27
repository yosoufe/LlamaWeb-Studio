import os
import uuid
import logging
from typing import List, Dict, Optional
from huggingface_hub import hf_hub_download
from app.schema import ModelInfo, DownloadTask

logger = logging.getLogger(__name__)

MODELS_DIR = os.getenv("MODELS_DIR", "/models")


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
        # We don't really need this if we pass tqdm_class, 
        # but hf_hub_download might use it in different ways
        return self


class ModelManager:
    def __init__(self):
        os.makedirs(MODELS_DIR, exist_ok=True)
        self.tasks: Dict[str, DownloadTask] = {}

    def list_downloaded_models(self) -> List[ModelInfo]:
        """Lists all GGUF models in the models directory."""
        models = []
        if not os.path.exists(MODELS_DIR):
            return []

        for f in os.listdir(MODELS_DIR):
            if f.endswith(".gguf"):
                path = os.path.join(MODELS_DIR, f)
                size = os.path.getsize(path)
                models.append(ModelInfo(filename=f, size=size, path=path))
        return models

    def get_tasks(self) -> List[DownloadTask]:
        return list(self.tasks.values())

    def update_task(self, task_id: str, **kwargs):
        if task_id in self.tasks:
            task = self.tasks[task_id]
            for key, value in kwargs.items():
                setattr(task, key, value)

    def download_model(self, repo_id: str, filename: str) -> str:
        """Downloads a model from Hugging Face. This should be run in a background task."""
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
            # Also remove completed task if it exists
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
