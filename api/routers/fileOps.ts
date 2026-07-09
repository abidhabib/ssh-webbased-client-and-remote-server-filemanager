import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import * as sftp from "../lib/sftp";
import { normalizePath } from "../lib/sftp";

export const fileOpsRouter = createRouter({
  list: publicQuery
    .input(z.object({ sessionId: z.string(), path: z.string().default("/") }))
    .query(async ({ input }) => {
      try {
        const normalizedPath = normalizePath("", input.path);
        const files = await sftp.listDirectory(input.sessionId, normalizedPath);
        const entries = files.map((file) => {
          const isDir = (file.attrs.mode & 0o040000) !== 0;
          const isLink = (file.attrs.mode & 0o120000) !== 0;
          const modeStr = (file.attrs.mode & 0o7777).toString(8).padStart(4, "0");
          return {
            name: file.filename,
            path: normalizedPath + "/" + file.filename,
            type: isDir ? "directory" as const : isLink ? "link" as const : "file" as const,
            size: file.attrs.size,
            owner: file.attrs.uid.toString(),
            group: file.attrs.gid.toString(),
            permissions: modeStr,
            modified: new Date(file.attrs.mtime * 1000),
            accessed: new Date(file.attrs.atime * 1000),
          };
        });
        return { success: true, entries };
      } catch (error: any) {
        return { success: false, error: error.message, entries: [] };
      }
    }),

  stat: publicQuery
    .input(z.object({ sessionId: z.string(), path: z.string() }))
    .query(async ({ input }) => {
      try {
        const normalizedPath = normalizePath("", input.path);
        const stats = (await sftp.statFile(input.sessionId, normalizedPath)) as any;
        const isDir = (stats.mode & 0o040000) !== 0;
        const modeStr = (stats.mode & 0o7777).toString(8).padStart(4, "0");
        return {
          success: true,
          stats: {
            path: normalizedPath,
            type: isDir ? "directory" : "file",
            size: stats.size,
            owner: stats.uid.toString(),
            group: stats.gid.toString(),
            permissions: modeStr,
            modified: new Date(stats.mtime * 1000),
            accessed: new Date(stats.atime * 1000),
            mode: stats.mode,
          },
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  createFile: publicQuery
    .input(z.object({ sessionId: z.string(), path: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await sftp.writeFileContent(input.sessionId, normalizePath("", input.path), "");
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  createDirectory: publicQuery
    .input(z.object({ sessionId: z.string(), path: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await sftp.createDirectory(input.sessionId, normalizePath("", input.path));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  delete: publicQuery
    .input(z.object({ sessionId: z.string(), path: z.string(), isDirectory: z.boolean().default(false) }))
    .mutation(async ({ input }) => {
      try {
        const normalizedPath = normalizePath("", input.path);
        if (input.isDirectory) {
          await sftp.deleteDirectory(input.sessionId, normalizedPath);
        } else {
          await sftp.deleteFile(input.sessionId, normalizedPath);
        }
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  bulkDelete: publicQuery
    .input(z.object({
      sessionId: z.string(),
      items: z.array(z.object({ path: z.string(), isDirectory: z.boolean() })),
    }))
    .mutation(async ({ input }) => {
      const results: { path: string; success: boolean; error?: string }[] = [];
      for (const item of input.items) {
        try {
          const normalizedPath = normalizePath("", item.path);
          if (item.isDirectory) {
            await sftp.deleteDirectory(input.sessionId, normalizedPath);
          } else {
            await sftp.deleteFile(input.sessionId, normalizedPath);
          }
          results.push({ path: item.path, success: true });
        } catch (error: any) {
          results.push({ path: item.path, success: false, error: error.message });
        }
      }
      return { results };
    }),

  rename: publicQuery
    .input(z.object({ sessionId: z.string(), oldPath: z.string(), newPath: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await sftp.renameFile(input.sessionId, normalizePath("", input.oldPath), normalizePath("", input.newPath));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  move: publicQuery
    .input(z.object({ sessionId: z.string(), sourcePath: z.string(), targetPath: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await sftp.renameFile(input.sessionId, normalizePath("", input.sourcePath), normalizePath("", input.targetPath));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  copy: publicQuery
    .input(z.object({ sessionId: z.string(), sourcePath: z.string(), targetPath: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const content = await sftp.readFileBuffer(input.sessionId, normalizePath("", input.sourcePath));
        await sftp.writeFileContent(input.sessionId, normalizePath("", input.targetPath), content.toString("utf8"));
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  duplicate: publicQuery
    .input(z.object({ sessionId: z.string(), path: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const normalizedPath = normalizePath("", input.path);
        const parts = normalizedPath.split("/");
        const filename = parts.pop() || "file";
        const dir = parts.join("/") || "/";
        const nameParts = filename.split(".");
        const ext = nameParts.length > 1 ? `.${nameParts.pop()}` : "";
        const baseName = nameParts.join(".");
        const newName = `${baseName}-copy${ext}`;
        const newPath = `${dir}/${newName}`.replace(/\/+/g, "/");
        const content = await sftp.readFileBuffer(input.sessionId, normalizedPath);
        await sftp.writeFileContent(input.sessionId, newPath, content.toString("utf8"));
        return { success: true, newPath };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  chmod: publicQuery
    .input(z.object({ sessionId: z.string(), path: z.string(), mode: z.number().int().min(0).max(0o7777) }))
    .mutation(async ({ input }) => {
      try {
        await sftp.chmodFile(input.sessionId, normalizePath("", input.path), input.mode);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  chown: publicQuery
    .input(z.object({ sessionId: z.string(), path: z.string(), uid: z.number().int(), gid: z.number().int() }))
    .mutation(async ({ input }) => {
      try {
        await sftp.chownFile(input.sessionId, normalizePath("", input.path), input.uid, input.gid);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  readFile: publicQuery
    .input(z.object({ sessionId: z.string(), path: z.string() }))
    .query(async ({ input }) => {
      try {
        const content = await sftp.readFileContent(input.sessionId, normalizePath("", input.path));
        return { success: true, content };
      } catch (error: any) {
        return { success: false, error: error.message, content: "" };
      }
    }),

  writeFile: publicQuery
    .input(z.object({ sessionId: z.string(), path: z.string(), content: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await sftp.writeFileContent(input.sessionId, normalizePath("", input.path), input.content);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  diskUsage: publicQuery
    .input(z.object({ sessionId: z.string(), path: z.string().default("/") }))
    .query(async ({ input }) => {
      try {
        const usage = await sftp.getDiskUsage(input.sessionId, normalizePath("", input.path));
        return { success: true, ...usage };
      } catch (error: any) {
        return { success: false, error: error.message, total: 0, used: 0, free: 0 };
      }
    }),

  dirSize: publicQuery
    .input(z.object({ sessionId: z.string(), path: z.string() }))
    .query(async ({ input }) => {
      try {
        const size = await sftp.getDirectorySize(input.sessionId, normalizePath("", input.path));
        return { success: true, size };
      } catch (error: any) {
        return { success: false, error: error.message, size: 0 };
      }
    }),

  execute: publicQuery
    .input(z.object({ sessionId: z.string(), command: z.string() }))
    .query(async ({ input }) => {
      try {
        const output = await sftp.executeCommand(input.sessionId, input.command);
        return { success: true, output };
      } catch (error: any) {
        return { success: false, error: error.message, output: "" };
      }
    }),
});
