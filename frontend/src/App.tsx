import { DownloadModel } from './components/DownloadModel'
import { Download } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-background to-purple-950/20 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <header className="flex items-center gap-4 mb-10">
          <div className="p-3.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Download className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              HF Model Downloader
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Download Hugging Face models to your local machine
            </p>
          </div>
        </header>

        <DownloadModel />
      </div>
    </div>
  )
}

export default App
