import type { FastifyReply, FastifyRequest } from "fastify";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { UserDrizzleRepository } from "../../infra/drizzle/user.drizzle.repository";
import { ListMyUseCase } from "../../use-cases/list-my";

export async function listMy(req: FastifyRequest, reply: FastifyReply) {
   try {
      const userId = req.user?.id as string;

      const userRepository = new UserDrizzleRepository();
      const listMyUseCase = new ListMyUseCase(userRepository);

      const user = await listMyUseCase.execute({
         userId,
      });

      return reply.status(200).send({
         user,
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
