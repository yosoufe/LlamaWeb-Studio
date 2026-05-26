import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import type { ModelInfo, DownloadTask } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, HardDrive, FileBox, RefreshCw, CheckCircle2, XCircle, AlertCircle, Trash2 } from 'lucide-react';

export function DownloadModel() {
    const [repoId, setRepoId] = useState('');
    const [filename, setFilename] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [tasks, setTasks] = useState<DownloadTask[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const pollingInterval = useRef<any>(null);

    const fetchModels = async () => {
        setModelsLoading(true);
        try {
            const data = await api.listModels();
            setModels(data);
        } catch (err) {
            console.error('Failed to fetch models', err);
        } finally {
            setModelsLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            const data = await api.getTasks();
            setTasks(data);
            
            // If any task just finished, refresh model list
            const activeCount = data.filter(t => t.status === 'downloading' || t.status === 'pending').length;
            if (activeCount === 0 && tasks.some(t => t.status === 'downloading')) {
                fetchModels();
            }
        } catch (err) {
            console.error('Failed to fetch tasks', err);
        }
    };

    useEffect(() => {
        fetchModels();
        fetchTasks();
        
        // Initial polling
        pollingInterval.current = setInterval(fetchTasks, 1500);

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, []);

    // Also refresh models when a task is completed
    useEffect(() => {
        if (tasks.some(t => t.status === 'completed')) {
            fetchModels();
        }
    }, [tasks.filter(t => t.status === 'completed').length]);

    const handleDownload = async () => {
        if (!repoId || !filename) return;

        setLoading(true);
        setError(null);
        try {
            await api.downloadModel(repoId, filename);
            setRepoId('');
            setFilename('');
            await fetchTasks();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Download failed. Check the repo ID and filename.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
        try {
            await api.deleteModel(filename);
            await fetchModels();
            await fetchTasks();
        } catch (err) {
            console.error('Failed to delete model', err);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes >= 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const activeTasks = tasks.filter(t => t.status === 'downloading' || t.status === 'pending');
    const recentTasks = tasks.filter(t => t.status === 'completed' || t.status === 'failed');

    return (
        <div className="space-y-8">
            {/* Download Form */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                            <Download className="h-5 w-5 text-white" />
                        </div>
                        New Download
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Enter the Hugging Face repository ID and the model filename.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Repository ID
                            </label>
                            <Input
                                placeholder="e.g. TheBloke/Mistral-7B-v0.1-GGUF"
                                value={repoId}
                                onChange={(e) => { setRepoId(e.target.value); setError(null); }}
                                className="bg-background/50 border-border/40 focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Filename
                            </label>
                            <Input
                                placeholder="e.g. mistral-7b-v0.1.Q4_K_M.gguf"
                                value={filename}
                                onChange={(e) => { setFilename(e.target.value); setError(null); }}
                                className="bg-background/50 border-border/40 focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <AlertCircle className="h-4 w-4" /> {error}
                        </div>
                    )}

                    <Button
                        onClick={handleDownload}
                        disabled={loading || !repoId || !filename}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:shadow-blue-500/40 disabled:opacity-40 disabled:shadow-none"
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Start Download
                    </Button>

                    <div className="pt-4 border-t border-border/20">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 opacity-70">
                            Quick Start Examples
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => { setRepoId('Qwen/Qwen2.5-0.5B-Instruct-GGUF'); setFilename('qwen2.5-0.5b-instruct-q4_k_m.gguf'); }}
                                className="text-[11px] h-8 bg-background/30 border-border/40 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
                            >
                                Qwen 2.5 (0.39 GB)
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => { setRepoId('microsoft/Phi-3-mini-4k-instruct-gguf'); setFilename('Phi-3-mini-4k-instruct-q4.gguf'); }}
                                className="text-[11px] h-8 bg-background/30 border-border/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all"
                            >
                                Phi-3 Mini (2.2 GB)
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Active Downloads */}
            {activeTasks.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 px-1">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        Active Downloads
                    </h3>
                    <div className="grid gap-4">
                        {activeTasks.map(task => (
                            <Card key={task.task_id} className="border-blue-500/20 bg-blue-500/5 backdrop-blur-sm shadow-md overflow-hidden">
                                <div className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-500" style={{ width: `${task.progress}%` }} />
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">{task.filename}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase font-bold tracking-tighter">
                                                    {task.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate max-w-[250px]">{task.repo_id}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-blue-400">{task.progress}%</span>
                                            {task.total_size && (
                                                <p className="text-[10px] text-muted-foreground">{formatSize((task.progress / 100) * task.total_size)} / {formatSize(task.total_size)}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                                            style={{ width: `${task.progress}%` }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Downloaded Models List */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                                <HardDrive className="h-5 w-5 text-white" />
                            </div>
                            Downloaded Models
                        </CardTitle>
                        <CardDescription className="text-muted-foreground/80 mt-1">
                            {models.length} model{models.length !== 1 ? 's' : ''} on disk
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchModels}
                        className="hover:bg-muted/50 transition-colors"
                    >
                        <RefreshCw className={`h-4 w-4 ${modelsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {models.length === 0 && !modelsLoading && (
                            <div className="text-center py-8 text-muted-foreground/60">
                                <FileBox className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                <p className="text-sm">No models downloaded yet.</p>
                            </div>
                        )}
                        {models.map((model) => (
                            <div
                                key={model.filename}
                                className="flex items-center justify-between p-4 border border-border/30 rounded-lg bg-background/30 hover:bg-background/50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-md bg-muted/50 group-hover:bg-muted/80 transition-colors">
                                        <FileBox className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-sm">{model.filename}</span>
                                        <p className="text-xs text-muted-foreground mt-0.5">{model.path}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-mono text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md">
                                        {formatSize(model.size)}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(model.filename)}
                                        className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent/Failed Tasks */}
            {recentTasks.length > 0 && (
                 <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        Recent History
                    </h3>
                    <div className="grid gap-2">
                        {recentTasks.map(task => (
                            <div key={task.task_id} className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-card/40 text-xs">
                                <div className="flex items-center gap-3">
                                    {task.status === 'completed' ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                    <div>
                                        <p className="font-medium">{task.filename}</p>
                                        <p className="text-muted-foreground opacity-70">{task.repo_id}</p>
                                        {task.error && <p className="text-red-400 mt-1">{task.error}</p>}
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {task.status}
                                </span>
                            </div>
                        ))}
                    </div>
                 </div>
            )}
        </div>
    );
}
