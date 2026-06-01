import axios from 'axios';

const API_BASE = '/api';

export interface ModelInfo {
    filename: string;
    size: number;
    path: string;
    is_loaded: boolean;
    status: string; // loaded, loading, sleeping, unloaded, not_registered
}

export interface DownloadTask {
    task_id: string;
    repo_id: string;
    filename: string;
    progress: number;
    status: 'pending' | 'downloading' | 'completed' | 'failed';
    total_size?: number;
    error?: string;
}

export interface SystemStats {
    cpu_percent: number;
    memory_used: number;
    memory_total: number;
    gpu_percent?: number;
    vram_used?: number;
    vram_total?: number;
}

export const api = {
    listModels: async () => {
        const res = await axios.get<ModelInfo[]>(`${API_BASE}/models`);
        return res.data;
    },

    getTasks: async () => {
        const res = await axios.get<DownloadTask[]>(`${API_BASE}/tasks`);
        return res.data;
    },

    downloadModel: async (repo_id: string, filename: string) => {
        const res = await axios.post(`${API_BASE}/models/download`, { repo_id, filename });
        return res.data;
    },

    deleteModel: async (filename: string) => {
        const res = await axios.delete(`${API_BASE}/models/${filename}`);
        return res.data;
    },

    clearTasks: async () => {
        const res = await axios.delete(`${API_BASE}/tasks`);
        return res.data;
    },
    
    loadModel: async (filename: string) => {
        const res = await axios.post(`${API_BASE}/models/${filename}/load`);
        return res.data;
    },
    
    unloadModel: async (filename: string) => {
        const res = await axios.post(`${API_BASE}/models/${filename}/unload`);
        return res.data;
    },
    
    systemStats: async () => {
        const res = await axios.get<SystemStats>(`${API_BASE}/system/stats`);
        return res.data;
    }
};
