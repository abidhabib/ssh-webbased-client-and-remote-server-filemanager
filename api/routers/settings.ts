import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { settings } from "@db/schema";
import { eq } from "drizzle-orm";

export const settingsRouter = createRouter({
  get: publicQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(settings)
        .where(eq(settings.key, input.key));

      return result[0] ?? null;
    }),

  getAll: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(settings);
  }),

  set: publicQuery
    .input(
      z.object({
        key: z.string().min(1),
        value: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check if exists
      const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.key, input.key));

      if (existing.length > 0) {
        await db
          .update(settings)
          .set({ value: input.value, updatedAt: new Date() })
          .where(eq(settings.key, input.key));
      } else {
        await db.insert(settings).values({
          key: input.key,
          value: input.value,
        });
      }

      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(settings).where(eq(settings.key, input.key));
      return { success: true };
    }),
});
