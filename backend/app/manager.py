import os
import logging
from typing import List
from huggingface_hub import hf_hub_download
from app.schema import ModelInfo

logger = logging.getLogger(__name__)

MODELS_DIR = os.getenv("MODELS_DIR", "/models")


class ModelManager:
    def __init__(self):
        os.makedirs(MODELS_DIR, exist_ok=True)

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

    def download_model(self, repo_id: str, filename: str) -> str:
        """Downloads a model from Hugging Face."""
        logger.info(f"Downloading {filename} from {repo_id}...")
        try:
            path = hf_hub_download(
                repo_id=repo_id,
                filename=filename,
                local_dir=MODELS_DIR,
                local_dir_use_symlinks=False,
            )
            return path
        except Exception as e:
            logger.error(f"Download failed: {e}")
            raise e
