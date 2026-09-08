import type { FastifyReply, FastifyRequest } from "fastify";
import { verify } from "jsonwebtoken";
import { env } from "@/env";
import { AppError } from "@/errors/app.errors";

export function authMiddleware(
   req: FastifyRequest,
   _: FastifyReply,
   next: () => void,
) {
   const accessToken = req.cookies["auth:accessToken"];

   if (!accessToken) {
      throw new AppError("User unauthorized", 401);
   }

   try {
      const decoded = verify(accessToken, env.SECRETE_AUTH) as unknown as {
         sub: {
            id: string;
         };
      };

      req.user = {
         id: decoded.sub.id,
      };

      return next();
   } catch {
      throw new AppError("User unauthorized", 401);
   }
}
