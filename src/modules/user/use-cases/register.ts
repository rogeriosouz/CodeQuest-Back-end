import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { UserAlreadyExistsError } from "@/errors/UserAlreadyExistsError";
import type { RefreshTokenRepository } from "../repositories/refresh.token.repository";
import type { UserRepository } from "../repositories/user.repository";

interface RegisterUseCaseRequest {
   name: string;
   email: string;
   password: string;
}

export class RegisterUseCase {
   constructor(
      private UserRepository: UserRepository,
      private RefreshTokenRepository: RefreshTokenRepository,
   ) {}

   async execute({ name, email, password }: RegisterUseCaseRequest) {
      const isUserExist = await this.UserRepository.findByEmail(email);

      if (isUserExist) {
         throw new UserAlreadyExistsError();
      }

      const passwordHash = await hash(password, 6);
      const user = await this.UserRepository.create({
         name,
         email,
         passwordHash,
      });

      const tokenHash = randomBytes(64).toString("hex");
      await this.RefreshTokenRepository.create({
         userId: user.id,
         tokenHash,
      });

      return {
         tokenHash,
         user,
      };
   }
}
