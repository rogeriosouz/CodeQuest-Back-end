import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { TracksAlreadyExistsError } from "@/errors/TracksAlreadyExistsError";
import { TracksDrizzleRepository } from "../../infra/drizzle/tracks.drizzle.repository";
import { CreateTrackUseCase } from "../../use-cases/create-track";

const codeChallengeSchema = z.object({
   languageCode: z.string().min(1),
   functionName: z.string().min(1),
   testCases: z.array(
      z.object({
         input: z.array(z.unknown()),
         expectedOutput: z.unknown(),
         isHidden: z.boolean().optional(),
      }),
   ),
   starterCode: z.string().default(""),
   timeLimitMs: z.number().int().positive().default(3000),
   memoryLimitMb: z.number().int().positive().default(128),
});

export const trackSchema = z.object({
   name: z.string().min(1),
   slug: z.string().min(1),
   description: z.string().optional(),
   icon: z.string().optional(),
   color: z.string().optional(),
   difficulty: z.string().optional(),
   language: z.string().default("javascript"),
   isActive: z.boolean().default(true),
   challenges: z
      .array(
         z.object({
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
            codeChallenge: codeChallengeSchema.optional(),
         }),
      )
      .min(1),
});

export async function createTrack(req: FastifyRequest, reply: FastifyReply) {
   try {
      const input = trackSchema.parse(req.body);

      const tracksRepository = new TracksDrizzleRepository();
      const trackUseCase = new CreateTrackUseCase(tracksRepository);

      const track = await trackUseCase.execute(input);

      return reply.status(201).send({ message: "Success create track", track });
   } catch (err) {
      if (err instanceof TracksAlreadyExistsError) {
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
      }

      throw err;
   }
}
