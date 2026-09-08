import { randomBytes } from "node:crypto";
import { compare } from "bcryptjs";
import { AppError } from "@/errors/app.errors";
import { InvalidCredentialsError } from "@/errors/InvalidCredentialsError";
import type { RefreshTokenRepository } from "../repositories/refresh.token.repository";
import type { UserRepository } from "../repositories/user.repository";

interface SigninUseCaseRequest {
   email: string;
   password: string;
   adminOnly?: boolean;
}

export class SigninUseCase {
   constructor(
      private UserRepository: UserRepository,
      private RefreshTokenRepository: RefreshTokenRepository,
   ) {}

   async execute({ email, password, adminOnly = false }: SigninUseCaseRequest) {
      const isUser = await this.UserRepository.findByEmail(email);

      if (!isUser) {
         throw new InvalidCredentialsError();
      }

      const comparePassword = await compare(password, isUser.passwordHash);

      if (!comparePassword) {
         throw new InvalidCredentialsError();
      }

      if (adminOnly && !isUser.isAdmin) {
         throw new AppError("Admin access required", 403);
      }

      const tokenHash = randomBytes(64).toString("hex");
      await this.RefreshTokenRepository.create({
         userId: isUser.id,
         tokenHash,
      });

      return {
         tokenHash,
         user: isUser,
      };
   }
}
