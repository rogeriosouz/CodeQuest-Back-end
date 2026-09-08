import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { TracksDrizzleRepository } from "../../infra/drizzle/tracks.drizzle.repository";
import { UpdateTrackUseCase } from "../../use-cases/update-track";

const updateTrackSchema = z.object({
   name: z.string().min(1).optional(),
   slug: z.string().min(1).optional(),
   description: z.string().optional(),
   icon: z.string().optional(),
   color: z.string().optional(),
   difficulty: z.string().optional(),
   language: z.string().optional(),
   isActive: z.boolean().optional(),
});

export async function updateTrack(req: FastifyRequest, reply: FastifyReply) {
   try {
      const { tracksId } = req.params as { tracksId: string };
      const input = updateTrackSchema.parse(req.body);
      const tracksRepository = new TracksDrizzleRepository();
      const updateTrackUseCase = new UpdateTrackUseCase(tracksRepository);

      const track = await updateTrackUseCase.execute({ tracksId, ...input });

      return reply.status(200).send({
         message: "Track updated successfully",
         track,
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
