import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export interface ModelInfo {
    filename: string;
    size: number;
    path: string;
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
};
