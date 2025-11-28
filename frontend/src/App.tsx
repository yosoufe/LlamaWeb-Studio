import { useState } from 'react'
import { DownloadModel } from './components/DownloadModel'
import { ModelList } from './components/ModelList'
import { ChatInterface } from './components/ChatInterface'
import { BrainCircuit } from 'lucide-react'

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDownloadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center gap-3 border-b pb-6">
          <div className="p-3 bg-primary rounded-lg">
            <BrainCircuit className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">LlamaWeb Studio</h1>
            <p className="text-muted-foreground">Self-hosted AI Cluster Manager</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <DownloadModel onDownloadComplete={handleDownloadComplete} />
            <ModelList refreshTrigger={refreshTrigger} />
          </div>
          <div className="lg:h-[calc(100vh-12rem)]">
            <ChatInterface />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
