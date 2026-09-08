import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { ChallengeInCorrectError } from "@/errors/ChallengeInCorrectError";
import { ChallengeIsCompletedError } from "@/errors/ChallengeIsCompletedError";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { TracksDrizzleRepository } from "@/modules/tracks/infra/drizzle/tracks.drizzle.repository";
import { ChallengeDrizzleRepository } from "../../infra/drizzle/challenge.drizzle.repository";
import { CompleteChallengeCodeUseCase } from "../../use-cases/complete-challenge-code";

export async function completeChallengeCode(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   const completeChallengeCodeSchema = z.object({
      code: z.string(),
   });

   const completeChallengeCodeSchemaParams = z.object({
      slug: z.string(),
   });

   const { slug } = completeChallengeCodeSchemaParams.parse(req.params);
   const { code } = completeChallengeCodeSchema.parse(req.body);

   try {
      const userId = req.user?.id as string;

      const challengeRepository = new ChallengeDrizzleRepository();
      const tracksRepository = new TracksDrizzleRepository();
      const completeChallengeCodeUseCase = new CompleteChallengeCodeUseCase(
         challengeRepository,
         tracksRepository,
      );

      await completeChallengeCodeUseCase.execute({
         code,
         slug,
         userId,
      });

      return reply.status(200).send();
   } catch (err) {
      if (err instanceof ResourceNotFoundError) {
         return reply.status(404).send({
            statusCode: 404,
            message: err.message,
         });
      }

      if (err instanceof ChallengeInCorrectError) {
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
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
