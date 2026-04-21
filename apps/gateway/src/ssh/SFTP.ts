import type { SFTPWrapper } from 'ssh2'
import type { Stats } from 'fs'

export interface FileInfo {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  modifiedAt: Date
  permissions: string
  isHidden: boolean
}

export class SFTPManager {
  private sftp: SFTPWrapper

  constructor(sftp: SFTPWrapper) {
    this.sftp = sftp
  }

  async listDirectory(path: string): Promise<FileInfo[]> {
    return new Promise((resolve, reject) => {
      this.sftp.readdir(path, (err, list) => {
        if (err) {
          reject(err)
          return
        }

        const files: FileInfo[] = list.map((item) => {
          const isDir = item.attrs.isDirectory()
          return {
            name: item.filename,
            path: `${path}/${item.filename}`.replace(/\/+/g, '/'),
            type: isDir ? 'directory' : 'file',
            size: item.attrs.size,
            modifiedAt: new Date(item.attrs.mtime * 1000),
            permissions: this.formatPermissions(item.attrs.mode),
            isHidden: item.filename.startsWith('.'),
          }
        })

        // Sort directories first, then files
        files.sort((a, b) => {
          if (a.type === b.type) {
            return a.name.localeCompare(b.name)
          }
          return a.type === 'directory' ? -1 : 1
        })

        resolve(files)
      })
    })
  }

  async downloadFile(remotePath: string, onProgress?: (bytes: number) => void): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      
      this.sftp.createReadStream(remotePath)
        .on('data', (chunk) => {
          chunks.push(chunk)
          onProgress?.(chunk.length)
        })
        .on('end', () => {
          resolve(Buffer.concat(chunks))
        })
        .on('error', reject)
    })
  }

  async uploadFile(
    remotePath: string,
    data: Buffer,
    onProgress?: (bytesWritten: number, totalBytes: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const writeStream = this.sftp.createWriteStream(remotePath)
      let bytesWritten = 0

      writeStream.on('finish', () => {
        resolve()
      })

      writeStream.on('error', reject)

      // Write in chunks to track progress
      const chunkSize = 64 * 1024 // 64KB
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize)
        bytesWritten += chunk.length
        writeStream.write(chunk)
        onProgress?.(bytesWritten, data.length)
      }

      writeStream.end()
    })
  }

  async deleteFile(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftp.unlink(path, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async deleteDirectory(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftp.rmdir(path, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async createDirectory(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftp.mkdir(path, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftp.rename(oldPath, newPath, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async chmod(path: string, mode: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftp.chmod(path, mode, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async stat(path: string): Promise<Stats> {
    return new Promise((resolve, reject) => {
      this.sftp.stat(path, (err, stats) => {
        if (err || !stats) reject(err)
        else resolve(stats)
      })
    })
  }

  private formatPermissions(mode: number): string {
    const permissions = [
      (mode & 0o400) ? 'r' : '-',
      (mode & 0o200) ? 'w' : '-',
      (mode & 0o100) ? 'x' : '-',
      (mode & 0o040) ? 'r' : '-',
      (mode & 0o020) ? 'w' : '-',
      (mode & 0o010) ? 'x' : '-',
      (mode & 0o004) ? 'r' : '-',
      (mode & 0o002) ? 'w' : '-',
      (mode & 0o001) ? 'x' : '-',
    ].join('')

    const type = (mode & 0o170000) >> 12
    const typeChar = type === 4 ? 'd' : type === 10 ? '-' : 'l'

    return typeChar + permissions
  }
}
