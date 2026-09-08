import type { FastifyReply, FastifyRequest } from "fastify";
import { sign } from "jsonwebtoken";
import z from "zod";
import { env } from "@/env";
import { UserAlreadyExistsError } from "@/errors/UserAlreadyExistsError";
import { RefreshTokenDrizzleRepository } from "../../infra/drizzle/refresh.token.drizzle.repository";
import { UserDrizzleRepository } from "../../infra/drizzle/user.drizzle.repository";
import { RegisterUseCase } from "../../use-cases/register";

export async function register(req: FastifyRequest, reply: FastifyReply) {
   const registerSchema = z.object({
      name: z.string().min(1),
      email: z.email(),
      password: z.string().min(5),
   });

   const { name, email, password } = registerSchema.parse(req.body);

   try {
      const usersRepository = new UserDrizzleRepository();
      const refreshTokenRepository = new RefreshTokenDrizzleRepository();
      const registerUseCase = new RegisterUseCase(
         usersRepository,
         refreshTokenRepository,
      );
      const { user, tokenHash } = await registerUseCase.execute({
         name,
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
         .status(201)
         .setCookie("refreshToken", tokenHash, {
            path: "/",
            expires: expiresAt,
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            signed: true,
         })
         .send({
            message: "success register user",
            statusCode: 201,
            token: accessToken,
            user: {
               id: user.id,
               name: user.name,
               email: user.email,
            },
         });
   } catch (err) {
      if (err instanceof UserAlreadyExistsError) {
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
      }

      throw err;
   }
}
