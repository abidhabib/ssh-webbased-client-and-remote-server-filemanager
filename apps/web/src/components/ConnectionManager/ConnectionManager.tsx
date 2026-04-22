import { useState } from 'react'
import { useTerminal } from '../../stores/terminalStore'
import type { SSHConnection } from '@web-ssh/shared-types'

interface ConnectionManagerProps {
  onClose: () => void
}

export function ConnectionManager({ onClose }: ConnectionManagerProps) {
  const [connections, setConnections] = useState<SSHConnection[]>([])
  const [showNewConnectionForm, setShowNewConnectionForm] = useState(false)
  const { setConnection, setIsConnecting, setError, currentConnection } = useTerminal()

  const handleConnect = async (conn: SSHConnection) => {
    setIsConnecting(true)
    setError(null)
    
    try {
      setConnection(conn)
      console.log('Connected to:', conn.host)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDeleteConnection = (id: string) => {
    setConnections(connections.filter(c => c.id !== id))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Connections</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Connection List */}
      <div className="flex-1 overflow-y-auto p-2">
        {connections.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No saved connections</p>
            <p className="text-sm mt-2">Click + to add a new connection</p>
          </div>
        ) : (
          <div className="space-y-1">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="p-3 rounded hover:bg-white/10 cursor-pointer group"
                onClick={() => handleConnect(conn)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{conn.name}</p>
                    <p className="text-sm text-gray-400">
                      {conn.username}@{conn.host}:{conn.port}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteConnection(conn.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Connection Button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => setShowNewConnectionForm(true)}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Connection
        </button>
      </div>

      {/* New Connection Modal */}
      {showNewConnectionForm && (
        <NewConnectionModal
          onSave={(conn) => {
            setConnections([...connections, conn])
            setShowNewConnectionForm(false)
          }}
          onCancel={() => setShowNewConnectionForm(false)}
        />
      )}
    </div>
  )
}

interface NewConnectionModalProps {
  onSave: (connection: SSHConnection) => void
  onCancel: () => void
}

function NewConnectionModal({ onSave, onCancel }: NewConnectionModalProps) {
  const [name, setName] = useState('')
  const [host, setHost] = useState('')
  const [port, setPort] = useState(22)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password')
  const [privateKey, setPrivateKey] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !host || !username) return

    const connection: SSHConnection = {
      id: crypto.randomUUID(),
      name,
      host,
      port,
      username,
      authMethod,
      password: authMethod === 'password' ? password : undefined,
      privateKey: authMethod === 'key' ? privateKey : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    onSave(connection)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-terminal-bg border border-white/10 rounded-lg w-full max-w-md p-6">
        <h3 className="text-xl font-semibold mb-4">New Connection</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="My Server"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm mb-1">Host</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="192.168.1.100"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value))}
                className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="22"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="root"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Authentication</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={authMethod === 'password'}
                  onChange={() => setAuthMethod('password')}
                />
                Password
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={authMethod === 'key'}
                  onChange={() => setAuthMethod('key')}
                />
                SSH Key
              </label>
            </div>
          </div>

          {authMethod === 'password' ? (
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm mb-1">Private Key</label>
              <textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 focus:outline-none focus:border-blue-500 font-mono text-sm"
                rows={4}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-white/20 rounded hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
