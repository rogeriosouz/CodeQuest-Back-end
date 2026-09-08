import fastifyRateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import { adminMiddleware } from "@/shared/http/middleware/auth-adim-middleware";
import { authMiddleware } from "@/shared/http/middleware/auth-middleware";
import { adminSignin } from "../controllers/admin-signin";
import { forgotPassword } from "../controllers/forgot-password";
import { listMy } from "../controllers/list-my";
import { listUser } from "../controllers/list-user";
import { listUsersAdmin } from "../controllers/list-users-admin";
import { recoveryPassword } from "../controllers/recovery-password";
import { refreshToken } from "../controllers/refresh-token";
import { register } from "../controllers/register";
import { signin } from "../controllers/signin";
import { updateUser } from "../controllers/update-user";
import { updateUserAdmin } from "../controllers/update-user-admin";

export async function usersRouters(app: FastifyInstance) {
   // admin
   app.get(
      "/admin/users",
      { preHandler: [authMiddleware, adminMiddleware] },
      listUsersAdmin,
   );
   app.put(
      "/admin/users/:userId",
      { preHandler: [authMiddleware, adminMiddleware] },
      updateUserAdmin,
   );

   // list user
   app.get("/user/:displayName", { preHandler: [authMiddleware] }, listUser);
   app.get("/my", { preHandler: [authMiddleware] }, listMy);

   // update user
   app.put("/profile", { preHandler: [authMiddleware] }, updateUser);

   await app.register(fastifyRateLimit, {
      max: 5,
      timeWindow: "1 minute",
   });

   // auth
   app.post("/auth/refresh-token", refreshToken);
   app.post("/auth/register", register);
   app.post("/auth/signin", signin);
   app.post("/auth/admin/signin", adminSignin);
   app.post("/auth/forgot-password", forgotPassword);
   app.post("/auth/recovery-password", recoveryPassword);
}
