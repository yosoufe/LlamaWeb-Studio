import os
import subprocess
import socket
import logging
from typing import Dict, Optional, List
from huggingface_hub import hf_hub_download
from app.schema import ModelInfo, RunningModelInfo

logger = logging.getLogger(__name__)

MODELS_DIR = os.getenv("MODELS_DIR", "/models")

class ModelManager:
    def __init__(self):
        self.running_models: Dict[str, subprocess.Popen] = {}
        self.model_ports: Dict[str, int] = {}
        self.start_port = 8001
        self.end_port = 8010
        
        # Ensure models directory exists
        os.makedirs(MODELS_DIR, exist_ok=True)

    def _get_free_port(self) -> Optional[int]:
        """Finds a free port in the configured range."""
        for port in range(self.start_port, self.end_port + 1):
            if port not in self.model_ports.values():
                # Check if port is actually free on the system
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    if s.connect_ex(('localhost', port)) != 0:
                        return port
        return None

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
                local_dir_use_symlinks=False
            )
            return path
        except Exception as e:
            logger.error(f"Download failed: {e}")
            raise e

    def load_model(self, filename: str) -> RunningModelInfo:
        """Starts a llama-cpp-python server for the given model."""
        if filename in self.running_models:
            port = self.model_ports[filename]
            return RunningModelInfo(model_id=filename, port=port, status="running")

        port = self._get_free_port()
        if not port:
            raise RuntimeError("No available ports to start model server.")

        model_path = os.path.join(MODELS_DIR, filename)
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model {filename} not found.")

        # Command to start the server
        # We use python -m llama_cpp.server
        cmd = [
            "python", "-m", "llama_cpp.server",
            "--model", model_path,
            "--host", "0.0.0.0",
            "--port", str(port),
            "--n_gpu_layers", "-1" # Offload all layers to GPU
        ]

        logger.info(f"Starting model {filename} on port {port}...")
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        self.running_models[filename] = process
        self.model_ports[filename] = port
        
        return RunningModelInfo(model_id=filename, port=port, status="starting")

    def unload_model(self, filename: str):
        """Stops the server for the given model."""
        if filename in self.running_models:
            process = self.running_models[filename]
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            
            del self.running_models[filename]
            del self.model_ports[filename]
            logger.info(f"Stopped model {filename}")

    def get_running_models(self) -> List[RunningModelInfo]:
        """Returns a list of currently running models."""
        result = []
        for name, port in self.model_ports.items():
            # Check if process is still alive
            proc = self.running_models.get(name)
            status = "running"
            if proc and proc.poll() is not None:
                status = "stopped" # Should clean this up
            
            result.append(RunningModelInfo(model_id=name, port=port, status=status))
        return result

    def get_model_port(self, filename: str) -> Optional[int]:
        return self.model_ports.get(filename)
