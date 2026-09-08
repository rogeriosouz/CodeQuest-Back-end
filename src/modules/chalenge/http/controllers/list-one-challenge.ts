import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { ChallengeDrizzleRepository } from "../../infra/drizzle/challenge.drizzle.repository";
import { ListOneChallengeUseCase } from "../../use-cases/list-one-challenge";

export async function listOneChallenge(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   const listOneChallengeSchema = z.object({
      slug: z.string(),
   });

   const { slug } = listOneChallengeSchema.parse(req.params);

   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const challengeRepository = new ChallengeDrizzleRepository();
      const listOneChallengeUseCase = new ListOneChallengeUseCase(
         challengeRepository,
      );

      const challenge = await listOneChallengeUseCase.execute({
         slug,
         userId,
      });

      return reply.status(200).send({
         statusCode: 200,
         challenge,
         message: "Success list challenge",
      });
   } catch (err) {
      if (err instanceof ResourceNotFoundError) {
         return reply.status(404).send({
            statusCode: 404,
            message: err.message,
         });
      }

      throw err;
   }
}
