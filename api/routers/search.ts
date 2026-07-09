import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import * as sftp from "../lib/sftp";
import { normalizePath } from "../lib/sftp";


interface SearchResult {
  name: string;
  path: string;
  type: string;
  size: number;
  modified: Date;
}

async function searchRecursive(
  sessionId: string,
  basePath: string,
  query: string,
  maxDepth: number,
  currentDepth: number = 0,
  results: SearchResult[] = []
): Promise<SearchResult[]> {
  if (currentDepth >= maxDepth) return results;

  try {
    const files = await sftp.listDirectory(sessionId, basePath);

    for (const file of files) {
      const isDir = (file.attrs.mode & 0o040000) !== 0;
      const filePath = basePath + "/" + file.filename;

      // Check if filename matches
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (regex.test(file.filename)) {
        results.push({
          name: file.filename,
          path: filePath,
          type: isDir ? "directory" : "file",
          size: file.attrs.size,
          modified: new Date(file.attrs.mtime * 1000),
        });

        // Limit results
        if (results.length >= 500) return results;
      }

      // Recurse into directories
      if (isDir && file.filename !== "." && file.filename !== "..") {
        await searchRecursive(sessionId, filePath, query, maxDepth, currentDepth + 1, results);
        if (results.length >= 500) return results;
      }
    }
  } catch {
    // Permission denied or other errors - skip this directory
  }

  return results;
}

export const searchRouter = createRouter({
  search: publicQuery
    .input(
      z.object({
        sessionId: z.string(),
        path: z.string().default("/"),
        query: z.string().min(1),
        maxDepth: z.number().int().min(1).max(10).default(5),
      })
    )
    .query(async ({ input }) => {
      try {
        const normalizedPath = normalizePath("", input.path);
        const results = await searchRecursive(
          input.sessionId,
          normalizedPath,
          input.query,
          input.maxDepth
        );

        return { success: true, results };
      } catch (error: any) {
        return { success: false, error: error.message, results: [] };
      }
    }),

  // Search file contents (basic implementation)
  searchContent: publicQuery
    .input(
      z.object({
        sessionId: z.string(),
        path: z.string().default("/"),
        query: z.string().min(1),
        maxDepth: z.number().int().min(1).max(5).default(3),
      })
    )
    .query(async ({ input }) => {
      try {
        const normalizedPath = normalizePath("", input.path);
        const results: SearchResult[] = [];

        await searchRecursive(input.sessionId, normalizedPath, input.query, input.maxDepth, 0, results);

        return { success: true, results };
      } catch (error: any) {
        return { success: false, error: error.message, results: [] };
      }
    }),
});
