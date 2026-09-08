import nodemailer from "nodemailer";
import { env } from "@/env";

const transporter = nodemailer.createTransport({
   host: env.SMTP_HOST,
   port: env.SMTP_PORT,
   auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
   },
});

export const mailProvider = {
   async sendEmail(to: string, subject: string, html: string) {
      await transporter.sendMail({
         from: '"Equipe" test@gmail.com',
         to,
         subject,
         html,
      });
   },
};
