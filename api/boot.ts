import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import * as sftp from "./lib/sftp";
import { normalizePath } from "./lib/sftp";

const app = new Hono<{ Bindings: HttpBindings }>();

// Get mime type helper
function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mimeMap: Record<string, string> = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
    webp: "image/webp", svg: "image/svg+xml", ico: "image/x-icon", bmp: "image/bmp",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    avi: "video/x-msvideo", mkv: "video/x-matroska",
    mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
    flac: "audio/flac", aac: "audio/aac", m4a: "audio/mp4",
    pdf: "application/pdf", txt: "text/plain", md: "text/markdown",
    json: "application/json", xml: "application/xml", html: "text/html",
    css: "text/css", js: "application/javascript", csv: "text/csv",
    zip: "application/zip", tar: "application/x-tar", gz: "application/gzip",
    rar: "application/vnd.rar", "7z": "application/x-7z-compressed",
  };
  return mimeMap[ext] || "application/octet-stream";
}

// Stream file for preview (images, videos, audio, pdf)
app.get("/api/stream", async (c) => {
  const sessionId = c.req.query("sessionId");
  const path = c.req.query("path");

  if (!sessionId || !path) {
    return c.json({ error: "Missing sessionId or path" }, 400);
  }

  try {
    const normalizedPath = normalizePath("", path);
    const filename = normalizedPath.split("/").pop() || "file";
    const mimeType = getMimeType(filename);

    const content = await sftp.readFileBuffer(sessionId, normalizedPath);

    c.header("Content-Type", mimeType);
    c.header("Content-Length", content.length.toString());
    c.header("Cache-Control", "private, max-age=3600");

    // Inline display for viewable types
    if (mimeType.startsWith("image/") || mimeType.startsWith("video/") || mimeType.startsWith("audio/") || mimeType === "application/pdf") {
      c.header("Content-Disposition", `inline; filename="${filename}"`);
    } else {
      c.header("Content-Disposition", `attachment; filename="${filename}"`);
    }

    return c.body(content as any);
  } catch (error: any) {
    return c.json({ error: error.message || "Stream failed" }, 500);
  }
});

// File download endpoint
app.get("/api/download", async (c) => {
  const sessionId = c.req.query("sessionId");
  const path = c.req.query("path");

  if (!sessionId || !path) {
    return c.json({ error: "Missing sessionId or path" }, 400);
  }

  try {
    const normalizedPath = normalizePath("", path);
    const content = await sftp.readFileBuffer(sessionId, normalizedPath);
    const filename = normalizedPath.split("/").pop() || "download";

    c.header("Content-Type", "application/octet-stream");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    c.header("Content-Length", content.length.toString());

    return c.body(content as any);
  } catch (error: any) {
    return c.json({ error: error.message || "Download failed" }, 500);
  }
});

// Bulk download as ZIP
app.post("/api/download-zip", bodyLimit({ maxSize: 500 * 1024 * 1024 }), async (c) => {
  const sessionId = c.req.query("sessionId");
  if (!sessionId) return c.json({ error: "Missing sessionId" }, 400);

  try {
    const body = await c.req.json();
    const paths = body.paths as string[];
    if (!paths || paths.length === 0) return c.json({ error: "No paths provided" }, 400);

    const tempDir = await sftp.getTempDir();
    const zipPath = `${tempDir}/download_${Date.now()}.zip`;

    await sftp.createZipDownload(sessionId, paths, zipPath);

    const fs = await import("fs");
    const content = await fs.promises.readFile(zipPath);
    await sftp.cleanupTempFile(zipPath);

    c.header("Content-Type", "application/zip");
    c.header("Content-Disposition", `attachment; filename="files.zip"`);
    c.header("Content-Length", content.length.toString());

    return c.body(content as any);
  } catch (error: any) {
    return c.json({ error: error.message || "ZIP creation failed" }, 500);
  }
});

// File upload endpoint (multipart/form-data)
app.post("/api/upload", bodyLimit({ maxSize: 500 * 1024 * 1024 }), async (c) => {
  const sessionId = c.req.query("sessionId");
  const remotePath = c.req.query("path");

  if (!sessionId || !remotePath) {
    return c.json({ error: "Missing sessionId or path" }, 400);
  }

  try {
    const body = await c.req.parseBody();
    const file = body.file;

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file provided" }, 400);
    }

    const normalizedPath = normalizePath("", remotePath);
    const remoteFilePath = normalizedPath + "/" + file.name;

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = await sftp.saveTempFile(buffer, file.name);
    await sftp.uploadFile(sessionId, tempPath, remoteFilePath);
    await sftp.cleanupTempFile(tempPath);

    return c.json({ success: true, path: remoteFilePath });
  } catch (error: any) {
    return c.json({ error: error.message || "Upload failed" }, 500);
  }
});

// tRPC endpoint
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
