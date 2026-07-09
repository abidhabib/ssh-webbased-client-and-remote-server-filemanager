import { useRef, useEffect } from "react";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import { X, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TerminalPanel() {
  const { logs, setShowTerminal, clearLogs } = useFileManagerStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-[#0F0F0F]">
      {/* Terminal Header */}
      <div className="h-[28px] flex items-center justify-between px-3 border-b border-[#27272A] flex-shrink-0">
        <span className="text-[10px] font-mono-data text-[#52525B] uppercase tracking-wider">
          Activity Log
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={clearLogs}
            className="p-1 text-[#52525B] hover:text-[#F87171] transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setShowTerminal(false)}
            className="p-1 text-[#52525B] hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-2 space-y-0">
          {logs.length === 0 && (
            <div className="text-[#52525B] text-xs font-mono-data py-4 text-center">
              No activity logged yet
            </div>
          )}
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 py-0.5 font-mono-data text-xs leading-5"
            >
              <span className="text-[#52525B] flex-shrink-0">
                {log.timestamp.toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span
                className={`${
                  log.type === "upload"
                    ? "terminal-upload"
                    : log.type === "download"
                    ? "terminal-info"
                    : log.type === "error"
                    ? "terminal-error"
                    : log.type === "delete"
                    ? "terminal-error"
                    : log.type === "rename"
                    ? "terminal-warning"
                    : "terminal-info"
                }`}
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
