import { hash } from "bcryptjs";
import { TokenInvalidError } from "@/errors/TokenInvalidError";
import type { RefreshTokenRepository } from "../repositories/refresh.token.repository";
import type { UserRepository } from "../repositories/user.repository";

interface RecoveryPasswordUseCaseRequest {
   token: string;
   newPassword: string;
}

export class RecoveryPasswordUseCase {
   constructor(
      private UserRepository: UserRepository,
      private RefreshTokenRepository: RefreshTokenRepository,
   ) {}

   async execute({ token, newPassword }: RecoveryPasswordUseCaseRequest) {
      const isToken = await this.RefreshTokenRepository.findToken(token);

      if (!isToken) {
         throw new TokenInvalidError();
      }

      if (isToken.expiresAt < new Date()) {
         throw new TokenInvalidError();
      }

      const userId = isToken.user.id;
      const newPasswordHash = await hash(newPassword, 6);
      await this.UserRepository.updatePassword({
         userId,
         passwordHash: newPasswordHash,
      });

      await this.RefreshTokenRepository.invalidateToken({
         tokenHash: token,
         userId,
      });
   }
}
