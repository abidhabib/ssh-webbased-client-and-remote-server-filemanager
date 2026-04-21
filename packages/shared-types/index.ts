// Shared TypeScript types for Web SSH Client

export interface SSHConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key';
  password?: string;
  privateKey?: string;
  passphrase?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SFTPFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modifiedAt: Date;
  permissions: string;
  isHidden: boolean;
}

export interface TransferJob {
  id: string;
  type: 'upload' | 'download';
  sourcePath: string;
  destinationPath: string;
  status: 'pending' | 'in-progress' | 'completed' | 'paused' | 'failed';
  progress: number; // 0-100
  speed?: number; // bytes per second
  eta?: number; // seconds
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface TerminalSession {
  id: string;
  connectionId: string;
  tabName: string;
  cwd: string;
  isActive: boolean;
  createdAt: Date;
}

export interface TerminalSize {
  cols: number;
  rows: number;
}

export type Theme = 
  | 'dracula'
  | 'monokai'
  | 'solarized-dark'
  | 'solarized-light'
  | 'github-dark'
  | 'github-light'
  | 'one-dark'
  | 'nord'
  | 'gruvbox'
  | 'tokyo-night'
  | 'custom';

export interface AppSettings {
  theme: Theme;
  fontSize: number;
  fontFamily: string;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  scrollback: number;
  confirmOnClose: boolean;
  autoReconnect: boolean;
  showHiddenFiles: boolean;
  defaultLocalPath?: string;
}

export interface WSMessage {
  type: WSMessageType;
  payload: any;
  sessionId?: string;
}

export enum WSMessageType {
  // Terminal messages
  TERMINAL_DATA = 'terminal:data',
  TERMINAL_RESIZE = 'terminal:resize',
  TERMINAL_PING = 'terminal:ping',
  TERMINAL_PONG = 'terminal:pong',
  
  // SFTP messages
  SFTP_LIST = 'sftp:list',
  SFTP_LIST_RESPONSE = 'sftp:list_response',
  SFTP_DOWNLOAD = 'sftp:download',
  SFTP_DOWNLOAD_CHUNK = 'sftp:download_chunk',
  SFTP_UPLOAD = 'sftp:upload',
  SFTP_UPLOAD_ACK = 'sftp:upload_ack',
  SFTP_DELETE = 'sftp:delete',
  SFTP_RENAME = 'sftp:rename',
  SFTP_MKDIR = 'sftp:mkdir',
  SFTP_CHMOD = 'sftp:chmod',
  
  // Connection messages
  CONNECT = 'connect',
  CONNECT_SUCCESS = 'connect_success',
  CONNECT_ERROR = 'connect_error',
  DISCONNECT = 'disconnect',
  
  // Error messages
  ERROR = 'error',
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}
