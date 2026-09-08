import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { ChallengeDrizzleRepository } from "../../infra/drizzle/challenge.drizzle.repository";
import { UpdateChallengeUseCase } from "../../use-cases/update-challenge";

const updateChallengeParamsSchema = z.object({
   challengeId: z.string().uuid(),
});

const updateChallengeCodeSchema = z.object({
   languageCode: z.string().min(1).optional(),
   functionName: z.string().min(1).optional(),
   testCases: z
      .array(
         z.object({
            input: z.array(z.unknown()),
            expectedOutput: z.unknown(),
            isHidden: z.boolean().optional(),
         }),
      )
      .optional(),
   starterCode: z.string().optional(),
   timeLimitMs: z.number().int().positive().optional(),
   memoryLimitMb: z.number().int().positive().optional(),
});

export const updateChallengeSchema = z.object({
   tracksId: z.string().uuid().optional(),
   name: z.string().min(1).optional(),
   slug: z.string().min(1).optional(),
   description: z.string().nullable().optional(),
   points: z.number().int().positive().optional(),
   difficulty: z.string().min(1).optional(),
   type: z.string().min(1).optional(),
   isCode: z.boolean().optional(),
   tips: z.array(z.string()).optional(),
   alternatives: z
      .array(z.object({ text: z.string(), isCorrect: z.boolean() }))
      .optional(),
   code: z.string().nullable().optional(),
   language: z.string().nullable().optional(),
   isActive: z.boolean().optional(),
   codeChallenge: updateChallengeCodeSchema.optional(),
});

export async function updateChallenge(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   try {
      const { challengeId } = updateChallengeParamsSchema.parse(req.params);
      const body = updateChallengeSchema.parse(req.body);

      const challengeRepository = new ChallengeDrizzleRepository();
      const updateChallengeUseCase = new UpdateChallengeUseCase(
         challengeRepository,
      );

      const challenge = await updateChallengeUseCase.execute({
         challengeId,
         ...body,
      });

      return reply.status(200).send({
         message: "Challenge updated successfully",
         challenge,
         statusCode: 200,
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
