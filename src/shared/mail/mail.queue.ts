import { myQueue } from "@/config/bullmq";

export async function queueRecoveryPassword({
   to,
   link,
}: {
   to: string;
   link: string;
}) {
   await myQueue.add("recovery-password", { to, link });
}
