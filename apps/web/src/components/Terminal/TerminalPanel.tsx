import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { SearchAddon } from 'xterm-addon-search'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { useTerminal } from '../../stores/terminalStore'
import { useFileManager } from '../../stores/fileManagerStore'
import type { TerminalSession } from '@web-ssh/shared-types'
import 'xterm/css/xterm.css'

export function TerminalPanel() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  
  const { sessions, activeSessionId, addSession, terminalSize, setTerminalSize } = useTerminal()
  const { currentConnection } = useTerminal()

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return

    const term = new Terminal({
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#cccccc',
        cursorAccent: '#1e1e1e',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      tabStopWidth: 4,
    })

    const fitAddon = new FitAddon()
    const searchAddon = new SearchAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(searchAddon)
    term.loadAddon(webLinksAddon)

    term.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    // Create initial session
    if (currentConnection && sessions.size === 0) {
      const session: TerminalSession = {
        id: crypto.randomUUID(),
        connectionId: currentConnection.id,
        tabName: `${currentConnection.username}@${currentConnection.host}`,
        cwd: '~',
        isActive: true,
        createdAt: new Date(),
      }
      addSession(session)
    }

    // Handle terminal input
    term.onData((data) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(data)
      }
    })

    // Handle resize
    const handleResize = () => {
      fitAddon.fit()
      const newSize = { cols: term.cols, rows: term.rows }
      setTerminalSize(newSize)
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'terminal:resize',
          payload: newSize,
        }))
      }
    }

    window.addEventListener('resize', handleResize)

    // Connect to WebSocket
    connectWebSocket(term)

    return () => {
      window.removeEventListener('resize', handleResize)
      wsRef.current?.close()
      term.dispose()
    }
  }, [])

  const connectWebSocket = (term: Terminal) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    
    const ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
      term.writeln('\r\n\x1b[32mConnected to gateway server\x1b[0m\r\n')
    }

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Handle binary data (file transfers, etc.)
        handleBinaryMessage(event.data)
      } else {
        // Handle text data (terminal output)
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'terminal:data') {
            term.write(message.payload)
          }
        } catch {
          term.write(event.data)
        }
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      term.writeln('\r\n\x1b[31mConnection error\x1b[0m\r\n')
    }

    ws.onclose = () => {
      console.log('WebSocket closed')
      term.writeln('\r\n\x1b[33mDisconnected from server\x1b[0m\r\n')
    }
  }

  const handleBinaryMessage = (data: ArrayBuffer) => {
    // TODO: Implement binary protocol parsing for file transfers
    console.log('Received binary data:', data.byteLength, 'bytes')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex items-center bg-black/20 border-b border-white/10 overflow-x-auto">
        {Array.from(sessions.values()).map((session) => (
          <div
            key={session.id}
            className={`px-4 py-2 flex items-center gap-2 border-r border-white/10 cursor-pointer hover:bg-white/5 ${
              session.id === activeSessionId ? 'bg-white/10' : ''
            }`}
          >
            <span className="text-sm whitespace-nowrap">{session.tabName}</span>
            <button
              className="hover:bg-red-500/20 rounded p-0.5"
              title="Close tab"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        
        {/* New Tab Button */}
        <button
          className="p-2 hover:bg-white/10 transition-colors"
          title="New tab"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Terminal Container */}
      <div ref={terminalRef} className="flex-1 overflow-hidden" />
    </div>
  )
}
