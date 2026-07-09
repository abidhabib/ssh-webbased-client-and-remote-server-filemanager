import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import * as sftp from "../lib/sftp";
import { normalizePath } from "../lib/sftp";

export const uploadRouter = createRouter({
  downloadFile: publicQuery
    .input(z.object({ sessionId: z.string(), remotePath: z.string() }))
    .query(async ({ input }) => {
      try {
        const normalizedPath = normalizePath("", input.remotePath);
        const content = await sftp.readFileBuffer(input.sessionId, normalizedPath);
        const base64 = content.toString("base64");
        const filename = normalizedPath.split("/").pop() || "download";
        const mimeType = getMimeType(filename);
        return { success: true, content: base64, filename, mimeType };
      } catch (error: any) {
        return { success: false, error: error.message, content: "", filename: "", mimeType: "" };
      }
    }),

  getMimeType: publicQuery
    .input(z.object({ filename: z.string() }))
    .query(({ input }) => {
      return { mimeType: getMimeType(input.filename) };
    }),
});

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mimeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    bmp: "image/bmp",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    flac: "audio/flac",
    aac: "audio/aac",
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/markdown",
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    csv: "text/csv",
    zip: "application/zip",
    tar: "application/x-tar",
    gz: "application/gzip",
    rar: "application/vnd.rar",
    "7z": "application/x-7z-compressed",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };
  return mimeMap[ext] || "application/octet-stream";
}
