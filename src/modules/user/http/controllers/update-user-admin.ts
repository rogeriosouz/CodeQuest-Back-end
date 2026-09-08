import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { UserAlreadyExistsError } from "@/errors/UserAlreadyExistsError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { UserDrizzleRepository } from "../../infra/drizzle/user.drizzle.repository";
import { UpdateUserAdminUseCase } from "../../use-cases/update-user-admin";

const updateUserAdminParamsSchema = z.object({
   userId: z.string().uuid("ID de usuário inválido"),
});

const updateUserAdminBodySchema = z.object({
   name: z.string().min(1, "O nome é obrigatório").optional(),
   email: z
      .string()
      .email("E-mail inválido")
      .min(1, "O e-mail é obrigatório")
      .optional(),
   displayName: z.string().optional(),
   bio: z.string().optional(),
   avatarUrl: z.string().optional(),
   isPremium: z.boolean().optional(),
   isAdmin: z.boolean().optional(),
   level: z.coerce
      .number()
      .int()
      .min(0, "O nível deve ser maior ou igual a 0")
      .optional(),
   xp: z.coerce
      .number()
      .int()
      .min(0, "O XP deve ser maior ou igual a 0")
      .optional(),
   streakDays: z.coerce
      .number()
      .int()
      .min(0, "A sequência deve ser maior ou igual a 0")
      .optional(),
   rankPoints: z.coerce
      .number()
      .int()
      .min(0, "Os pontos devem ser maior ou igual a 0")
      .optional(),
});

export async function updateUserAdmin(
   req: FastifyRequest,
   reply: FastifyReply,
) {
   const { userId } = updateUserAdminParamsSchema.parse(req.params);
   const body = updateUserAdminBodySchema.parse(req.body);

   try {
      const userRepository = new UserDrizzleRepository();
      const updateUserAdminUseCase = new UpdateUserAdminUseCase(userRepository);

      const { user } = await updateUserAdminUseCase.execute({
         userId,
         ...body,
      });

      return reply.status(200).send({
         message: "Usuário atualizado com sucesso",
         statusCode: 200,
         user: {
            id: user.id,
            name: user.name,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            xp: user.xp,
            level: user.level,
            rankPoints: user.rankPoints,
            streakDays: user.streakDays,
            isPremium: user.isPremium,
            isAdmin: user.isAdmin,
            updatedAt: user.updatedAt,
         },
      });
   } catch (err) {
      if (err instanceof UserNotFoundError) {
         return reply.status(404).send({
            statusCode: 404,
            message: err.message,
         });
      }

      if (err instanceof UserAlreadyExistsError) {
         return reply.status(409).send({
            statusCode: 409,
            message: "E-mail já está em uso por outro usuário",
         });
      }

      throw err;
   }
}
