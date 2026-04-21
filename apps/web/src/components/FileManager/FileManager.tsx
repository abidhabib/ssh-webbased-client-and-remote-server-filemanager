import { useState, useRef } from 'react'
import { useFileManager } from '../../stores/fileManagerStore'
import type { SFTPFile } from '@web-ssh/shared-types'

export function FileManager() {
  const { 
    remoteFiles, 
    remotePath, 
    setRemotePath, 
    selectedRemoteFiles,
    toggleRemoteFileSelection,
    showHiddenFiles,
    sortBy,
    sortDirection,
    toggleSortDirection,
    setSortBy,
  } = useFileManager()

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock data for demonstration
  const mockFiles: SFTPFile[] = [
    { name: 'index.html', path: '/var/www/html/index.html', type: 'file', size: 12400, modifiedAt: new Date('2024-03-12'), permissions: '-rw-r--r--', isHidden: false },
    { name: 'assets', path: '/var/www/html/assets', type: 'directory', size: 0, modifiedAt: new Date('2024-03-10'), permissions: 'drwxr-xr-x', isHidden: false },
    { name: '.env', path: '/var/www/html/.env', type: 'file', size: 1200, modifiedAt: new Date('2024-03-08'), permissions: '-rw-------', isHidden: true },
    { name: 'config.yml', path: '/var/www/html/config.yml', type: 'file', size: 4500, modifiedAt: new Date('2024-03-08'), permissions: '-rw-r--r--', isHidden: false },
    { name: 'package.json', path: '/var/www/html/package.json', type: 'file', size: 2300, modifiedAt: new Date('2024-03-11'), permissions: '-rw-r--r--', isHidden: false },
    { name: 'node_modules', path: '/var/www/html/node_modules', type: 'directory', size: 0, modifiedAt: new Date('2024-03-09'), permissions: 'drwxr-xr-x', isHidden: false },
  ]

  const files = showHiddenFiles ? mockFiles : mockFiles.filter(f => !f.isHidden)

  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'size':
        comparison = a.size - b.size
        break
      case 'date':
        comparison = a.modifiedAt.getTime() - b.modifiedAt.getTime()
        break
      case 'type':
        comparison = a.type.localeCompare(b.type)
        break
    }
    
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const handleFileClick = (file: SFTPFile) => {
    if (file.type === 'directory') {
      setRemotePath(file.path)
    } else {
      toggleRemoteFileSelection(file.path)
    }
  }

  const handleDoubleClick = (file: SFTPFile) => {
    if (file.type === 'directory') {
      setRemotePath(file.path)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '--'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getFileIcon = (file: SFTPFile) => {
    if (file.type === 'directory') {
      return (
        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
          <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
        </svg>
      )
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (['js', 'ts', 'jsx', 'tsx'].includes(ext || '')) {
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      )
    }
    
    return (
      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2">
        {/* Path Navigation */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={() => setRemotePath('/')}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Home"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          
          <button
            onClick={() => setRemotePath(remotePath.split('/').slice(0, -1).join('/') || '/')}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Parent directory"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 bg-black/30 rounded px-3 py-1.5 text-sm truncate">
            {remotePath}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {}}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            title={viewMode === 'list' ? 'Grid view' : 'List view'}
          >
            {viewMode === 'list' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              console.log('Uploading files:', files)
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload
          </button>
        </div>
      </div>

      {/* Column Headers (List View) */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-white/10 text-xs font-medium text-gray-400">
          <div className="col-span-6 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => { setSortBy('name'); toggleSortDirection(); }}>
            Name
            {sortBy === 'name' && (
              <svg className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="col-span-2 cursor-pointer hover:text-white" onClick={() => { setSortBy('size'); toggleSortDirection(); }}>Size</div>
          <div className="col-span-2 cursor-pointer hover:text-white" onClick={() => { setSortBy('date'); toggleSortDirection(); }}>Modified</div>
          <div className="col-span-2">Permissions</div>
        </div>
      )}

      {/* File List */}
      <div className={`flex-1 overflow-y-auto ${viewMode === 'grid' ? 'grid grid-cols-4 gap-2 p-2' : ''}`}>
        {sortedFiles.map((file) => (
          <div
            key={file.path}
            className={`${
              viewMode === 'list'
                ? 'grid grid-cols-12 gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer'
                : 'flex flex-col items-center p-3 rounded hover:bg-white/10 cursor-pointer'
            } ${selectedRemoteFiles.has(file.path) ? 'bg-blue-600/20' : ''}`}
            onClick={() => handleFileClick(file)}
            onDoubleClick={() => handleDoubleClick(file)}
          >
            {viewMode === 'list' ? (
              <>
                <div className="col-span-6 flex items-center gap-2 truncate">
                  {getFileIcon(file)}
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="col-span-2 text-sm text-gray-400">{formatSize(file.size)}</div>
                <div className="col-span-2 text-sm text-gray-400">{formatDate(file.modifiedAt)}</div>
                <div className="col-span-2 text-xs font-mono text-gray-500">{file.permissions}</div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 mb-2">{getFileIcon(file)}</div>
                <span className="text-sm text-center truncate w-full">{file.name}</span>
                <span className="text-xs text-gray-400">{formatSize(file.size)}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="px-3 py-2 border-t border-white/10 text-xs text-gray-400 flex items-center justify-between">
        <span>{sortedFiles.length} items</span>
        <span>{selectedRemoteFiles.size} selected</span>
      </div>
    </div>
  )
}
