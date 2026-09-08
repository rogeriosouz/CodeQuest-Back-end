import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { UserDrizzleRepository } from "../../infra/drizzle/user.drizzle.repository";
import { UpdateUserUseCase } from "../../use-cases/update-user";

export async function updateUser(req: FastifyRequest, reply: FastifyReply) {
   const updateUserSchema = z.object({
      name: z.string().optional(),
      displayName: z.string().optional(),
      bio: z.string().optional(),
   });

   const { name, displayName, bio } = updateUserSchema.parse(req.body);

   const userId = req.user?.id as string;
   try {
      const userRepository = new UserDrizzleRepository();

      const updateUser = new UpdateUserUseCase(userRepository);

      await updateUser.execute({
         userId,
         name,
         displayName,
         bio,
      });

      return reply.status(200).send({
         message: "user update successful",
         statusCode: 200,
      });
   } catch (err) {
      if (err instanceof UserNotFoundError) {
         return reply.status(404).send({
            statusCode: 404,
            message: err.message,
         });
      }

      throw err;
   }
}
