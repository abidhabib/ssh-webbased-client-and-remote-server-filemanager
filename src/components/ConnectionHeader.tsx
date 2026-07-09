import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import {
  FolderPlus, RefreshCw, Terminal, Settings, LogOut,
  ChevronRight, Home, Search, ArrowLeft, ArrowRight,
  LayoutGrid, List, Eye, EyeOff, Keyboard, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ConnectionHeader() {
  const navigate = useNavigate();
  const {
    sessionId, serverInfo, currentPath, isConnected,
    showHiddenFiles, setShowHiddenFiles,
    navigateTo, navigateBack, navigateForward,
    setShowTerminal, setShowSettings, setShowSearch, setShowShortcuts,
    setIsConnected, setSessionId, setServerInfo, addLog,
    viewMode, setViewMode,
  } = useFileManagerStore();

  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const disconnectMutation = trpc.connection.disconnect.useMutation();
  const createFolderMutation = trpc.file.createDirectory.useMutation();
  const utils = trpc.useUtils();

  const handleDisconnect = useCallback(async () => {
    if (sessionId) await disconnectMutation.mutateAsync({ sessionId });
    setIsConnected(false); setSessionId(null); setServerInfo(null);
    addLog({ message: "Disconnected", type: "info" });
    navigate("/");
  }, [sessionId, disconnectMutation, setIsConnected, setSessionId, setServerInfo, addLog, navigate]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim() || !sessionId) return;
    const newPath = currentPath === "/" ? `/${newFolderName}` : `${currentPath}/${newFolderName}`;
    try {
      await createFolderMutation.mutateAsync({ sessionId, path: newPath });
      toast.success(`Created "${newFolderName}"`); addLog({ message: `Created folder: ${newPath}`, type: "info" });
      setNewFolderName(""); setShowNewFolderDialog(false); utils.file.list.invalidate();
    } catch (error: any) { toast.error(`Failed: ${error.message}`); addLog({ message: `Failed: ${error.message}`, type: "error" }); }
  }, [newFolderName, sessionId, currentPath, createFolderMutation, addLog, utils]);

  const handleRefresh = useCallback(() => { utils.file.list.invalidate(); toast.success("Refreshed"); }, [utils]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !sessionId) return;
    for (const file of Array.from(files)) {
      const formData = new FormData(); formData.append("file", file);
      try {
        const res = await fetch(`/api/upload?sessionId=${sessionId}&path=${encodeURIComponent(currentPath)}`, { method: "POST", body: formData });
        if (res.ok) toast.success(`Uploaded: ${file.name}`);
        else toast.error(`Failed: ${file.name}`);
      } catch (err: any) { toast.error(`Error: ${err.message}`); }
    }
    utils.file.list.invalidate();
    setShowUploadDialog(false);
  }, [sessionId, currentPath, utils]);

  const pathParts = currentPath.split("/").filter(Boolean);
  const breadcrumbItems = [{ name: "~", path: "/" }, ...pathParts.map((part, index) => ({ name: part, path: "/" + pathParts.slice(0, index + 1).join("/") }))];

  return (
    <header className="h-[48px] bg-[#0A0A0A] border-b border-[#27272A] flex items-center px-3 gap-2 flex-shrink-0">
      {/* Server Info */}
      <div className="flex items-center gap-2 mr-3 min-w-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? "status-online" : "status-offline"}`} />
        <span className="text-[11px] font-mono-data text-[#A1A1AA] truncate max-w-[180px]">
          {serverInfo ? `${serverInfo.username}@${serverInfo.host}` : "Disconnected"}
        </span>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-0.5 mr-2 flex-shrink-0">
        <button onClick={navigateBack} className="nav-btn"><ArrowLeft className="w-4 h-4" /></button>
        <button onClick={navigateForward} className="nav-btn"><ArrowRight className="w-4 h-4" /></button>
      </div>

      {/* Breadcrumb */}
      <div className="flex-1 flex items-center overflow-hidden min-w-0">
        <div className="flex items-center text-[11px] font-mono-data text-[#52525B] overflow-x-auto scrollbar-none">
          {breadcrumbItems.map((item, index) => (
            <span key={item.path} className="flex items-center flex-shrink-0">
              {index > 0 && <ChevronRight className="w-3 h-3 mx-0.5 text-[#3F3F46]" />}
              <button onClick={() => navigateTo(item.path)} className={`px-1.5 py-0.5 hover:bg-[#141414] transition-colors ${index === breadcrumbItems.length - 1 ? "text-white" : ""}`}>
                {index === 0 ? <Home className="w-3.5 h-3.5" /> : <span className="truncate max-w-[120px]">{item.name}</span>}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center mr-2 flex-shrink-0 border border-[#27272A]">
        <button onClick={() => setViewMode({ type: "list", iconSize: 16 })} className={`p-1.5 transition-colors ${viewMode.type === "list" ? "text-white bg-[#141414]" : "text-[#52525B] hover:text-[#A1A1AA]"}`} title="List view"><List className="w-4 h-4" /></button>
        <button onClick={() => setViewMode({ type: "grid", iconSize: 24 })} className={`p-1.5 transition-colors ${viewMode.type === "grid" ? "text-white bg-[#141414]" : "text-[#52525B] hover:text-[#A1A1AA]"}`} title="Grid view"><LayoutGrid className="w-4 h-4" /></button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {/* Upload */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <button className="nav-btn" title="Upload"><Upload className="w-4 h-4" /></button>
          </DialogTrigger>
          <DialogContent className="bg-[#141414] border-[#27272A] text-white">
            <DialogHeader><DialogTitle className="text-sm font-mono-data">Upload Files</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="border-2 border-dashed border-[#27272A] hover:border-[#4ADE80] transition-colors p-8 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-8 h-8 text-[#52525B] mx-auto mb-2" />
                <p className="text-xs text-[#A1A1AA] font-mono-data">Click to browse or drag files here</p>
                <p className="text-[10px] text-[#52525B] font-mono-data mt-1">Max 500MB per file</p>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Folder */}
        <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
          <DialogTrigger asChild>
            <button className="nav-btn" title="New Folder"><FolderPlus className="w-4 h-4" /></button>
          </DialogTrigger>
          <DialogContent className="bg-[#141414] border-[#27272A] text-white">
            <DialogHeader><DialogTitle className="text-sm font-mono-data">New Folder</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="folder-name" className="bg-[#0A0A0A] border-[#27272A] text-white font-mono-data" onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()} autoFocus />
              <Button onClick={handleCreateFolder} className="w-full bg-[#4ADE80] hover:bg-[#22c55e] text-[#050505]">Create</Button>
            </div>
          </DialogContent>
        </Dialog>

        <button onClick={handleRefresh} className="nav-btn" title="Refresh (F5)"><RefreshCw className="w-4 h-4" /></button>
        <button onClick={() => setShowSearch(true)} className="nav-btn" title="Search (Ctrl+F)"><Search className="w-4 h-4" /></button>
        <button onClick={() => setShowHiddenFiles(!showHiddenFiles)} className={`nav-btn ${showHiddenFiles ? "text-[#60A5FA] bg-[#141414]" : ""}`} title="Toggle hidden files">
          {showHiddenFiles ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button onClick={() => setShowTerminal(true)} className="nav-btn" title="Activity Log"><Terminal className="w-4 h-4" /></button>
        <button onClick={() => setShowShortcuts(true)} className="nav-btn" title="Shortcuts (?)"><Keyboard className="w-4 h-4" /></button>
        <button onClick={() => setShowSettings(true)} className="nav-btn" title="Settings"><Settings className="w-4 h-4" /></button>
        <button onClick={handleDisconnect} className="nav-btn text-[#A1A1AA] hover:text-[#F87171] ml-1" title="Disconnect"><LogOut className="w-4 h-4" /></button>
      </div>
    </header>
  );
}
