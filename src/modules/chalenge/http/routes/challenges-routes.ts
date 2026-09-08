import type { FastifyInstance } from "fastify";
import { adminMiddleware } from "@/shared/http/middleware/auth-adim-middleware";
import { authMiddleware } from "@/shared/http/middleware/auth-middleware";
import { completeChallenge } from "../controllers/complete-challenge";
import { completeChallengeCode } from "../controllers/complete-challenge-code";
import { createChallenge } from "../controllers/create-challenge";
import { listChallenges } from "../controllers/list-challenges";
import { listChallengesAdmin } from "../controllers/list-challenges-admin";
import { listOneChallenge } from "../controllers/list-one-challenge";
import { updateChallenge } from "../controllers/update-challenge";

export function challengesRoutes(app: FastifyInstance) {
   app.get(
      "/admin/challenges",
      { preHandler: [authMiddleware, adminMiddleware] },
      listChallengesAdmin,
   );

   app.post(
      "/admin/challenges",
      { preHandler: [authMiddleware, adminMiddleware] },
      createChallenge,
   );

   app.put(
      "/admin/challenges/:challengeId",
      { preHandler: [authMiddleware, adminMiddleware] },
      updateChallenge,
   );

   app.get(
      "/challenges/:tracksSlug",
      { preHandler: [authMiddleware] },
      listChallenges,
   );

   app.get(
      "/challenges/list-one/:slug",
      { preHandler: [authMiddleware] },
      listOneChallenge,
   );

   app.post(
      "/challenges/complete/:slug",
      { preHandler: [authMiddleware] },
      completeChallenge,
   );

   app.post(
      "/challenges/complete-code/:slug",
      { preHandler: [authMiddleware] },
      completeChallengeCode,
   );
}
