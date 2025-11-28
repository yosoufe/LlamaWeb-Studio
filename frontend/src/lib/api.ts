import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export interface ModelInfo {
    filename: string;
    size: number;
    path: string;
}

export interface RunningModelInfo {
    model_id: string;
    port: number;
    status: string;
}

export const api = {
    listModels: async () => {
        const res = await axios.get<ModelInfo[]>(`${API_BASE}/models`);
        return res.data;
    },

    downloadModel: async (repo_id: string, filename: string) => {
        const res = await axios.post(`${API_BASE}/models/download`, { repo_id, filename });
        return res.data;
    },

    loadModel: async (filename: string) => {
        const res = await axios.post<RunningModelInfo>(`${API_BASE}/models/load`, { filename });
        return res.data;
    },

    unloadModel: async (filename: string) => {
        const res = await axios.post(`${API_BASE}/models/unload`, { filename });
        return res.data;
    },

    getRunningModels: async () => {
        const res = await axios.get<RunningModelInfo[]>(`${API_BASE}/models/running`);
        return res.data;
    }
};
