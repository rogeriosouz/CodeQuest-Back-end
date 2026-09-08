import type { FastifyReply, FastifyRequest } from "fastify";
import { sign } from "jsonwebtoken";
import { env } from "@/env";
import { InvalidCredentialsError } from "@/errors/InvalidCredentialsError";
import { RefreshTokenDrizzleRepository } from "../../infra/drizzle/refresh.token.drizzle.repository";
import { RefreshTokenUseCase } from "../../use-cases/refresh-token";

export async function refreshToken(req: FastifyRequest, reply: FastifyReply) {
   if (!req.cookies.refreshToken) {
      throw new InvalidCredentialsError();
   }

   const isRefreshToken = req.unsignCookie(req.cookies.refreshToken as string);

   if (!isRefreshToken.valid) {
      throw new InvalidCredentialsError();
   }

   try {
      const refreshTokenDrizzleRepository = new RefreshTokenDrizzleRepository();

      const refreshTokenUseCase = new RefreshTokenUseCase(
         refreshTokenDrizzleRepository,
      );

      const { user } = await refreshTokenUseCase.execute({
         refreshToken: isRefreshToken.value,
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const accessToken = sign(
         {
            sub: {
               id: user.id,
               name: user.name,
               email: user.email,
            },
         },
         env.SECRETE_AUTH,
         {
            expiresIn: "10m",
         },
      );

      return reply.status(200).send({
         message: "success refresh token",
         statusCode: 200,
         token: accessToken,
         user: {
            id: user.id,
            name: user.name,
            email: user.email,
         },
      });
   } catch (err) {
      if (err instanceof InvalidCredentialsError) {
         return reply.status(401).send({
            statusCode: 401,
            message: err.message,
         });
      }

      throw err;
   }
}
