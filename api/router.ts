import { createRouter, publicQuery } from "./middleware";
import { connectionRouter } from "./routers/connection";
import { fileOpsRouter } from "./routers/fileOps";
import { uploadRouter } from "./routers/upload";
import { favoritesRouter } from "./routers/favorites";
import { logsRouter } from "./routers/logs";
import { settingsRouter } from "./routers/settings";
import { searchRouter } from "./routers/search";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  connection: connectionRouter,
  file: fileOpsRouter,
  upload: uploadRouter,
  favorites: favoritesRouter,
  logs: logsRouter,
  settings: settingsRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
