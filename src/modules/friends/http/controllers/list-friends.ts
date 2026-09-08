import type { FastifyReply, FastifyRequest } from "fastify";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { FriendsDrizzleRepository } from "../../infra/drizzle/friends.drizzle.repository";
import { ListFriendsUseCase } from "../../use-cases/list-friends";

export async function listFriends(req: FastifyRequest, reply: FastifyReply) {
   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const friendsRepository = new FriendsDrizzleRepository();
      const listFriendsUseCase = new ListFriendsUseCase(friendsRepository);

      const friends = await listFriendsUseCase.execute({ userId });

      return reply.status(200).send({
         friends,
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
