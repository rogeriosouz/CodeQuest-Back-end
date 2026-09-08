import type { FastifyReply, FastifyRequest } from "fastify";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { UserDrizzleRepository } from "@/modules/user/infra/drizzle/user.drizzle.repository";
import { FriendsDrizzleRepository } from "../../infra/drizzle/friends.drizzle.repository";
import { ListRequestFriendsUseCase } from "../../use-cases/list-request-friends";

export async function listRequestFriends(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const friendsRepository = new FriendsDrizzleRepository();
      const usersRepository = new UserDrizzleRepository();
      const listRequestFriendsUseCase = new ListRequestFriendsUseCase(
         friendsRepository,
         usersRepository,
      );

      const requestFriends = await listRequestFriendsUseCase.execute({
         userId,
      });

      return reply.status(200).send({
         requestFriends,
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
