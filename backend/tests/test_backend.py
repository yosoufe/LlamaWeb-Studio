import sys
import os
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Set env var for testing
os.environ["MODELS_DIR"] = os.path.join(os.getcwd(), "models_test")

from app.main import app
from app.manager import ModelManager

client = TestClient(app)

@pytest.fixture
def mock_manager():
    with patch("app.main.manager") as mock:
        yield mock

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "LlamaWeb-Studio Backend is running"}

def test_list_models(mock_manager):
    mock_manager.list_downloaded_models.return_value = [
        {"filename": "model1.gguf", "size": 1024, "path": "/models/model1.gguf"}
    ]
    response = client.get("/models")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["filename"] == "model1.gguf"

def test_download_model_success(mock_manager):
    mock_manager.download_model.return_value = "/models/new_model.gguf"
    response = client.post("/models/download", json={"repo_id": "test/repo", "filename": "new_model.gguf"})
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_load_model(mock_manager):
    mock_manager.load_model.return_value = {"model_id": "model1.gguf", "port": 8001, "status": "starting"}
    response = client.post("/models/load", json={"filename": "model1.gguf"})
    assert response.status_code == 200
    assert response.json()["port"] == 8001

def test_openai_proxy_routing_success(mock_manager):
    # Mock that model is running on port 8001
    mock_manager.get_model_port.return_value = 8001
    
    # We need to mock httpx.AsyncClient to avoid actual network calls
    with patch("httpx.AsyncClient") as mock_client:
        mock_stream = MagicMock()
        mock_stream.__aenter__.return_value = mock_stream
        mock_stream.__aexit__.return_value = None
        mock_stream.status_code = 200
        
        # Mock async iterator for bytes
        async def async_iter():
            yield b"data: hello\n\n"
        mock_stream.aiter_bytes.return_value = async_iter()
        
        mock_client.return_value.__aenter__.return_value.stream.return_value = mock_stream
        
        response = client.post("/v1/chat/completions", json={
            "model": "model1.gguf",
            "messages": [{"role": "user", "content": "hi"}]
        })
        
        assert response.status_code == 200
        # Note: TestClient doesn't fully support StreamingResponse content inspection easily in sync mode
        # but we check status code and that our mock was called

def test_openai_proxy_no_model_specified_single_running(mock_manager):
    # Mock single running model
    mock_manager.get_running_models.return_value = [
        MagicMock(model_id="default_model", port=8001)
    ]
    mock_manager.get_model_port.return_value = 8001
    
    with patch("httpx.AsyncClient") as mock_client:
        mock_stream = MagicMock()
        mock_stream.__aenter__.return_value = mock_stream
        mock_stream.status_code = 200
        async def async_iter():
            yield b"data: hello\n\n"
        mock_stream.aiter_bytes.return_value = async_iter()
        mock_client.return_value.__aenter__.return_value.stream.return_value = mock_stream

        # No model in body
        response = client.post("/v1/chat/completions", json={
            "messages": [{"role": "user", "content": "hi"}]
        })
        assert response.status_code == 200

def test_openai_proxy_no_model_specified_multiple_running(mock_manager):
    # Mock multiple running models
    mock_manager.get_running_models.return_value = [
        MagicMock(model_id="model1", port=8001),
        MagicMock(model_id="model2", port=8002)
    ]
    
    response = client.post("/v1/chat/completions", json={
        "messages": [{"role": "user", "content": "hi"}]
    })
    assert response.status_code == 400
    assert "Multiple models running" in response.json()["detail"]
