import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { ChallengeDrizzleRepository } from "../../infra/drizzle/challenge.drizzle.repository";
import { ListChallengesAdminUseCase } from "../../use-cases/list-challenges-admin";

const listChallengesAdminQuerySchema = z.object({
   tracksId: z.string().uuid().optional(),
   search: z.string().optional(),
});

export async function listChallengesAdmin(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   const { tracksId, search } = listChallengesAdminQuerySchema.parse(req.query);

   const challengeRepository = new ChallengeDrizzleRepository();
   const listChallengesAdminUseCase = new ListChallengesAdminUseCase(
      challengeRepository,
   );

   const challenges = await listChallengesAdminUseCase.execute({
      tracksId,
      search,
   });

   return reply.status(200).send({
      message: "list all challenges successful",
      challenges,
      statusCode: 200,
   });
}

