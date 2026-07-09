import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import ConnectionHeader from "@/components/ConnectionHeader";
import DirectoryTree from "@/components/DirectoryTree";
import FileList from "@/components/FileList";
import TelemetryPanel from "@/components/TelemetryPanel";
import TerminalPanel from "@/components/TerminalPanel";
import TextEditor from "@/components/TextEditor";
import PreviewPanel from "@/components/PreviewPanel";
import ContextMenu from "@/components/ContextMenu";
import SearchPanel from "@/components/SearchPanel";
import SettingsPanel from "@/components/SettingsPanel";
import ChmodDialog from "@/components/ChmodDialog";
import QuickActions from "@/components/QuickActions";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import { Toaster, toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    sessionId, isConnected, currentPath, setFiles, setIsLoading, setLoadingMessage,
    showTerminal, openEditors, previewFile, showSearch, showSettings, showChmod, showShortcuts,
    contextMenu, setContextMenu, addLog, setDiskUsage,
  } = useFileManagerStore();

  const listQuery = trpc.file.list.useQuery(
    { sessionId: sessionId || "", path: currentPath },
    { enabled: !!sessionId && isConnected, refetchInterval: 5000 }
  );

  const diskQuery = trpc.file.diskUsage.useQuery(
    { sessionId: sessionId || "", path: "/" },
    { enabled: !!sessionId && isConnected, refetchInterval: 30000 }
  );

  useEffect(() => { if (!isConnected || !sessionId) navigate("/"); }, [isConnected, sessionId, navigate]);

  useEffect(() => {
    if (listQuery.data?.success && listQuery.data.entries) {
      setFiles(listQuery.data.entries as any);
    }
    setIsLoading(listQuery.isLoading);
    setLoadingMessage(listQuery.isLoading ? "Loading directory..." : "");
  }, [listQuery.data, listQuery.isLoading, setFiles, setIsLoading, setLoadingMessage]);

  useEffect(() => {
    if (diskQuery.data?.success) {
      setDiskUsage({ total: diskQuery.data.total, used: diskQuery.data.used, free: diskQuery.data.free });
    }
  }, [diskQuery.data, setDiskUsage]);

  useEffect(() => {
    if (listQuery.error) {
      addLog({ message: `Error: ${listQuery.error.message}`, type: "error" });
      toast.error(`Failed to load: ${listQuery.error.message}`);
    }
  }, [listQuery.error, addLog]);

  const handleContextMenu = useCallback((e: React.MouseEvent, file: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  }, [setContextMenu]);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [contextMenu, setContextMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const store = useFileManagerStore.getState();
      if (e.key === "F5") { e.preventDefault(); store.navigateTo(store.currentPath); }
      if (e.key === "Escape") {
        if (store.previewFile) store.setPreviewFile(null);
        else if (store.showSearch) store.setShowSearch(false);
        else if (store.showSettings) store.setShowSettings(false);
        else if (store.showChmod) store.setShowChmod(false);
        else if (store.showShortcuts) store.setShowShortcuts(false);
        else store.clearSelection();
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); store.setShowShortcuts(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") { e.preventDefault(); store.setShowSearch(true); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isConnected) return null;

  return (
    <div className="h-screen w-screen bg-[#050505] flex flex-col overflow-hidden selection:bg-[#60A5FA]/30">
      <Toaster position="top-right" toastOptions={{ style: { background: "#141414", border: "1px solid #27272A", color: "#FFFFFF" } }} />

      <ConnectionHeader />
      <QuickActions />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[260px] flex-shrink-0 border-r border-[#27272A] bg-[#0A0A0A]">
          <DirectoryTree />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
          <FileList onContextMenu={handleContextMenu} />
        </div>
        <div className="w-[260px] flex-shrink-0 border-l border-[#27272A] bg-[#0A0A0A]">
          <TelemetryPanel />
        </div>
      </div>

      {showTerminal && (
        <div className="h-[200px] border-t border-[#27272A] bg-[#0A0A0A] flex-shrink-0">
          <TerminalPanel />
        </div>
      )}

      {openEditors.length > 0 && (
        <div className="absolute inset-0 z-50 bg-[#050505]">
          <TextEditor />
        </div>
      )}

      {previewFile && <PreviewPanel />}
      {showSearch && <div className="absolute inset-0 z-40 bg-[#050505]/80 flex items-start justify-center pt-20"><SearchPanel /></div>}
      {showSettings && <div className="absolute inset-0 z-40 bg-[#050505]/80 flex items-center justify-center"><SettingsPanel /></div>}
      {showChmod && <ChmodDialog />}
      {showShortcuts && <KeyboardShortcuts />}
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} file={contextMenu.file} />}
    </div>
  );
}
