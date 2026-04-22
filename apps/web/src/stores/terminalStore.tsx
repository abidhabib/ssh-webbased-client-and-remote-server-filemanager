import { create } from 'zustand'
import type { TerminalSession, TerminalSize, SSHConnection } from '@web-ssh/shared-types'

interface TerminalState {
  sessions: Map<string, TerminalSession>
  activeSessionId: string | null
  currentConnection: SSHConnection | null
  terminalSize: TerminalSize
  isConnecting: boolean
  error: string | null
  
  // Actions
  addSession: (session: TerminalSession) => void
  removeSession: (sessionId: string) => void
  setActiveSession: (sessionId: string) => void
  updateSession: (sessionId: string, updates: Partial<TerminalSession>) => void
  setConnection: (connection: SSHConnection | null) => void
  setTerminalSize: (size: TerminalSize) => void
  setIsConnecting: (connecting: boolean) => void
  setError: (error: string | null) => void
  clearSessions: () => void
}

const DEFAULT_TERMINAL_SIZE: TerminalSize = { cols: 80, rows: 24 }

export const useTerminalStore = create<TerminalState>((set, get) => ({
  sessions: new Map(),
  activeSessionId: null,
  currentConnection: null,
  terminalSize: DEFAULT_TERMINAL_SIZE,
  isConnecting: false,
  error: null,

  addSession: (session) => {
    const sessions = new Map(get().sessions)
    sessions.set(session.id, session)
    set({ 
      sessions,
      activeSessionId: session.id,
    })
  },

  removeSession: (sessionId) => {
    const sessions = new Map(get().sessions)
    sessions.delete(sessionId)
    
    const activeSessionId = get().activeSessionId === sessionId 
      ? (sessions.size > 0 ? Array.from(sessions.keys())[0] : null)
      : get().activeSessionId
    
    set({ sessions, activeSessionId })
  },

  setActiveSession: (sessionId) => {
    set({ activeSessionId: sessionId })
  },

  updateSession: (sessionId, updates) => {
    const sessions = new Map(get().sessions)
    const session = sessions.get(sessionId)
    if (session) {
      sessions.set(sessionId, { ...session, ...updates })
      set({ sessions })
    }
  },

  setConnection: (connection) => {
    set({ currentConnection: connection })
  },

  setTerminalSize: (size) => {
    set({ terminalSize: size })
  },

  setIsConnecting: (connecting) => {
    set({ isConnecting: connecting })
  },

  setError: (error) => {
    set({ error })
  },

  clearSessions: () => {
    set({ 
      sessions: new Map(),
      activeSessionId: null,
    })
  },
}))

// Provider component for context
import { createContext, useContext, ReactNode } from 'react'

const TerminalContext = createContext<typeof useTerminalStore | null>(null)

export function TerminalProvider({ children }: { children: ReactNode }) {
  return (
    <TerminalContext.Provider value={useTerminalStore}>
      {children}
    </TerminalContext.Provider>
  )
}

export function useTerminal() {
  const context = useContext(TerminalContext)
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider')
  }
  return context
}
