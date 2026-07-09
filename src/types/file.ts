export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory" | "link";
  size: number;
  owner: string;
  group: string;
  permissions: string;
  modified: Date;
  accessed: Date;
}

export interface SortConfig {
  key: "name" | "size" | "modified" | "type";
  direction: "asc" | "desc";
}

export interface ViewMode {
  type: "list" | "grid" | "compact";
  iconSize: number;
}

export interface ConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  protocol: "sftp" | "ftp";
  name?: string;
}

export interface SavedConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  protocol: "sftp" | "ftp";
  createdAt: Date;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: "upload" | "download" | "error" | "info" | "delete" | "rename" | "move" | "warning";
}

export interface UploadProgress {
  id: string;
  filename: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  size?: number;
}

export interface ClipboardEntry {
  path: string;
  name: string;
  type: "file" | "directory";
  operation: "copy" | "cut";
}

export interface DiskUsage {
  total: number;
  used: number;
  free: number;
}

export interface ChmodBits {
  owner: { read: boolean; write: boolean; execute: boolean };
  group: { read: boolean; write: boolean; execute: boolean };
  others: { read: boolean; write: boolean; execute: boolean };
}
