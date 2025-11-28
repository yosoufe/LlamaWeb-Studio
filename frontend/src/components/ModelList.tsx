import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ModelInfo, RunningModelInfo } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Square, Loader2, RefreshCw } from 'lucide-react';

export function ModelList({ refreshTrigger }: { refreshTrigger: number }) {
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [runningModels, setRunningModels] = useState<RunningModelInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [m, r] = await Promise.all([api.listModels(), api.getRunningModels()]);
            setModels(m);
            setRunningModels(r);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [refreshTrigger]);

    const handleLoad = async (filename: string) => {
        setActionLoading(filename);
        try {
            await api.loadModel(filename);
            await fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnload = async (filename: string) => {
        setActionLoading(filename);
        try {
            await api.unloadModel(filename);
            await fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const isRunning = (filename: string) => {
        return runningModels.find(m => m.model_id === filename);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>My Models</CardTitle>
                    <CardDescription>Manage your local GGUF models.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchData}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {models.length === 0 && !loading && (
                        <p className="text-sm text-muted-foreground text-center py-4">No models found. Download one above.</p>
                    )}
                    {models.map((model) => {
                        const running = isRunning(model.filename);
                        const isBusy = actionLoading === model.filename;

                        return (
                            <div key={model.filename} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex flex-col">
                                    <span className="font-medium">{model.filename}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {(model.size / (1024 * 1024 * 1024)).toFixed(2)} GB
                                        {running && <span className="ml-2 text-green-500 font-semibold">• Running on port {running.port}</span>}
                                    </span>
                                </div>
                                <div>
                                    {running ? (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleUnload(model.filename)}
                                            disabled={isBusy}
                                        >
                                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4 mr-2" />}
                                            Stop
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleLoad(model.filename)}
                                            disabled={isBusy}
                                        >
                                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                                            Load
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
