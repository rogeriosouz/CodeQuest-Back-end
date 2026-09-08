import type { FastifyReply, FastifyRequest } from "fastify";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { UserDrizzleRepository } from "@/modules/user/infra/drizzle/user.drizzle.repository";
import { TracksDrizzleRepository } from "../../infra/drizzle/tracks.drizzle.repository";
import { ListTracksUseCase } from "../../use-cases/list-tracks";

export async function listTracks(req: FastifyRequest, reply: FastifyReply) {
   try {
      const userId = req.user?.id as string;
      const { search } = req.query as { search?: string };

      const tracksRepository = new TracksDrizzleRepository();
      const userRepository = new UserDrizzleRepository();

      const listTracksUseCase = new ListTracksUseCase(
         tracksRepository,
         userRepository,
      );

      const tracks = await listTracksUseCase.execute({
         userId,
         ...(search ? { search } : {}),
      });

      return reply.status(200).send({
         message: "list all tracks successful",
         tracks,
         statusCode: 200,
      });
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
