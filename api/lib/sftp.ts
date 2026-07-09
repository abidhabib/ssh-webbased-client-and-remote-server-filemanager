import { Client } from "ssh2";
import type { SFTPWrapper } from "ssh2";
import { createReadStream, createWriteStream } from "fs";
import { mkdir, writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export interface ConnectionConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

export interface FileEntry {
  filename: string;
  longname: string;
  attrs: {
    mode: number;
    uid: number;
    gid: number;
    size: number;
    atime: number;
    mtime: number;
  };
}

interface SessionData {
  client: Client;
  sftp: SFTPWrapper;
  lastUsed: number;
  config: ConnectionConfig;
}

const sessions = new Map<string, SessionData>();

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastUsed > 30 * 60 * 1000) {
      session.client.end();
      sessions.delete(id);
    }
  }
}, 60 * 1000);

export async function connect(config: ConnectionConfig): Promise<string> {
  const sessionId = generateSessionId();
  const conn = new Client();

  return new Promise((resolve, reject) => {
    conn.on("ready", () => {
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        sessions.set(sessionId, { client: conn, sftp, lastUsed: Date.now(), config });
        resolve(sessionId);
      });
    });

    conn.on("error", (err) => reject(err));
    conn.on("end", () => sessions.delete(sessionId));
    conn.on("close", () => sessions.delete(sessionId));

    const connectConfig: any = {
      host: config.host,
      port: config.port,
      username: config.username,
      readyTimeout: 20000,
      keepaliveInterval: 10000,
    };

    if (config.password) connectConfig.password = config.password;
    if (config.privateKey) connectConfig.privateKey = config.privateKey;
    if (config.passphrase) connectConfig.passphrase = config.passphrase;

    conn.connect(connectConfig);
  });
}

export function disconnect(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.client.end();
    sessions.delete(sessionId);
  }
}

function getSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error("Session not found or expired");
  session.lastUsed = Date.now();
  return session;
}

export async function listDirectory(sessionId: string, path: string): Promise<FileEntry[]> {
  const { sftp } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    sftp.readdir(path, (err: any, list: any) => {
      if (err) return reject(err);
      resolve(list as FileEntry[]);
    });
  });
}

export async function statFile(sessionId: string, path: string): Promise<unknown> {
  const { sftp } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    sftp.stat(path, (err: any, stats: any) => {
      if (err) return reject(err);
      resolve(stats);
    });
  });
}

export async function readFileContent(sessionId: string, path: string): Promise<string> {
  const { sftp } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    let content = "";
    const stream = sftp.createReadStream(path, { encoding: "utf8" });
    stream.on("data", (chunk: string) => { content += chunk; });
    stream.on("end", () => resolve(content));
    stream.on("error", reject);
  });
}

export async function readFileBuffer(sessionId: string, path: string): Promise<Buffer> {
  const { sftp } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = sftp.createReadStream(path);
    stream.on("data", (chunk: any) => { chunks.push(Buffer.from(chunk)); });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export async function writeFileContent(sessionId: string, path: string, content: string): Promise<void> {
  const { sftp } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    const stream = sftp.createWriteStream(path, { flags: "w", encoding: "utf8" });
    stream.write(content, "utf8", (err: any) => {
      if (err) return reject(err);
      stream.end(() => resolve());
    });
    stream.on("error", reject);
  });
}

export async function createDirectory(sessionId: string, path: string): Promise<void> {
  const { sftp } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    sftp.mkdir(path, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function deleteFile(sessionId: string, path: string): Promise<void> {
  const { sftp } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    sftp.unlink(path, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function deleteDirectory(sessionId: string, path: string): Promise<void> {
  const { sftp } = getSession(sessionId);
  // Try recursive delete by listing and deleting contents first
  try {
    const files = await listDirectory(sessionId, path);
    for (const file of files) {
      if (file.filename === "." || file.filename === "..") continue;
      const childPath = path + "/" + file.filename;
      const isDir = (file.attrs.mode & 0o040000) !== 0;
      if (isDir) {
        await deleteDirectory(sessionId, childPath);
      } else {
        await deleteFile(sessionId, childPath);
      }
    }
  } catch {
    // Directory might be empty or permission denied
  }
  return new Promise((resolve, reject) => {
    sftp.rmdir(path, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function renameFile(sessionId: string, oldPath: string, newPath: string): Promise<void> {
  const { sftp } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    sftp.rename(oldPath, newPath, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function chmodFile(sessionId: string, path: string, mode: number): Promise<void> {
  const { sftp } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    sftp.chmod(path, mode, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function chownFile(sessionId: string, path: string, uid: number, gid: number): Promise<void> {
  const { sftp } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    sftp.chown(path, uid, gid, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function uploadFile(
  sessionId: string,
  localPath: string,
  remotePath: string,
  onProgress?: (transferred: number, total: number) => void
): Promise<void> {
  const { sftp } = getSession(sessionId);
  const fs = await import("fs");
  return new Promise((resolve, reject) => {
    const readStream = createReadStream(localPath);
    const writeStream = sftp.createWriteStream(remotePath);
    let totalSize = 0;
    let transferred = 0;

    readStream.on("data", (chunk: any) => {
      const buf = Buffer.from(chunk);
      transferred += buf.length;
      if (onProgress && totalSize > 0) onProgress(transferred, totalSize);
    });

    readStream.pipe(writeStream);
    writeStream.on("close", () => resolve());
    writeStream.on("error", reject);
    readStream.on("error", reject);

    fs.stat(localPath, (err: any, stats: any) => {
      if (!err) totalSize = stats.size;
    });
  });
}

export async function downloadFile(
  sessionId: string,
  remotePath: string,
  localPath: string,
  onProgress?: (transferred: number, total: number) => void
): Promise<void> {
  const { sftp } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    const readStream = sftp.createReadStream(remotePath);
    const writeStream = createWriteStream(localPath);
    let totalSize = 0;
    let transferred = 0;

    readStream.on("data", (chunk: any) => {
      const buf = Buffer.from(chunk);
      transferred += buf.length;
      if (onProgress && totalSize > 0) onProgress(transferred, totalSize);
    });

    readStream.pipe(writeStream);
    writeStream.on("close", () => resolve());
    writeStream.on("error", reject);
    readStream.on("error", reject);

    sftp.stat(remotePath, (err: any, stats: any) => {
      if (!err) totalSize = stats.size;
    });
  });
}

export async function createZipDownload(
  sessionId: string,
  remotePaths: string[],
  localZipPath: string
): Promise<void> {
  const archiverMod: any = await import("archiver");
  const archive = (archiverMod.default || archiverMod)("zip", { zlib: { level: 9 } });
  const output = createWriteStream(localZipPath);

  return new Promise(async (resolve, reject) => {
    output.on("close", () => resolve());
    archive.on("error", (err: any) => reject(err));
    archive.on("warning", (err: any) => {
      if (err.code === "ENOENT") console.warn("Archive warning:", err);
      else reject(err);
    });
    archive.pipe(output);

    for (const remotePath of remotePaths) {
      try {
        const content = await readFileBuffer(sessionId, remotePath);
        const name = remotePath.split("/").pop() || "file";
        archive.append(content, { name });
      } catch (err: any) {
        console.error(`Failed to add ${remotePath} to archive:`, err);
      }
    }
    archive.finalize();
  });
}

export async function getDiskUsage(sessionId: string, path: string): Promise<{ total: number; used: number; free: number }> {
  const { client } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    client.exec(`df -B1 "${path}" | tail -1`, (err: any, stream: any) => {
      if (err) return reject(err);
      let output = "";
      stream.on("data", (data: any) => { output += data.toString(); });
      stream.on("close", () => {
        const parts = output.trim().split(/\s+/);
        if (parts.length >= 4) {
          resolve({
            total: parseInt(parts[1]) || 0,
            used: parseInt(parts[2]) || 0,
            free: parseInt(parts[3]) || 0,
          });
        } else {
          resolve({ total: 0, used: 0, free: 0 });
        }
      });
      stream.on("error", reject);
    });
  });
}

export async function getDirectorySize(sessionId: string, path: string): Promise<number> {
  const { client } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    client.exec(`du -sb "${path}" | cut -f1`, (err: any, stream: any) => {
      if (err) return reject(err);
      let output = "";
      stream.on("data", (data: any) => { output += data.toString(); });
      stream.on("close", () => {
        const size = parseInt(output.trim()) || 0;
        resolve(size);
      });
      stream.on("error", reject);
    });
  });
}

export async function executeCommand(sessionId: string, command: string): Promise<string> {
  const { client } = getSession(sessionId);
  return new Promise((resolve, reject) => {
    client.exec(command, (err: any, stream: any) => {
      if (err) return reject(err);
      let stdout = "";
      let stderr = "";
      stream.on("data", (data: any) => { stdout += data.toString(); });
      stream.stderr.on("data", (data: any) => { stderr += data.toString(); });
      stream.on("close", () => {
        resolve(stdout || stderr);
      });
      stream.on("error", reject);
    });
  });
}

export async function getTempDir(): Promise<string> {
  const tempDir = join(tmpdir(), "web-file-manager");
  await mkdir(tempDir, { recursive: true });
  return tempDir;
}

export async function saveTempFile(buffer: Buffer, filename: string): Promise<string> {
  const tempDir = await getTempDir();
  const filepath = join(tempDir, filename);
  await writeFile(filepath, buffer);
  return filepath;
}

export async function cleanupTempFile(filepath: string): Promise<void> {
  try { await unlink(filepath); } catch { /* ignore */ }
}

export function isConnected(sessionId: string): boolean {
  return sessions.has(sessionId);
}

export function getSessionInfo(sessionId: string): ConnectionConfig | null {
  const session = sessions.get(sessionId);
  return session?.config || null;
}

export function getActiveSessions(): string[] {
  return Array.from(sessions.keys());
}

export function normalizePath(basePath: string, userPath: string): string {
  const cleaned = userPath.replace(/\0/g, "").replace(/\\/g, "/");
  const parts = cleaned.split("/").filter(Boolean);
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "..") resolved.pop();
    else if (part !== ".") resolved.push(part);
  }
  return basePath + "/" + resolved.join("/");
}
