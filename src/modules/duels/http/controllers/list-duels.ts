import type { FastifyReply, FastifyRequest } from "fastify";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { DuelsDrizzleRepository } from "@/modules/duels/infra/drizzle/duels.drizzle.repository";
import { ListDuelsUseCase } from "@/modules/duels/use-cases/list-duels";
import { UserDrizzleRepository } from "@/modules/user/infra/drizzle/user.drizzle.repository";

export async function listDuels(req: FastifyRequest, reply: FastifyReply) {
   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const duelsRepository = new DuelsDrizzleRepository();
      const usersRepository = new UserDrizzleRepository();

      const listDuelsUseCase = new ListDuelsUseCase(
         duelsRepository,
         usersRepository,
      );

      const duels = await listDuelsUseCase.execute({ userId });

      return reply.status(200).send(duels);
   } catch (err) {
      if (err instanceof UserNotFoundError) {
         return reply
            .status(404)
            .send({ statusCode: 404, message: err.message });
      }

      if (err instanceof ResourceNotFoundError) {
         return reply
            .status(404)
            .send({ statusCode: 404, message: err.message });
      }

      throw err;
   }
}
