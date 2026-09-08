import type { FastifyReply, FastifyRequest } from "fastify";
import { sign } from "jsonwebtoken";
import z from "zod";
import { env } from "@/env";
import { InvalidCredentialsError } from "@/errors/InvalidCredentialsError";
import { RefreshTokenDrizzleRepository } from "../../infra/drizzle/refresh.token.drizzle.repository";
import { UserDrizzleRepository } from "../../infra/drizzle/user.drizzle.repository";
import { SigninUseCase } from "../../use-cases/signin";

export async function signin(req: FastifyRequest, reply: FastifyReply) {
   const signinSchema = z.object({
      email: z.email(),
      password: z.string().min(5),
   });

   const { email, password } = signinSchema.parse(req.body);

   try {
      const usersRepository = new UserDrizzleRepository();
      const refreshTokenRepository = new RefreshTokenDrizzleRepository();
      const signinUseCase = new SigninUseCase(
         usersRepository,
         refreshTokenRepository,
      );

      const { user, tokenHash } = await signinUseCase.execute({
         email,
         password,
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

      return reply
         .status(200)
         .setCookie("refreshToken", tokenHash, {
            path: "/",
            expires: expiresAt,
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            signed: true,
         })
         .send({
            message: "success signin user",
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
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
      }

      throw err;
   }
}
