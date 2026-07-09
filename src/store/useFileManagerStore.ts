import { create } from "zustand";
import type { FileEntry, SortConfig, ViewMode, ClipboardEntry, LogEntry, DiskUsage, SavedConnection } from "@/types/file";

interface FileManagerState {
  // Connection
  sessionId: string | null;
  serverInfo: { host: string; port: number; username: string } | null;
  isConnected: boolean;
  setSessionId: (id: string | null) => void;
  setServerInfo: (info: { host: string; port: number; username: string } | null) => void;
  setIsConnected: (connected: boolean) => void;

  // Saved connections
  savedConnections: SavedConnection[];
  setSavedConnections: (conns: SavedConnection[]) => void;
  addSavedConnection: (conn: SavedConnection) => void;
  removeSavedConnection: (id: string) => void;

  // Navigation
  currentPath: string;
  setCurrentPath: (path: string) => void;
  pathHistory: string[];
  pathHistoryIndex: number;
  navigateTo: (path: string) => void;
  navigateBack: () => void;
  navigateForward: () => void;

  // File list
  files: FileEntry[];
  setFiles: (files: FileEntry[]) => void;
  selectedFiles: Set<string>;
  setSelectedFiles: (files: Set<string>) => void;
  toggleSelection: (path: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Sorting
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Clipboard
  clipboard: ClipboardEntry[];
  setClipboard: (entries: ClipboardEntry[]) => void;
  clearClipboard: () => void;

  // Terminal / Logs
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  clearLogs: () => void;
  showTerminal: boolean;
  setShowTerminal: (show: boolean) => void;

  // Disk usage
  diskUsage: DiskUsage | null;
  setDiskUsage: (usage: DiskUsage | null) => void;

  // Search
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Editor
  openEditors: { path: string; content: string; isDirty: boolean }[];
  activeEditor: string | null;
  setOpenEditors: (editors: { path: string; content: string; isDirty: boolean }[]) => void;
  setActiveEditor: (path: string | null) => void;
  openEditor: (path: string, content: string) => void;
  closeEditor: (path: string) => void;
  markEditorDirty: (path: string, isDirty: boolean) => void;

  // Preview
  previewFile: FileEntry | null;
  setPreviewFile: (file: FileEntry | null) => void;

  // Settings
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showHiddenFiles: boolean;
  setShowHiddenFiles: (show: boolean) => void;

  // Favorites
  favorites: string[];
  setFavorites: (favs: string[]) => void;
  addFavorite: (path: string) => void;
  removeFavorite: (path: string) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (msg: string) => void;

  // Context menu
  contextMenu: { x: number; y: number; file: FileEntry | null } | null;
  setContextMenu: (menu: { x: number; y: number; file: FileEntry | null } | null) => void;

  // Chmod dialog
  showChmod: boolean;
  setShowChmod: (show: boolean) => void;
  chmodTarget: FileEntry | null;
  setChmodTarget: (file: FileEntry | null) => void;

  // Keyboard shortcuts
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean) => void;

  // Upload progress
  uploadProgress: { filename: string; progress: number; status: string }[];
  setUploadProgress: (progress: { filename: string; progress: number; status: string }[]) => void;
  addUploadProgress: (item: { filename: string; progress: number; status: string }) => void;
  removeUploadProgress: (filename: string) => void;

  // Drag state
  dragSource: string | null;
  setDragSource: (path: string | null) => void;
}

export const useFileManagerStore = create<FileManagerState>((set, get) => ({
  // Connection
  sessionId: null,
  serverInfo: null,
  isConnected: false,
  setSessionId: (id) => set({ sessionId: id }),
  setServerInfo: (info) => set({ serverInfo: info }),
  setIsConnected: (connected) => set({ isConnected: connected }),

  // Saved connections
  savedConnections: JSON.parse(localStorage.getItem("savedConnections") || "[]"),
  setSavedConnections: (conns) => {
    localStorage.setItem("savedConnections", JSON.stringify(conns));
    set({ savedConnections: conns });
  },
  addSavedConnection: (conn) => {
    const state = get();
    const exists = state.savedConnections.find((c) => c.host === conn.host && c.username === conn.username);
    if (!exists) {
      const newConns = [...state.savedConnections, conn];
      localStorage.setItem("savedConnections", JSON.stringify(newConns));
      set({ savedConnections: newConns });
    }
  },
  removeSavedConnection: (id) => {
    const state = get();
    const newConns = state.savedConnections.filter((c) => c.id !== id);
    localStorage.setItem("savedConnections", JSON.stringify(newConns));
    set({ savedConnections: newConns });
  },

  // Navigation
  currentPath: "/",
  setCurrentPath: (path) => set({ currentPath: path }),
  pathHistory: ["/"],
  pathHistoryIndex: 0,
  navigateTo: (path) => {
    const state = get();
    const newHistory = state.pathHistory.slice(0, state.pathHistoryIndex + 1);
    if (newHistory[newHistory.length - 1] !== path) newHistory.push(path);
    set({ currentPath: path, pathHistory: newHistory, pathHistoryIndex: newHistory.length - 1, selectedFiles: new Set() });
  },
  navigateBack: () => {
    const state = get();
    if (state.pathHistoryIndex > 0) {
      const newIndex = state.pathHistoryIndex - 1;
      set({ currentPath: state.pathHistory[newIndex], pathHistoryIndex: newIndex, selectedFiles: new Set() });
    }
  },
  navigateForward: () => {
    const state = get();
    if (state.pathHistoryIndex < state.pathHistory.length - 1) {
      const newIndex = state.pathHistoryIndex + 1;
      set({ currentPath: state.pathHistory[newIndex], pathHistoryIndex: newIndex, selectedFiles: new Set() });
    }
  },

  // File list
  files: [],
  setFiles: (files) => set({ files }),
  selectedFiles: new Set(),
  setSelectedFiles: (files) => set({ selectedFiles: files }),
  toggleSelection: (path) => {
    const state = get();
    const newSet = new Set(state.selectedFiles);
    if (newSet.has(path)) newSet.delete(path);
    else newSet.add(path);
    set({ selectedFiles: newSet });
  },
  selectAll: () => {
    const state = get();
    set({ selectedFiles: new Set(state.files.map((f) => f.path)) });
  },
  clearSelection: () => set({ selectedFiles: new Set() }),

  // Sorting
  sortConfig: { key: "name", direction: "asc" },
  setSortConfig: (config) => set({ sortConfig: config }),

  // View mode
  viewMode: { type: "list", iconSize: 16 },
  setViewMode: (mode) => set({ viewMode: mode }),

  // Clipboard
  clipboard: [],
  setClipboard: (entries) => set({ clipboard: entries }),
  clearClipboard: () => set({ clipboard: [] }),

  // Terminal / Logs
  logs: [],
  addLog: (entry) => {
    const state = get();
    const newLog: LogEntry = { ...entry, id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, timestamp: new Date() };
    set({ logs: [...state.logs.slice(-499), newLog] });
  },
  clearLogs: () => set({ logs: [] }),
  showTerminal: false,
  setShowTerminal: (show) => set({ showTerminal: show }),

  // Disk usage
  diskUsage: null,
  setDiskUsage: (usage) => set({ diskUsage: usage }),

  // Search
  showSearch: false,
  setShowSearch: (show) => set({ showSearch: show }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Editor
  openEditors: [],
  activeEditor: null,
  setOpenEditors: (editors) => set({ openEditors: editors }),
  setActiveEditor: (path) => set({ activeEditor: path }),
  openEditor: (path, content) => {
    const state = get();
    const existing = state.openEditors.find((e) => e.path === path);
    if (!existing) {
      set({ openEditors: [...state.openEditors, { path, content, isDirty: false }], activeEditor: path });
    } else {
      set({ activeEditor: path });
    }
  },
  closeEditor: (path) => {
    const state = get();
    const newEditors = state.openEditors.filter((e) => e.path !== path);
    const newActive = state.activeEditor === path ? (newEditors.length > 0 ? newEditors[newEditors.length - 1].path : null) : state.activeEditor;
    set({ openEditors: newEditors, activeEditor: newActive });
  },
  markEditorDirty: (path, isDirty) => {
    const state = get();
    set({ openEditors: state.openEditors.map((e) => e.path === path ? { ...e, isDirty } : e) });
  },

  // Preview
  previewFile: null,
  setPreviewFile: (file) => set({ previewFile: file }),

  // Settings
  showSettings: false,
  setShowSettings: (show) => set({ showSettings: show }),
  showHiddenFiles: false,
  setShowHiddenFiles: (show) => set({ showHiddenFiles: show }),

  // Favorites
  favorites: JSON.parse(localStorage.getItem("favorites") || "[]"),
  setFavorites: (favs) => {
    localStorage.setItem("favorites", JSON.stringify(favs));
    set({ favorites: favs });
  },
  addFavorite: (path) => {
    const state = get();
    if (!state.favorites.includes(path)) {
      const newFavs = [...state.favorites, path];
      localStorage.setItem("favorites", JSON.stringify(newFavs));
      set({ favorites: newFavs });
    }
  },
  removeFavorite: (path) => {
    const state = get();
    const newFavs = state.favorites.filter((f) => f !== path);
    localStorage.setItem("favorites", JSON.stringify(newFavs));
    set({ favorites: newFavs });
  },

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  loadingMessage: "",
  setLoadingMessage: (msg) => set({ loadingMessage: msg }),

  // Context menu
  contextMenu: null,
  setContextMenu: (menu) => set({ contextMenu: menu }),

  // Chmod dialog
  showChmod: false,
  setShowChmod: (show) => set({ showChmod: show }),
  chmodTarget: null,
  setChmodTarget: (file) => set({ chmodTarget: file }),

  // Keyboard shortcuts
  showShortcuts: false,
  setShowShortcuts: (show) => set({ showShortcuts: show }),

  // Upload progress
  uploadProgress: [],
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  addUploadProgress: (item) => {
    const state = get();
    set({ uploadProgress: [...state.uploadProgress.filter((p) => p.filename !== item.filename), item] });
  },
  removeUploadProgress: (filename) => {
    const state = get();
    set({ uploadProgress: state.uploadProgress.filter((p) => p.filename !== filename) });
  },

  // Drag state
  dragSource: null,
  setDragSource: (path) => set({ dragSource: path }),
}));
