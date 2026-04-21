import { Client, SFTPWrapper } from 'ssh2'
import type { ConnectConfig, ClientChannel } from 'ssh2'

export interface SSHConnectionConfig {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
  passphrase?: string
}

export class SSHClient {
  private client: Client
  private stream: ClientChannel | null = null
  private sftp: SFTPWrapper | null = null
  public isConnected: boolean = false

  constructor() {
    this.client = new Client()
  }

  async connect(config: SSHConnectionConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const sshConfig: ConnectConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: 10000,
        keepaliveInterval: 10000,
      }

      if (config.password) {
        sshConfig.password = config.password
      }

      if (config.privateKey) {
        sshConfig.privateKey = config.privateKey
        if (config.passphrase) {
          sshConfig.passphrase = config.passphrase
        }
      }

      this.client.on('ready', () => {
        this.isConnected = true
        resolve()
      })

      this.client.on('error', (err) => {
        this.isConnected = false
        reject(err)
      })

      this.client.on('close', () => {
        this.isConnected = false
      })

      this.client.connect(sshConfig)
    })
  }

  async createShell(): Promise<ClientChannel> {
    return new Promise((resolve, reject) => {
      this.client.shell((err, stream) => {
        if (err || !stream) {
          reject(err || new Error('Failed to create shell'))
          return
        }
        this.stream = stream
        resolve(stream)
      })
    })
  }

  async getSFTP(): Promise<SFTPWrapper> {
    if (this.sftp) {
      return this.sftp
    }

    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err || !sftp) {
          reject(err || new Error('Failed to get SFTP'))
          return
        }
        this.sftp = sftp
        resolve(sftp)
      })
    })
  }

  resize(cols: number, rows: number): void {
    if (this.stream) {
      // Set window size for the shell
      ;(this.stream as any).setWindow(rows, cols, 0, 0)
    }
  }

  write(data: string): void {
    if (this.stream) {
      this.stream.write(data)
    }
  }

  disconnect(): void {
    this.stream?.end()
    this.sftp = null
    this.client.end()
    this.isConnected = false
  }
}
