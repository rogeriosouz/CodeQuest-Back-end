import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { FriendRequestNotFoundError } from "@/errors/FriendRequestNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { UserDrizzleRepository } from "@/modules/user/infra/drizzle/user.drizzle.repository";
import { FriendsDrizzleRepository } from "../../infra/drizzle/friends.drizzle.repository";
import { AcceptRequestFriendUseCase } from "../../use-cases/accept-request-friend";

export async function acceptRequestFriend(
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

      const acceptRequestFriendUseCase = new AcceptRequestFriendUseCase(
         friendsRepository,
         usersRepository,
      );

      await acceptRequestFriendUseCase.execute({ userId, requestFriendId });

      return reply.status(200).send({
         message: "Success add friend",
      });
   } catch (err) {
      if (err instanceof UserNotFoundError) {
         return reply.status(404).send({
            statusCode: 404,
            message: err.message,
         });
      }

      if (err instanceof FriendRequestNotFoundError) {
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
      }

      throw err;
   }
}
