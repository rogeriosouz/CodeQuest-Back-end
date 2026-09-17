import { randomBytes } from "node:crypto";
import { env } from "@/env";
import { InvalidCredentialsError } from "@/errors/InvalidCredentialsError";
import type { MailService } from "@/shared/mail/mail.service";
import type { RefreshTokenRepository } from "../repositories/refresh.token.repository";
import type { UserRepository } from "../repositories/user.repository";

interface ForgotPasswordUseCaseRequest {
   email: string;
}

export class ForgotPasswordUseCase {
   constructor(
      private UserRepository: UserRepository,
      private RefreshTokenRepository: RefreshTokenRepository,
      private MailService: MailService,
   ) {}

   async execute({ email }: ForgotPasswordUseCaseRequest) {
      const isUser = await this.UserRepository.findByEmail(email);

      if (!isUser) {
         throw new InvalidCredentialsError();
      }

      const tokenHash = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await this.RefreshTokenRepository.create({
         userId: isUser.id,
         tokenHash,
         expiresAt,
      });

      await this.MailService.sendResetPassword({
         to: email,
         link: `${env.FRONT_END_URL}/auth/recovery-password?token=${tokenHash}`,
      });
   }
}
