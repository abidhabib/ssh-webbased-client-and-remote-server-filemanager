import { useCallback, useState, useRef, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import {
  File, Folder, FileCode, FileImage, FileText, FileAudio, FileVideo,
  FileArchive, FileJson, FileSpreadsheet, ChevronUp, ChevronDown,
  Loader2, HardDrive,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { FileEntry } from "@/types/file";

function getFileIcon(entry: FileEntry, size: number = 16) {
  if (entry.type === "directory") return <Folder className="text-[#60A5FA] flex-shrink-0" style={{ width: size, height: size }} />;
  const ext = entry.name.split(".").pop()?.toLowerCase() || "";
  const iconMap: Record<string, React.ReactNode> = {
    js: <FileCode className="text-[#FACC15] flex-shrink-0" style={{ width: size, height: size }} />,
    ts: <FileCode className="text-[#60A5FA] flex-shrink-0" style={{ width: size, height: size }} />,
    jsx: <FileCode className="text-[#60A5FA] flex-shrink-0" style={{ width: size, height: size }} />,
    tsx: <FileCode className="text-[#60A5FA] flex-shrink-0" style={{ width: size, height: size }} />,
    json: <FileJson className="text-[#FACC15] flex-shrink-0" style={{ width: size, height: size }} />,
    html: <FileCode className="text-[#F87171] flex-shrink-0" style={{ width: size, height: size }} />,
    css: <FileCode className="text-[#60A5FA] flex-shrink-0" style={{ width: size, height: size }} />,
    py: <FileCode className="text-[#4ADE80] flex-shrink-0" style={{ width: size, height: size }} />,
    java: <FileCode className="text-[#F87171] flex-shrink-0" style={{ width: size, height: size }} />,
    php: <FileCode className="text-[#A78BFA] flex-shrink-0" style={{ width: size, height: size }} />,
    go: <FileCode className="text-[#60A5FA] flex-shrink-0" style={{ width: size, height: size }} />,
    rs: <FileCode className="text-[#F87171] flex-shrink-0" style={{ width: size, height: size }} />,
    png: <FileImage className="text-[#A78BFA] flex-shrink-0" style={{ width: size, height: size }} />,
    jpg: <FileImage className="text-[#A78BFA] flex-shrink-0" style={{ width: size, height: size }} />,
    jpeg: <FileImage className="text-[#A78BFA] flex-shrink-0" style={{ width: size, height: size }} />,
    gif: <FileImage className="text-[#A78BFA] flex-shrink-0" style={{ width: size, height: size }} />,
    svg: <FileImage className="text-[#A78BFA] flex-shrink-0" style={{ width: size, height: size }} />,
    webp: <FileImage className="text-[#A78BFA] flex-shrink-0" style={{ width: size, height: size }} />,
    mp4: <FileVideo className="text-[#F87171] flex-shrink-0" style={{ width: size, height: size }} />,
    webm: <FileVideo className="text-[#F87171] flex-shrink-0" style={{ width: size, height: size }} />,
    mp3: <FileAudio className="text-[#FACC15] flex-shrink-0" style={{ width: size, height: size }} />,
    wav: <FileAudio className="text-[#FACC15] flex-shrink-0" style={{ width: size, height: size }} />,
    ogg: <FileAudio className="text-[#FACC15] flex-shrink-0" style={{ width: size, height: size }} />,
    zip: <FileArchive className="text-[#FACC15] flex-shrink-0" style={{ width: size, height: size }} />,
    tar: <FileArchive className="text-[#FACC15] flex-shrink-0" style={{ width: size, height: size }} />,
    gz: <FileArchive className="text-[#FACC15] flex-shrink-0" style={{ width: size, height: size }} />,
    csv: <FileSpreadsheet className="text-[#4ADE80] flex-shrink-0" style={{ width: size, height: size }} />,
    xlsx: <FileSpreadsheet className="text-[#4ADE80] flex-shrink-0" style={{ width: size, height: size }} />,
    md: <FileText className="text-[#A1A1AA] flex-shrink-0" style={{ width: size, height: size }} />,
    txt: <FileText className="text-[#A1A1AA] flex-shrink-0" style={{ width: size, height: size }} />,
    log: <FileText className="text-[#A1A1AA] flex-shrink-0" style={{ width: size, height: size }} />,
    xml: <FileCode className="text-[#FACC15] flex-shrink-0" style={{ width: size, height: size }} />,
    sql: <FileCode className="text-[#60A5FA] flex-shrink-0" style={{ width: size, height: size }} />,
    yml: <FileCode className="text-[#F87171] flex-shrink-0" style={{ width: size, height: size }} />,
    yaml: <FileCode className="text-[#F87171] flex-shrink-0" style={{ width: size, height: size }} />,
    sh: <FileCode className="text-[#4ADE80] flex-shrink-0" style={{ width: size, height: size }} />,
    bash: <FileCode className="text-[#4ADE80] flex-shrink-0" style={{ width: size, height: size }} />,
    env: <FileText className="text-[#FACC15] flex-shrink-0" style={{ width: size, height: size }} />,
  };
  return iconMap[ext] || <File className="text-[#52525B] flex-shrink-0" style={{ width: size, height: size }} />;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function formatPermissions(perm: string): string {
  const num = parseInt(perm, 8);
  const r = (n: number) => (n & 4 ? "r" : "-");
  const w = (n: number) => (n & 2 ? "w" : "-");
  const x = (n: number) => (n & 1 ? "x" : "-");
  return `${r(num >> 6)}${w(num >> 6)}${x(num >> 6)}${r((num >> 3) & 7)}${w((num >> 3) & 7)}${x((num >> 3) & 7)}${r(num & 7)}${w(num & 7)}${x(num & 7)}`;
}

// Skeleton loader
function FileRowSkeleton() {
  return (
    <div className="flex items-center h-[40px] border-b border-[#27272A]/30 animate-pulse">
      <div className="w-[40px] flex-shrink-0 px-3"><div className="w-3.5 h-3.5 bg-[#1a1a1a] rounded" /></div>
      <div className="flex-1 flex items-center gap-2 px-2"><div className="w-4 h-4 bg-[#1a1a1a] rounded" /><div className="w-32 h-3 bg-[#1a1a1a] rounded" /></div>
      <div className="w-[100px] px-2"><div className="w-16 h-3 bg-[#1a1a1a] rounded ml-auto" /></div>
      <div className="w-[140px] px-2"><div className="w-20 h-3 bg-[#1a1a1a] rounded" /></div>
      <div className="w-[70px] px-2"><div className="w-10 h-3 bg-[#1a1a1a] rounded" /></div>
      <div className="w-[70px] px-2"><div className="w-12 h-3 bg-[#1a1a1a] rounded" /></div>
    </div>
  );
}

interface FileListProps {
  onContextMenu: (e: React.MouseEvent, file: FileEntry) => void;
}

export default function FileList({ onContextMenu }: FileListProps) {
  const {
    files, selectedFiles, toggleSelection, selectAll, clearSelection,
    sortConfig, setSortConfig, viewMode, showHiddenFiles, navigateTo,
    sessionId, currentPath, setPreviewFile, openEditor, isLoading,
    setDragSource,
  } = useFileManagerStore();

  const [lastSelected, setLastSelected] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverDir, setDragOverDir] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const renameMutation = trpc.file.rename.useMutation();

  const visibleFiles = useMemo(() =>
    showHiddenFiles ? files : files.filter((f) => !f.name.startsWith(".")),
    [files, showHiddenFiles]
  );

  const sortedFiles = useMemo(() => {
    const sorted = [...visibleFiles].sort((a, b) => {
      if (a.type === "directory" && b.type !== "directory") return -1;
      if (a.type !== "directory" && b.type === "directory") return 1;
      const { key, direction } = sortConfig;
      let cmp = 0;
      switch (key) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "size": cmp = a.size - b.size; break;
        case "modified": cmp = new Date(a.modified).getTime() - new Date(b.modified).getTime(); break;
        case "type": cmp = a.type.localeCompare(b.type); break;
      }
      return direction === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [visibleFiles, sortConfig]);

  const handleSort = useCallback((key: "name" | "size" | "modified" | "type") => {
    setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc" });
  }, [sortConfig, setSortConfig]);

  const handleClick = useCallback((e: React.MouseEvent, file: FileEntry) => {
    if (e.ctrlKey || e.metaKey) { toggleSelection(file.path); setLastSelected(file.path); }
    else if (e.shiftKey && lastSelected) {
      const idx1 = sortedFiles.findIndex((f) => f.path === lastSelected);
      const idx2 = sortedFiles.findIndex((f) => f.path === file.path);
      const [start, end] = idx1 < idx2 ? [idx1, idx2] : [idx2, idx1];
      const newSet = new Set(selectedFiles);
      for (let i = start; i <= end; i++) newSet.add(sortedFiles[i].path);
      useFileManagerStore.getState().setSelectedFiles(newSet);
      setLastSelected(file.path);
    } else {
      clearSelection();
      toggleSelection(file.path);
      setLastSelected(file.path);
    }
  }, [toggleSelection, lastSelected, sortedFiles, selectedFiles, clearSelection]);

  const handleDoubleClick = useCallback(async (file: FileEntry) => {
    if (file.type === "directory") { navigateTo(file.path); return; }
    const textExts = ["txt", "md", "js", "ts", "jsx", "tsx", "json", "html", "css", "py", "java", "php", "go", "rs", "sql", "xml", "yml", "yaml", "sh", "bash", "env", "conf", "ini", "cfg", "dockerfile", "nginx", "log", "csv"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (textExts.includes(ext) || file.size < 1024 * 1024) {
      try {
        const result = await utils.client.file.readFile.query({ sessionId: sessionId || "", path: file.path });
        if (result.success) openEditor(file.path, result.content);
        else setPreviewFile(file);
      } catch { setPreviewFile(file); }
    } else { setPreviewFile(file); }
  }, [navigateTo, sessionId, utils.client.file.readFile, openEditor, setPreviewFile]);

  // Drag & drop for file upload
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); }, []);
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;
    for (const file of droppedFiles) {
      const formData = new FormData(); formData.append("file", file);
      try {
        const res = await fetch(`/api/upload?sessionId=${sessionId}&path=${encodeURIComponent(currentPath)}`, { method: "POST", body: formData });
        if (res.ok) toast.success(`Uploaded: ${file.name}`);
        else toast.error(`Failed: ${file.name}`);
      } catch (err: any) { toast.error(`Upload error: ${err.message}`); }
    }
    utils.file.list.invalidate();
  }, [sessionId, currentPath, utils]);

  // Drag & drop for moving files between directories
  const handleDirDragOver = useCallback((e: React.DragEvent, dirPath: string) => {
    e.preventDefault(); e.stopPropagation();
    setDragOverDir(dirPath);
  }, []);
  const handleDirDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOverDir(null);
  }, []);
  const handleDirDrop = useCallback(async (e: React.DragEvent, targetDir: string) => {
    e.preventDefault(); e.stopPropagation();
    setDragOverDir(null);
    const draggedPath = e.dataTransfer.getData("text/plain");
    if (!draggedPath || draggedPath === targetDir) return;
    const fileName = draggedPath.split("/").pop() || "";
    const newPath = targetDir + "/" + fileName;
    try {
      await renameMutation.mutateAsync({ sessionId: sessionId || "", oldPath: draggedPath, newPath });
      toast.success(`Moved to ${targetDir.split("/").pop()}`);
      useFileManagerStore.getState().addLog({ message: `Moved ${fileName}`, type: "info" });
      utils.file.list.invalidate();
    } catch (err: any) { toast.error("Move failed: " + err.message); }
  }, [sessionId, renameMutation, utils]);

  const handleRowDragStart = useCallback((e: React.DragEvent, file: FileEntry) => {
    e.dataTransfer.setData("text/plain", file.path);
    setDragSource(file.path);
  }, [setDragSource]);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === "asc" ? <ChevronUp className="w-3 h-3 inline text-[#4ADE80]" /> : <ChevronDown className="w-3 h-3 inline text-[#4ADE80]" />;
  };

  // Loading skeleton
  if (isLoading && files.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="flex items-center h-[36px] bg-[#0A0A0A] border-b border-[#27272A] text-[10px] font-mono-data text-[#52525B] uppercase tracking-wider flex-shrink-0">
          <div className="w-[40px] px-3">&nbsp;</div>
          <div className="flex-1 px-2">Name</div>
          <div className="w-[100px] text-right px-2">Size</div>
          <div className="w-[140px] px-2">Modified</div>
          <div className="w-[70px] px-2">Owner</div>
          <div className="w-[70px] px-2">Permissions</div>
        </div>
        <ScrollArea className="flex-1">
          {Array.from({ length: 15 }).map((_, i) => <FileRowSkeleton key={i} />)}
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full ${dragOver ? "drag-over" : ""}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {/* Table Header */}
      {viewMode.type === "list" && (
        <div className="flex items-center h-[36px] bg-[#0A0A0A] border-b border-[#27272A] text-[10px] font-mono-data text-[#52525B] uppercase tracking-wider flex-shrink-0 select-none">
          <div className="w-[40px] flex-shrink-0 px-3">
            <input type="checkbox" checked={selectedFiles.size === sortedFiles.length && sortedFiles.length > 0} onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
              className="w-3.5 h-3.5 accent-[#60A5FA] cursor-pointer" />
          </div>
          <button onClick={() => handleSort("name")} className="flex-1 text-left px-2 hover:text-[#A1A1AA] transition-colors flex items-center gap-1">
            Name <SortIcon column="name" />
          </button>
          <button onClick={() => handleSort("size")} className="w-[100px] text-right px-2 hover:text-[#A1A1AA] transition-colors flex items-center justify-end gap-1">
            Size <SortIcon column="size" />
          </button>
          <button onClick={() => handleSort("modified")} className="w-[140px] text-left px-2 hover:text-[#A1A1AA] transition-colors flex items-center gap-1">
            Modified <SortIcon column="modified" />
          </button>
          <div className="w-[70px] text-left px-2">Owner</div>
          <div className="w-[70px] text-left px-2">Permissions</div>
        </div>
      )}

      {/* File List */}
      <ScrollArea className="flex-1">
        {viewMode.type === "list" ? (
          <div>
            {sortedFiles.map((file) => {
              const isSelected = selectedFiles.has(file.path);
              const isDragTarget = dragOverDir === file.path && file.type === "directory";
              return (
                <div
                  key={file.path}
                  onClick={(e) => handleClick(e, file)}
                  onDoubleClick={() => handleDoubleClick(file)}
                  onContextMenu={(e) => onContextMenu(e, file)}
                  draggable
                  onDragStart={(e) => handleRowDragStart(e, file)}
                  onDragOver={(e) => file.type === "directory" ? handleDirDragOver(e, file.path) : undefined}
                  onDragLeave={file.type === "directory" ? handleDirDragLeave : undefined}
                  onDrop={(e) => file.type === "directory" ? handleDirDrop(e, file.path) : undefined}
                  className={`flex items-center h-[40px] border-b border-[#27272A]/30 cursor-pointer select-none transition-all ${
                    isSelected ? "row-active" : "row-hover"
                  } ${isDragTarget ? "bg-[#4ADE80]/10 border-[#4ADE80]/30" : ""}`}
                >
                  <div className="w-[40px] flex-shrink-0 px-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(file.path)} className="w-3.5 h-3.5 accent-[#60A5FA] cursor-pointer" />
                  </div>
                  <div className="flex-1 flex items-center gap-2.5 px-2 min-w-0">
                    {getFileIcon(file)}
                    <span className="text-xs font-mono-data text-white truncate">{file.name}</span>
                    {file.type === "directory" && <span className="text-[9px] text-[#52525B] font-mono-data">({sortedFiles.filter((f) => f.path.startsWith(file.path + "/")).length} items)</span>}
                  </div>
                  <div className="w-[100px] text-right px-2 text-xs font-mono-data text-[#A1A1AA]">{file.type === "directory" ? "--" : formatSize(file.size)}</div>
                  <div className="w-[140px] px-2 text-[11px] font-mono-data text-[#52525B]">{formatDate(file.modified)}</div>
                  <div className="w-[70px] px-2 text-[11px] font-mono-data text-[#52525B] truncate">{file.owner}</div>
                  <div className="w-[70px] px-2 text-[10px] font-mono-data text-[#52525B]">{formatPermissions(file.permissions)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1 p-3">
            {sortedFiles.map((file) => {
              const isSelected = selectedFiles.has(file.path);
              return (
                <div key={file.path} onClick={(e) => handleClick(e, file)} onDoubleClick={() => handleDoubleClick(file)} onContextMenu={(e) => onContextMenu(e, file)}
                  className={`flex flex-col items-center p-3 cursor-pointer select-none transition-all border ${isSelected ? "bg-[#141414] border-[#60A5FA]/30" : "border-transparent hover:border-[#27272A]"}`}>
                  <div className="mb-2">{getFileIcon(file, viewMode.iconSize)}</div>
                  <span className="text-[10px] font-mono-data text-white text-center truncate w-full">{file.name}</span>
                  <span className="text-[9px] font-mono-data text-[#52525B]">{file.type === "directory" ? "--" : formatSize(file.size)}</span>
                </div>
              );
            })}
          </div>
        )}

        {sortedFiles.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <HardDrive className="w-10 h-10 text-[#27272A]" />
            <span className="text-sm text-[#52525B] font-mono-data">This folder is empty</span>
            <span className="text-xs text-[#3F3F46] font-mono-data">Drop files here to upload</span>
          </div>
        )}
      </ScrollArea>

      {/* Status Bar */}
      <div className="h-[28px] bg-[#0A0A0A] border-t border-[#27272A] flex items-center px-3 gap-4 text-[10px] font-mono-data text-[#52525B] flex-shrink-0">
        <span>{sortedFiles.length} items</span>
        {selectedFiles.size > 0 && <span className="text-[#60A5FA]">{selectedFiles.size} selected</span>}
        <span className="truncate flex-1 text-[#3F3F46]">{currentPath}</span>
        {isLoading && <span className="text-[#FACC15] animate-pulse flex items-center gap-1"><Loader2 className="w-3 h-3 spinner" /> Loading...</span>}
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" />
    </div>
  );
}
