import { useState, useEffect } from 'react'
import { TerminalProvider } from './stores/terminalStore'
import { FileManagerProvider } from './stores/fileManagerStore'
import { ConnectionManager } from './components/ConnectionManager/ConnectionManager'
import { TerminalPanel } from './components/Terminal/TerminalPanel'
import { FileManager } from './components/FileManager/FileManager'
import { TransferQueue } from './components/FileManager/TransferQueue'

function App() {
  const [showConnections, setShowConnections] = useState(true)

  return (
    <TerminalProvider>
      <FileManagerProvider>
        <div className="flex h-screen bg-terminal-bg text-terminal-fg">
          {/* Connection Manager Sidebar */}
          {showConnections && (
            <div className="w-64 border-r border-white/10 flex-shrink-0">
              <ConnectionManager onClose={() => setShowConnections(false)} />
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="h-12 border-b border-white/10 flex items-center px-4 gap-4 bg-black/20">
              {!showConnections && (
                <button
                  onClick={() => setShowConnections(true)}
                  className="p-2 hover:bg-white/10 rounded transition-colors"
                  title="Show Connections"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <h1 className="text-lg font-semibold">Web SSH Client</h1>
            </div>

            {/* Terminal and File Manager Split View */}
            <div className="flex-1 flex overflow-hidden">
              {/* Terminal Panel - Left Side */}
              <div className="flex-1 min-w-0">
                <TerminalPanel />
              </div>

              {/* Resize Handle */}
              <div className="w-1 bg-white/5 hover:bg-blue-500 cursor-col-resize transition-colors" />

              {/* File Manager Panel - Right Side */}
              <div className="flex-1 min-w-0 border-l border-white/10">
                <FileManager />
              </div>
            </div>

            {/* Transfer Queue Bottom Panel */}
            <div className="h-48 border-t border-white/10 bg-black/20">
              <TransferQueue />
            </div>
          </div>
        </div>
      </FileManagerProvider>
    </TerminalProvider>
  )
}

export default App
