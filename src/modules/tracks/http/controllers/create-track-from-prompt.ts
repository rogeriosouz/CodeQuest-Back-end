import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { OpenAITrackGenerator } from "../../infra/ai/track-generator";
import { TracksDrizzleRepository } from "../../infra/drizzle/tracks.drizzle.repository";
import type { CreateTrackInput } from "../../repositories/tracks.repository";
import { CreateTrackUseCase } from "../../use-cases/create-track";
import { trackSchema } from "./create-track";

export async function createTrackFromPrompt(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   try {
      const { prompt } = z
         .object({ prompt: z.string().min(10) })
         .parse(req.body);

      const generatedTrack = await new OpenAITrackGenerator().generate(prompt);
      const input = trackSchema.parse(generatedTrack) as CreateTrackInput;

      const tracksRepository = new TracksDrizzleRepository();
      const trackUseCase = new CreateTrackUseCase(tracksRepository);
      const track = await trackUseCase.execute(input);

      return reply
         .status(201)
         .send({ message: "Success create track from prompt", track });
   } catch (err) {
      if (err instanceof UserNotFoundError) {
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
      }

      throw err;
   }
}
