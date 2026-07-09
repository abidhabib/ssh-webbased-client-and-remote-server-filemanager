import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { activityLogs } from "@db/schema";
import { desc, sql } from "drizzle-orm";

export const logsRouter = createRouter({
  list: publicQuery
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(1000).default(100),
          offset: z.number().int().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 100;
      const offset = input?.offset ?? 0;

      return db
        .select()
        .from(activityLogs)
        .orderBy(desc(activityLogs.timestamp))
        .limit(limit)
        .offset(offset);
    }),

  create: publicQuery
    .input(
      z.object({
        action: z.string().min(1),
        path: z.string().min(1),
        details: z.string().optional(),
        ip: z.string().optional(),
        userAgent: z.string().optional(),
        status: z.string().default("success"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(activityLogs).values({
        action: input.action,
        path: input.path,
        details: input.details,
        ip: input.ip,
        userAgent: input.userAgent,
        status: input.status,
      });
      return { success: true };
    }),

  clear: publicQuery.mutation(async () => {
    const db = getDb();
    await db.delete(activityLogs);
    return { success: true };
  }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const total = await db.select({ count: sql<number>`count(*)` }).from(activityLogs);
    const byAction = await db
      .select({
        action: activityLogs.action,
        count: sql<number>`count(*)`,
      })
      .from(activityLogs)
      .groupBy(activityLogs.action);

    return { total: total[0]?.count ?? 0, byAction };
  }),
});
