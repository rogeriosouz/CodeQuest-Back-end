import type { FastifyReply, FastifyRequest } from "fastify";
import { verify } from "jsonwebtoken";
import { env } from "@/env";
import { AppError } from "@/errors/app.errors";
import { UserDrizzleRepository } from "@/modules/user/infra/drizzle/user.drizzle.repository";

export async function adminMiddleware(req: FastifyRequest, _: FastifyReply) {
   const accessToken = req.cookies["auth:accessToken"];

   if (!accessToken) {
      throw new AppError("User unauthorized", 401);
   }

   const decoded = verify(accessToken, env.SECRETE_AUTH) as unknown as {
      sub: {
         id: string;
      };
   };

   const user = await new UserDrizzleRepository().findById(
      decoded.sub?.id ?? "",
   );

   if (!user) {
      throw new AppError("User unauthorized", 401);
   }

   if (!user.isAdmin) {
      throw new AppError("Admin access required", 403);
   }

   req.user = {
      id: decoded.sub.id,
   };
}
