import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { InvalidCredentialsError } from "@/errors/InvalidCredentialsError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { UserDrizzleRepository } from "../../infra/drizzle/user.drizzle.repository";
import { UpdatePasswordUseCase } from "../../use-cases/update-password";

export async function updatePassword(req: FastifyRequest, reply: FastifyReply) {
   const updatePasswordSchema = z
      .object({
         currentPassword: z.string().min(5),
         newPassword: z.string().min(5),
         confirmNewPassword: z.string().min(5),
      })
      .refine((data) => data.newPassword === data.confirmNewPassword, {
         message: "Passwords do not match",
         path: ["confirmNewPassword"],
      });

   const { currentPassword, newPassword } = updatePasswordSchema.parse(
      req.body,
   );
   const userId = req.user?.id as string;

   try {
      const userRepository = new UserDrizzleRepository();
      const updatePasswordUseCase = new UpdatePasswordUseCase(userRepository);

      await updatePasswordUseCase.execute({
         userId,
         currentPassword,
         newPassword,
      });

      return reply.status(200).send({
         message: "password updated successfully",
         statusCode: 200,
      });
   } catch (err) {
      if (err instanceof InvalidCredentialsError) {
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
      }

      if (err instanceof UserNotFoundError) {
         return reply.status(404).send({
            statusCode: 404,
            message: err.message,
         });
      }

      throw err;
   }
}
