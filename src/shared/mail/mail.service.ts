import { queueRecoveryPassword } from "./mail.queue";

export class MailService {
   async sendResetPassword({ to, link }: { to: string; link: string }) {
      await queueRecoveryPassword({
         to,
         link,
      });
   }
}
