import type { FastifyInstance } from "fastify";
import { authMiddleware } from "@/shared/http/middleware/auth-middleware";
import { acceptDuels } from "../controllers/accept-duels";
import { checkDuelWinner } from "../controllers/check-duel-winner";
import { completeDuel } from "../controllers/complete-duel";
import { createDuels } from "../controllers/create-duels";
import { listDuels } from "../controllers/list-duels";
import { listOneDuel } from "../controllers/list-one-duel";
import { refuseDuels } from "../controllers/refuse-duels";
import { userGiveUp } from "../controllers/user-give-up";

export function duelsRoutes(app: FastifyInstance) {
   app.get("/duels", { preHandler: [authMiddleware] }, listDuels);
   app.get("/duels/:id", { preHandler: [authMiddleware] }, listOneDuel);
   app.get(
      "/duels/:id/winner",
      { preHandler: [authMiddleware] },
      checkDuelWinner,
   );
   app.post("/duels", { preHandler: [authMiddleware] }, createDuels);
   app.post("/refuse-duels", { preHandler: [authMiddleware] }, refuseDuels);
   app.post("/accept-duels", { preHandler: [authMiddleware] }, acceptDuels);
   app.post(
      "/user-give-up-duels",
      { preHandler: [authMiddleware] },
      userGiveUp,
   );
   app.post(
      "/duels/complete-duel",
      { preHandler: [authMiddleware] },
      completeDuel,
   );
}
