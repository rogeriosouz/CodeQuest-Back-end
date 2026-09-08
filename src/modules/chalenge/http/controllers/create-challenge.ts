import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { ChallengeDrizzleRepository } from "../../infra/drizzle/challenge.drizzle.repository";
import { CreateChallengeUseCase } from "../../use-cases/create-challenge";

const challengeCodeSchema = z.object({
   languageCode: z.string().min(1),
   functionName: z.string().min(1),
   testCases: z
      .array(
         z.object({
            input: z.array(z.unknown()),
            expectedOutput: z.unknown(),
            isHidden: z.boolean().optional(),
         }),
      )
      .default([]),
   starterCode: z.string().default(""),
   timeLimitMs: z.number().int().positive().default(3000),
   memoryLimitMb: z.number().int().positive().default(128),
});

export const createChallengeSchema = z.object({
   tracksId: z.uuid(),
   name: z.string().min(1),
   slug: z.string().min(1),
   description: z.string().optional(),
   points: z.number().int().positive(),
   difficulty: z.string().min(1),
   type: z.string().min(1),
   isCode: z.boolean().default(true),
   tips: z.array(z.string()).default([]),
   alternatives: z
      .array(z.object({ text: z.string(), isCorrect: z.boolean() }))
      .default([]),
   code: z.string().optional(),
   language: z.string().optional(),
   isActive: z.boolean().default(true),
   codeChallenge: challengeCodeSchema.optional(),
});

export async function createChallenge(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   const body = req.body;
   const input = Array.isArray(body)
      ? z.array(createChallengeSchema).min(1).parse(body)
      : createChallengeSchema.parse(body);

   const challengeRepository = new ChallengeDrizzleRepository();
   const challengesUseCase = new CreateChallengeUseCase(challengeRepository);

   const challenges = await challengesUseCase.execute(input);

   return reply.status(201).send({
      message: "Success create challenge(s)",
      challenges,
   });
}
