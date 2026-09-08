import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { UserDrizzleRepository } from "../../infra/drizzle/user.drizzle.repository";
import { ListUserUseCase } from "../../use-cases/list-user";

export async function listUser(req: FastifyRequest, reply: FastifyReply) {
   const listUserSchema = z.object({
      displayName: z.string(),
   });

   const { displayName } = listUserSchema.parse(req.params);

   try {
      const userRepository = new UserDrizzleRepository();
      const listUserUseCase = new ListUserUseCase(userRepository);

      const { user } = await listUserUseCase.execute({
         displayName,
      });

      return reply.status(200).send({
         statusCode: 200,
         message: "Success list user",
         user: {
            displayName: user.displayName,
            bio: user.bio,
            xp: user.xp,
            level: user.level,
            rankPoints: user.rankPoints,
         },
      });
   } catch (err) {
      if (err instanceof UserNotFoundError) {
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
      }

      throw err;
   }
}
