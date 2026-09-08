import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { FriendRequestAlreadyExistsError } from "@/errors/FriendRequestAlreadySentError";
import { FriendshipAlreadyExistsError } from "@/errors/FriendshipAlreadyExistsError";
import { InvalidCredentialsError } from "@/errors/InvalidCredentialsError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { UserDrizzleRepository } from "@/modules/user/infra/drizzle/user.drizzle.repository";
import { FriendsDrizzleRepository } from "../../infra/drizzle/friends.drizzle.repository";
import { AddRequestFriendUseCase } from "../../use-cases/add-request-friends";

export async function addRequestFriend(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   const { friendId } = z
      .object({
         friendId: z.uuid(),
      })
      .parse(req.body);

   try {
      const userId = req.user?.id;

      if (!userId) {
         throw new UserNotFoundError();
      }

      const friendsRepository = new FriendsDrizzleRepository();
      const usersRepository = new UserDrizzleRepository();
      const addRequestFriendUseCase = new AddRequestFriendUseCase(
         friendsRepository,
         usersRepository,
      );

      await addRequestFriendUseCase.execute({
         userId,
         friendId,
      });

      return reply.status(200).send({
         message: "Success request friend",
      });
   } catch (err) {
      if (err instanceof InvalidCredentialsError) {
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
      }

      if (err instanceof UserNotFoundError) {
         return reply.status(404).send({
            statusCode: 404,
            message: err.message,
         });
      }

      if (err instanceof FriendRequestAlreadyExistsError) {
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
      }

      if (err instanceof FriendshipAlreadyExistsError) {
         return reply.status(400).send({
            statusCode: 400,
            message: err.message,
         });
      }

      throw err;
   }
}
