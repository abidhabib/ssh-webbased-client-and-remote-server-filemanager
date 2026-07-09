import { useState, useEffect, useRef, useCallback } from "react";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Volume2,
  Loader2,
  AlertTriangle,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function getFileCategory(name: string): "image" | "video" | "audio" | "pdf" | "text" | "code" | "binary" {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (["txt", "md", "csv", "log", "env"].includes(ext)) return "text";
  if (["js", "ts", "jsx", "tsx", "json", "html", "css", "py", "java", "php", "go", "rs", "sql", "xml", "yml", "yaml", "sh", "bash", "dockerfile", "conf", "ini", "nginx"].includes(ext)) return "code";
  return "binary";
}

export default function PreviewPanel() {
  const { previewFile, setPreviewFile, sessionId, addLog } = useFileManagerStore();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const category = previewFile ? getFileCategory(previewFile.name) : "binary";

  // Create object URL from stream endpoint
  useEffect(() => {
    if (!previewFile || !sessionId) return;

    // For viewable types, we use the /api/stream endpoint via fetch to create a blob URL
    if (["image", "video", "audio", "pdf"].includes(category)) {
      setLoading(true);
      setError(null);

      const url = `/api/stream?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(previewFile.path)}`;

      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          objectUrlRef.current = objectUrl;
          setStreamUrl(objectUrl);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [previewFile, sessionId, category]);

  const handleDownload = useCallback(() => {
    if (!previewFile || !sessionId) return;
    const url = `/api/download?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(previewFile.path)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = previewFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloading: ${previewFile.name}`);
    addLog({ message: `Downloaded: ${previewFile.path}`, type: "download" });
  }, [previewFile, sessionId, addLog]);

  const handleClose = useCallback(() => {
    setPreviewFile(null);
    setZoom(1);
    setRotation(0);
    setStreamUrl(null);
    setError(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, [setPreviewFile]);

  if (!previewFile) return null;

  return (
    <div className="absolute inset-0 z-40 bg-[#050505]/95 flex items-center justify-center fade-in">
      <div className="w-[95%] h-[95%] bg-[#0A0A0A] border border-[#27272A] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="h-[44px] bg-[#0A0A0A] border-b border-[#27272A] flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-mono-data text-white truncate max-w-[500px]">{previewFile.name}</span>
            <span className="text-[10px] font-mono-data text-[#52525B] px-2 py-0.5 bg-[#141414] border border-[#27272A] uppercase">{category}</span>
            {previewFile.size > 0 && (
              <span className="text-[10px] font-mono-data text-[#52525B]">{formatSize(previewFile.size)}</span>
            )}
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            {category === "image" && (
              <>
                <button onClick={() => setZoom((z) => Math.min(z + 0.25, 5))} className="preview-action-btn" title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))} className="preview-action-btn" title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => setRotation((r) => r + 90)} className="preview-action-btn" title="Rotate"><RotateCw className="w-4 h-4" /></button>
              </>
            )}
            <button onClick={handleDownload} className="preview-action-btn text-[#4ADE80]" title="Download"><Download className="w-4 h-4" /></button>
            <button onClick={handleClose} className="preview-action-btn text-[#F87171] hover:bg-[#F87171]/10" title="Close"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-[#050505] flex items-center justify-center relative">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 spinner text-[#60A5FA]" />
              <span className="text-xs text-[#52525B] font-mono-data">Loading preview...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="w-12 h-12 text-[#F87171]" />
              <div className="text-center">
                <p className="text-sm text-[#F87171] font-mono-data mb-1">Failed to load preview</p>
                <p className="text-xs text-[#52525B] font-mono-data">{error}</p>
              </div>
              <Button onClick={handleDownload} className="bg-[#4ADE80] hover:bg-[#22c55e] text-[#050505]">
                <Download className="w-4 h-4 mr-2" /> Download Instead
              </Button>
            </div>
          )}

          {/* Image */}
          {!loading && !error && category === "image" && streamUrl && (
            <img
              src={streamUrl}
              alt={previewFile.name}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
              draggable={false}
            />
          )}

          {/* Video */}
          {!loading && !error && category === "video" && streamUrl && (
            <video src={streamUrl} controls className="max-w-full max-h-full" autoPlay>
              Your browser does not support video playback.
            </video>
          )}

          {/* Audio */}
          {!loading && !error && category === "audio" && streamUrl && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-[#141414] border-2 border-[#27272A] flex items-center justify-center">
                <Volume2 className="w-10 h-10 text-[#60A5FA]" />
              </div>
              <span className="text-sm text-white font-mono-data">{previewFile.name}</span>
              <audio src={streamUrl} controls autoPlay className="w-[400px]" />
            </div>
          )}

          {/* PDF */}
          {!loading && !error && category === "pdf" && streamUrl && (
            <iframe src={streamUrl} className="w-full h-full" title={previewFile.name} />
          )}

          {/* Binary / Unsupported */}
          {!loading && !error && ["binary", "text", "code"].includes(category) && (
            <div className="flex flex-col items-center gap-4">
              <FileCode className="w-16 h-16 text-[#52525B]" />
              <div className="text-center">
                <p className="text-sm text-[#A1A1AA] font-mono-data mb-1">{previewFile.name}</p>
                <p className="text-xs text-[#52525B] font-mono-data">
                  {category === "code" || category === "text"
                    ? "Use the editor to view this file (double-click to open)"
                    : "This file type cannot be previewed in the browser"}
                </p>
              </div>
              <Button onClick={handleDownload} className="bg-[#4ADE80] hover:bg-[#22c55e] text-[#050505]">
                <Download className="w-4 h-4 mr-2" /> Download File
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
