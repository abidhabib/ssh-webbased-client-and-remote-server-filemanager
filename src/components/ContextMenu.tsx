import { useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import {
  FileText,
  Edit3,
  Copy,
  Scissors,
  ClipboardPaste,
  Trash2,
  Download,
  Star,
  ExternalLink,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import type { FileEntry } from "@/types/file";

interface ContextMenuProps {
  x: number;
  y: number;
  file: FileEntry | null;
}

export default function ContextMenu({ x, y, file }: ContextMenuProps) {
  const {
    sessionId,
    currentPath,
    clipboard,
    setClipboard,
    clearClipboard,
    addFavorite,
    removeFavorite,
    favorites,
    addLog,
    navigateTo,
    setPreviewFile,
    openEditor,
    selectedFiles,
    setChmodTarget,
    setShowChmod,
  } = useFileManagerStore();

  const utils = trpc.useUtils();

  const deleteMutation = trpc.file.delete.useMutation({
    onSuccess: () => {
      utils.file.list.invalidate();
      toast.success("Deleted successfully");
    },
  });
  const renameMutation = trpc.file.rename.useMutation({
    onSuccess: () => {
      utils.file.list.invalidate();
      toast.success("Renamed successfully");
    },
  });
  const copyMutation = trpc.file.copy.useMutation({
    onSuccess: () => {
      utils.file.list.invalidate();
      toast.success("Copied successfully");
    },
  });
  const duplicateMutation = trpc.file.duplicate.useMutation({
    onSuccess: () => {
      utils.file.list.invalidate();
      toast.success("Duplicated successfully");
    },
  });

  const handleOpen = useCallback(async () => {
    if (!file || !sessionId) return;

    if (file.type === "directory") {
      navigateTo(file.path);
    } else {
      // Try to open as text
      const textExts = [
        "txt", "md", "js", "ts", "jsx", "tsx", "json", "html", "css", "py", "java",
        "php", "go", "rs", "sql", "xml", "yml", "yaml", "sh", "bash", "env", "conf",
        "ini", "cfg", "dockerfile", "nginx", "log",
      ];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      if (textExts.includes(ext) || file.size < 1024 * 1024) {
        try {
          const result = await utils.client.file.readFile.query({
            sessionId,
            path: file.path,
          });
          if (result.success) {
            openEditor(file.path, result.content);
          } else {
            setPreviewFile(file);
          }
        } catch {
          setPreviewFile(file);
        }
      } else {
        setPreviewFile(file);
      }
    }
  }, [file, sessionId, navigateTo, utils.client.file.readFile, openEditor, setPreviewFile]);

  const handleCopy = useCallback(() => {
    if (!file) return;
    const entries = Array.from(selectedFiles).map((path) => {
      const f = useFileManagerStore.getState().files.find((file) => file.path === path);
      return f ? { path: f.path, name: f.name, type: f.type as "file" | "directory" } : null;
    }).filter(Boolean) as { path: string; name: string; type: "file" | "directory" }[];

    if (entries.length === 0 && file) {
      entries.push({ path: file.path, name: file.name, type: file.type as "file" | "directory" });
    }

    setClipboard(
      entries.map((e) => ({ ...e, operation: "copy" as const }))
    );
    toast.success(`${entries.length} item(s) copied to clipboard`);
    addLog({ message: `Copied ${entries.length} item(s) to clipboard`, type: "info" });
  }, [file, selectedFiles, setClipboard, addLog]);

  const handleCut = useCallback(() => {
    if (!file) return;
    const entries = Array.from(selectedFiles).map((path) => {
      const f = useFileManagerStore.getState().files.find((file) => file.path === path);
      return f ? { path: f.path, name: f.name, type: f.type as "file" | "directory" } : null;
    }).filter(Boolean) as { path: string; name: string; type: "file" | "directory" }[];

    if (entries.length === 0 && file) {
      entries.push({ path: file.path, name: file.name, type: file.type as "file" | "directory" });
    }

    setClipboard(
      entries.map((e) => ({ ...e, operation: "cut" as const }))
    );
    toast.success(`${entries.length} item(s) cut to clipboard`);
    addLog({ message: `Cut ${entries.length} item(s) to clipboard`, type: "info" });
  }, [file, selectedFiles, setClipboard, addLog]);

  const handlePaste = useCallback(async () => {
    if (!sessionId || clipboard.length === 0) return;

    for (const entry of clipboard) {
      const targetPath = currentPath + "/" + entry.name;
      if (entry.operation === "copy") {
        try {
          await copyMutation.mutateAsync({
            sessionId,
            sourcePath: entry.path,
            targetPath,
          });
          addLog({ message: `Copied ${entry.name} to ${currentPath}`, type: "info" });
        } catch (err: any) {
          toast.error(`Failed to copy ${entry.name}: ${err.message}`);
        }
      } else {
        // Cut = move
        try {
          await renameMutation.mutateAsync({
            sessionId,
            oldPath: entry.path,
            newPath: targetPath,
          });
          addLog({ message: `Moved ${entry.name} to ${currentPath}`, type: "info" });
        } catch (err: any) {
          toast.error(`Failed to move ${entry.name}: ${err.message}`);
        }
      }
    }

    clearClipboard();
    utils.file.list.invalidate();
  }, [sessionId, clipboard, currentPath, copyMutation, renameMutation, clearClipboard, addLog, utils]);

  const handleDelete = useCallback(async () => {
    if (!file || !sessionId) return;

    const entries =
      selectedFiles.size > 0
        ? Array.from(selectedFiles).map((path) => ({
            path,
            isDir: useFileManagerStore.getState().files.find((f) => f.path === path)?.type === "directory",
          }))
        : [{ path: file.path, isDir: file.type === "directory" }];

    const confirmed = window.confirm(
      `Are you sure you want to delete ${entries.length} item(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    for (const entry of entries) {
      try {
        await deleteMutation.mutateAsync({
          sessionId,
          path: entry.path,
          isDirectory: entry.isDir,
        });
        addLog({ message: `Deleted: ${entry.path}`, type: "delete" });
      } catch (err: any) {
        toast.error(`Failed to delete ${entry.path}: ${err.message}`);
        addLog({ message: `Failed to delete: ${entry.path} - ${err.message}`, type: "error" });
      }
    }

    utils.file.list.invalidate();
  }, [file, sessionId, selectedFiles, deleteMutation, addLog, utils]);

  const handleDuplicate = useCallback(async () => {
    if (!file || !sessionId) return;
    try {
      await duplicateMutation.mutateAsync({ sessionId, path: file.path });
      addLog({ message: `Duplicated: ${file.path}`, type: "info" });
    } catch (err: any) {
      toast.error(`Failed to duplicate: ${err.message}`);
    }
  }, [file, sessionId, duplicateMutation, addLog]);

  const handleRename = useCallback(() => {
    if (!file) return;
    const newName = window.prompt("Enter new name:", file.name);
    if (!newName || newName === file.name) return;

    const parentPath = file.path.substring(0, file.path.lastIndexOf("/"));
    const newPath = parentPath + "/" + newName;

    renameMutation.mutate(
      { sessionId: sessionId || "", oldPath: file.path, newPath },
      {
        onSuccess: () => {
          addLog({ message: `Renamed: ${file.name} → ${newName}`, type: "rename" });
          utils.file.list.invalidate();
        },
      }
    );
  }, [file, sessionId, renameMutation, addLog, utils]);

  const handleDownload = useCallback(() => {
    if (!file || !sessionId) return;
    const entries =
      selectedFiles.size > 0
        ? Array.from(selectedFiles).map((path) => ({
            path,
            name: useFileManagerStore.getState().files.find((f) => f.path === path)?.name || "file",
          }))
        : [{ path: file.path, name: file.name }];

    for (const entry of entries) {
      const url = `/api/download?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(
        entry.path
      )}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = entry.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      addLog({ message: `Downloaded: ${entry.path}`, type: "download" });
    }

    toast.success(`Downloading ${entries.length} file(s)`);
  }, [file, sessionId, selectedFiles, addLog]);

  const handleChmod = useCallback(() => {
    if (!file) return;
    setChmodTarget(file);
    setShowChmod(true);
  }, [file, setChmodTarget, setShowChmod]);

  const handleFavorite = useCallback(() => {
    if (!file || file.type !== "directory") return;
    if (favorites.includes(file.path)) {
      removeFavorite(file.path);
      toast.success("Removed from favorites");
    } else {
      addFavorite(file.path);
      toast.success("Added to favorites");
    }
  }, [file, favorites, addFavorite, removeFavorite]);

  // Calculate position to keep menu in viewport
  const menuStyle: React.CSSProperties = {
    position: "fixed",
    left: Math.min(x, window.innerWidth - 220),
    top: Math.min(y, window.innerHeight - 400),
    zIndex: 1000,
  };

  if (!file) return null;

  return (
    <div style={menuStyle} className="context-menu py-1 w-[200px]">
      {/* Open */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white font-mono-data hover:bg-[#27272A] transition-colors text-left"
      >
        <ExternalLink className="w-3.5 h-3.5 text-[#60A5FA]" />
        Open
      </button>

      {/* Edit (files only) */}
      {file.type === "file" && (
        <button
          onClick={handleOpen}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white font-mono-data hover:bg-[#27272A] transition-colors text-left"
        >
          <FileText className="w-3.5 h-3.5 text-[#4ADE80]" />
          Edit
        </button>
      )}

      <div className="my-1 border-t border-[#27272A]" />

      {/* Copy */}
      <button
        onClick={handleCopy}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white font-mono-data hover:bg-[#27272A] transition-colors text-left"
      >
        <Copy className="w-3.5 h-3.5 text-[#A1A1AA]" />
        Copy
      </button>

      {/* Cut */}
      <button
        onClick={handleCut}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white font-mono-data hover:bg-[#27272A] transition-colors text-left"
      >
        <Scissors className="w-3.5 h-3.5 text-[#A1A1AA]" />
        Cut
      </button>

      {/* Paste */}
      {clipboard.length > 0 && (
        <button
          onClick={handlePaste}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white font-mono-data hover:bg-[#27272A] transition-colors text-left"
        >
          <ClipboardPaste className="w-3.5 h-3.5 text-[#A1A1AA]" />
          Paste ({clipboard.length})
        </button>
      )}

      <div className="my-1 border-t border-[#27272A]" />

      {/* Chmod */}
      <button
        onClick={handleChmod}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white font-mono-data hover:bg-[#27272A] transition-colors text-left"
      >
        <Lock className="w-3.5 h-3.5 text-[#FACC15]" />
        Permissions
      </button>

      {/* Rename */}
      <button
        onClick={handleRename}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white font-mono-data hover:bg-[#27272A] transition-colors text-left"
      >
        <Edit3 className="w-3.5 h-3.5 text-[#A1A1AA]" />
        Rename
      </button>

      {/* Duplicate */}
      {file.type === "file" && (
        <button
          onClick={handleDuplicate}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white font-mono-data hover:bg-[#27272A] transition-colors text-left"
        >
          <Copy className="w-3.5 h-3.5 text-[#A1A1AA]" />
          Duplicate
        </button>
      )}

      <div className="my-1 border-t border-[#27272A]" />

      {/* Download */}
      {file.type === "file" && (
        <button
          onClick={handleDownload}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white font-mono-data hover:bg-[#27272A] transition-colors text-left"
        >
          <Download className="w-3.5 h-3.5 text-[#60A5FA]" />
          Download
        </button>
      )}

      {/* Add to favorites */}
      {file.type === "directory" && (
        <button
          onClick={handleFavorite}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white font-mono-data hover:bg-[#27272A] transition-colors text-left"
        >
          <Star
            className={`w-3.5 h-3.5 ${
              favorites.includes(file.path) ? "text-[#FACC15]" : "text-[#A1A1AA]"
            }`}
          />
          {favorites.includes(file.path) ? "Remove Favorite" : "Add to Favorites"}
        </button>
      )}

      <div className="my-1 border-t border-[#27272A]" />

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#F87171] font-mono-data hover:bg-[#27272A] transition-colors text-left"
      >
        <Trash2 className="w-3.5 h-3.5 text-[#F87171]" />
        Delete
      </button>
    </div>
  );
}
