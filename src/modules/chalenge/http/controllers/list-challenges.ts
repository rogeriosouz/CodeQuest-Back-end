import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { TracksDrizzleRepository } from "@/modules/tracks/infra/drizzle/tracks.drizzle.repository";
import { ChallengeDrizzleRepository } from "../../infra/drizzle/challenge.drizzle.repository";
import { ListChallengesUseCase } from "../../use-cases/list-challenges";

export async function listChallenges(req: FastifyRequest, reply: FastifyReply) {
   const listChallengesSchema = z.object({
      tracksSlug: z.string(),
   });

   const { tracksSlug } = listChallengesSchema.parse(req.params);

   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const tracksRepository = new TracksDrizzleRepository();
      const challengesRepository = new ChallengeDrizzleRepository();

      const listChallengesUseCase = new ListChallengesUseCase(
         challengesRepository,
         tracksRepository,
      );

      const { challenges, track } = await listChallengesUseCase.execute({
         tracksSlug,
         userId,
      });

      return reply.status(200).send({
         message: "list all challenges successful",
         challenges,
         track,
         statusCode: 200,
      });
   } catch (err) {
      if (err instanceof UserNotFoundError) {
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
      }
      if (err instanceof ResourceNotFoundError) {
         return reply.status(404).send({
            statusCode: 404,
            message: err.message,
         });
      }

      throw err;
   }
}
