import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { DuelsDrizzleRepository } from "@/modules/duels/infra/drizzle/duels.drizzle.repository";
import { ListOneDuelUseCase } from "@/modules/duels/use-cases/list-one-duel";
import { UserDrizzleRepository } from "@/modules/user/infra/drizzle/user.drizzle.repository";

export async function listOneDuel(req: FastifyRequest, reply: FastifyReply) {
   const { id } = z.object({ id: z.uuid() }).parse(req.params);

   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const duelsRepository = new DuelsDrizzleRepository();
      const usersRepository = new UserDrizzleRepository();

      const listOneDuelUseCase = new ListOneDuelUseCase(
         duelsRepository,
         usersRepository,
      );

      const duel = await listOneDuelUseCase.execute({ duelsId: id, userId });

      return reply.status(200).send(duel);
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
