import type { WebSocket } from 'ws'
import type { SSHClient } from '../ssh/Client.js'
import type { SFTPManager } from '../ssh/SFTP.js'

interface SessionStore {
  ssh: SSHClient
  sftp: SFTPManager
}

export class WebSocketHandler {
  private ws: WebSocket
  private sessions: Map<string, SessionStore>
  private sessionId: string | null = null

  constructor(ws: WebSocket, sessions: Map<string, SessionStore>) {
    this.ws = ws
    this.sessions = sessions
  }

  handleConnection() {
    console.log('New WebSocket connection')

    this.ws.on('message', async (data) => {
      try {
        await this.handleMessage(data)
      } catch (error) {
        console.error('Error handling message:', error)
        this.sendError(error instanceof Error ? error.message : 'Unknown error')
      }
    })

    this.ws.on('close', () => {
      console.log('WebSocket connection closed')
      if (this.sessionId) {
        const session = this.sessions.get(this.sessionId)
        if (session) {
          session.ssh.disconnect()
          this.sessions.delete(this.sessionId)
        }
      }
    })

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  }

  private async handleMessage(data: any) {
    // Handle text messages (JSON)
    if (typeof data === 'string') {
      const message = JSON.parse(data)
      
      switch (message.type) {
        case 'connect':
          await this.handleConnect(message.payload)
          break
          
        case 'terminal:resize':
          await this.handleResize(message.payload)
          break
          
        case 'sftp:list':
          await this.handleSFTPList(message.payload)
          break
          
        default:
          // Forward to terminal stream
          if (this.sessionId) {
            const session = this.sessions.get(this.sessionId)
            if (session?.ssh.isConnected) {
              session.ssh.write(message.payload || data)
            }
          }
      }
    } 
    // Handle binary messages
    else if (data instanceof ArrayBuffer || Buffer.isBuffer(data)) {
      await this.handleBinaryMessage(Buffer.from(data))
    }
  }

  private async handleConnect(payload: any) {
    const { host, port, username, password, privateKey, passphrase } = payload
    
    // Create new SSH client
    const ssh = new SSHClient()
    await ssh.connect({ host, port, username, password, privateKey, passphrase })
    
    // Create shell
    const stream = await ssh.createShell()
    
    // Setup stream handlers
    stream.on('data', (data: Buffer) => {
      this.sendMessage({
        type: 'terminal:data',
        payload: data.toString('utf-8'),
      })
    })

    // Get SFTP
    const sftpWrapper = await ssh.getSFTP()
    const sftp = new SFTPManager(sftpWrapper)
    
    // Store session
    this.sessionId = crypto.randomUUID()
    this.sessions.set(this.sessionId, { ssh, sftp })
    
    this.sendMessage({
      type: 'connect_success',
      sessionId: this.sessionId,
    })
  }

  private async handleResize(payload: { cols: number; rows: number }) {
    if (this.sessionId) {
      const session = this.sessions.get(this.sessionId)
      if (session) {
        session.ssh.resize(payload.cols, payload.rows)
      }
    }
  }

  private async handleSFTPList(payload: { path: string }) {
    if (!this.sessionId) {
      this.sendError('No active session')
      return
    }

    const session = this.sessions.get(this.sessionId)
    if (!session) {
      this.sendError('Session not found')
      return
    }

    const files = await session.sftp.listDirectory(payload.path || '/')
    
    this.sendMessage({
      type: 'sftp:list_response',
      payload: { files, path: payload.path || '/' },
    })
  }

  private async handleBinaryMessage(data: Buffer) {
    // TODO: Implement binary protocol for file transfers
    console.log('Received binary data:', data.length, 'bytes')
  }

  private sendMessage(message: any) {
    if (this.ws.readyState === 1) { // WebSocket.OPEN
      this.ws.send(JSON.stringify(message))
    }
  }

  private sendError(error: string) {
    this.sendMessage({
      type: 'error',
      payload: error,
    })
  }
}
