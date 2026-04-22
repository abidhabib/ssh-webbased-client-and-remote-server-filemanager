import { create } from 'zustand'
import type { SFTPFile, TransferJob } from '@web-ssh/shared-types'

interface FileManagerState {
  // Remote file system
  remoteFiles: SFTPFile[]
  remotePath: string
  isLoadingRemote: boolean
  
  // Local file system (browser)
  localFiles: File[]
  localPath: string
  isLoadingLocal: boolean
  
  // Selection
  selectedRemoteFiles: Set<string>
  selectedLocalFiles: Set<number>
  
  // Transfer queue
  transferJobs: TransferJob[]
  isTransferPanelOpen: boolean
  
  // Settings
  showHiddenFiles: boolean
  sortBy: 'name' | 'size' | 'date' | 'type'
  sortDirection: 'asc' | 'desc'
  
  // Actions
  setRemoteFiles: (files: SFTPFile[]) => void
  setRemotePath: (path: string) => void
  setIsLoadingRemote: (loading: boolean) => void
  refreshRemoteFiles: () => Promise<void>
  
  setLocalFiles: (files: File[]) => void
  setLocalPath: (path: string) => void
  setIsLoadingLocal: (loading: boolean) => void
  
  toggleRemoteFileSelection: (filePath: string) => void
  clearRemoteSelection: () => void
  toggleLocalFileSelection: (fileIndex: number) => void
  clearLocalSelection: () => void
  
  addTransferJob: (job: TransferJob) => void
  updateTransferJob: (jobId: string, updates: Partial<TransferJob>) => void
  removeTransferJob: (jobId: string) => void
  cancelTransferJob: (jobId: string) => void
  clearCompletedJobs: () => void
  
  setTransferPanelOpen: (open: boolean) => void
  
  setShowHiddenFiles: (show: boolean) => void
  setSortBy: (sortBy: 'name' | 'size' | 'date' | 'type') => void
  toggleSortDirection: () => void
  
  // File operations
  deleteRemoteFiles: (paths: string[]) => Promise<void>
  createRemoteDirectory: (name: string) => Promise<void>
  renameRemoteFile: (oldPath: string, newPath: string) => Promise<void>
  downloadFiles: () => Promise<void>
  uploadFiles: (files: File[]) => Promise<void>
}

export const useFileManagerStore = create<FileManagerState>((set, get) => ({
  remoteFiles: [],
  remotePath: '/',
  isLoadingRemote: false,
  
  localFiles: [],
  localPath: '',
  isLoadingLocal: false,
  
  selectedRemoteFiles: new Set(),
  selectedLocalFiles: new Set(),
  
  transferJobs: [],
  isTransferPanelOpen: true,
  
  showHiddenFiles: false,
  sortBy: 'name',
  sortDirection: 'asc',

  setRemoteFiles: (files) => {
    set({ remoteFiles: files })
  },

  setRemotePath: (path) => {
    set({ remotePath: path })
  },

  setIsLoadingRemote: (loading) => {
    set({ isLoadingRemote: loading })
  },

  refreshRemoteFiles: async () => {
    // Implementation will call WebSocket to fetch remote files
    console.log('Refreshing remote files:', get().remotePath)
  },

  setLocalFiles: (files) => {
    set({ localFiles: files })
  },

  setLocalPath: (path) => {
    set({ localPath: path })
  },

  setIsLoadingLocal: (loading) => {
    set({ isLoadingLocal: loading })
  },

  toggleRemoteFileSelection: (filePath) => {
    const selected = new Set(get().selectedRemoteFiles)
    if (selected.has(filePath)) {
      selected.delete(filePath)
    } else {
      selected.add(filePath)
    }
    set({ selectedRemoteFiles: selected })
  },

  clearRemoteSelection: () => {
    set({ selectedRemoteFiles: new Set() })
  },

  toggleLocalFileSelection: (fileIndex) => {
    const selected = new Set(get().selectedLocalFiles)
    if (selected.has(fileIndex)) {
      selected.delete(fileIndex)
    } else {
      selected.add(fileIndex)
    }
    set({ selectedLocalFiles: selected })
  },

  clearLocalSelection: () => {
    set({ selectedLocalFiles: new Set() })
  },

  addTransferJob: (job) => {
    set({ transferJobs: [...get().transferJobs, job] })
  },

  updateTransferJob: (jobId, updates) => {
    set({
      transferJobs: get().transferJobs.map(job =>
        job.id === jobId ? { ...job, ...updates } : job
      ),
    })
  },

  removeTransferJob: (jobId) => {
    set({
      transferJobs: get().transferJobs.filter(job => job.id !== jobId),
    })
  },

  cancelTransferJob: (jobId) => {
    get().updateTransferJob(jobId, { status: 'failed', error: 'Cancelled by user' })
  },

  clearCompletedJobs: () => {
    set({
      transferJobs: get().transferJobs.filter(
        job => job.status !== 'completed' && job.status !== 'failed'
      ),
    })
  },

  setTransferPanelOpen: (open) => {
    set({ isTransferPanelOpen: open })
  },

  setShowHiddenFiles: (show) => {
    set({ showHiddenFiles: show })
  },

  setSortBy: (sortBy) => {
    set({ sortBy })
  },

  toggleSortDirection: () => {
    set({ 
      sortDirection: get().sortDirection === 'asc' ? 'desc' : 'asc' 
    })
  },

  deleteRemoteFiles: async (paths) => {
    console.log('Deleting remote files:', paths)
    // Implementation will call WebSocket to delete files
  },

  createRemoteDirectory: async (name) => {
    console.log('Creating remote directory:', name)
    // Implementation will call WebSocket to create directory
  },

  renameRemoteFile: async (oldPath, newPath) => {
    console.log('Renaming remote file:', oldPath, '->', newPath)
    // Implementation will call WebSocket to rename file
  },

  downloadFiles: async () => {
    console.log('Downloading selected files')
    // Implementation will call WebSocket to download files
  },

  uploadFiles: async (files) => {
    console.log('Uploading files:', files)
    // Implementation will call WebSocket to upload files
  },
}))

// Provider component for context
import { createContext, useContext, ReactNode } from 'react'

const FileManagerContext = createContext<typeof useFileManagerStore | null>(null)

export function FileManagerProvider({ children }: { children: ReactNode }) {
  return (
    <FileManagerContext.Provider value={useFileManagerStore}>
      {children}
    </FileManagerContext.Provider>
  )
}

export function useFileManager() {
  const context = useContext(FileManagerContext)
  if (!context) {
    throw new Error('useFileManager must be used within a FileManagerProvider')
  }
  return context
}
