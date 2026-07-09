import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { favorites, recentFiles } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const favoritesRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(favorites).orderBy(favorites.createdAt);
  }),

  add: publicQuery
    .input(
      z.object({
        path: z.string().min(1),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      // Check if already exists
      const existing = await db
        .select()
        .from(favorites)
        .where(eq(favorites.path, input.path));

      if (existing.length > 0) {
        return { success: true, id: existing[0].id };
      }

      const result = await db.insert(favorites).values({
        path: input.path,
        name: input.name,
      });
      return { success: true, id: Number(result[0].insertId) };
    }),

  remove: publicQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(favorites).where(eq(favorites.id, input.id));
      return { success: true };
    }),

  // Recent files
  recentList: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(recentFiles).orderBy(desc(recentFiles.accessedAt)).limit(20);
  }),

  addRecent: publicQuery
    .input(
      z.object({
        path: z.string().min(1),
        name: z.string().min(1),
        type: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Remove old entry if exists
      await db.delete(recentFiles).where(eq(recentFiles.path, input.path));

      // Add new entry
      await db.insert(recentFiles).values({
        path: input.path,
        name: input.name,
        type: input.type,
      });

      return { success: true };
    }),

  clearRecent: publicQuery.mutation(async () => {
    const db = getDb();
    await db.delete(recentFiles);
    return { success: true };
  }),
});
