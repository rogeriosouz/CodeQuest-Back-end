import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { UserDrizzleRepository } from "@/modules/user/infra/drizzle/user.drizzle.repository";
import { DuelsDrizzleRepository } from "../../infra/drizzle/duels.drizzle.repository";
import { GiveUpDuelsUseCase } from "../../use-cases/give-up-duels";

export async function userGiveUp(req: FastifyRequest, reply: FastifyReply) {
   const { duelsId } = z.object({ duelsId: z.uuid() }).parse(req.body);

   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const duelsRepository = new DuelsDrizzleRepository();
      const usersRepository = new UserDrizzleRepository();

      const giveUpDuelsUseCase = new GiveUpDuelsUseCase(
         duelsRepository,
         usersRepository,
      );

      await giveUpDuelsUseCase.execute({ userId, duelsId });

      return reply.status(200).send({ message: "Success GiveUp" });
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
