import { useFileManagerStore } from "@/store/useFileManagerStore";
import { X, Keyboard } from "lucide-react";

const shortcuts = [
  { key: "Ctrl + C", desc: "Copy selected files" },
  { key: "Ctrl + X", desc: "Cut selected files" },
  { key: "Ctrl + V", desc: "Paste files" },
  { key: "Ctrl + A", desc: "Select all" },
  { key: "Ctrl + S", desc: "Save file (editor)" },
  { key: "Ctrl + W", desc: "Close editor tab" },
  { key: "Ctrl + F", desc: "Search files" },
  { key: "F5", desc: "Refresh directory" },
  { key: "F2", desc: "Rename selected file" },
  { key: "Delete", desc: "Delete selected files" },
  { key: "Enter", desc: "Open file/folder" },
  { key: "Backspace", desc: "Navigate up" },
];

export default function KeyboardShortcuts() {
  const { showShortcuts, setShowShortcuts } = useFileManagerStore();

  if (!showShortcuts) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[#050505]/80 flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
      <div className="w-[400px] bg-[#141414] border border-[#27272A]" onClick={(e) => e.stopPropagation()}>
        <div className="h-[40px] bg-[#0A0A0A] border-b border-[#27272A] flex items-center justify-between px-3">
          <span className="text-xs font-mono-data text-white flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 text-[#60A5FA]" />
            Keyboard Shortcuts
          </span>
          <button onClick={() => setShowShortcuts(false)} className="p-1 text-[#52525B] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-1">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between py-2 px-3 hover:bg-[#0A0A0A] transition-colors">
                <span className="text-xs text-[#A1A1AA] font-mono-data">{shortcut.desc}</span>
                <kbd className="px-2 py-0.5 bg-[#0A0A0A] border border-[#27272A] text-[10px] font-mono-data text-white">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
