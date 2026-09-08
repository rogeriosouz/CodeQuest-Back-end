/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import vm from "node:vm";

type TestCase = {
   input: unknown[];
   expectedOutput: unknown;
   isHidden?: boolean;
};

export async function runCodeJs({
   code,
   functionName,
   testCases,
}: {
   code: string;
   functionName: string;
   testCases: TestCase[];
}) {
   const results: {
      passed: boolean;
      input: unknown[];
      expected: unknown;
      received: unknown;
      error?: string;
   }[] = [];
   try {
      const sandbox: any = {};
      const context = vm.createContext(sandbox);

      const script = new vm.Script(code);
      script.runInContext(context, {
         timeout: 1000,
      });

      const userFunction = sandbox[functionName];

      if (typeof userFunction !== "function") {
         throw new Error(`Função ${functionName} não encontrada`);
      }

      const testResponse = testCases.map(async (testCase) => {
         try {
            const result = await userFunction(...testCase.input);

            const passed =
               JSON.stringify(result) ===
               JSON.stringify(testCase.expectedOutput);

            results.push({
               passed,
               input: testCase.input,
               expected: testCase.expectedOutput,
               received: result,
            });
         } catch (err: any) {
            results.push({
               passed: false,
               input: testCase.input,
               expected: testCase.expectedOutput,
               received: null,
               error: err.message,
            });
         }
      });

      await Promise.all(testResponse);

      const allPassed = results.every((r) => r.passed);

      return {
         success: allPassed,
         results,
      };
   } catch (error: any) {
      return {
         success: false,
         error: error.message,
      };
   }
}
