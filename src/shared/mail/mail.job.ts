import { Worker } from "bullmq";
import { connection } from "@/config/bullmq";
import { env } from "@/env";
import { getTempleteHtml } from "../utils/get-template-html-to-text";
import { mailProvider } from "./mail.provider";

const worker = new Worker(
   "emailQueue",
   async (job) => {
      const { to, link } = job.data;

      if (job.name === "recovery-password") {
         const htmlTemplateForgotPassword = getTempleteHtml({
            htmlTemplete: "recovery-password.html",
            replace: "{{reset_href}}",
            newValueReplace: link,
         });

         await mailProvider.sendEmail(
            to,
            "Redefinir senha",
            htmlTemplateForgotPassword,
         );
      }

      if (env.NODE_ENV === "dev") {
         console.log(`✅ E-mail enviado para ${to}`);
      }
   },
   { connection },
);

worker.on("completed", (job) => {
   if (env.NODE_ENV !== "production") {
      console.log(`${job.id} has completed!`);
   }
});

worker.on("failed", (job, err) => {
   if (env.NODE_ENV !== "production") {
      console.log(`${job?.id} has failed with ${err.message}`);
   }
});
