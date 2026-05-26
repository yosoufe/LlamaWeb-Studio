import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { ModelInfo } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, HardDrive, FileBox, RefreshCw, CheckCircle2 } from 'lucide-react';

export function DownloadModel() {
    const [repoId, setRepoId] = useState('');
    const [filename, setFilename] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);

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

    useEffect(() => {
        fetchModels();
    }, []);

    const handleDownload = async () => {
        if (!repoId || !filename) return;

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await api.downloadModel(repoId, filename);
            setSuccess(`Successfully downloaded ${filename}`);
            setRepoId('');
            setFilename('');
            await fetchModels();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Download failed. Check the repo ID and filename.');
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes >= 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-8">
            {/* Download Form */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                            <Download className="h-5 w-5 text-white" />
                        </div>
                        Download Model
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Enter the Hugging Face repository ID and the model filename to download.
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
                                onChange={(e) => { setRepoId(e.target.value); setError(null); setSuccess(null); }}
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
                                onChange={(e) => { setFilename(e.target.value); setError(null); setSuccess(null); }}
                                className="bg-background/50 border-border/40 focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <span>⚠</span> {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                            <CheckCircle2 className="h-4 w-4" /> {success}
                        </div>
                    )}

                    <Button
                        onClick={handleDownload}
                        disabled={loading || !repoId || !filename}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:shadow-blue-500/40 disabled:opacity-40 disabled:shadow-none"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Downloading…
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Model
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

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
                                <p className="text-xs mt-1">Use the form above to download your first model.</p>
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
                                <span className="text-sm font-mono text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md">
                                    {formatSize(model.size)}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
