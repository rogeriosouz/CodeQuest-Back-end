import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { ActiveDuelAlreadyExistsError } from "@/errors/ActiveDuelAlreadyExistsError";
import { DuelAlreadyInProgressError } from "@/errors/DuelAlreadyInProgressError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { DuelsDrizzleRepository } from "@/modules/duels/infra/drizzle/duels.drizzle.repository";
import { CreateDuelsUseCase } from "@/modules/duels/use-cases/create-duels";
import { UserDrizzleRepository } from "@/modules/user/infra/drizzle/user.drizzle.repository";

export async function createDuels(req: FastifyRequest, reply: FastifyReply) {
   const { friendId, difficulty, language, totalChallenges } = z
      .object({
         friendId: z.string().uuid(),
         difficulty: z.enum(["easy", "medium", "hard"]),
         language: z.string(),
         totalChallenges: z.number().int().positive(),
      })
      .parse(req.body);

   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const duelsRepository = new DuelsDrizzleRepository();
      const usersRepository = new UserDrizzleRepository();

      const createDuelsUseCase = new CreateDuelsUseCase(
         duelsRepository,
         usersRepository,
      );

      const { duelsId } = await createDuelsUseCase.execute({
         userId,
         friendId,
         difficulty,
         language,
         totalChallenges,
      });

      return reply
         .status(200)
         .send({ message: "Success create duels", duelsId });
   } catch (err) {
      if (err instanceof UserNotFoundError) {
         return reply
            .status(404)
            .send({ statusCode: 404, message: err.message });
      }

      if (err instanceof ActiveDuelAlreadyExistsError) {
         return reply
            .status(400)
            .send({ statusCode: 400, message: err.message });
      }

      if (err instanceof DuelAlreadyInProgressError) {
         return reply
            .status(400)
            .send({ statusCode: 400, message: err.message });
      }

      throw err;
   }
}
