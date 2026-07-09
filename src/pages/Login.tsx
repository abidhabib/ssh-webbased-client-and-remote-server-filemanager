import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Shield, Wifi, WifiOff, Clock, Trash2, HardDrive, Terminal, ChevronRight } from "lucide-react";
import { Toaster, toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { setSessionId, setServerInfo, setIsConnected, addLog, savedConnections, addSavedConnection, removeSavedConnection } = useFileManagerStore();

  const [host, setHost] = useState("");
  const [port, setPort] = useState("22");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [protocol, setProtocol] = useState<"sftp" | "ftp">("sftp");
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSaved, setShowSaved] = useState(true);

  const connectMutation = trpc.connection.connect.useMutation();

  // Load last used connection
  useEffect(() => {
    const lastConn = localStorage.getItem("lastConnection");
    if (lastConn) {
      try {
        const parsed = JSON.parse(lastConn);
        setHost(parsed.host || "");
        setPort(parsed.port?.toString() || "22");
        setUsername(parsed.username || "");
        setProtocol(parsed.protocol || "sftp");
      } catch { /* ignore */ }
    }
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host || !username) { toast.error("Host and username are required"); return; }

    setIsConnecting(true);
    toast.loading("Establishing secure connection...");

    try {
      const result = await connectMutation.mutateAsync({
        host, port: parseInt(port) || 22, username,
        password: password || undefined,
      });

      toast.dismiss();
      if (result.success && result.sessionId) {
        setSessionId(result.sessionId);
        setServerInfo({ host, port: parseInt(port) || 22, username });
        setIsConnected(true);

        // Save connection
        const connId = `conn_${Date.now()}`;
        addSavedConnection({ id: connId, name: `${username}@${host}`, host, port: parseInt(port) || 22, username, protocol, createdAt: new Date() });
        localStorage.setItem("lastConnection", JSON.stringify({ host, port: parseInt(port) || 22, username, protocol }));

        addLog({ message: `Connected to ${username}@${host}:${port}`, type: "info" });
        toast.success("Connected successfully");
        navigate("/dashboard");
      } else {
        toast.error(result.error || "Connection failed");
        addLog({ message: `Connection failed: ${result.error}`, type: "error" });
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Connection failed");
      addLog({ message: `Connection error: ${error.message}`, type: "error" });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleQuickConnect = (conn: typeof savedConnections[0]) => {
    setHost(conn.host);
    setPort(conn.port.toString());
    setUsername(conn.username);
    setProtocol(conn.protocol);
    setPassword("");
    setShowSaved(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <Toaster position="top-right" toastOptions={{ style: { background: "#141414", border: "1px solid #27272A", color: "#FFFFFF" } }} />

      <div className="w-full max-w-md">
        {/* Animated Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-[#4ADE80]/10 blur-xl rounded-full" />
            <div className="relative w-16 h-16 bg-[#0A0A0A] border border-[#27272A] flex items-center justify-center">
              <HardDrive className="w-8 h-8 text-[#4ADE80]" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Web File Manager</h1>
          <p className="text-[#52525B] text-sm mt-2 font-mono-data flex items-center justify-center gap-2">
            <Terminal className="w-3.5 h-3.5" />
            Secure SSH2 / SFTP Remote Access
          </p>
        </div>

        {/* Saved Connections */}
        {savedConnections.length > 0 && showSaved && (
          <div className="mb-4 bg-[#0A0A0A] border border-[#27272A]">
            <div className="px-4 py-2 border-b border-[#27272A] flex items-center justify-between">
              <span className="text-[10px] font-mono-data text-[#52525B] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Recent Connections
              </span>
              <button onClick={() => setShowSaved(false)} className="text-[10px] text-[#52525B] hover:text-white font-mono-data">Hide</button>
            </div>
            <div className="divide-y divide-[#27272A]/50">
              {savedConnections.slice(-5).reverse().map((conn) => (
                <div key={conn.id} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-[#141414] transition-colors">
                  <div className={`w-2 h-2 rounded-full ${conn.protocol === "sftp" ? "bg-[#4ADE80]" : "bg-[#60A5FA]"}`} />
                  <button onClick={() => handleQuickConnect(conn)} className="flex-1 text-left">
                    <div className="text-xs text-white font-mono-data">{conn.name}</div>
                    <div className="text-[10px] text-[#52525B] font-mono-data">{conn.protocol.toUpperCase()} / Port {conn.port}</div>
                  </button>
                  <button onClick={() => removeSavedConnection(conn.id)} className="p-1 text-[#52525B] hover:text-[#F87171] opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <ChevronRight className="w-3 h-3 text-[#52525B]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection Form */}
        <form onSubmit={handleConnect} className="bg-[#0A0A0A] border border-[#27272A] p-6 space-y-5">
          {/* Protocol Selection */}
          <div className="flex gap-2">
            <button type="button" onClick={() => setProtocol("sftp")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-mono-data border transition-all ${protocol === "sftp" ? "border-[#4ADE80] bg-[#4ADE80]/5 text-[#4ADE80]" : "border-[#27272A] text-[#A1A1AA] hover:text-white hover:border-[#3F3F46]"}`}>
              <Shield className="w-4 h-4" /> SFTP
            </button>
            <button type="button" onClick={() => setProtocol("ftp")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-mono-data border transition-all ${protocol === "ftp" ? "border-[#60A5FA] bg-[#60A5FA]/5 text-[#60A5FA]" : "border-[#27272A] text-[#A1A1AA] hover:text-white hover:border-[#3F3F46]"}`}>
              <Wifi className="w-4 h-4" /> FTP
            </button>
          </div>

          {/* Host & Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="host" className="text-xs font-mono-data text-[#52525B] uppercase tracking-wider">Host</Label>
              <Input id="host" type="text" placeholder="192.168.1.100 or example.com" value={host} onChange={(e) => setHost(e.target.value)}
                className="bg-[#141414] border-[#27272A] text-white font-mono-data text-sm h-9 focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] placeholder:text-[#3F3F46]" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="port" className="text-xs font-mono-data text-[#52525B] uppercase tracking-wider">Port</Label>
              <Input id="port" type="number" placeholder="22" value={port} onChange={(e) => setPort(e.target.value)}
                className="bg-[#141414] border-[#27272A] text-white font-mono-data text-sm h-9 focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80]" />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-mono-data text-[#52525B] uppercase tracking-wider">Username</Label>
            <Input id="username" type="text" placeholder="root" value={username} onChange={(e) => setUsername(e.target.value)}
              className="bg-[#141414] border-[#27272A] text-white font-mono-data text-sm h-9 focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] placeholder:text-[#3F3F46]" required />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-mono-data text-[#52525B] uppercase tracking-wider">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              className="bg-[#141414] border-[#27272A] text-white font-mono-data text-sm h-9 focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] placeholder:text-[#3F3F46]" />
            <p className="text-xs text-[#3F3F46] font-mono-data">Leave blank for key-based authentication</p>
          </div>

          {/* Connect Button */}
          <Button type="submit" disabled={isConnecting}
            className="w-full h-10 bg-[#4ADE80] hover:bg-[#22c55e] text-[#050505] font-semibold text-sm transition-all disabled:opacity-50">
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 spinner" /> Connecting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4" /> Connect to Server
              </span>
            )}
          </Button>

          {isConnecting && (
            <div className="flex items-center justify-center gap-2 text-xs font-mono-data text-[#FACC15]">
              <span className="w-2 h-2 rounded-full bg-[#FACC15] animate-pulse" />
              Handshaking... Authenticating...
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="mt-6 text-center space-y-1">
          <p className="text-xs text-[#3F3F46] font-mono-data">Encrypted SSH2 tunnel with AES-256-GCM</p>
          <p className="text-[10px] text-[#27272A] font-mono-data">v2.0.0 Enhanced Edition</p>
        </div>
      </div>
    </div>
  );
}
