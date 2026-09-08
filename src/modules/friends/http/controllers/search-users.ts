import type { FastifyReply, FastifyRequest } from "fastify";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { FriendsDrizzleRepository } from "../../infra/drizzle/friends.drizzle.repository";
import { SearchUsersUseCase } from "../../use-cases/search-users";

export async function searchUsers(req: FastifyRequest, reply: FastifyReply) {
   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const { q } = req.query as { q?: string };

      const query = q ?? "";

      const friendsRepository = new FriendsDrizzleRepository();
      const searchUsersUseCase = new SearchUsersUseCase(friendsRepository);

      const users = await searchUsersUseCase.execute({ userId, query });

      return reply.status(200).send({ users });
   } catch (err) {
      if (err instanceof UserNotFoundError) {
         return reply
            .status(400)
            .send({ statusCode: 400, message: err.message });
      }

      throw err;
   }
}
