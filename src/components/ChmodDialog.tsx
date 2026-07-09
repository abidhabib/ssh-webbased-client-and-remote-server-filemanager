import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import { X, Lock, Shield, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function modeToBits(mode: string) {
  const num = parseInt(mode, 8);
  return {
    owner: { read: !!(num & 0o400), write: !!(num & 0o200), execute: !!(num & 0o100) },
    group: { read: !!(num & 0o040), write: !!(num & 0o020), execute: !!(num & 0o010) },
    others: { read: !!(num & 0o004), write: !!(num & 0o002), execute: !!(num & 0o001) },
  };
}

function bitsToMode(bits: ReturnType<typeof modeToBits>): number {
  let mode = 0;
  if (bits.owner.read) mode |= 0o400;
  if (bits.owner.write) mode |= 0o200;
  if (bits.owner.execute) mode |= 0o100;
  if (bits.group.read) mode |= 0o040;
  if (bits.group.write) mode |= 0o020;
  if (bits.group.execute) mode |= 0o010;
  if (bits.others.read) mode |= 0o004;
  if (bits.others.write) mode |= 0o002;
  if (bits.others.execute) mode |= 0o001;
  return mode;
}

const presets = [
  { label: "644 (rw-r--r--)", value: 0o644, desc: "Default file" },
  { label: "755 (rwxr-xr-x)", value: 0o755, desc: "Executable / Directory" },
  { label: "777 (rwxrwxrwx)", value: 0o777, desc: "Full access" },
  { label: "600 (rw-------)", value: 0o600, desc: "Private" },
  { label: "700 (rwx------)", value: 0o700, desc: "Private exec" },
  { label: "444 (r--r--r--)", value: 0o444, desc: "Read-only" },
];

export default function ChmodDialog() {
  const { showChmod, setShowChmod, chmodTarget, sessionId, addLog } = useFileManagerStore();
  const [bits, setBits] = useState(modeToBits("644"));
  const [numeric, setNumeric] = useState("644");

  const chmodMutation = trpc.file.chmod.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (chmodTarget) {
      const b = modeToBits(chmodTarget.permissions);
      setBits(b);
      setNumeric(parseInt(chmodTarget.permissions).toString(8));
    }
  }, [chmodTarget]);

  useEffect(() => {
    const mode = bitsToMode(bits);
    setNumeric(mode.toString(8).padStart(3, "0"));
  }, [bits]);

  const toggleBit = (section: "owner" | "group" | "others", perm: "read" | "write" | "execute") => {
    setBits((prev) => ({
      ...prev,
      [section]: { ...prev[section], [perm]: !prev[section][perm] },
    }));
  };

  const handleApply = async () => {
    if (!chmodTarget || !sessionId) return;
    const mode = bitsToMode(bits);
    try {
      await chmodMutation.mutateAsync({ sessionId, path: chmodTarget.path, mode });
      toast.success(`Permissions updated to ${numeric}`);
      addLog({ message: `Chmod ${numeric} on ${chmodTarget.name}`, type: "info" });
      utils.file.list.invalidate();
      setShowChmod(false);
    } catch (err: any) {
      toast.error("Failed to update permissions: " + err.message);
    }
  };

  const PermissionRow = ({ label, icon: Icon, section, color }: { label: string; icon: any; section: "owner" | "group" | "others"; color: string }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-mono-data text-white">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="capitalize">{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(["read", "write", "execute"] as const).map((perm) => (
          <button
            key={perm}
            onClick={() => toggleBit(section, perm)}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-mono-data border transition-all ${
              bits[section][perm]
                ? `border-[#4ADE80]/50 bg-[#4ADE80]/10 text-[#4ADE80]`
                : "border-[#27272A] bg-[#0A0A0A] text-[#52525B] hover:border-[#3F3F46]"
            }`}
          >
            <span className="uppercase">{perm === "read" ? "R" : perm === "write" ? "W" : "X"}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (!showChmod || !chmodTarget) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[#050505]/80 flex items-center justify-center" onClick={() => setShowChmod(false)}>
      <div className="w-[420px] bg-[#141414] border border-[#27272A]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="h-[40px] bg-[#0A0A0A] border-b border-[#27272A] flex items-center justify-between px-3">
          <span className="text-xs font-mono-data text-white flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#FACC15]" />
            Permissions: {chmodTarget.name}
          </span>
          <button onClick={() => setShowChmod(false)} className="p-1 text-[#52525B] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Numeric display */}
          <div className="bg-[#0A0A0A] border border-[#27272A] p-3 flex items-center justify-between">
            <span className="text-[10px] text-[#52525B] font-mono-data uppercase">Current Mode</span>
            <span className="text-lg font-mono-data text-[#4ADE80]">{numeric}</span>
          </div>

          {/* Permission rows */}
          <PermissionRow label="Owner" icon={Shield} section="owner" color="text-[#FACC15]" />
          <PermissionRow label="Group" icon={Users} section="group" color="text-[#60A5FA]" />
          <PermissionRow label="Others" icon={Globe} section="others" color="text-[#4ADE80]" />

          {/* Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-[#52525B] font-mono-data uppercase tracking-wider">Presets</span>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    const b = modeToBits(preset.value.toString(8));
                    setBits(b);
                    setNumeric(preset.value.toString(8));
                  }}
                  className={`text-left px-2.5 py-2 border transition-all ${
                    numeric === preset.value.toString(8)
                      ? "border-[#60A5FA]/50 bg-[#60A5FA]/10"
                      : "border-[#27272A] bg-[#0A0A0A] hover:border-[#3F3F46]"
                  }`}
                >
                  <div className="text-[10px] font-mono-data text-white">{preset.label}</div>
                  <div className="text-[9px] font-mono-data text-[#52525B]">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#27272A] flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowChmod(false)} className="h-8 text-xs font-mono-data bg-transparent border-[#27272A] text-[#A1A1AA] hover:bg-[#141414]">
            Cancel
          </Button>
          <Button onClick={handleApply} className="h-8 text-xs font-mono-data bg-[#4ADE80] hover:bg-[#22c55e] text-[#050505]">
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
