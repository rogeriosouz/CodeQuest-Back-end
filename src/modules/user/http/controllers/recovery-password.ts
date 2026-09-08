import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { TokenInvalidError } from "@/errors/TokenInvalidError";
import { RefreshTokenDrizzleRepository } from "../../infra/drizzle/refresh.token.drizzle.repository";
import { UserDrizzleRepository } from "../../infra/drizzle/user.drizzle.repository";
import { RecoveryPasswordUseCase } from "../../use-cases/recovery-password";

export async function recoveryPassword(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   const recoveryPasswordSchema = z
      .object({
         token: z.string(),
         newPassword: z.string().min(5),
         confirmNewPassword: z.string().min(5),
      })
      .refine((data) => data.newPassword === data.confirmNewPassword, {
         message: "Passwords do not match",
         path: ["confirmPassword"], // Error appears on this field
      });

   const { token, newPassword } = recoveryPasswordSchema.parse(req.body);

   try {
      const usersRepository = new UserDrizzleRepository();
      const refreshTokenRepository = new RefreshTokenDrizzleRepository();

      const recoveryPasswordUseCase = new RecoveryPasswordUseCase(
         usersRepository,
         refreshTokenRepository,
      );

      await recoveryPasswordUseCase.execute({
         token,
         newPassword,
      });

      return reply.status(200).send({
         message: "password edited successful",
         statusCode: 200,
      });
   } catch (err) {
      if (err instanceof TokenInvalidError) {
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
      }

      throw err;
   }
}
