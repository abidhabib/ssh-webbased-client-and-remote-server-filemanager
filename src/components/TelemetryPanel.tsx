import { useFileManagerStore } from "@/store/useFileManagerStore";
import {
  File, Folder, HardDrive, Calendar, User, Lock, Hash,
  Cpu, CircleDot, Gauge,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function PermissionDisplay({ mode }: { mode: string }) {
  const num = parseInt(mode, 8);
  const owner = [num & 0o400 ? "r" : "-", num & 0o200 ? "w" : "-", num & 0o100 ? "x" : "-"];
  const group = [num & 0o040 ? "r" : "-", num & 0o020 ? "w" : "-", num & 0o010 ? "x" : "-"];
  const other = [num & 0o004 ? "r" : "-", num & 0o002 ? "w" : "-", num & 0o001 ? "x" : "-"];
  return (
    <div className="flex gap-1 font-mono-data text-xs">
      <span className="text-[#FACC15]">{owner.join("")}</span>
      <span className="text-[#60A5FA]">{group.join("")}</span>
      <span className="text-[#4ADE80]">{other.join("")}</span>
    </div>
  );
}

export default function TelemetryPanel() {
  const { selectedFiles, files, diskUsage } = useFileManagerStore();

  const selectedFilePaths = Array.from(selectedFiles);
  const selectedFileEntries = files.filter((f) => selectedFilePaths.includes(f.path));
  const singleFile = selectedFileEntries.length === 1 ? selectedFileEntries[0] : null;
  const totalSize = selectedFileEntries.reduce((sum, f) => sum + f.size, 0);
  const diskPercent = diskUsage ? Math.round((diskUsage.used / diskUsage.total) * 100) : 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {/* Disk Usage */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-mono-data text-[#52525B] uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive className="w-3 h-3" /> Server Storage
          </h3>
          <div className="bg-[#141414] border border-[#27272A] p-3 space-y-2">
            {diskUsage && diskUsage.total > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#52525B] font-mono-data">Used</span>
                  <span className="text-xs text-white font-mono-data">{formatSize(diskUsage.used)} / {formatSize(diskUsage.total)}</span>
                </div>
                <div className="w-full h-1.5 bg-[#0A0A0A] overflow-hidden">
                  <div className="h-full transition-all duration-500" style={{ width: `${diskPercent}%`, backgroundColor: diskPercent > 90 ? "#F87171" : diskPercent > 70 ? "#FACC15" : "#4ADE80" }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#52525B] font-mono-data">{diskPercent}% used</span>
                  <span className="text-[10px] text-[#4ADE80] font-mono-data">{formatSize(diskUsage.free)} free</span>
                </div>
              </>
            ) : (
              <div className="text-[10px] text-[#52525B] font-mono-data text-center py-1">No disk data available</div>
            )}
          </div>
        </div>

        {/* Selection Summary */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-mono-data text-[#52525B] uppercase tracking-wider flex items-center gap-1.5">
            <CircleDot className="w-3 h-3" /> Selection
          </h3>
          <div className="bg-[#141414] border border-[#27272A] p-3 space-y-1.5">
            <div className="flex items-center justify-between"><span className="text-[10px] text-[#A1A1AA] font-mono-data">Items</span><span className="text-xs text-white font-mono-data">{selectedFileEntries.length}</span></div>
            {totalSize > 0 && <div className="flex items-center justify-between"><span className="text-[10px] text-[#A1A1AA] font-mono-data">Total Size</span><span className="text-xs text-white font-mono-data">{formatSize(totalSize)}</span></div>}
            <div className="flex items-center justify-between"><span className="text-[10px] text-[#A1A1AA] font-mono-data">Directory Items</span><span className="text-xs text-white font-mono-data">{files.length}</span></div>
          </div>
        </div>

        {/* Single File Details */}
        {singleFile && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-mono-data text-[#52525B] uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3 h-3" /> File Details
            </h3>

            <div className="flex items-center gap-3 pb-3 border-b border-[#27272A]">
              <div className="w-10 h-10 bg-[#141414] border border-[#27272A] flex items-center justify-center flex-shrink-0">
                {singleFile.type === "directory" ? <Folder className="w-5 h-5 text-[#60A5FA]" /> : <File className="w-5 h-5 text-[#A1A1AA]" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-white font-mono-data truncate">{singleFile.name}</div>
                <div className="text-[10px] text-[#52525B] font-mono-data capitalize">{singleFile.type} &middot; {formatSize(singleFile.size)}</div>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { icon: HardDrive, label: "Size", value: formatSize(singleFile.size), color: "text-[#52525B]" },
                { icon: Calendar, label: "Modified", value: formatDate(singleFile.modified), color: "text-[#52525B]" },
                { icon: User, label: "Owner / Group", value: `${singleFile.owner} / ${singleFile.group}`, color: "text-[#52525B]" },
                { icon: Lock, label: "Permissions", value: `${singleFile.permissions}`, color: "text-[#52525B]", extra: <PermissionDisplay mode={singleFile.permissions} /> },
                { icon: Hash, label: "Path", value: singleFile.path, color: "text-[#52525B]", small: true },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <item.icon className={`w-3.5 h-3.5 ${item.color} flex-shrink-0 mt-0.5`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-[#52525B] font-mono-data">{item.label}</div>
                    <div className={`text-xs text-white font-mono-data truncate ${item.small ? "break-all leading-tight text-[10px]" : ""}`}>{item.value}</div>
                    {item.extra}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedFileEntries.length > 1 && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-mono-data text-[#52525B] uppercase tracking-wider">Selected Files</h3>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {selectedFileEntries.map((file) => (
                <div key={file.path} className="flex items-center gap-2 py-1 px-2 bg-[#141414] border border-[#27272A]">
                  {file.type === "directory" ? <Folder className="w-3 h-3 text-[#60A5FA] flex-shrink-0" /> : <File className="w-3 h-3 text-[#A1A1AA] flex-shrink-0" />}
                  <span className="text-[10px] text-white font-mono-data truncate">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedFileEntries.length === 0 && (
          <div className="text-center py-6">
            <Cpu className="w-8 h-8 text-[#27272A] mx-auto mb-2" />
            <div className="text-[#52525B] text-xs font-mono-data">Select a file for details</div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
