import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2 } from 'lucide-react';

export function DownloadModel({ onDownloadComplete }: { onDownloadComplete: () => void }) {
    const [repoId, setRepoId] = useState('');
    const [filename, setFilename] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDownload = async () => {
        if (!repoId || !filename) return;

        setLoading(true);
        setError(null);
        try {
            await api.downloadModel(repoId, filename);
            setRepoId('');
            setFilename('');
            onDownloadComplete();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Download failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Download New Model</CardTitle>
                <CardDescription>Enter the Hugging Face Repo ID and Filename (GGUF).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                        placeholder="Repo ID (e.g. TheBloke/Mistral-7B-v0.1-GGUF)"
                        value={repoId}
                        onChange={(e) => setRepoId(e.target.value)}
                    />
                    <Input
                        placeholder="Filename (e.g. mistral-7b-v0.1.Q4_K_M.gguf)"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                    />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button onClick={handleDownload} disabled={loading || !repoId || !filename} className="w-full">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Downloading...
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
    );
}
