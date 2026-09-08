import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { ChallengeIsCompletedError } from "@/errors/ChallengeIsCompletedError";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { DuelsDrizzleRepository } from "@/modules/duels/infra/drizzle/duels.drizzle.repository";
import { CompleteDuelUseCase } from "@/modules/duels/use-cases/complete-duel";
import { UserDrizzleRepository } from "@/modules/user/infra/drizzle/user.drizzle.repository";

export async function completeDuel(req: FastifyRequest, reply: FastifyReply) {
   const { duelsId, results } = z
      .object({
         duelsId: z.uuid(),
         results: z.array(
            z.object({ challengeSlug: z.string(), res: z.string() }),
         ),
      })
      .parse(req.body);

   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const duelsRepository = new DuelsDrizzleRepository();
      const usersRepository = new UserDrizzleRepository();

      const completeUseCase = new CompleteDuelUseCase(
         duelsRepository,
         usersRepository,
      );

      const { isCompetedDuel } = await completeUseCase.execute({
         userId,
         duelsId,
         results,
      });

      return reply
         .status(200)
         .send({ message: "Success complete duels", isCompetedDuel });
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

      if (err instanceof ChallengeIsCompletedError) {
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
      }

      throw err;
   }
}
