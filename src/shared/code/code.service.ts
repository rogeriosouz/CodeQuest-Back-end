import type { TestCase } from "./code.job";
import { queueExecuteCode } from "./code.queue";

interface ExecuteCodeInput {
   code: string;
   language: string;
   functionName: string;
   testCases: TestCase[];
   userId: string;
   challengeId: string;
   tracksId: string;
}

export class ExecuteCodeService {
   async sendExecuteCode(data: ExecuteCodeInput) {
      await queueExecuteCode(data);
   }
}
