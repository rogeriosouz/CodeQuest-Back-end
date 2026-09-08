import type { FastifyInstance } from "fastify";
import { adminMiddleware } from "@/shared/http/middleware/auth-adim-middleware";
import { createTrack } from "../controllers/create-track";
import { createTrackFromPrompt } from "../controllers/create-track-from-prompt";
import { listTracks } from "../controllers/list-tracks";
import { updateTrack } from "../controllers/update-track";

export function tracksRoutes(app: FastifyInstance) {
   app.get("/tracks", { onRequest: [adminMiddleware] }, listTracks);
   app.put(
      "/admin/tracks/:tracksId",
      { onRequest: [adminMiddleware] },
      updateTrack,
   );
   app.post(
      "/admin/tracks",
      { onRequest: [adminMiddleware, adminMiddleware] },
      createTrack,
   );
   app.post(
      "/admin/tracks/from-prompt",
      { onRequest: [adminMiddleware, adminMiddleware] },
      createTrackFromPrompt,
   );
}
