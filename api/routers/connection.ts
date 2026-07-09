import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import * as sftp from "../lib/sftp";

export const connectionRouter = createRouter({
  connect: publicQuery
    .input(
      z.object({
        host: z.string().min(1),
        port: z.number().int().min(1).max(65535).default(22),
        username: z.string().min(1),
        password: z.string().optional(),
        privateKey: z.string().optional(),
        passphrase: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const sessionId = await sftp.connect({
          host: input.host,
          port: input.port,
          username: input.username,
          password: input.password,
          privateKey: input.privateKey,
          passphrase: input.passphrase,
        });
        return { success: true, sessionId };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Connection failed",
        };
      }
    }),

  disconnect: publicQuery
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input }) => {
      sftp.disconnect(input.sessionId);
      return { success: true };
    }),

  status: publicQuery
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => {
      return { connected: sftp.isConnected(input.sessionId) };
    }),
});
