import { useState } from "react";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import { X, Eye, EyeOff, Terminal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function SettingsPanel() {
  const {
    setShowSettings,
    showHiddenFiles,
    setShowHiddenFiles,
    showTerminal,
    setShowTerminal,
    clearLogs,
    logs,
  } = useFileManagerStore();

  const [activeTab, setActiveTab] = useState<"general" | "display">("general");

  return (
    <div
      className="w-[450px] bg-[#141414] border border-[#27272A] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Settings Header */}
      <div className="h-[40px] bg-[#0A0A0A] border-b border-[#27272A] flex items-center justify-between px-3 flex-shrink-0">
        <span className="text-xs font-mono-data text-white uppercase tracking-wider">
          Settings
        </span>
        <button
          onClick={() => setShowSettings(false)}
          className="p-1 text-[#52525B] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#27272A]">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex-1 py-2 text-xs font-mono-data uppercase tracking-wider transition-colors ${
            activeTab === "general"
              ? "text-white border-b-2 border-[#60A5FA]"
              : "text-[#52525B] hover:text-[#A1A1AA]"
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab("display")}
          className={`flex-1 py-2 text-xs font-mono-data uppercase tracking-wider transition-colors ${
            activeTab === "display"
              ? "text-white border-b-2 border-[#60A5FA]"
              : "text-[#52525B] hover:text-[#A1A1AA]"
          }`}
        >
          Display
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {activeTab === "general" && (
          <>
            {/* Hidden Files */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                {showHiddenFiles ? (
                  <Eye className="w-4 h-4 text-[#60A5FA]" />
                ) : (
                  <EyeOff className="w-4 h-4 text-[#52525B]" />
                )}
                <div>
                  <div className="text-xs text-white font-mono-data">Show Hidden Files</div>
                  <div className="text-[10px] text-[#52525B] font-mono-data">
                    Display files starting with a dot
                  </div>
                </div>
              </div>
              <Switch
                checked={showHiddenFiles}
                onCheckedChange={setShowHiddenFiles}
              />
            </div>

            {/* Terminal */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#4ADE80]" />
                <div>
                  <div className="text-xs text-white font-mono-data">Show Terminal</div>
                  <div className="text-[10px] text-[#52525B] font-mono-data">
                    Display activity log panel
                  </div>
                </div>
              </div>
              <Switch
                checked={showTerminal}
                onCheckedChange={setShowTerminal}
              />
            </div>

            {/* Clear Logs */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-[#F87171]" />
                <div>
                  <div className="text-xs text-white font-mono-data">Clear Activity Logs</div>
                  <div className="text-[10px] text-[#52525B] font-mono-data">
                    {logs.length} log entries
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearLogs();
                  toast.success("Activity logs cleared");
                }}
                className="h-7 text-[10px] font-mono-data bg-transparent border-[#27272A] text-[#F87171] hover:bg-[#F87171]/10 hover:text-[#F87171]"
              >
                Clear
              </Button>
            </div>
          </>
        )}

        {activeTab === "display" && (
          <>
            <div className="text-center py-8">
              <div className="text-xs text-[#52525B] font-mono-data">
                Display settings will be available in a future update.
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#27272A] flex justify-end">
        <Button
          onClick={() => setShowSettings(false)}
          className="h-8 px-4 text-xs font-mono-data bg-[#27272A] hover:bg-[#3F3F46] text-white"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
