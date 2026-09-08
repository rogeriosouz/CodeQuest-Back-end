import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { DuelsDrizzleRepository } from "@/modules/duels/infra/drizzle/duels.drizzle.repository";
import { RefuseDuelsUseCase } from "@/modules/duels/use-cases/refuse-duels";
import { UserDrizzleRepository } from "@/modules/user/infra/drizzle/user.drizzle.repository";

export async function refuseDuels(req: FastifyRequest, reply: FastifyReply) {
   const { duelsId } = z.object({ duelsId: z.string().uuid() }).parse(req.body);

   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const duelsRepository = new DuelsDrizzleRepository();
      const usersRepository = new UserDrizzleRepository();

      const refuseDuelsUseCase = new RefuseDuelsUseCase(
         duelsRepository,
         usersRepository,
      );

      await refuseDuelsUseCase.execute({ userId, duelsId });

      return reply.status(200).send({ message: "Success refuse duels" });
   } catch (err) {
      if (err instanceof UserNotFoundError) {
         return reply
            .status(404)
            .send({ statusCode: 404, message: err.message });
      }

      if (err instanceof ResourceNotFoundError) {
         return reply
            .status(404)
            .send({ statusCode: 404, message: err.message });
      }

      throw err;
   }
}
