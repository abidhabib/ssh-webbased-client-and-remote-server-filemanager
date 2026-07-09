import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { trpc } from "@/providers/trpc";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import {
  X,
  Save,
  Search,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";

function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    jsx: "javascript",
    tsx: "typescript",
    json: "json",
    html: "html",
    css: "css",
    py: "python",
    java: "java",
    php: "php",
    go: "go",
    rs: "rust",
    sql: "sql",
    xml: "xml",
    yml: "yaml",
    yaml: "yaml",
    sh: "shell",
    bash: "shell",
    md: "markdown",
    dockerfile: "dockerfile",
    nginx: "nginx",
    conf: "ini",
    ini: "ini",
    env: "ini",
    log: "plaintext",
    txt: "plaintext",
    csv: "plaintext",
  };
  return langMap[ext] || "plaintext";
}

export default function TextEditor() {
  const {
    openEditors,
    activeEditor,
    setOpenEditors,
    setActiveEditor,
    closeEditor,
    markEditorDirty,
    sessionId,
    addLog,
  } = useFileManagerStore();

  const [isSaving, setIsSaving] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const writeFileMutation = trpc.file.writeFile.useMutation();

  const activeFile = openEditors.find((e) => e.path === activeEditor);

  const handleSave = useCallback(async () => {
    if (!activeEditor || !sessionId || !activeFile) return;

    setIsSaving(true);
    try {
      const result = await writeFileMutation.mutateAsync({
        sessionId,
        path: activeEditor,
        content: activeFile.content,
      });

      if (result.success) {
        markEditorDirty(activeEditor, false);
        toast.success("File saved");
        addLog({ message: `Saved: ${activeEditor}`, type: "info" });
      } else {
        toast.error("Failed to save: " + result.error);
        addLog({ message: `Failed to save: ${activeEditor} - ${result.error}`, type: "error" });
      }
    } catch (err: any) {
      toast.error("Save error: " + err.message);
      addLog({ message: `Save error: ${err.message}`, type: "error" });
    } finally {
      setIsSaving(false);
    }
  }, [activeEditor, sessionId, activeFile, writeFileMutation, markEditorDirty, addLog]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!activeEditor || value === undefined) return;
      const state = useFileManagerStore.getState();
      const newEditors = state.openEditors.map((e) =>
        e.path === activeEditor ? { ...e, content: value, isDirty: true } : e
      );
      setOpenEditors(newEditors);
    },
    [activeEditor, setOpenEditors]
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        if (activeEditor) closeEditor(activeEditor);
      }
      if (e.key === "Escape" && openEditors.length === 0) {
        // Already handled by close
      }
    },
    [handleSave, activeEditor, closeEditor, openEditors]
  );

  if (!activeFile) return null;

  return (
    <div className="h-full flex flex-col bg-[#050505]" onKeyDown={handleKeyDown}>
      {/* Editor Header */}
      <div className="h-[40px] bg-[#0A0A0A] border-b border-[#27272A] flex items-center justify-between px-2 flex-shrink-0">
        {/* Tabs */}
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto">
          {openEditors.map((editor) => (
            <button
              key={editor.path}
              onClick={() => setActiveEditor(editor.path)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono-data border-t-2 transition-colors min-w-0 ${
                editor.path === activeEditor
                  ? "bg-[#141414] border-t-[#60A5FA] text-white"
                  : "bg-[#0A0A0A] border-t-transparent text-[#52525B] hover:text-[#A1A1AA]"
              }`}
            >
              <FileCode className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[150px]">
                {editor.path.split("/").pop()}
              </span>
              {editor.isDirty && <span className="text-[#FACC15]">●</span>}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  closeEditor(editor.path);
                }}
                className="ml-1 p-0.5 hover:bg-[#27272A] rounded"
              >
                <X className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {searchOpen && (
            <div className="flex items-center gap-1 mr-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find..."
                className="w-[150px] h-6 bg-[#141414] border border-[#27272A] text-white text-xs font-mono-data px-2 focus:outline-none focus:border-[#60A5FA]"
                autoFocus
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-1 text-[#52525B] hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#141414] transition-colors"
            title="Search (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || !activeFile.isDirty}
            className={`p-1.5 transition-colors ${
              activeFile.isDirty
                ? "text-[#4ADE80] hover:bg-[#141414]"
                : "text-[#52525B]"
            }`}
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (activeEditor) closeEditor(activeEditor);
            }}
            className="p-1.5 text-[#A1A1AA] hover:text-[#F87171] hover:bg-[#141414] transition-colors"
            title="Close (Ctrl+W)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={getLanguageFromPath(activeFile.path)}
          value={activeFile.content}
          theme="vs-dark"
          onChange={handleEditorChange}
          options={{
            fontSize: 13,
            fontFamily: "JetBrains Mono, monospace",
            minimap: { enabled: true, scale: 1 },
            lineNumbers: "on",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
            folding: true,
            matchBrackets: "always",
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-[#52525B] text-sm font-mono-data">
              Loading editor...
            </div>
          }
        />
      </div>

      {/* Status Bar */}
      <div className="h-[22px] bg-[#0A0A0A] border-t border-[#27272A] flex items-center px-3 gap-4 text-[10px] font-mono-data text-[#52525B]">
        <span>{getLanguageFromPath(activeFile.path)}</span>
        <span>UTF-8</span>
        <span>{activeFile.content.split("\n").length} lines</span>
        <span>{activeFile.content.length} chars</span>
        {activeFile.isDirty && <span className="text-[#FACC15]">unsaved</span>}
        {isSaving && <span className="text-[#4ADE80]">saving...</span>}
      </div>
    </div>
  );
}
