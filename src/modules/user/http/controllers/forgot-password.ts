import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { InvalidCredentialsError } from "@/errors/InvalidCredentialsError";
import { MailService } from "@/shared/mail/mail.service";
import { RefreshTokenDrizzleRepository } from "../../infra/drizzle/refresh.token.drizzle.repository";
import { UserDrizzleRepository } from "../../infra/drizzle/user.drizzle.repository";
import { ForgotPasswordUseCase } from "../../use-cases/forgot-password";

export async function forgotPassword(req: FastifyRequest, reply: FastifyReply) {
   const forgotPasswordSchema = z.object({
      email: z.email(),
   });

   const { email } = forgotPasswordSchema.parse(req.body);

   try {
      const usersRepository = new UserDrizzleRepository();
      const refreshTokenRepository = new RefreshTokenDrizzleRepository();
      const mailService = new MailService();

      const forgotPasswordUseCase = new ForgotPasswordUseCase(
         usersRepository,
         refreshTokenRepository,
         mailService,
      );

      await forgotPasswordUseCase.execute({
         email,
      });

      return reply.status(200).send({
         message: "email sent successful",
         statusCode: 200,
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
