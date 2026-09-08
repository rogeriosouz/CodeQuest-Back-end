import { Queue } from "bullmq";
import { env } from "@/env";

export const connection = {
   host: env.REDIS_HOST,
   port: 6379,
   password: env.REDIS_PASSWORD,
   maxRetriesPerRequest: null,
};

export const myQueue = new Queue("emailQueue", {
   connection,
});

export const myQueueCode = new Queue("codeExecutionQueue", {
   connection,
});
