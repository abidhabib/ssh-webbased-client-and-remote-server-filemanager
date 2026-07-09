import { useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import {
  Copy,
  Scissors,
  ClipboardPaste,
  Trash2,
  Download,
  Lock,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function QuickActions() {
  const {
    selectedFiles,
    files,
    clearSelection,
    clipboard,
    setClipboard,
    clearClipboard,
    sessionId,
    currentPath,
    addLog,
    setChmodTarget,
    setShowChmod,
  } = useFileManagerStore();

  const utils = trpc.useUtils();
  const deleteMutation = trpc.file.delete.useMutation();
  const copyMutation = trpc.file.copy.useMutation();
  const renameMutation = trpc.file.rename.useMutation();

  const selectedEntries = files.filter((f) => selectedFiles.has(f.path));
  const hasSelection = selectedFiles.size > 0;

  const handleCopy = useCallback(() => {
    if (!hasSelection) return;
    const entries = selectedEntries.map((f) => ({ path: f.path, name: f.name, type: f.type as "file" | "directory" }));
    setClipboard(entries.map((e) => ({ ...e, operation: "copy" as const })));
    toast.success(`${entries.length} item(s) copied`);
    addLog({ message: `Copied ${entries.length} item(s)`, type: "info" });
  }, [hasSelection, selectedEntries, setClipboard, addLog]);

  const handleCut = useCallback(() => {
    if (!hasSelection) return;
    const entries = selectedEntries.map((f) => ({ path: f.path, name: f.name, type: f.type as "file" | "directory" }));
    setClipboard(entries.map((e) => ({ ...e, operation: "cut" as const })));
    toast.success(`${entries.length} item(s) cut`);
    addLog({ message: `Cut ${entries.length} item(s)`, type: "info" });
  }, [hasSelection, selectedEntries, setClipboard, addLog]);

  const handlePaste = useCallback(async () => {
    if (!sessionId || clipboard.length === 0) return;
    for (const entry of clipboard) {
      const targetPath = currentPath + "/" + entry.name;
      try {
        if (entry.operation === "copy") {
          await copyMutation.mutateAsync({ sessionId, sourcePath: entry.path, targetPath });
        } else {
          await renameMutation.mutateAsync({ sessionId, oldPath: entry.path, newPath: targetPath });
        }
      } catch (err: any) {
        toast.error(`Failed: ${err.message}`);
      }
    }
    clearClipboard();
    utils.file.list.invalidate();
    toast.success("Paste complete");
  }, [sessionId, clipboard, currentPath, copyMutation, renameMutation, clearClipboard, utils]);

  const handleDelete = useCallback(async () => {
    if (!hasSelection || !sessionId) return;
    const confirmed = window.confirm(`Delete ${selectedFiles.size} item(s)? This cannot be undone.`);
    if (!confirmed) return;
    for (const entry of selectedEntries) {
      try {
        await deleteMutation.mutateAsync({ sessionId, path: entry.path, isDirectory: entry.type === "directory" });
        addLog({ message: `Deleted: ${entry.name}`, type: "delete" });
      } catch (err: any) {
        toast.error(`Failed to delete ${entry.name}`);
      }
    }
    clearSelection();
    utils.file.list.invalidate();
  }, [hasSelection, sessionId, selectedFiles, selectedEntries, deleteMutation, clearSelection, addLog, utils]);

  const handleDownload = useCallback(() => {
    if (!sessionId || !hasSelection) return;
    for (const entry of selectedEntries) {
      if (entry.type === "file") {
        const url = `/api/download?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(entry.path)}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = entry.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addLog({ message: `Downloaded: ${entry.name}`, type: "download" });
      }
    }
    toast.success(`Downloading ${selectedEntries.filter((e) => e.type === "file").length} file(s)`);
  }, [sessionId, hasSelection, selectedEntries, addLog]);

  const handleChmod = useCallback(() => {
    if (selectedEntries.length === 1) {
      setChmodTarget(selectedEntries[0]);
      setShowChmod(true);
    }
  }, [selectedEntries, setChmodTarget, setShowChmod]);

  if (!hasSelection) return null;

  return (
    <div className="absolute top-[48px] left-1/2 -translate-x-1/2 z-30 bg-[#141414] border border-[#27272A] shadow-2xl slide-in-up">
      <div className="flex items-center h-[36px] px-1">
        <span className="text-[10px] font-mono-data text-[#52525B] px-2 border-r border-[#27272A]">
          {selectedFiles.size} selected
        </span>

        <button onClick={handleCopy} className="action-btn" title="Copy (Ctrl+C)">
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleCut} className="action-btn" title="Cut (Ctrl+X)">
          <Scissors className="w-3.5 h-3.5" />
        </button>
        {clipboard.length > 0 && (
          <button onClick={handlePaste} className="action-btn text-[#4ADE80]" title="Paste (Ctrl+V)">
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span className="text-[9px]">{clipboard.length}</span>
          </button>
        )}
        <div className="w-px h-4 bg-[#27272A] mx-1" />
        <button onClick={handleChmod} className="action-btn" title="Permissions">
          <Lock className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleDownload} className="action-btn text-[#60A5FA]" title="Download">
          <Download className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-[#27272A] mx-1" />
        <button onClick={handleDelete} className="action-btn text-[#F87171] hover:text-[#F87171] hover:bg-[#F87171]/10" title="Delete (Del)">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-[#27272A] mx-1" />
        <button onClick={clearSelection} className="action-btn" title="Clear selection">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
