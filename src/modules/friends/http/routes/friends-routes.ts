import type { FastifyInstance } from "fastify";
import { authMiddleware } from "@/shared/http/middleware/auth-middleware";
import { acceptRequestFriend } from "../controllers/accept-request-friend";
import { addRequestFriend } from "../controllers/add-request-friends";
import { listFriends } from "../controllers/list-friends";
import { listRequestFriends } from "../controllers/list-request-friends";
import { refuseRequestFriend } from "../controllers/refuse-request-friends";
import { searchUsers } from "../controllers/search-users";

export function friendsRoutes(app: FastifyInstance) {
   app.get("/friends", { onRequest: [authMiddleware] }, listFriends);
   app.get("/friends/search", { onRequest: [authMiddleware] }, searchUsers);
   app.get(
      "/request-friends",
      { onRequest: [authMiddleware] },
      listRequestFriends,
   );
   app.post(
      "/request-friend",
      { onRequest: [authMiddleware] },
      addRequestFriend,
   );

   app.post(
      "/refuse-request-friend",
      { onRequest: [authMiddleware] },
      refuseRequestFriend,
   );

   app.post(
      "/accept-request-friend",
      { onRequest: [authMiddleware] },
      acceptRequestFriend,
   );
}
