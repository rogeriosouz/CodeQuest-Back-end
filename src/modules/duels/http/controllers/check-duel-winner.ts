import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { DuelsDrizzleRepository } from "@/modules/duels/infra/drizzle/duels.drizzle.repository";
import { CheckDuelWinnerUseCase } from "@/modules/duels/use-cases/check-duel-winner";
import { UserDrizzleRepository } from "@/modules/user/infra/drizzle/user.drizzle.repository";

export async function checkDuelWinner(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   const { id } = z.object({ id: z.uuid() }).parse(req.params);

   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const duelsRepository = new DuelsDrizzleRepository();
      const usersRepository = new UserDrizzleRepository();

      const checkDuelWinnerUseCase = new CheckDuelWinnerUseCase(
         duelsRepository,
         usersRepository,
      );

      const duelWinner = await checkDuelWinnerUseCase.execute({
         duelsId: id,
         userId,
      });

      return reply.status(200).send(duelWinner);
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
