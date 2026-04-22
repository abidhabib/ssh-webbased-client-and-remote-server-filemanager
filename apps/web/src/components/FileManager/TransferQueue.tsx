import { useFileManager } from '../../stores/fileManagerStore.tsx'

export function TransferQueue() {
  const { transferJobs, updateTransferJob, removeTransferJob, cancelTransferJob, clearCompletedJobs } = useFileManager()

  if (transferJobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p>No active transfers</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'in-progress': return 'text-blue-400'
      case 'paused': return 'text-yellow-400'
      case 'failed': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const formatSpeed = (speed?: number) => {
    if (!speed) return ''
    if (speed < 1024) return `${speed.toFixed(0)} B/s`
    if (speed < 1024 * 1024) return `${(speed / 1024).toFixed(1)} KB/s`
    return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`
  }

  const formatETA = (eta?: number) => {
    if (!eta) return ''
    if (eta < 60) return `${Math.round(eta)}s`
    if (eta < 3600) return `${Math.round(eta / 60)}m ${Math.round(eta % 60)}s`
    return `${Math.round(eta / 3600)}h ${Math.round((eta % 3600) / 60)}m`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Transfer Queue</h3>
        <button
          onClick={clearCompletedJobs}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Clear Completed
        </button>
      </div>

      {/* Transfer List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {transferJobs.map((job) => (
          <div
            key={job.id}
            className="bg-black/20 rounded p-3 border border-white/5"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status.toUpperCase()}
                </span>
                <span className="text-sm truncate">
                  {job.type === 'upload' ? '↑' : '↓'} {job.sourcePath.split('/').pop()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {job.status === 'in-progress' && (
                  <button
                    onClick={() => updateTransferJob(job.id, { status: 'paused' })}
                    className="p-1 hover:bg-white/10 rounded"
                    title="Pause"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                
                {job.status === 'paused' && (
                  <button
                    onClick={() => updateTransferJob(job.id, { status: 'in-progress' })}
                    className="p-1 hover:bg-white/10 rounded"
                    title="Resume"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                
                {(job.status === 'in-progress' || job.status === 'paused') && (
                  <button
                    onClick={() => cancelTransferJob(job.id)}
                    className="p-1 hover:bg-red-500/20 rounded"
                    title="Cancel"
                  >
                    <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                {(job.status === 'completed' || job.status === 'failed') && (
                  <button
                    onClick={() => removeTransferJob(job.id)}
                    className="p-1 hover:bg-white/10 rounded"
                    title="Remove"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar mb-2">
              <div
                className="progress-bar-fill"
                style={{ width: `${job.progress}%` }}
              />
            </div>

            {/* Details */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{job.progress.toFixed(1)}%</span>
              {job.speed && <span>{formatSpeed(job.speed)}</span>}
              {job.eta && <span>ETA: {formatETA(job.eta)}</span>}
            </div>

            {job.error && (
              <div className="mt-2 text-xs text-red-400">{job.error}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
