import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { ChallengeInCorrectError } from "@/errors/ChallengeInCorrectError";
import { ChallengeIsCompletedError } from "@/errors/ChallengeIsCompletedError";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { TracksDrizzleRepository } from "@/modules/tracks/infra/drizzle/tracks.drizzle.repository";
import { ChallengeDrizzleRepository } from "../../infra/drizzle/challenge.drizzle.repository";
import { CompleteChallengeUseCase } from "../../use-cases/complete-challenge";

export async function completeChallenge(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   const completeChallengeSchemaParams = z.object({
      slug: z.string(),
   });
   const completeChallengeSchemaBody = z.object({
      trackId: z.uuid(),
      res: z.string(),
   });

   const { slug } = completeChallengeSchemaParams.parse(req.params);
   const { res, trackId } = completeChallengeSchemaBody.parse(req.body);

   const userId = req.user?.id as string;

   try {
      const challengeRepository = new ChallengeDrizzleRepository();
      const tracksRepository = new TracksDrizzleRepository();

      const completeChallengeUseCase = new CompleteChallengeUseCase(
         challengeRepository,
         tracksRepository,
      );

      await completeChallengeUseCase.execute({
         res,
         slug,
         trackId,
         userId,
      });

      return reply.status(200).send({
         statusCode: 200,
         message: "Challenge complete successful",
      });
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
