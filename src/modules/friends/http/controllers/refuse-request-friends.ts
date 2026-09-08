import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { FriendRequestNotFoundError } from "@/errors/FriendRequestNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { UserDrizzleRepository } from "@/modules/user/infra/drizzle/user.drizzle.repository";
import { FriendsDrizzleRepository } from "../../infra/drizzle/friends.drizzle.repository";
import { RefuseRequestFriendUseCase } from "../../use-cases/refuse-request-friends";

export async function refuseRequestFriend(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   const { requestFriendId } = z
      .object({
         requestFriendId: z.uuid(),
      })
      .parse(req.body);

   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const friendsRepository = new FriendsDrizzleRepository();
      const usersRepository = new UserDrizzleRepository();
      const refuseRequestFriendUseCase = new RefuseRequestFriendUseCase(
         friendsRepository,
         usersRepository,
      );

      await refuseRequestFriendUseCase.execute({
         userId,
         requestFriendId,
      });

      return reply.status(200).send({
         message: "Refuse request friend!",
      });
   } catch (err) {
      if (err instanceof UserNotFoundError) {
         return reply.status(404).send({
            statusCode: 404,
            message: err.message,
         });
      }

      if (err instanceof FriendRequestNotFoundError) {
         return reply.status(404).send({
            statusCode: 404,
            message: err.message,
         });
      }

      throw err;
   }
}
