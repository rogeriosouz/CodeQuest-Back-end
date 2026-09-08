import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { UserDrizzleRepository } from "../../infra/drizzle/user.drizzle.repository";
import { ListUsersAdminUseCase } from "../../use-cases/list-users-admin";

const listUsersAdminQuerySchema = z.object({
   search: z.string().optional(),
   page: z.coerce.number().int().positive().default(1),
   perPage: z.coerce.number().int().positive().max(100).default(20),
});

export async function listUsersAdmin(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   const { search, page, perPage } = listUsersAdminQuerySchema.parse(
      req.query,
   );

   const userRepository = new UserDrizzleRepository();
   const listUsersAdminUseCase = new ListUsersAdminUseCase(userRepository);

   const result = await listUsersAdminUseCase.execute({
      search,
      page,
      perPage,
   });

   return reply.status(200).send({
      message: "list all users successful",
      ...result,
      statusCode: 200,
   });
}

